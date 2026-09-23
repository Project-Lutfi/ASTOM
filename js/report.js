/* ==========================================================
   PENGATURAN
   Data dibaca dari localStorage yang sama dengan halaman Register
   ========================================================== */

const REPORT_STORAGE_KEY = "astom_list_barang";

/* Judul kolom tabel, dipakai untuk header file Excel yang diunduh */
const KOLOM_REPORT = [
  "CUSTOMER", "ASET NO", "DOKUMEN", "NO AJU", "URAIAN BARANG",
  "KODE BARANG", "JUMLAH", "SATUAN", "HS CODE", "LOKASI",
  "TGL.MASUK", "NO.DAFTAR", "TGL.DAFTAR"
];
const KOLOM_REPORT_RETURN = KOLOM_REPORT.map(judul =>
  judul === "TGL.MASUK" ? "TGL.KELUAR" : judul
);


/* ==========================================================
   BACA DATA
   ========================================================== */

function ambilDataReport() {

  try {

    const data = JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY));

    return Array.isArray(data) ? data : [];

  } catch (error) {

    return [];

  }

}

/* Barang yang sudah pernah GATE masuk (RECEIVED / RETURNED) */
function ambilDataAllAsset() {

  return ambilDataReport().filter(
    item => item.status === "RECEIVED" || item.status === "RETURNED"
  );

}

/* Barang yang sudah GATE keluar lewat menu Return */
function ambilDataReturnAsset() {

  return ambilDataReport().filter(
    item => item.status === "RETURNED" && item.ret
  );

}


/* ==========================================================
   HELPER
   ========================================================== */

/* Teks aman untuk HTML; kosong ditampilkan sebagai "-" */
function teksReport(value) {

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

/* "2026-09-20T10:00:00.000Z" atau "2026-09-20" -> "20-09-2026" */
function formatTanggalReport(tanggal) {

  if (!tanggal || tanggal === "-") {
    return "";
  }

  const parts = String(tanggal).slice(0, 10).split("-");

  if (parts.length !== 3) {
    return tanggal;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}

/* Ambil bagian tanggal saja (YYYY-MM-DD) dari ISO datetime, untuk dibandingkan */
function tanggalSaja(nilai) {

  return nilai ? String(nilai).slice(0, 10) : "";

}


/* ==========================================================
   BARIS TABEL
   Kolom: Customer, Aset No, Dokumen, No Aju, Uraian Barang,
          Kode Barang, Jumlah, Satuan, HS Code, Lokasi,
          Tgl. Masuk/Keluar, No. Daftar, Tgl. Daftar
   ========================================================== */

function barisAllAsset(item) {

  return {
    customer: item.perusahaan,
    aset: item.aset,
    dokumen: item.kodeDoc,
    noAju: item.nomorAju,
    uraian: item.uraian,
    kode: item.kode,
    jumlah: item.jumlah,
    satuan: item.satuan,
    hsCode: item.hsCode,
    lokasi: item.gate && item.gate.lokasi,
    tglTransaksi: item.tglGate,
    noDaftar: item.nomorDaftar,
    tglDaftar: item.tglDaftar
  };

}

function barisReturnAsset(item) {

  const ret = item.ret || {};

  return {
    customer: item.perusahaan,
    aset: item.aset,
    dokumen: ret.kodeDoc,
    noAju: ret.nomorAju,
    uraian: item.uraian,
    kode: item.kode,
    jumlah: item.jumlah,
    satuan: item.satuan,
    hsCode: item.hsCode,
    lokasi: ret.lokasi,
    tglTransaksi: ret.tglGate,
    noDaftar: ret.nomorDaftar,
    tglDaftar: ret.tglDaftar
  };

}


/* ==========================================================
   RENDER TABEL
   ========================================================== */

function renderTabelReport(tab) {

  const daftarItem = tab === "all" ? ambilDataAllAsset() : ambilDataReturnAsset();
  const jadikanBaris = tab === "all" ? barisAllAsset : barisReturnAsset;

  const daftarBaris = daftarItem
    .map(jadikanBaris)
    .sort((a, b) => String(b.tglTransaksi || "").localeCompare(String(a.tglTransaksi || "")));

  const tbody = document.getElementById("tabel-" + tab + "-body");

  tbody.innerHTML = "";

  daftarBaris.forEach(baris => {

    const tr = document.createElement("tr");

    tr.dataset.tanggal = tanggalSaja(baris.tglTransaksi);

    tr.innerHTML =
      `<td>${teksReport(baris.customer)}</td>` +
      `<td>${teksReport(baris.aset)}</td>` +
      `<td>${teksReport(baris.dokumen)}</td>` +
      `<td>${teksReport(baris.noAju)}</td>` +
      `<td class="left">${teksReport(baris.uraian)}</td>` +
      `<td>${teksReport(baris.kode)}</td>` +
      `<td>${teksReport(baris.jumlah)}</td>` +
      `<td>${teksReport(baris.satuan)}</td>` +
      `<td>${teksReport(baris.hsCode)}</td>` +
      `<td>${teksReport(baris.lokasi)}</td>` +
      `<td>${formatTanggalReport(baris.tglTransaksi)}</td>` +
      `<td>${teksReport(baris.noDaftar)}</td>` +
      `<td>${formatTanggalReport(baris.tglDaftar)}</td>`;

    tbody.appendChild(tr);

  });

  pasangLabelKolomReport("table-" + tab);
  perbaruiJumlahReport(tab);

}


/* ==========================================================
   LABEL KOLOM UNTUK TAMPILAN HP
   Di HP tabel menjadi kartu; tiap isian diberi nama kolomnya
   (dibaca dari judul kolom tabel) lewat atribut data-label.
   ========================================================== */

function pasangLabelKolomReport(idTabel) {

  const tabel = document.getElementById(idTabel);

  if (!tabel) {
    return;
  }

  const judul = Array.from(tabel.querySelectorAll("thead th")).map(th => th.textContent.trim());

  tabel.querySelectorAll("tbody tr").forEach(tr => {

    Array.from(tr.children).forEach((td, index) => {
      td.setAttribute("data-label", judul[index] || "");
    });

  });

}


/* ==========================================================
   FILTER: PERIODE TANGGAL (Tampilkan)
   ========================================================== */

function tampilkanReport(tab) {

  const dari = document.getElementById(tab + "-tgl-dari").value;
  const sampai = document.getElementById(tab + "-tgl-sampai").value;

  const baris = document.querySelectorAll("#table-" + tab + " tbody tr");

  baris.forEach(tr => {

    const tanggal = tr.dataset.tanggal || "";

    const cocokDari = !dari || (tanggal && tanggal >= dari);
    const cocokSampai = !sampai || (tanggal && tanggal <= sampai);

    tr.classList.toggle("tersembunyi-periode", !(cocokDari && cocokSampai));

  });

  /* pencarian teks yang sedang aktif tetap dihormati */
  const inputCari = document.getElementById(tab + "-cari");

  cariReport(tab, inputCari ? inputCari.value : "");

}


/* ==========================================================
   FILTER: PENCARIAN TEKS (Cari)
   ========================================================== */

function cariReport(tab, kataKunci) {

  const keyword = String(kataKunci || "").toLowerCase().trim();

  const baris = document.querySelectorAll("#table-" + tab + " tbody tr");

  baris.forEach(tr => {

    const cocokTeks = keyword === "" || tr.innerText.toLowerCase().includes(keyword);

    tr.classList.toggle("tersembunyi-cari", !cocokTeks);

  });

  perbaruiJumlahReport(tab);

}


/* ==========================================================
   JUMLAH DATA YANG TAMPIL
   ========================================================== */

function perbaruiJumlahReport(tab) {

  const tampil = document.querySelectorAll(
    "#table-" + tab + " tbody tr:not(.tersembunyi-periode):not(.tersembunyi-cari)"
  );

  document.getElementById(tab + "-jumlah").textContent = tampil.length;

}


/* ==========================================================
   EXPORT EXCEL
   File .xls dibuat langsung di browser (tanpa server / library
   tambahan) dari data yang sedang tampil di tabel.
   ========================================================== */

function exportExcel(tab) {

  const judulKolom = tab === "all" ? KOLOM_REPORT : KOLOM_REPORT_RETURN;

  const barisTampil = Array.from(
    document.querySelectorAll(
      "#table-" + tab + " tbody tr:not(.tersembunyi-periode):not(.tersembunyi-cari)"
    )
  );

  if (barisTampil.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  let html = "<table><thead><tr>";

  judulKolom.forEach(judul => {
    html += `<th>${judul}</th>`;
  });

  html += "</tr></thead><tbody>";

  barisTampil.forEach(tr => {

    html += "<tr>";

    tr.querySelectorAll("td").forEach(td => {
      html += `<td>${td.textContent}</td>`;
    });

    html += "</tr>";

  });

  html += "</tbody></table>";

  const namaFile = (tab === "all" ? "report-all-asset-" : "report-return-asset-")
    + new Date().toISOString().slice(0, 10) + ".xls";

  const blob = new Blob(
    ["\ufeff<html><head><meta charset='UTF-8'></head><body>" + html + "</body></html>"],
    { type: "application/vnd.ms-excel" }
  );

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = namaFile;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

}


/* ==========================================================
   TAB
   ========================================================== */

function bukaTabReport(tab) {

  ["all", "return"].forEach(nama => {

    document.getElementById("tab-" + nama).classList.remove("active");
    document.getElementById("tab-button-" + nama).classList.remove("active");

  });

  document.getElementById("tab-" + tab).classList.add("active");
  document.getElementById("tab-button-" + tab).classList.add("active");

  renderTabelReport(tab);

  location.hash = tab;

}

/* Buka tab sesuai alamat, mis. report.html#return (dipakai link dari sidebar) */
function bukaTabReportDariHash() {

  const tab = location.hash.replace("#", "");

  if (["all", "return"].includes(tab)) {
    bukaTabReport(tab);
  } else {
    renderTabelReport("all");
  }

}


/* ==========================================================
   INITIALIZE
   ========================================================== */

bukaTabReportDariHash();

/* Data berubah di tab lain (mis. halaman Register) -> segarkan */
window.addEventListener("storage", function (event) {

  if (event.key === REPORT_STORAGE_KEY || event.key === null) {
    renderTabelReport("all");
    renderTabelReport("return");
  }

});

/* Kembali ke halaman ini lewat tombol Back -> segarkan */
window.addEventListener("pageshow", function (event) {

  if (event.persisted) {
    renderTabelReport("all");
    renderTabelReport("return");
  }

});
