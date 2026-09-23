/* ==========================================================
   SESI LOGIN (dipakai semua halaman)

   - Halaman yang WAJIB login (dashboard.html, register.html)
     cukup memberi atribut  data-butuh-login  pada tag <html>
     dan memuat file ini di <head>.
   - Halaman login (index.html) memakai buatSesi() setelah
     username dan password benar.

   Catatan: ini pengaman di sisi browser saja. Siapa pun yang
   paham developer tools masih bisa melewatinya. Untuk keamanan
   sungguhan, login harus diperiksa oleh server.
   ========================================================== */

const KUNCI_SESI = "astom_session";
const MASA_SESI_JAM = 8;
const HALAMAN_LOGIN = "index.html";


function buatSesi(user) {

  const sesi = {
    username: user.username,
    nama: user.nama,
    tipe: user.tipe,
    exp: Date.now() + MASA_SESI_JAM * 60 * 60 * 1000
  };

  localStorage.setItem(KUNCI_SESI, JSON.stringify(sesi));

}

function ambilSesi() {

  try {

    const sesi = JSON.parse(localStorage.getItem(KUNCI_SESI));

    if (!sesi || !sesi.exp || sesi.exp < Date.now()) {
      hapusSesi();
      return null;
    }

    return sesi;

  } catch (error) {

    return null;

  }

}

function hapusSesi() {

  try {
    localStorage.removeItem(KUNCI_SESI);
  } catch (error) {
    /* abaikan */
  }

}

function keluar() {

  hapusSesi();

  window.location.href = HALAMAN_LOGIN;

}

/* Belum login -> kembali ke halaman login */
function wajibLogin() {

  if (ambilSesi()) {
    return true;
  }

  document.documentElement.style.display = "none";

  window.location.replace(HALAMAN_LOGIN);

  return false;

}

/* Tampilkan nama user di header dan aktifkan menu LOGOUT */
function siapkanSesiHalaman() {

  const sesi = ambilSesi();

  if (!sesi) {
    return;
  }

  const info = document.querySelector(".user-login-container");

  if (info) {
    info.textContent = "USER LOGIN : " + sesi.nama;
  }

  const tombolLogout = document.getElementById("menu-logout");

  if (tombolLogout) {

    tombolLogout.addEventListener("click", function () {

      if (confirm("Keluar dari ASTOM?")) {
        keluar();
      }

    });

  }

}

/* Otomatis untuk halaman yang memakai data-butuh-login */
if (document.documentElement.hasAttribute("data-butuh-login")) {

  if (wajibLogin()) {
    document.addEventListener("DOMContentLoaded", siapkanSesiHalaman);
  }

}
