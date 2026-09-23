/* ==========================================================
   MASTER USER
   Data disimpan di localStorage (belum terhubung ke server).
   ========================================================== */

const STORAGE_KEY_USER = "astom_master_user";

let listUser = [];
let userEditId = null;      // id user yang sedang diedit (null = mode tambah)
let userHapusId = null;     // id user yang akan dihapus (menunggu konfirmasi)
let userHalaman = 1;        // halaman tabel yang aktif


/* ==========================================================
   LOAD & SAVE
   ========================================================== */

function loadUser() {

  const data = localStorage.getItem(STORAGE_KEY_USER);

  if (!data) {
    listUser = [];
    return;
  }

  try {
    listUser = JSON.parse(data);
  } catch (error) {
    listUser = [];
  }

}

function saveUser() {

  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(listUser));
    return true;
  } catch (error) {
    alert("Data gagal disimpan karena penyimpanan browser penuh.");
    return false;
  }

}

function userIdBerikutnya() {

  const idTertinggi = listUser.reduce(function (max, u) {
    return u.id > max ? u.id : max;
  }, 0);

  return idTertinggi + 1;

}


/* ==========================================================
   RENDER TABEL
   ========================================================== */

function dataUserTersaring() {

  const kata = document.getElementById("master-cari").value.toLowerCase().trim();

  if (!kata) {
    return listUser;
  }

  return listUser.filter(function (u) {
    return (
      u.nama.toLowerCase().includes(kata) ||
      u.email.toLowerCase().includes(kata) ||
      u.username.toLowerCase().includes(kata)
    );
  });

}

function renderTabel() {

  userHalaman = 1;
  renderHalamanTabel();

}

function renderHalamanTabel() {

  const tbody = document.getElementById("tabel-user-body");
  const dataTersaring = dataUserTersaring();
  const perHalaman = parseInt(document.getElementById("master-show").value, 10) || 10;

  const totalHalaman = Math.max(1, Math.ceil(dataTersaring.length / perHalaman));

  if (userHalaman > totalHalaman) {
    userHalaman = totalHalaman;
  }

  const awal = (userHalaman - 1) * perHalaman;
  const dataHalaman = dataTersaring.slice(awal, awal + perHalaman);

  tbody.innerHTML = "";

  if (dataHalaman.length === 0) {

    tbody.innerHTML =
      '<tr><td colspan="6" class="master-empty">Belum ada data user</td></tr>';

  } else {

    dataHalaman.forEach(function (u) {

      const statusAktif = u.status === "AKTIF";
      const badgeStatus = statusAktif
        ? '<span class="master-badge master-badge-aktif">Aktif</span>'
        : '<span class="master-badge master-badge-nonaktif">Tidak Aktif</span>';

      const badgeAkses = u.hakAkses === "ADMIN"
        ? '<span class="master-badge master-badge-admin">Admin</span>'
        : '<span class="master-badge master-badge-user">User</span>';

      const baris = document.createElement("tr");

      baris.innerHTML =
        "<td>" + escapeHtml(String(u.id)) + "</td>" +
        '<td class="kolom-kiri">' + escapeHtml(u.nama) + "</td>" +
        '<td class="kolom-kiri">' + escapeHtml(u.email) + "</td>" +
        "<td>" + badgeAkses + "</td>" +
        "<td>" + badgeStatus + "</td>" +
        '<td><div class="master-aksi">' +
          '<button type="button" class="master-btn-edit" title="Edit" onclick="bukaFormEdit(' + u.id + ')">' +
            '<span class="ico ico-save"></span>' +
          "</button>" +
          '<button type="button" class="master-btn-hapus" title="Hapus" onclick="mintaKonfirmasiHapus(' + u.id + ')">' +
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
  tombolSebelumnya.disabled = userHalaman === 1;
  tombolSebelumnya.onclick = function () {
    userHalaman -= 1;
    renderHalamanTabel();
  };
  wadah.appendChild(tombolSebelumnya);

  for (let i = 1; i <= totalHalaman; i++) {

    const tombol = document.createElement("button");
    tombol.textContent = String(i);

    if (i === userHalaman) {
      tombol.classList.add("aktif");
    }

    tombol.onclick = function () {
      userHalaman = i;
      renderHalamanTabel();
    };

    wadah.appendChild(tombol);

  }

  const tombolBerikutnya = document.createElement("button");
  tombolBerikutnya.textContent = ">";
  tombolBerikutnya.disabled = userHalaman === totalHalaman;
  tombolBerikutnya.onclick = function () {
    userHalaman += 1;
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

  userEditId = null;

  document.getElementById("user-form-judul").textContent = "Tambah User";
  document.getElementById("user-nama").value = "";
  document.getElementById("user-email").value = "";
  document.getElementById("user-username").value = "";
  document.getElementById("user-password").value = "";
  document.getElementById("user-konfirmasi").value = "";
  document.getElementById("user-status").value = "AKTIF";
  document.getElementById("user-hakakses").value = "USER";
  document.getElementById("user-password-ket").textContent = "";
  sembunyikanErrorForm();

  document.getElementById("user-form-overlay").classList.add("active");

}

function bukaFormEdit(id) {

  const u = listUser.find(function (item) {
    return item.id === id;
  });

  if (!u) {
    return;
  }

  userEditId = id;

  document.getElementById("user-form-judul").textContent = "Edit User";
  document.getElementById("user-nama").value = u.nama;
  document.getElementById("user-email").value = u.email;
  document.getElementById("user-username").value = u.username;
  document.getElementById("user-password").value = "";
  document.getElementById("user-konfirmasi").value = "";
  document.getElementById("user-status").value = u.status;
  document.getElementById("user-hakakses").value = u.hakAkses;
  document.getElementById("user-password-ket").textContent =
    "(kosongkan bila tidak ingin mengganti password)";
  sembunyikanErrorForm();

  document.getElementById("user-form-overlay").classList.add("active");

}

function tutupForm() {
  document.getElementById("user-form-overlay").classList.remove("active");
}

function klikLuarForm(event) {

  if (event.target.id === "user-form-overlay") {
    tutupForm();
  }

}

function tampilkanErrorForm(pesan) {

  const kotak = document.getElementById("user-form-error");
  kotak.textContent = pesan;
  kotak.classList.add("tampil");

}

function sembunyikanErrorForm() {

  const kotak = document.getElementById("user-form-error");
  kotak.textContent = "";
  kotak.classList.remove("tampil");

}

function togglePassword(idInput, tombol) {

  const input = document.getElementById(idInput);
  input.type = input.type === "password" ? "text" : "password";

}

function simpanUser() {

  const nama = document.getElementById("user-nama").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const username = document.getElementById("user-username").value.trim();
  const password = document.getElementById("user-password").value;
  const konfirmasi = document.getElementById("user-konfirmasi").value;
  const status = document.getElementById("user-status").value;
  const hakAkses = document.getElementById("user-hakakses").value;

  if (!nama || !email || !username) {
    tampilkanErrorForm("Nama, Email, dan User Name wajib diisi.");
    return;
  }

  const polaEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!polaEmail.test(email)) {
    tampilkanErrorForm("Format email tidak valid.");
    return;
  }

  const usernameDipakai = listUser.some(function (u) {
    return (
      u.username.toLowerCase() === username.toLowerCase() &&
      u.id !== userEditId
    );
  });

  if (usernameDipakai) {
    tampilkanErrorForm("User Name sudah dipakai, gunakan yang lain.");
    return;
  }

  /* password wajib diisi saat tambah baru; saat edit boleh dikosongkan */
  if (userEditId === null || password !== "" || konfirmasi !== "") {

    if (password.length < 6) {
      tampilkanErrorForm("Password minimal 6 karakter.");
      return;
    }

    if (password !== konfirmasi) {
      tampilkanErrorForm("Confirm Password tidak sama dengan Password.");
      return;
    }

  }

  if (userEditId === null) {

    listUser.push({
      id: userIdBerikutnya(),
      nama: nama,
      email: email,
      username: username,
      password: password,
      status: status,
      hakAkses: hakAkses
    });

  } else {

    const u = listUser.find(function (item) {
      return item.id === userEditId;
    });

    if (u) {
      u.nama = nama;
      u.email = email;
      u.username = username;
      u.status = status;
      u.hakAkses = hakAkses;

      if (password !== "") {
        u.password = password;
      }
    }

  }

  if (!saveUser()) {
    return;
  }

  tutupForm();
  renderTabel();

}


/* ==========================================================
   HAPUS
   ========================================================== */

function mintaKonfirmasiHapus(id) {

  const u = listUser.find(function (item) {
    return item.id === id;
  });

  if (!u) {
    return;
  }

  userHapusId = id;

  document.getElementById("user-confirm-text").textContent =
    'Hapus user "' + u.nama + '"?';

  document.getElementById("user-confirm-overlay").classList.add("active");

}

function tutupKonfirmasi() {
  userHapusId = null;
  document.getElementById("user-confirm-overlay").classList.remove("active");
}

function konfirmasiHapus() {

  if (userHapusId === null) {
    return;
  }

  listUser = listUser.filter(function (u) {
    return u.id !== userHapusId;
  });

  saveUser();
  tutupKonfirmasi();
  renderHalamanTabel();

}


/* ==========================================================
   INIT
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {

  loadUser();
  renderTabel();

  document.getElementById("master-show").addEventListener("change", renderTabel);

  document.getElementById("master-cari").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      renderTabel();
    }
  });

});
