/* ==========================================================
   MASTER CUSTOMER
   Data disimpan di localStorage (belum terhubung ke server).
   ========================================================== */

const STORAGE_KEY_CUSTOMER = "astom_master_customer";

let listCustomer = [];
let customerEditId = null;   // id customer yang sedang diedit (null = mode tambah)
let customerHapusId = null;  // id customer yang akan dihapus (menunggu konfirmasi)
let customerHalaman = 1;     // halaman tabel yang aktif


/* ==========================================================
   LOAD & SAVE
   ========================================================== */

function loadCustomer() {

  const data = localStorage.getItem(STORAGE_KEY_CUSTOMER);

  if (!data) {
    listCustomer = [];
    return;
  }

  try {
    listCustomer = JSON.parse(data);
  } catch (error) {
    listCustomer = [];
  }

}

function saveCustomer() {

  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(listCustomer));
    return true;
  } catch (error) {
    alert("Data gagal disimpan karena penyimpanan browser penuh.");
    return false;
  }

}

function customerIdBerikutnya() {

  const idTertinggi = listCustomer.reduce(function (max, c) {
    return c.id > max ? c.id : max;
  }, 0);

  return idTertinggi + 1;

}


/* ==========================================================
   RENDER TABEL
   ========================================================== */

function dataCustomerTersaring() {

  const kata = document.getElementById("master-cari").value.toLowerCase().trim();

  if (!kata) {
    return listCustomer;
  }

  return listCustomer.filter(function (c) {
    return (
      c.nama.toLowerCase().includes(kata) ||
      c.alamat.toLowerCase().includes(kata) ||
      c.npwp.toLowerCase().includes(kata)
    );
  });

}

function renderTabel() {

  customerHalaman = 1;
  renderHalamanTabel();

}

function renderHalamanTabel() {

  const tbody = document.getElementById("tabel-customer-body");
  const dataTersaring = dataCustomerTersaring();
  const perHalaman = parseInt(document.getElementById("master-show").value, 10) || 10;

  const totalHalaman = Math.max(1, Math.ceil(dataTersaring.length / perHalaman));

  if (customerHalaman > totalHalaman) {
    customerHalaman = totalHalaman;
  }

  const awal = (customerHalaman - 1) * perHalaman;
  const dataHalaman = dataTersaring.slice(awal, awal + perHalaman);

  tbody.innerHTML = "";

  if (dataHalaman.length === 0) {

    tbody.innerHTML =
      '<tr><td colspan="5" class="master-empty">Belum ada data customer</td></tr>';

  } else {

    dataHalaman.forEach(function (c) {

      const badgeStatus = c.status === "KB"
        ? '<span class="master-badge master-badge-admin">KB</span>'
        : '<span class="master-badge master-badge-user">TLDDP</span>';

      const baris = document.createElement("tr");

      baris.innerHTML =
        '<td class="kolom-kiri">' + escapeHtml(c.nama) + "</td>" +
        '<td class="kolom-kiri">' + escapeHtml(c.alamat) + "</td>" +
        "<td>" + escapeHtml(c.npwp) + "</td>" +
        "<td>" + badgeStatus + "</td>" +
        '<td><div class="master-aksi">' +
          '<button type="button" class="master-btn-edit" title="Edit" onclick="bukaFormEdit(' + c.id + ')">' +
            '<span class="ico ico-save"></span>' +
          "</button>" +
          '<button type="button" class="master-btn-hapus" title="Hapus" onclick="mintaKonfirmasiHapus(' + c.id + ')">' +
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
  tombolSebelumnya.disabled = customerHalaman === 1;
  tombolSebelumnya.onclick = function () {
    customerHalaman -= 1;
    renderHalamanTabel();
  };
  wadah.appendChild(tombolSebelumnya);

  for (let i = 1; i <= totalHalaman; i++) {

    const tombol = document.createElement("button");
    tombol.textContent = String(i);

    if (i === customerHalaman) {
      tombol.classList.add("aktif");
    }

    tombol.onclick = function () {
      customerHalaman = i;
      renderHalamanTabel();
    };

    wadah.appendChild(tombol);

  }

  const tombolBerikutnya = document.createElement("button");
  tombolBerikutnya.textContent = ">";
  tombolBerikutnya.disabled = customerHalaman === totalHalaman;
  tombolBerikutnya.onclick = function () {
    customerHalaman += 1;
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

  customerEditId = null;

  document.getElementById("customer-form-judul").textContent = "Tambah Customer";
  document.getElementById("customer-nama").value = "";
  document.getElementById("customer-alamat").value = "";
  document.getElementById("customer-npwp").value = "";
  document.getElementById("customer-status").value = "KB";
  sembunyikanErrorForm();

  document.getElementById("customer-form-overlay").classList.add("active");

}

function bukaFormEdit(id) {

  const c = listCustomer.find(function (item) {
    return item.id === id;
  });

  if (!c) {
    return;
  }

  customerEditId = id;

  document.getElementById("customer-form-judul").textContent = "Edit Customer";
  document.getElementById("customer-nama").value = c.nama;
  document.getElementById("customer-alamat").value = c.alamat;
  document.getElementById("customer-npwp").value = c.npwp;
  document.getElementById("customer-status").value = c.status;
  sembunyikanErrorForm();

  document.getElementById("customer-form-overlay").classList.add("active");

}

function tutupForm() {
  document.getElementById("customer-form-overlay").classList.remove("active");
}

function klikLuarForm(event) {

  if (event.target.id === "customer-form-overlay") {
    tutupForm();
  }

}

function tampilkanErrorForm(pesan) {

  const kotak = document.getElementById("customer-form-error");
  kotak.textContent = pesan;
  kotak.classList.add("tampil");

}

function sembunyikanErrorForm() {

  const kotak = document.getElementById("customer-form-error");
  kotak.textContent = "";
  kotak.classList.remove("tampil");

}

function simpanCustomer() {

  const nama = document.getElementById("customer-nama").value.trim();
  const alamat = document.getElementById("customer-alamat").value.trim();
  const npwp = document.getElementById("customer-npwp").value.trim();
  const status = document.getElementById("customer-status").value;

  if (!nama || !alamat || !npwp) {
    tampilkanErrorForm("Nama, Alamat, dan Npwp wajib diisi.");
    return;
  }

  const npwpDipakai = listCustomer.some(function (c) {
    return (
      c.npwp.replace(/\D/g, "") === npwp.replace(/\D/g, "") &&
      c.id !== customerEditId
    );
  });

  if (npwpDipakai) {
    tampilkanErrorForm("Npwp sudah terdaftar untuk customer lain.");
    return;
  }

  if (customerEditId === null) {

    listCustomer.push({
      id: customerIdBerikutnya(),
      nama: nama,
      alamat: alamat,
      npwp: npwp,
      status: status
    });

  } else {

    const c = listCustomer.find(function (item) {
      return item.id === customerEditId;
    });

    if (c) {
      c.nama = nama;
      c.alamat = alamat;
      c.npwp = npwp;
      c.status = status;
    }

  }

  if (!saveCustomer()) {
    return;
  }

  tutupForm();
  renderTabel();

}


/* ==========================================================
   HAPUS
   ========================================================== */

function mintaKonfirmasiHapus(id) {

  const c = listCustomer.find(function (item) {
    return item.id === id;
  });

  if (!c) {
    return;
  }

  customerHapusId = id;

  document.getElementById("customer-confirm-text").textContent =
    'Hapus customer "' + c.nama + '"?';

  document.getElementById("customer-confirm-overlay").classList.add("active");

}

function tutupKonfirmasi() {
  customerHapusId = null;
  document.getElementById("customer-confirm-overlay").classList.remove("active");
}

function konfirmasiHapus() {

  if (customerHapusId === null) {
    return;
  }

  listCustomer = listCustomer.filter(function (c) {
    return c.id !== customerHapusId;
  });

  saveCustomer();
  tutupKonfirmasi();
  renderHalamanTabel();

}


/* ==========================================================
   INIT
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {

  loadCustomer();
  renderTabel();

  document.getElementById("master-show").addEventListener("change", renderTabel);

  document.getElementById("master-cari").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      renderTabel();
    }
  });

});
