/* ==========================================================
   MASTER BARANG
   Data disimpan di localStorage (belum terhubung ke server).
   Kode Barang dibuat otomatis dengan format BRG-0001, dst.
   ========================================================== */

const STORAGE_KEY_BARANG = "astom_master_barang";

let listBarangMaster = [];
let barangEditId = null;     // id barang yang sedang diedit (null = mode tambah)
let barangHapusId = null;    // id barang yang akan dihapus (menunggu konfirmasi)
let barangHalaman = 1;       // halaman tabel yang aktif


/* ==========================================================
   LOAD & SAVE
   ========================================================== */

function loadBarangMaster() {

  const data = localStorage.getItem(STORAGE_KEY_BARANG);

  if (!data) {
    listBarangMaster = [];
    return;
  }

  try {
    listBarangMaster = JSON.parse(data);
  } catch (error) {
    listBarangMaster = [];
  }

}

function saveBarangMaster() {

  try {
    localStorage.setItem(STORAGE_KEY_BARANG, JSON.stringify(listBarangMaster));
    return true;
  } catch (error) {
    alert("Data gagal disimpan karena penyimpanan browser penuh.");
    return false;
  }

}

function barangIdBerikutnya() {

  const idTertinggi = listBarangMaster.reduce(function (max, b) {
    return b.id > max ? b.id : max;
  }, 0);

  return idTertinggi + 1;

}

function buatKodeBarang() {

  const nomor = barangIdBerikutnya();
  return "BRG-" + String(nomor).padStart(4, "0");

}


/* ==========================================================
   RENDER TABEL
   ========================================================== */

function dataBarangTersaring() {

  const kata = document.getElementById("master-cari").value.toLowerCase().trim();

  if (!kata) {
    return listBarangMaster;
  }

  return listBarangMaster.filter(function (b) {
    return (
      b.kode.toLowerCase().includes(kata) ||
      b.uraian.toLowerCase().includes(kata) ||
      b.lokasi.toLowerCase().includes(kata)
    );
  });

}

function renderTabel() {

  barangHalaman = 1;
  renderHalamanTabel();

}

function renderHalamanTabel() {

  const tbody = document.getElementById("tabel-barang-body");
  const dataTersaring = dataBarangTersaring();
  const perHalaman = parseInt(document.getElementById("master-show").value, 10) || 10;

  const totalHalaman = Math.max(1, Math.ceil(dataTersaring.length / perHalaman));

  if (barangHalaman > totalHalaman) {
    barangHalaman = totalHalaman;
  }

  const awal = (barangHalaman - 1) * perHalaman;
  const dataHalaman = dataTersaring.slice(awal, awal + perHalaman);

  tbody.innerHTML = "";

  if (dataHalaman.length === 0) {

    tbody.innerHTML =
      '<tr><td colspan="7" class="master-empty">Belum ada data barang</td></tr>';

  } else {

    dataHalaman.forEach(function (b) {

      const baris = document.createElement("tr");

      baris.innerHTML =
        "<td>" + escapeHtml(b.kode) + "</td>" +
        '<td class="kolom-kiri">' + escapeHtml(b.uraian) + "</td>" +
        "<td>" + escapeHtml(b.satuan) + "</td>" +
        "<td>" + escapeHtml(b.netto) + "</td>" +
        "<td>" + escapeHtml(b.asetNo) + "</td>" +
        '<td class="kolom-kiri">' + escapeHtml(b.lokasi) + "</td>" +
        '<td><div class="master-aksi">' +
          '<button type="button" class="master-btn-edit" title="Edit" onclick="bukaFormEdit(' + b.id + ')">' +
            '<span class="ico ico-save"></span>' +
          "</button>" +
          '<button type="button" class="master-btn-hapus" title="Hapus" onclick="mintaKonfirmasiHapus(' + b.id + ')">' +
            '<span class="ico ico-trash"></span>' +
          "</button>" +
        "</div></td>";

      tbody.appendChild(baris);

    });

  }

  document.getElementById("master-info").textContent =
    "Menampilkan " + dataHalaman.length + " dari " + dataTersaring.length + " data";

  renderPagination(totalHalaman);

}

function renderPagination(totalHalaman) {

  const wadah = document.getElementById("master-pagination");
  wadah.innerHTML = "";

  if (totalHalaman <= 1) {
    return;
  }

  const tombolSebelumnya = document.createElement("button");
  tombolSebelumnya.textContent = "<";
  tombolSebelumnya.disabled = barangHalaman === 1;
  tombolSebelumnya.onclick = function () {
    barangHalaman -= 1;
    renderHalamanTabel();
  };
  wadah.appendChild(tombolSebelumnya);

  for (let i = 1; i <= totalHalaman; i++) {

    const tombol = document.createElement("button");
    tombol.textContent = String(i);

    if (i === barangHalaman) {
      tombol.classList.add("aktif");
    }

    tombol.onclick = function () {
      barangHalaman = i;
      renderHalamanTabel();
    };

    wadah.appendChild(tombol);

  }

  const tombolBerikutnya = document.createElement("button");
  tombolBerikutnya.textContent = ">";
  tombolBerikutnya.disabled = barangHalaman === totalHalaman;
  tombolBerikutnya.onclick = function () {
    barangHalaman += 1;
    renderHalamanTabel();
  };
  wadah.appendChild(tombolBerikutnya);

}

function escapeHtml(teks) {

  const div = document.createElement("div");
  div.textContent = teks;
  return div.innerHTML;

}


/* ==========================================================
   FORM TAMBAH / EDIT
   ========================================================== */

function bukaFormTambah() {

  barangEditId = null;

  document.getElementById("barang-form-judul").textContent = "Tambah Barang";
  document.getElementById("barang-kode").value = buatKodeBarang();
  document.getElementById("barang-uraian").value = "";
  document.getElementById("barang-satuan").value = "";
  document.getElementById("barang-netto").value = "";
  document.getElementById("barang-asetno").value = "";
  document.getElementById("barang-lokasi").value = "";
  sembunyikanErrorForm();

  document.getElementById("barang-form-overlay").classList.add("active");

}

function bukaFormEdit(id) {

  const b = listBarangMaster.find(function (item) {
    return item.id === id;
  });

  if (!b) {
    return;
  }

  barangEditId = id;

  document.getElementById("barang-form-judul").textContent = "Edit Barang";
  document.getElementById("barang-kode").value = b.kode;
  document.getElementById("barang-uraian").value = b.uraian;
  document.getElementById("barang-satuan").value = b.satuan;
  document.getElementById("barang-netto").value = b.netto;
  document.getElementById("barang-asetno").value = b.asetNo;
  document.getElementById("barang-lokasi").value = b.lokasi;
  sembunyikanErrorForm();

  document.getElementById("barang-form-overlay").classList.add("active");

}

function tutupForm() {
  document.getElementById("barang-form-overlay").classList.remove("active");
}

function klikLuarForm(event) {

  if (event.target.id === "barang-form-overlay") {
    tutupForm();
  }

}

function tampilkanErrorForm(pesan) {

  const kotak = document.getElementById("barang-form-error");
  kotak.textContent = pesan;
  kotak.classList.add("tampil");

}

function sembunyikanErrorForm() {

  const kotak = document.getElementById("barang-form-error");
  kotak.textContent = "";
  kotak.classList.remove("tampil");

}

function simpanBarang() {

  const uraian = document.getElementById("barang-uraian").value.trim();
  const satuan = document.getElementById("barang-satuan").value.trim();
  const netto = document.getElementById("barang-netto").value.trim();
  const asetNo = document.getElementById("barang-asetno").value.trim();
  const lokasi = document.getElementById("barang-lokasi").value.trim();

  if (!uraian || !satuan) {
    tampilkanErrorForm("Uraian Barang dan Satuan wajib diisi.");
    return;
  }

  if (barangEditId === null) {

    listBarangMaster.push({
      id: barangIdBerikutnya(),
      kode: document.getElementById("barang-kode").value,
      uraian: uraian,
      satuan: satuan,
      netto: netto,
      asetNo: asetNo,
      lokasi: lokasi
    });

  } else {

    const b = listBarangMaster.find(function (item) {
      return item.id === barangEditId;
    });

    if (b) {
      b.uraian = uraian;
      b.satuan = satuan;
      b.netto = netto;
      b.asetNo = asetNo;
      b.lokasi = lokasi;
    }

  }

  if (!saveBarangMaster()) {
    return;
  }

  tutupForm();
  renderTabel();

}


/* ==========================================================
   HAPUS
   ========================================================== */

function mintaKonfirmasiHapus(id) {

  const b = listBarangMaster.find(function (item) {
    return item.id === id;
  });

  if (!b) {
    return;
  }

  barangHapusId = id;

  document.getElementById("barang-confirm-text").textContent =
    'Hapus barang "' + b.uraian + '" (' + b.kode + ")?";

  document.getElementById("barang-confirm-overlay").classList.add("active");

}

function tutupKonfirmasi() {
  barangHapusId = null;
  document.getElementById("barang-confirm-overlay").classList.remove("active");
}

function konfirmasiHapus() {

  if (barangHapusId === null) {
    return;
  }

  listBarangMaster = listBarangMaster.filter(function (b) {
    return b.id !== barangHapusId;
  });

  saveBarangMaster();
  tutupKonfirmasi();
  renderHalamanTabel();

}


/* ==========================================================
   INIT
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {

  loadBarangMaster();
  renderTabel();

  document.getElementById("master-show").addEventListener("change", renderTabel);

  document.getElementById("master-cari").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      renderTabel();
    }
  });

});
