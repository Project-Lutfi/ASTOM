/* ==========================================================
   PENGATURAN (boleh diubah)
   ========================================================== */

/* Data dibaca dari localStorage yang sama dengan halaman Register */
const STORAGE_KEY = "astom_list_barang";

/* Judul dua kartu BC di dashboard (harus sama dengan tulisan di kartu) */
const BC_KARTU_1 = "BC 2.7";
const BC_KARTU_2 = "BC 4.0";

/* Jumlah baris minimum tabel history (kekurangan diisi baris kosong) */
const JUMLAH_BARIS_MIN = 7;

/* Warna potongan pie chart */
const WARNA_CHART = [
  "#175d84", "#e66632", "#58b036", "#f7a600",
  "#8e5ea2", "#3cba9f", "#c0392b", "#7f8c8d"
];
const WARNA_TANPA_BC = "#b0b8c0";
const LABEL_TANPA_BC = "Belum ada BC";

let chartAsset = null;
let chartReturn = null;


/* ==========================================================
   BACA DATA
   ========================================================== */

function ambilData() {

  try {

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return Array.isArray(data) ? data : [];

  } catch (error) {

    return [];

  }

}

/* "BC.2.3" / "bc 2.3" / "BC2.3" -> "BC 2.3"; kosong -> "Belum ada BC" */
function normalisasiBc(teks) {

  const t = String(teks || "").trim();

  if (!t) {
    return LABEL_TANPA_BC;
  }

  const cocok = t.match(/(\d+(?:[.,]\d+)?)/);

  return cocok ? "BC " + cocok[1].replace(",", ".") : t.toUpperCase();

}

/* Hitung jumlah per jenis BC -> { labels: [...], values: [...] } */
function hitungPerBc(daftarKode) {

  const hitung = {};

  daftarKode.forEach(kode => {

    const label = normalisasiBc(kode);

    hitung[label] = (hitung[label] || 0) + 1;

  });

  const labels = Object.keys(hitung).sort((a, b) => {

    if (a === LABEL_TANPA_BC) return 1;
    if (b === LABEL_TANPA_BC) return -1;

    return hitung[b] - hitung[a];

  });

  return {
    labels: labels,
    values: labels.map(label => hitung[label])
  };

}


/* ==========================================================
   KARTU RINGKASAN
   ========================================================== */

function isiKartu(diterima, dikembalikan) {

  const jumlahBc = judul =>
    diterima.filter(item => normalisasiBc(item.kodeDoc) === judul).length;

  document.getElementById("card-asset").textContent = diterima.length;
  document.getElementById("card-bc1").textContent = jumlahBc(BC_KARTU_1);
  document.getElementById("card-bc2").textContent = jumlahBc(BC_KARTU_2);
  document.getElementById("card-return").textContent = dikembalikan.length;

}


/* ==========================================================
   TABEL HISTORY
   ========================================================== */

function isiTabel(idTbody, baris) {

  const tbody = document.getElementById(idTbody);

  tbody.innerHTML = "";

  baris.forEach((kolom, index) => {

    const tr = document.createElement("tr");

    tr.innerHTML =
      `<td>${index + 1}</td>` +
      `<td>${teks(kolom[0])}</td>` +
      `<td class="left">${teks(kolom[1])}</td>` +
      `<td>${teks(kolom[2])}</td>` +
      `<td>${teks(kolom[3])}</td>` +
      `<td>${teks(kolom[4])}</td>` +
      `<td>${teks(kolom[5])}</td>`;

    tbody.appendChild(tr);

  });

  /* baris kosong supaya tampilan tetap sama seperti desain */
  for (let i = baris.length; i < JUMLAH_BARIS_MIN; i++) {

    const tr = document.createElement("tr");

    tr.className = "empty-row";
    tr.innerHTML = "<td></td>".repeat(7);

    tbody.appendChild(tr);

  }

}

/* Urutkan dari yang terbaru */
function urutTerbaru(daftar, ambilWaktu) {

  return daftar.slice().sort((a, b) =>
    String(ambilWaktu(b) || "").localeCompare(String(ambilWaktu(a) || ""))
  );

}


/* ==========================================================
   PIE CHART
   ========================================================== */

function gambarPie(idCanvas, chartLama, hitungan) {

  const canvas = document.getElementById(idCanvas);
  const pesan = canvas.parentElement.querySelector(".chart-pesan");

  if (chartLama) {
    chartLama.destroy();
  }

  /* Chart.js belum termuat (mis. tidak ada internet) */
  if (typeof Chart === "undefined") {

    canvas.style.display = "none";

    pesan.textContent =
      "Grafik tidak dapat dimuat. Periksa koneksi internet.";
    pesan.style.display = "flex";

    return null;

  }

  canvas.style.display = "";
  pesan.style.display = "none";

  const kosong = hitungan.labels.length === 0;

  const labels = kosong ? ["Belum ada data"] : hitungan.labels;
  const values = kosong ? [1] : hitungan.values;

  let urutanWarna = 0;

  const warna = kosong
    ? ["#d5dde5"]
    : labels.map(label => {

        if (label === LABEL_TANPA_BC) {
          return WARNA_TANPA_BC;
        }

        return WARNA_CHART[urutanWarna++ % WARNA_CHART.length];

      });

  return new Chart(canvas.getContext("2d"), {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: warna,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: { enabled: !kosong },
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            font: { size: 9 },
            usePointStyle: false
          }
        }
      }
    }
  });

}


/* ==========================================================
   RENDER DASHBOARD
   ========================================================== */

function renderDashboard() {

  const semua = ambilData();

  /* Barang yang saat ini ada (sudah GATE masuk, belum dikembalikan) */
  const diterima = semua.filter(item => item.status === "RECEIVED");

  /* Barang yang sudah GATE keluar lewat menu Return */
  const dikembalikan = semua.filter(item => item.status === "RETURNED");

  /* Semua barang yang pernah masuk gate */
  const pernahMasuk = semua.filter(
    item => item.status === "RECEIVED" || item.status === "RETURNED"
  );

  isiKartu(diterima, dikembalikan);

  /* History Pemasukan: Dokumen, Nama Barang, Kode Barang,
     Nomor Pendaftar, Tgl. Pendaftar, Aset No. */
  isiTabel(
    "tabel-pemasukan",
    urutTerbaru(pernahMasuk, item => item.tglGate || item.tglPilih)
      .map(item => [
        item.kodeDoc,
        item.uraian,
        item.kode,
        item.nomorDaftar,
        formatTanggal(item.tglDaftar),
        item.aset
      ])
  );

  /* History Pengembalian: Dokumen, Nama Barang, Kode Barang,
     BC No., Tgl. BC, Aset No. */
  isiTabel(
    "tabel-pengembalian",
    urutTerbaru(dikembalikan, item => item.ret && item.ret.tglGate)
      .map(item => {

        const r = item.ret || {};

        return [
          r.kodeDoc,
          item.uraian,
          item.kode,
          r.nomorDaftar,
          formatTanggal(r.tglDaftar),
          item.aset
        ];

      })
  );

  chartAsset = gambarPie(
    "assetCustomersChart",
    chartAsset,
    hitungPerBc(diterima.map(item => item.kodeDoc))
  );

  chartReturn = gambarPie(
    "returnAssetChart",
    chartReturn,
    hitungPerBc(dikembalikan.map(item => item.ret && item.ret.kodeDoc))
  );

}


/* ==========================================================
   HELPER
   ========================================================== */

/* "2026-09-20" -> "20-09-2026"; kosong -> "" */
function formatTanggal(tanggal) {

  if (!tanggal || tanggal === "-") {
    return "";
  }

  const parts = String(tanggal).split("-");

  if (parts.length !== 3) {
    return tanggal;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}

/* Teks aman untuk HTML; kosong ditampilkan sebagai "-" */
function teks(value) {

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


/* ==========================================================
   INITIALIZE
   ========================================================== */

renderDashboard();

/* Data berubah di tab lain (mis. halaman Register) -> segarkan */
window.addEventListener("storage", function (event) {

  if (event.key === STORAGE_KEY || event.key === null) {
    renderDashboard();
  }

});

/* Kembali ke dashboard lewat tombol Back -> segarkan */
window.addEventListener("pageshow", function (event) {

  if (event.persisted) {
    renderDashboard();
  }

});
