/* ==========================================================
   HALAMAN LOGIN (index.html)
   Login, Daftar, Konfirmasi Email, Reset Password.

   PENTING - versi ini berjalan sepenuhnya di browser:
   - Akun disimpan di localStorage browser tersebut, jadi akun
     yang didaftarkan di satu HP/komputer TIDAK terbaca di
     perangkat lain.
   - Email belum bisa dikirim (tidak ada server). Selama
     MODE_DEMO_EMAIL = true, kode konfirmasi / reset ditampilkan
     langsung di layar.
   Untuk pemakaian sungguhan, ganti bagian penyimpanan akun dan
   fungsi kirimEmail() dengan server / database.
   ========================================================== */


/* ==========================================================
   PENGATURAN (boleh diubah)
   ========================================================== */

const KUNCI_USERS = "astom_users";
const HALAMAN_UTAMA = "dashboard.html";

/* true  = kode ditampilkan di layar (belum ada server email)
   false = kode harus dikirim lewat email (butuh server) */
const MODE_DEMO_EMAIL = true;

/* Isi dengan alamat file/URL user manual (mis. "manual.pdf") bila sudah ada.
   Kosong = tampilkan petunjuk singkat di pop-up. */
const URL_USER_MANUAL = "";

const MASA_KODE_KONFIRMASI_MENIT = 24 * 60;
const MASA_KODE_RESET_MENIT = 15;
const MAKS_SALAH_KODE = 5;
const JEDA_KIRIM_ULANG_DETIK = 30;

/* Akun pertama yang dibuat otomatis. GANTI passwordnya lewat Reset Password
   sebelum dipakai sungguhan. */
const AKUN_AWAL = {
  username: "admin",
  password: "123",
  nama: "Administrator",
  email: "admin@astom.local",
  tipe: "public"
};

const NAMA_TIPE = {
  public: "Public",
  personal: "Personal"
};

const PANEL = {
  login:      { id: "panelLogin",      judul: "Portal Login",     tab: true, bantuan: true },
  daftar:     { id: "panelDaftar",     judul: "Daftar Akun",      tab: true },
  konfirmasi: { id: "panelKonfirmasi", judul: "Konfirmasi Email" },
  resetMinta: { id: "panelResetMinta", judul: "Reset Password" },
  resetBaru:  { id: "panelResetBaru",  judul: "Password Baru" }
};


/* ==========================================================
   STATE
   ========================================================== */

let tipeAkun = "public";   // tab yang sedang dipilih
let targetReset = "";      // username / email yang sedang direset


/* ==========================================================
   HELPER
   ========================================================== */

function $(id) {
  return document.getElementById(id);
}

function tampilAlert(jenis, pesan) {

  const warna = {
    sukses: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    gagal: "bg-red-100 text-red-700 border border-red-300",
    peringatan: "bg-amber-100 text-amber-800 border border-amber-300",
    info: "bg-blue-100 text-blue-800 border border-blue-300"
  };

  const kotak = $("alertMessage");

  kotak.className = "mb-4 p-3 rounded text-xs " + warna[jenis];
  kotak.textContent = pesan;

}

function sembunyikanAlert() {

  const kotak = $("alertMessage");

  kotak.className = "hidden mb-4 p-3 rounded text-xs";
  kotak.textContent = "";

}

/* Jalankan fungsi async; kesalahan tak terduga ditampilkan sebagai pesan */
function jalankan(fungsi) {

  fungsi().catch(function (error) {

    if (error && error.message === "no-crypto") {
      tampilAlert(
        "gagal",
        "Browser tidak mendukung penyimpanan sandi aman. Buka situs lewat https."
      );
      return;
    }

    tampilAlert("gagal", "Terjadi kesalahan. Coba lagi.");

    console.error(error);

  });

}


/* ==========================================================
   KEAMANAN SANDI (SHA-256 + garam)
   ========================================================== */

function keHex(byteArray) {

  return Array.from(byteArray)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

}

function buatGaram() {

  const acak = new Uint8Array(8);

  crypto.getRandomValues(acak);

  return keHex(acak);

}

async function hashPassword(password, garam) {

  if (!window.crypto || !crypto.subtle) {
    throw new Error("no-crypto");
  }

  const data = new TextEncoder().encode(garam + ":" + password);

  const hasil = await crypto.subtle.digest("SHA-256", data);

  return keHex(new Uint8Array(hasil));

}

/* Kode 6 digit */
function buatKode6() {

  const acak = new Uint32Array(1);

  crypto.getRandomValues(acak);

  return String(acak[0] % 1000000).padStart(6, "0");

}

/* Password baru: minimal 8 karakter, ada huruf dan angka. "" = valid */
function periksaPassword(password) {

  if (password.length < 8) {
    return "Password minimal 8 karakter.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password harus kombinasi huruf dan angka.";
  }

  return "";

}


/* ==========================================================
   PENYIMPANAN AKUN (localStorage)
   ========================================================== */

function muatUsers() {

  try {

    const data = JSON.parse(localStorage.getItem(KUNCI_USERS));

    return Array.isArray(data) ? data : [];

  } catch (error) {

    return [];

  }

}

function simpanUsers(users) {

  try {

    localStorage.setItem(KUNCI_USERS, JSON.stringify(users));

    return true;

  } catch (error) {

    tampilAlert(
      "gagal",
      "Data akun gagal disimpan. Penyimpanan browser penuh atau diblokir."
    );

    return false;

  }

}

/* Cari berdasarkan username ATAU email (huruf besar/kecil tidak dibedakan) */
function cariUser(users, kunci) {

  const k = String(kunci || "").trim().toLowerCase();

  return users.find(u => u.username === k || u.email === k);

}

async function siapkanAkunAwal() {

  if (muatUsers().length > 0) {
    return;
  }

  const garam = buatGaram();

  simpanUsers([{
    username: AKUN_AWAL.username,
    nama: AKUN_AWAL.nama,
    email: AKUN_AWAL.email,
    tipe: AKUN_AWAL.tipe,
    status: "AKTIF",
    garam: garam,
    hash: await hashPassword(AKUN_AWAL.password, garam),
    kode: null,
    dibuat: new Date().toISOString()
  }]);

}


/* ==========================================================
   KODE KONFIRMASI / RESET
   ========================================================== */

function buatKodeBerlaku(jenis, menit) {

  return {
    jenis: jenis,
    nilai: buatKode6(),
    dibuat: Date.now(),
    exp: Date.now() + menit * 60 * 1000,
    gagal: 0
  };

}

/* Periksa kode. Mengembalikan "" bila benar, atau pesan kesalahan.
   Objek user bisa berubah (hitungan salah) -> simpan setelah dipanggil. */
function periksaKode(user, jenis, masukan) {

  const kode = user && user.kode;

  if (!kode || kode.jenis !== jenis) {
    return "Kode tidak valid. Minta kode baru.";
  }

  if (Date.now() > kode.exp) {
    user.kode = null;
    return "Kode sudah kedaluwarsa. Minta kode baru.";
  }

  if (kode.gagal >= MAKS_SALAH_KODE) {
    user.kode = null;
    return "Terlalu banyak percobaan salah. Minta kode baru.";
  }

  if (String(masukan).trim() !== kode.nilai) {

    kode.gagal += 1;

    if (kode.gagal >= MAKS_SALAH_KODE) {
      user.kode = null;
      return "Terlalu banyak percobaan salah. Minta kode baru.";
    }

    return "Kode salah.";

  }

  return "";

}

/* Ganti isi fungsi ini dengan pemanggilan server email bila sudah tersedia.
   Selama MODE_DEMO_EMAIL = true, kode hanya ditampilkan di layar. */
function kirimEmail(user, subjek, kode) {

  if (MODE_DEMO_EMAIL) {
    return { demo: true, kode: kode };
  }

  throw new Error("Pengiriman email belum dikonfigurasi.");

}

/* Tampilkan kotak kode demo (atau sembunyikan bila bukan mode demo) */
function tampilkanKodeDemo(idKotak, idKode, hasil) {

  const kotak = $(idKotak);

  if (hasil && hasil.demo) {
    $(idKode).textContent = hasil.kode;
    kotak.classList.remove("hidden");
  } else {
    kotak.classList.add("hidden");
  }

}


/* ==========================================================
   TAMPILAN: TAB & PANEL
   ========================================================== */

function aturTab(tipe) {

  tipeAkun = tipe;

  $("tabPublic").classList.toggle("tab-aktif", tipe === "public");
  $("tabPersonal").classList.toggle("tab-aktif", tipe === "personal");

  $("infoTipeDaftar").textContent =
    "Jenis akun: " + NAMA_TIPE[tipe] + " (ganti lewat tab di atas)";

}

function tampilPanel(nama, fokus = true) {

  const konfigurasi = PANEL[nama];

  Object.keys(PANEL).forEach(kunci => {

    const panel = $(PANEL[kunci].id);

    panel.classList.toggle("hidden", kunci !== nama);

  });

  $("judulPanel").textContent = konfigurasi.judul;

  $("areaTab").classList.toggle("hidden", !konfigurasi.tab);
  $("linkBantuan").classList.toggle("hidden", !konfigurasi.bantuan);

  sembunyikanAlert();

  const inputPertama = $(konfigurasi.id).querySelector("input");

  if (fokus && inputPertama) {
    inputPertama.focus();
  }

}


/* ==========================================================
   LOGIN
   ========================================================== */

async function prosesLogin() {

  await siapAkun;

  const kunci = $("usernameInput").value.trim();
  const password = $("passwordInput").value.trim();

  if (kunci === "" || password === "") {
    tampilAlert("peringatan", "Isi username dan password terlebih dahulu!");
    return;
  }

  const user = cariUser(muatUsers(), kunci);

  const passwordBenar =
    user && (await hashPassword(password, user.garam)) === user.hash;

  if (!passwordBenar) {
    tampilAlert("gagal", "Username atau Password salah!");
    return;
  }

  /* akun belum dikonfirmasi -> arahkan ke konfirmasi email */
  if (user.status !== "AKTIF") {

    tampilPanel("konfirmasi");

    $("konfirmasiEmail").value = user.email;

    tampilAlert(
      "peringatan",
      "Akun belum dikonfirmasi. Masukkan kode dari email, atau klik Kirim Ulang Kode."
    );

    return;

  }

  /* tab yang dipilih harus sama dengan jenis akun */
  if (user.tipe !== tipeAkun) {

    tampilAlert(
      "peringatan",
      "Akun ini terdaftar sebagai " + NAMA_TIPE[user.tipe] +
      ". Pilih tab " + NAMA_TIPE[user.tipe] + " lalu login lagi."
    );

    return;

  }

  buatSesi(user);

  tampilAlert("sukses", "Login Berhasil! Mengalihkan ke Dashboard...");

  setTimeout(function () {
    window.location.href = HALAMAN_UTAMA;
  }, 1000);

}


/* ==========================================================
   DAFTAR
   ========================================================== */

async function prosesDaftar() {

  await siapAkun;

  const nama = $("daftarNama").value.trim();
  const email = $("daftarEmail").value.trim().toLowerCase();
  const username = $("daftarUsername").value.trim().toLowerCase();
  const password = $("daftarPassword").value.trim();
  const password2 = $("daftarPassword2").value.trim();

  if (!nama || !email || !username || !password || !password2) {
    tampilAlert("peringatan", "Semua kolom wajib diisi.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    tampilAlert("peringatan", "Format email tidak valid.");
    return;
  }

  if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
    tampilAlert(
      "peringatan",
      "Username 3-20 karakter: huruf, angka, titik, atau garis bawah."
    );
    return;
  }

  const galatPassword = periksaPassword(password);

  if (galatPassword) {
    tampilAlert("peringatan", galatPassword);
    return;
  }

  if (password !== password2) {
    tampilAlert("peringatan", "Ulangi password tidak sama.");
    return;
  }

  const users = muatUsers();

  if (cariUser(users, username)) {
    tampilAlert("gagal", "Username sudah dipakai.");
    return;
  }

  if (cariUser(users, email)) {
    tampilAlert("gagal", "Email sudah terdaftar.");
    return;
  }

  const garam = buatGaram();

  const user = {
    username: username,
    nama: nama,
    email: email,
    tipe: tipeAkun,
    status: "PENDING",
    garam: garam,
    hash: await hashPassword(password, garam),
    kode: buatKodeBerlaku("konfirmasi", MASA_KODE_KONFIRMASI_MENIT),
    dibuat: new Date().toISOString()
  };

  users.push(user);

  if (!simpanUsers(users)) {
    return;
  }

  const hasil = kirimEmail(user, "Kode konfirmasi ASTOM", user.kode.nilai);

  tampilPanel("konfirmasi");

  $("konfirmasiEmail").value = email;
  $("konfirmasiKode").value = "";

  tampilkanKodeDemo("demoKonfirmasi", "kodeDemoKonfirmasi", hasil);

  tampilAlert(
    "sukses",
    "Pendaftaran berhasil. Masukkan kode konfirmasi yang dikirim ke " + email + "."
  );

  /* kosongkan formulir pendaftaran */
  $("panelDaftar").reset();

}


/* ==========================================================
   KONFIRMASI EMAIL
   ========================================================== */

async function prosesKonfirmasi() {

  await siapAkun;

  const email = $("konfirmasiEmail").value.trim().toLowerCase();
  const kode = $("konfirmasiKode").value.trim();

  if (!email || !kode) {
    tampilAlert("peringatan", "Isi email dan kode konfirmasi.");
    return;
  }

  const users = muatUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    tampilAlert("gagal", "Email atau kode tidak valid.");
    return;
  }

  if (user.status === "AKTIF") {

    tampilPanel("login");
    tampilAlert("info", "Akun sudah aktif. Silakan login.");

    return;

  }

  const galat = periksaKode(user, "konfirmasi", kode);

  simpanUsers(users);

  if (galat) {
    tampilAlert("gagal", galat);
    return;
  }

  user.status = "AKTIF";
  user.kode = null;

  simpanUsers(users);

  aturTab(user.tipe);

  tampilPanel("login");

  $("usernameInput").value = user.username;
  $("passwordInput").value = "";

  tampilAlert("sukses", "Email berhasil dikonfirmasi. Silakan login.");

}

async function kirimUlangKonfirmasi() {

  await siapAkun;

  const email = $("konfirmasiEmail").value.trim().toLowerCase();

  if (!email) {
    tampilAlert("peringatan", "Isi email terlebih dahulu.");
    return;
  }

  const users = muatUsers();
  const user = users.find(u => u.email === email);

  let hasil = null;

  if (user && user.status === "PENDING") {

    const jeda = user.kode
      ? (Date.now() - user.kode.dibuat) / 1000
      : Infinity;

    if (jeda < JEDA_KIRIM_ULANG_DETIK) {

      tampilAlert(
        "peringatan",
        "Tunggu " + Math.ceil(JEDA_KIRIM_ULANG_DETIK - jeda) +
        " detik sebelum mengirim ulang."
      );

      return;

    }

    user.kode = buatKodeBerlaku("konfirmasi", MASA_KODE_KONFIRMASI_MENIT);

    if (!simpanUsers(users)) {
      return;
    }

    hasil = kirimEmail(user, "Kode konfirmasi ASTOM", user.kode.nilai);

  }

  tampilkanKodeDemo("demoKonfirmasi", "kodeDemoKonfirmasi", hasil);

  /* pesan sama untuk email terdaftar maupun tidak (tidak membocorkan data akun) */
  tampilAlert(
    "info",
    "Jika email terdaftar dan belum dikonfirmasi, kode baru telah dikirim. " +
    "Periksa juga folder spam."
  );

}


/* ==========================================================
   RESET PASSWORD
   ========================================================== */

async function mintaResetPassword() {

  await siapAkun;

  const kunci = $("resetKunci").value.trim();

  if (!kunci) {
    tampilAlert("peringatan", "Isi username atau email.");
    return;
  }

  const users = muatUsers();
  const user = cariUser(users, kunci);

  let hasil = null;

  if (user && user.status === "AKTIF") {

    user.kode = buatKodeBerlaku("reset", MASA_KODE_RESET_MENIT);

    if (!simpanUsers(users)) {
      return;
    }

    hasil = kirimEmail(user, "Kode reset password ASTOM", user.kode.nilai);

  }

  targetReset = kunci;

  tampilPanel("resetBaru");

  $("resetKode").value = "";

  tampilkanKodeDemo("demoReset", "kodeDemoReset", hasil);

  tampilAlert(
    "info",
    "Jika akun terdaftar dan aktif, kode reset telah dikirim ke email. " +
    "Kode berlaku " + MASA_KODE_RESET_MENIT + " menit."
  );

}

async function simpanPasswordBaru() {

  await siapAkun;

  const kode = $("resetKode").value.trim();
  const password = $("resetPassword").value.trim();
  const password2 = $("resetPassword2").value.trim();

  if (!kode || !password || !password2) {
    tampilAlert("peringatan", "Semua kolom wajib diisi.");
    return;
  }

  const galatPassword = periksaPassword(password);

  if (galatPassword) {
    tampilAlert("peringatan", galatPassword);
    return;
  }

  if (password !== password2) {
    tampilAlert("peringatan", "Ulangi password tidak sama.");
    return;
  }

  const users = muatUsers();
  const user = cariUser(users, targetReset);

  if (!user || user.status !== "AKTIF") {
    tampilAlert("gagal", "Kode tidak valid. Minta kode baru.");
    return;
  }

  const galat = periksaKode(user, "reset", kode);

  if (galat) {
    simpanUsers(users);
    tampilAlert("gagal", galat);
    return;
  }

  user.garam = buatGaram();
  user.hash = await hashPassword(password, user.garam);
  user.kode = null;

  if (!simpanUsers(users)) {
    return;
  }

  aturTab(user.tipe);

  tampilPanel("login");

  $("usernameInput").value = user.username;
  $("passwordInput").value = "";

  $("panelResetBaru").reset();

  tampilAlert("sukses", "Password berhasil diubah. Silakan login.");

}


/* ==========================================================
   PETUNJUK PENGGUNAAN (USER MANUAL)
   ========================================================== */

function bukaManual() {

  if (URL_USER_MANUAL) {
    window.open(URL_USER_MANUAL, "_blank");
    return;
  }

  $("modalManual").classList.remove("hidden");

}

function tutupManual() {

  $("modalManual").classList.add("hidden");

}


/* ==========================================================
   BANNER "WELCOME BACK" (ciutkan / tampilkan)
   ========================================================== */

function toggleBanner() {

  const ciut = $("teksWelcome").classList.toggle("hidden");

  $("bannerWelcome").classList.toggle("py-2.5", !ciut);
  $("bannerWelcome").classList.toggle("py-1", ciut);

  $("ikonBanner").className =
    ciut ? "fa-solid fa-caret-down" : "fa-solid fa-caret-up";

}


/* ==========================================================
   INISIALISASI
   ========================================================== */

const siapAkun = siapkanAkunAwal();

function ikatFormulir(idForm, fungsi) {

  $(idForm).addEventListener("submit", function (event) {

    event.preventDefault();

    jalankan(fungsi);

  });

}

ikatFormulir("panelLogin", prosesLogin);
ikatFormulir("panelDaftar", prosesDaftar);
ikatFormulir("panelKonfirmasi", prosesKonfirmasi);
ikatFormulir("panelResetMinta", mintaResetPassword);
ikatFormulir("panelResetBaru", simpanPasswordBaru);

$("tombolKirimUlang").addEventListener("click", function () {
  jalankan(kirimUlangKonfirmasi);
});

$("tabPublic").addEventListener("click", function () {
  aturTab("public");
});

$("tabPersonal").addEventListener("click", function () {
  aturTab("personal");
});

/* semua elemen dengan data-panel="..." berpindah panel saat diklik */
document.addEventListener("click", function (event) {

  const tombol = event.target.closest("[data-panel]");

  if (!tombol) {
    return;
  }

  event.preventDefault();

  tampilPanel(tombol.dataset.panel);

});

$("tombolManual").addEventListener("click", bukaManual);
$("tutupManual").addEventListener("click", tutupManual);
$("tutupManual2").addEventListener("click", tutupManual);

$("modalManual").addEventListener("click", function (event) {

  if (event.target === $("modalManual")) {
    tutupManual();
  }

});

document.addEventListener("keydown", function (event) {

  if (event.key === "Escape") {
    tutupManual();
  }

});

$("tombolBanner").addEventListener("click", toggleBanner);

aturTab("public");

tampilPanel("login", false);
