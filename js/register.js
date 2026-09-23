/* ==========================================================
   DATA
   ========================================================== */

let listBarang = [];

let currentEditIndex = null;   // index barang yang sedang diedit (Register New)
let currentBcId = null;        // id barang yang sedang diisi BC (Receiving)
let filterPeriode = "";        // filter bulan Receiving, format "YYYY-MM"
let pilihanSementara = new Set(); // id barang yang dicentang di popup Cari

let currentGateId = null;          // id barang yang sedang diproses GATE
let gateFoto = { unit: "", label: "" }; // foto sementara di form GATE
let gateKesesuaian = "";           // "SESUAI" atau "TIDAK SESUAI"

let currentBcMode = "receiving";   // ADD BC dipakai oleh "receiving" atau "return"

let filterPeriodeReturn = "";      // filter bulan Return, format "YYYY-MM"
let pilihanReturn = new Set();     // id barang yang dicentang di popup Cari (Return)
let currentGateReturnId = null;    // id barang yang sedang diproses GATE Return
let returnFoto = { unit: "", label: "" }; // foto sementara di form GATE Return
let returnKesesuaian = "";         // "SESUAI" atau "TIDAK SESUAI"

const STORAGE_KEY = "astom_list_barang";


/* ==========================================================
   LOAD & SAVE DATA
   ========================================================== */

function loadData() {

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return;
  }

  try {
    listBarang = JSON.parse(data);
  } catch (error) {
    listBarang = [];
  }

  listBarang.forEach(migrasiItem);

}

function saveData() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(listBarang)
    );

    return true;

  } catch (error) {

    alert(
      "Data gagal disimpan karena penyimpanan browser penuh. " +
      "Hapus data lama atau kurangi foto."
    );

    return false;

  }

}

/* Melengkapi data lama agar punya field Receiving yang baru */
function migrasiItem(item) {

  if (item.inReceiving === undefined) {

    const lamaDiterima = item.statusReceiving === "DITERIMA";

    item.inReceiving = lamaDiterima;
    item.tglPilih = lamaDiterima ? (item.tanggalReceiving || "") : "";
    item.tglGate = lamaDiterima ? (item.tanggalReceiving || "") : "";

  }

  item.tglPilih = item.tglPilih || "";
  item.tglGate = item.tglGate || "";
  item.kodeDoc = item.kodeDoc || "";
  item.nomorAju = item.nomorAju || "";
  item.nomorDaftar = item.nomorDaftar || "";
  item.tglDaftar = item.tglDaftar || "";
  item.gate = item.gate || null;
  item.ret = item.ret || null;

}

function cariItemById(id) {

  return listBarang.find(item => item.id === id);

}


/* ==========================================================
   TAB SWITCH
   ========================================================== */

function bukaTab(tab) {

  ["new", "receiving", "return"].forEach(nama => {

    document.getElementById("tab-" + nama).classList.remove("active");
    document.getElementById("tab-button-" + nama).classList.remove("active");

  });

  document.getElementById("tab-" + tab).classList.add("active");
  document.getElementById("tab-button-" + tab).classList.add("active");

  if (tab === "new") {
    renderTableNew();
  }

  if (tab === "receiving") {
    renderTableReceiving();
  }

  if (tab === "return") {
    renderTableReturn();
  }

}


/* ==========================================================
   REGISTER NEW - MODAL REKAM
   ========================================================== */

function openRekamBarangModal() {

  document
    .getElementById("modal-rekam-barang")
    .classList.add("active");

}

function closeRekamBarangModal() {

  document
    .getElementById("modal-rekam-barang")
    .classList.remove("active");

  clearRekamForm();

}

function clearRekamForm() {

  document.getElementById("rekam-kode").value = "";
  document.getElementById("rekam-uraian").value = "";
  document.getElementById("rekam-satuan").value = "";
  document.getElementById("rekam-jumlah").value = "";
  document.getElementById("rekam-aset").value = "";

}


/* ==========================================================
   REGISTER NEW - SIMPAN BARANG BARU
   ========================================================== */

function simpanBarangBaru() {

  const kode = document.getElementById("rekam-kode").value.trim();
  const uraian = document.getElementById("rekam-uraian").value.trim();
  const satuan = document.getElementById("rekam-satuan").value.trim();
  const jumlah = document.getElementById("rekam-jumlah").value.trim();
  const aset = document.getElementById("rekam-aset").value.trim();

  const skk = document.getElementById("skk-nomor-main").value.trim();
  const tglSkk = document.getElementById("skk-tgl-main").value;
  const perusahaan = document.getElementById("perusahaan-main").value.trim();
  const doc = document.getElementById("documen-main").value.trim();

  const status =
    document.getElementById("status-aset-main").value.trim()
    || "REGISTERED";

  if (!skk) {
    alert("Nomor SKK wajib diisi.");
    return;
  }

  if (!kode) {
    alert("Kode Barang wajib diisi.");
    return;
  }

  if (!uraian) {
    alert("Uraian Barang wajib diisi.");
    return;
  }

  if (!satuan) {
    alert("Jenis Satuan wajib diisi.");
    return;
  }

  if (!jumlah || Number(jumlah) <= 0) {
    alert("Jumlah Barang harus lebih dari 0.");
    return;
  }

  const dataBarang = {

    id: Date.now(),

    /* data Register New */
    kode: kode,
    uraian: uraian,
    jumlah: jumlah,
    satuan: satuan,
    aset: aset || "-",
    status: status,
    skk: skk,
    tglSkk: tglSkk || "-",
    perusahaan: perusahaan || "-",
    doc: doc || "-",

    /* data Receiving (diisi setelah barang dipilih lewat tombol Cari) */
    inReceiving: false,
    tglPilih: "",
    tglGate: "",
    kodeDoc: "",
    nomorAju: "",
    nomorDaftar: "",
    tglDaftar: "",
    gate: null,

    /* data Return (diisi setelah barang dipilih di menu Return) */
    ret: null

  };

  listBarang.push(dataBarang);

  saveData();

  renderTableNew();
  renderTableReceiving();

  closeRekamBarangModal();

  alert(
    "Barang berhasil direkam. Buka menu Receiving lalu klik Cari untuk memilih barang."
  );

}


/* ==========================================================
   REGISTER NEW - RENDER TABLE
   ========================================================== */

function renderTableNew() {

  const tbody = document.getElementById("tabel-barang-body");

  tbody.innerHTML = "";

  if (listBarang.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-message">
          Belum ada data barang.
          Klik "+ Rekam" untuk menambahkan barang.
        </td>
      </tr>
    `;

    return;

  }

  listBarang.forEach((item, index) => {

    const tr = document.createElement("tr");

    tr.innerHTML = `

      <td>
        <input
          type="checkbox"
          class="row-checkbox"
          data-index="${index}">
      </td>

      <td>${escapeHTML(item.kode)}</td>

      <td class="left">${escapeHTML(item.uraian)}</td>

      <td>${escapeHTML(item.jumlah)}</td>

      <td>${escapeHTML(item.satuan)}</td>

      <td>${escapeHTML(item.aset)}</td>

      <td>
        <span class="status status-${getStatusClass(item.status)}">
          ${escapeHTML(item.status)}
        </span>
      </td>

      <td>${escapeHTML(item.skk)}</td>

      <td>${escapeHTML(item.perusahaan)}</td>

      <td>${escapeHTML(item.doc)}</td>

      <td>
        <button
          class="btn-edit"
          onclick="openEditBarangModal(${index})">
          Edit
        </button>
      </td>

    `;

    tbody.appendChild(tr);

  });

}


/* ==========================================================
   RECEIVING - RENDER TABLE
   Kolom: Kode Barang, Uraian, Jumlah, Satuan, Aset No, Status,
          Perusahaan, Kode Doc, Nomor AJU, Nomor Daftar,
          Tgl. Daftar, Aksi
   ========================================================== */

function renderTableReceiving() {

  const tbody = document.getElementById("tabel-receiving-body");

  tbody.innerHTML = "";

  const semuaReceiving = listBarang.filter(item => item.inReceiving);

  const tampil = filterPeriode
    ? semuaReceiving.filter(item => ambilBulan(item.tglPilih) === filterPeriode)
    : semuaReceiving;

  /* Belum ada data / tidak ada data di periode */
  if (tampil.length === 0) {

    const pesan = semuaReceiving.length === 0
      ? "DATA MASUK SETELAH DIPILIH"
      : "Tidak ada data pada periode yang dipilih.";

    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="empty-message empty-receiving">
          ${pesan}
        </td>
      </tr>
    `;

    return;

  }

  tampil.forEach(item => {

    const sudahGate =
      item.status === "RECEIVED" || item.status === "RETURNED";

    const tombolGate = sudahGate
      ? `<button class="btn-aksi btn-aksi-selesai" disabled><span class="ico ico-check"></span>GATE</button>`
      : `<button class="btn-aksi" onclick="openGateModal(${item.id})">GATE</button>`;

    const tr = document.createElement("tr");

    tr.innerHTML = `

      <td>${nilai(item.kode)}</td>

      <td class="left">${nilai(item.uraian)}</td>

      <td>${nilai(item.jumlah)}</td>

      <td>${nilai(item.satuan)}</td>

      <td>${nilai(item.aset)}</td>

      <td>
        <span class="status status-${getStatusClass(item.status)}">
          ${escapeHTML(item.status)}
        </span>
      </td>

      <td>${nilai(item.perusahaan)}</td>

      <td>${nilai(item.kodeDoc)}</td>

      <td>${nilai(item.nomorAju)}</td>

      <td>${nilai(item.nomorDaftar)}</td>

      <td>${formatTanggal(item.tglDaftar)}</td>

      <td>
        <div class="aksi-group">

          ${tombolGate}

          <button
            class="btn-aksi"
            onclick="openAddBcModal(${item.id})">
            ADD BC
          </button>

          <button
            class="btn-icon btn-icon-detail"
            title="Preview"
            onclick="openPreviewModal(${item.id})">
            <span class="ico ico-eye"></span>
          </button>

          <button
            class="btn-icon btn-icon-hapus"
            title="Hapus dari Receiving"
            onclick="hapusDariReceiving(${item.id})">
            <span class="ico ico-trash"></span>
          </button>

        </div>
      </td>

    `;

    tbody.appendChild(tr);

  });

}


/* ==========================================================
   RECEIVING - PERIODE BULAN
   ========================================================== */

function tampilkanPeriode() {

  filterPeriode = document.getElementById("periode-bulan").value;

  renderTableReceiving();

}

function resetPeriode() {

  filterPeriode = "";

  document.getElementById("periode-bulan").value = "";

}


/* ==========================================================
   RECEIVING - CARI / PILIH BARANG
   Barang yang belum masuk Receiving tampil di popup ini.
   Setelah dipilih, barang masuk ke tabel Receiving.
   ========================================================== */

function openPilihBarangModal() {

  pilihanSementara.clear();

  document.getElementById("pilih-cari").value = "";

  renderTablePilih();

  document
    .getElementById("modal-pilih-barang")
    .classList.add("active");

}

function closePilihBarangModal() {

  document
    .getElementById("modal-pilih-barang")
    .classList.remove("active");

  pilihanSementara.clear();

}

function renderTablePilih() {

  const tbody = document.getElementById("tabel-pilih-body");

  const keyword =
    document.getElementById("pilih-cari").value.toLowerCase().trim();

  const kandidat = listBarang.filter(item => {

    if (item.inReceiving) {
      return false;
    }

    const teks = [
      item.kode,
      item.uraian,
      item.skk,
      item.perusahaan
    ].join(" ").toLowerCase();

    return teks.includes(keyword);

  });

  tbody.innerHTML = "";

  document.getElementById("check-all-pilih").checked = false;

  if (kandidat.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-message">
          Tidak ada barang yang bisa dipilih.
          Rekam barang terlebih dahulu di REGISTER NEW.
        </td>
      </tr>
    `;

    return;

  }

  kandidat.forEach(item => {

    const tr = document.createElement("tr");

    const dicentang = pilihanSementara.has(item.id) ? "checked" : "";

    tr.innerHTML = `

      <td>
        <input
          type="checkbox"
          class="pilih-checkbox"
          data-id="${item.id}"
          ${dicentang}
          onchange="togglePilihan(${item.id}, this.checked)">
      </td>

      <td class="left">${nilai(item.uraian)}</td>

      <td>${nilai(item.kode)}</td>

      <td>${nilai(item.jumlah)}</td>

      <td>${nilai(item.satuan)}</td>

      <td>${nilai(item.aset)}</td>

      <td>
        <span class="status status-${getStatusClass(item.status)}">
          ${escapeHTML(item.status)}
        </span>
      </td>

      <td>${nilai(item.skk)}</td>

      <td>${nilai(item.perusahaan)}</td>

    `;

    tbody.appendChild(tr);

  });

}

function togglePilihan(id, dicentang) {

  if (dicentang) {
    pilihanSementara.add(id);
  } else {
    pilihanSementara.delete(id);
  }

}

function toggleSelectAllPilih(master) {

  document
    .querySelectorAll(".pilih-checkbox")
    .forEach(checkbox => {

      checkbox.checked = master.checked;

      togglePilihan(
        Number(checkbox.dataset.id),
        master.checked
      );

    });

}

function pilihBarang() {

  if (pilihanSementara.size === 0) {
    alert("Pilih minimal satu barang.");
    return;
  }

  const sekarang = new Date().toISOString();

  let jumlahDipilih = 0;

  listBarang.forEach(item => {

    if (pilihanSementara.has(item.id) && !item.inReceiving) {

      item.inReceiving = true;
      item.tglPilih = sekarang;

      jumlahDipilih++;

    }

  });

  saveData();

  closePilihBarangModal();

  /* reset filter periode supaya data baru langsung terlihat */
  resetPeriode();

  renderTableReceiving();

  alert(jumlahDipilih + " barang masuk ke Receiving.");

}


/* ==========================================================
   RECEIVING - AKSI: GATE
   Form pemeriksaan barang masuk. Setelah disimpan, status
   barang menjadi RECEIVED dan tombol GATE berubah jadi tanda centang.
   ========================================================== */

function openGateModal(id) {

  const item = cariItemById(id);

  if (!item) {
    return;
  }

  currentGateId = id;

  resetFormGate();

  /* Data Barang: terisi otomatis dari baris yang diklik */
  document.getElementById("gate-kode").value = item.kode;
  document.getElementById("gate-uraian").value = item.uraian;
  document.getElementById("gate-jumlah").value = item.jumlah;
  document.getElementById("gate-satuan").value = item.satuan;

  /* Rekam Masuk: default tanggal & waktu sekarang, boleh diubah */
  const sekarang = new Date();

  document.getElementById("gate-tanggal").value = tanggalLokal(sekarang);
  document.getElementById("gate-waktu").value = waktuLokal(sekarang);

  document
    .getElementById("modal-gate")
    .classList.add("active");

}

function closeGateModal() {

  document
    .getElementById("modal-gate")
    .classList.remove("active");

  currentGateId = null;

  gateFoto = { unit: "", label: "" };

}

function resetFormGate() {

  document.getElementById("gate-penerima").value = "";
  document.getElementById("gate-lokasi").value = "";
  document.getElementById("gate-keterangan").value = "";

  gateFoto = { unit: "", label: "" };

  tampilkanFotoGate("unit");
  tampilkanFotoGate("label");

  setKesesuaian("");

}

/* ----- Foto pendukung ----- */

function pilihFotoGate(jenis) {

  document.getElementById("gate-file-" + jenis).click();

}

async function prosesFotoGate(jenis, input) {

  const file = input.files && input.files[0];

  input.value = "";

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar.");
    return;
  }

  try {

    gateFoto[jenis] = await kompresFoto(file, 720, 0.65);

    tampilkanFotoGate(jenis);

  } catch (error) {

    alert("Foto tidak dapat dibaca. Coba pilih foto lain.");

  }

}

function tampilkanFotoGate(jenis) {

  const box = document.getElementById("gate-preview-" + jenis);

  box.innerHTML = gateFoto[jenis]
    ? `<img src="${gateFoto[jenis]}" alt="Foto ${jenis}">`
    : "";

}

/* Perkecil foto (sisi terpanjang maks. maxSisi px) supaya hemat penyimpanan */
function kompresFoto(file, maxSisi, kualitas) {

  return new Promise((resolve, reject) => {

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = function () {

      const skala = Math.min(1, maxSisi / Math.max(img.width, img.height));

      const canvas = document.createElement("canvas");

      canvas.width = Math.round(img.width * skala);
      canvas.height = Math.round(img.height * skala);

      canvas
        .getContext("2d")
        .drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      resolve(canvas.toDataURL("image/jpeg", kualitas));

    };

    img.onerror = function () {

      URL.revokeObjectURL(url);

      reject(new Error("Gambar tidak dapat dibaca"));

    };

    img.src = url;

  });

}

/* ----- Kesesuaian data ----- */

function setKesesuaian(nilaiPilihan) {

  gateKesesuaian = nilaiPilihan;

  document
    .getElementById("btn-sesuai")
    .classList.toggle("active", nilaiPilihan === "SESUAI");

  document
    .getElementById("btn-tidak-sesuai")
    .classList.toggle("active", nilaiPilihan === "TIDAK SESUAI");

}

/* ----- Simpan ----- */

function simpanGate() {

  if (currentGateId === null) {
    return;
  }

  const item = cariItemById(currentGateId);

  if (!item) {
    return;
  }

  const tanggal = document.getElementById("gate-tanggal").value;
  const waktu = document.getElementById("gate-waktu").value;
  const penerima = document.getElementById("gate-penerima").value.trim();
  const lokasi = document.getElementById("gate-lokasi").value.trim();
  const keterangan = document.getElementById("gate-keterangan").value.trim();

  if (!tanggal || !waktu) {
    alert("Tanggal dan Waktu wajib diisi.");
    return;
  }

  if (!penerima) {
    alert("Penerima wajib diisi.");
    return;
  }

  if (!lokasi) {
    alert("Lokasi wajib diisi.");
    return;
  }

  if (!gateKesesuaian) {
    alert("Pilih Kesesuaian Data: Sesuai atau Tidak Sesuai.");
    return;
  }

  if (gateKesesuaian === "TIDAK SESUAI" && !keterangan) {
    alert("Keterangan wajib diisi jika data Tidak Sesuai.");
    return;
  }

  /* cadangan, dipakai kalau penyimpanan browser gagal */
  const cadangan = {
    status: item.status,
    tglGate: item.tglGate,
    gate: item.gate
  };

  item.status = "RECEIVED";
  item.tglGate = new Date().toISOString();

  item.gate = {
    tanggal: tanggal,
    waktu: waktu,
    penerima: penerima,
    lokasi: lokasi,
    fotoUnit: gateFoto.unit,
    fotoLabel: gateFoto.label,
    kesesuaian: gateKesesuaian,
    keterangan: keterangan
  };

  if (!saveData()) {

    item.status = cadangan.status;
    item.tglGate = cadangan.tglGate;
    item.gate = cadangan.gate;

    return;

  }

  closeGateModal();

  renderTableNew();
  renderTableReceiving();

  alert("Data GATE berhasil disimpan.");

}


/* ==========================================================
   ADD BC (dipakai Receiving dan Return)
   Receiving menyimpan ke data barang, Return menyimpan ke item.ret
   ========================================================== */

function sumberBc(item, mode) {

  return mode === "return" ? item.ret : item;

}

function openAddBcModal(id, mode) {

  const item = cariItemById(id);

  if (!item) {
    return;
  }

  const modeBc = mode || "receiving";
  const sumber = sumberBc(item, modeBc);

  if (!sumber) {
    return;
  }

  currentBcId = id;
  currentBcMode = modeBc;

  document.getElementById("add-bc-info").textContent =
    `${item.kode} - ${item.uraian}`;

  document.getElementById("bc-kode-doc").value = sumber.kodeDoc;
  document.getElementById("bc-nomor-aju").value = sumber.nomorAju;
  document.getElementById("bc-nomor-daftar").value = sumber.nomorDaftar;
  document.getElementById("bc-tgl-daftar").value = sumber.tglDaftar;

  document
    .getElementById("modal-add-bc")
    .classList.add("active");

}

function closeAddBcModal() {

  document
    .getElementById("modal-add-bc")
    .classList.remove("active");

  currentBcId = null;

}

function simpanAddBc() {

  if (currentBcId === null) {
    return;
  }

  const item = cariItemById(currentBcId);

  if (!item) {
    return;
  }

  const sumber = sumberBc(item, currentBcMode);

  if (!sumber) {
    return;
  }

  const kodeDoc = document.getElementById("bc-kode-doc").value.trim();
  const nomorAju = document.getElementById("bc-nomor-aju").value.trim();
  const nomorDaftar = document.getElementById("bc-nomor-daftar").value.trim();
  const tglDaftar = document.getElementById("bc-tgl-daftar").value;

  if (!kodeDoc) {
    alert("Kode Doc wajib diisi.");
    return;
  }

  sumber.kodeDoc = kodeDoc;
  sumber.nomorAju = nomorAju;
  sumber.nomorDaftar = nomorDaftar;
  sumber.tglDaftar = tglDaftar;

  saveData();

  renderTableReceiving();
  renderTableReturn();

  closeAddBcModal();

  alert("Data BC berhasil disimpan.");

}


/* ==========================================================
   RECEIVING - AKSI: PREVIEW (ikon mata, tampilan baca-saja)
   ========================================================== */

function openPreviewModal(id) {

  const item = cariItemById(id);

  if (!item) {
    return;
  }

  const g = item.gate || {};

  document.getElementById("preview-title").textContent = "PREVIEW";

  const kesesuaian = g.kesesuaian
    ? `<div class="pv-kesesuaian">Kesesuaian: <strong>${escapeHTML(g.kesesuaian)}</strong></div>`
    : "";

  document.getElementById("preview-body").innerHTML = `

    <div class="pv-row pv-row-1">
      ${kotakPreview("Perusahaan", item.perusahaan)}
    </div>

    <div class="pv-row pv-row-4">
      ${kotakPreview("Kode Doc", item.kodeDoc)}
      ${kotakPreview("Nomor Pengajuan", item.nomorAju)}
      ${kotakPreview("Nomor Daftar", item.nomorDaftar)}
      ${kotakPreview("Tgl. Daftar", formatTanggal(item.tglDaftar))}
    </div>

    <div class="preview-title">DATA BARANG</div>

    <div class="pv-row pv-row-barang">
      ${kotakPreview("Kode Barang", item.kode)}
      ${kotakPreview("Uraian Barang", item.uraian)}
      ${kotakPreview("Jumlah", item.jumlah)}
      ${kotakPreview("Satuan", item.satuan)}
    </div>

    <div class="pv-row pv-row-2">
      ${kotakPreview("Aset Nomor", item.aset)}
      ${kotakPreview("Status Aset", item.status)}
    </div>

    <div class="preview-title">WAKTU MASUK</div>

    <div class="pv-row pv-row-4">
      ${kotakPreview("Tanggal", formatTanggal(g.tanggal))}
      ${kotakPreview("Waktu", g.waktu)}
      ${kotakPreview("Penerima", g.penerima)}
      ${kotakPreview("Lokasi", g.lokasi)}
    </div>

    <div class="pv-bawah">

      <div>
        <div class="preview-title">BUKTI FOTO</div>
        <div class="pv-foto-row">
          ${fotoPreviewHTML("Foto unit", g.fotoUnit)}
          ${fotoPreviewHTML("Foto label", g.fotoLabel)}
        </div>
      </div>

      <div>
        <div class="preview-title">KETERANGAN</div>
        <div class="pv-box pv-keterangan">${escapeHTML(g.keterangan) || "-"}</div>
        ${kesesuaian}
      </div>

    </div>

  `;

  document
    .getElementById("modal-preview")
    .classList.add("active");

}

function closePreviewModal() {

  document
    .getElementById("modal-preview")
    .classList.remove("active");

}

/* Kotak baca-saja: label di atas, isi di dalam kotak */
function kotakPreview(label, isi) {

  return `
    <div class="pv-field">
      <div class="pv-label">${escapeHTML(label)}</div>
      <div class="pv-box">${escapeHTML(isi) || "-"}</div>
    </div>
  `;

}

function fotoPreviewHTML(label, foto) {

  const adaFoto =
    typeof foto === "string" && foto.startsWith("data:image/");

  const isi = adaFoto
    ? `<img class="preview-foto" src="${foto}" alt="${escapeHTML(label)}">`
    : `<span class="preview-kosong">Belum ada foto</span>`;

  return `
    <div class="pv-field">
      <div class="pv-label">${escapeHTML(label)}</div>
      <div class="pv-foto-box">${isi}</div>
    </div>
  `;

}


/* ==========================================================
   RECEIVING - AKSI: HAPUS (dari daftar Receiving saja)
   Data barang di REGISTER NEW tidak ikut terhapus.
   ========================================================== */

function hapusDariReceiving(id) {

  const item = cariItemById(id);

  if (!item) {
    return;
  }

  if (item.ret) {
    alert(
      "Barang ini ada di menu Return. " +
      "Hapus dulu dari Return sebelum menghapusnya dari Receiving."
    );
    return;
  }

  const konfirmasi = confirm(
    `Hapus barang "${item.uraian}" dari Receiving?\n\n` +
    "Data BC dan data GATE (termasuk foto) akan direset. " +
    "Data barang di REGISTER NEW tidak terhapus."
  );

  if (!konfirmasi) {
    return;
  }

  item.inReceiving = false;
  item.tglPilih = "";
  item.tglGate = "";
  item.kodeDoc = "";
  item.nomorAju = "";
  item.nomorDaftar = "";
  item.tglDaftar = "";
  item.gate = null;
  item.status = "REGISTERED";

  saveData();

  renderTableNew();
  renderTableReceiving();

}


/* ==========================================================
   RETURN - FORM PERMINTAAN (Requestor, Departemen, Alasan, dst.)
   Isi form ini ikut tersimpan pada barang yang dipilih lewat Cari.
   ========================================================== */

function ambilHeaderReturn() {

  const requestor = document.getElementById("ret-requestor").value.trim();
  const tglRequest = document.getElementById("ret-tgl-request").value;
  const departemen = document.getElementById("ret-departemen").value.trim();
  const alasan = document.getElementById("ret-alasan").value.trim();
  const penerima = document.getElementById("ret-penerima").value.trim();
  const lokasi = document.getElementById("ret-lokasi").value.trim();

  if (!requestor || !tglRequest) {
    alert("Nama & Tanggal Requestor wajib diisi.");
    return null;
  }

  if (!departemen) {
    alert("Departemen wajib diisi.");
    return null;
  }

  if (!alasan) {
    alert("Alasan Pengembalian wajib diisi.");
    return null;
  }

  if (!penerima) {
    alert("Nama Perusahaan / Penerima wajib diisi.");
    return null;
  }

  if (!lokasi) {
    alert("Lokasi wajib diisi.");
    return null;
  }

  return {
    requestor: requestor,
    tglRequest: tglRequest,
    departemen: departemen,
    alasan: alasan,
    penerima: penerima,
    lokasi: lokasi
  };

}


/* ==========================================================
   RETURN - CARI / PILIH BARANG
   Yang tampil: barang yang sudah GATE di Receiving (status
   RECEIVED) dan belum masuk Return.
   ========================================================== */

function openPilihReturnModal() {

  /* form permintaan harus lengkap dulu */
  if (!ambilHeaderReturn()) {
    return;
  }

  pilihanReturn.clear();

  document.getElementById("pilih-return-cari").value = "";

  renderTablePilihReturn();

  document
    .getElementById("modal-pilih-return")
    .classList.add("active");

}

function closePilihReturnModal() {

  document
    .getElementById("modal-pilih-return")
    .classList.remove("active");

  pilihanReturn.clear();

}

function renderTablePilihReturn() {

  const tbody = document.getElementById("tabel-pilih-return-body");

  const keyword =
    document.getElementById("pilih-return-cari").value.toLowerCase().trim();

  const kandidat = listBarang.filter(item => {

    if (!item.inReceiving || item.status !== "RECEIVED" || item.ret) {
      return false;
    }

    const teks = [
      item.kode,
      item.uraian,
      item.aset,
      item.perusahaan,
      item.nomorDaftar
    ].join(" ").toLowerCase();

    return teks.includes(keyword);

  });

  tbody.innerHTML = "";

  document.getElementById("check-all-pilih-return").checked = false;

  if (kandidat.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-message">
          Belum ada barang yang bisa dikembalikan.
          Barang harus sudah GATE di menu Receiving.
        </td>
      </tr>
    `;

    return;

  }

  kandidat.forEach(item => {

    const tr = document.createElement("tr");

    const dicentang = pilihanReturn.has(item.id) ? "checked" : "";

    tr.innerHTML = `

      <td>
        <input
          type="checkbox"
          class="pilih-return-checkbox"
          data-id="${item.id}"
          ${dicentang}
          onchange="togglePilihanReturn(${item.id}, this.checked)">
      </td>

      <td>${nilai(item.kode)}</td>

      <td class="left">${nilai(item.uraian)}</td>

      <td>${nilai(item.jumlah)}</td>

      <td>${nilai(item.satuan)}</td>

      <td>${nilai(item.aset)}</td>

      <td>${nilai(item.perusahaan)}</td>

      <td>${nilai(item.nomorDaftar)}</td>

      <td>${formatTanggal(item.tglDaftar)}</td>

    `;

    tbody.appendChild(tr);

  });

}

function togglePilihanReturn(id, dicentang) {

  if (dicentang) {
    pilihanReturn.add(id);
  } else {
    pilihanReturn.delete(id);
  }

}

function toggleSelectAllPilihReturn(master) {

  document
    .querySelectorAll(".pilih-return-checkbox")
    .forEach(checkbox => {

      checkbox.checked = master.checked;

      togglePilihanReturn(
        Number(checkbox.dataset.id),
        master.checked
      );

    });

}

function pilihReturn() {

  if (pilihanReturn.size === 0) {
    alert("Pilih minimal satu barang.");
    return;
  }

  const header = ambilHeaderReturn();

  if (!header) {
    return;
  }

  const sekarang = new Date().toISOString();

  let jumlahDipilih = 0;

  listBarang.forEach(item => {

    if (pilihanReturn.has(item.id) && item.status === "RECEIVED" && !item.ret) {

      item.ret = Object.assign({}, header, {
        tglPilih: sekarang,
        kodeDoc: "",
        nomorAju: "",
        nomorDaftar: "",
        tglDaftar: "",
        tglGate: "",
        gate: null
      });

      jumlahDipilih++;

    }

  });

  saveData();

  closePilihReturnModal();

  /* reset filter periode supaya data baru langsung terlihat */
  resetPeriodeReturn();

  renderTableReturn();

  alert(jumlahDipilih + " barang masuk ke Return.");

}


/* ==========================================================
   RETURN - RENDER TABLE
   Kolom: Kode Barang, Uraian, Jumlah, Satuan, Aset No, Perusahaan,
          Kode Doc, Nomor AJU, Nomor Daftar, Tgl. Daftar, Aksi
   ========================================================== */

function renderTableReturn() {

  const tbody = document.getElementById("tabel-return-body");

  tbody.innerHTML = "";

  const semuaReturn = listBarang.filter(item => item.ret);

  const tampil = filterPeriodeReturn
    ? semuaReturn.filter(
        item => ambilBulan(item.ret.tglPilih) === filterPeriodeReturn
      )
    : semuaReturn;

  if (tampil.length === 0) {

    const pesan = semuaReturn.length === 0
      ? "DATA MASUK SETELAH DIPILIH"
      : "Tidak ada data pada periode yang dipilih.";

    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-message empty-receiving">
          ${pesan}
        </td>
      </tr>
    `;

    return;

  }

  tampil.forEach(item => {

    const r = item.ret;

    const sudahGate = item.status === "RETURNED";

    const tombolGate = sudahGate
      ? `<button class="btn-aksi btn-aksi-selesai" disabled><span class="ico ico-check"></span>GATE</button>`
      : `<button class="btn-aksi" onclick="openGateReturnModal(${item.id})">GATE</button>`;

    const tr = document.createElement("tr");

    tr.innerHTML = `

      <td>${nilai(item.kode)}</td>

      <td class="left">${nilai(item.uraian)}</td>

      <td>${nilai(item.jumlah)}</td>

      <td>${nilai(item.satuan)}</td>

      <td>${nilai(item.aset)}</td>

      <td>${nilai(item.perusahaan)}</td>

      <td>${nilai(r.kodeDoc)}</td>

      <td>${nilai(r.nomorAju)}</td>

      <td>${nilai(r.nomorDaftar)}</td>

      <td>${formatTanggal(r.tglDaftar)}</td>

      <td>
        <div class="aksi-group">

          ${tombolGate}

          <button
            class="btn-aksi"
            onclick="openAddBcModal(${item.id}, 'return')">
            ADD BC
          </button>

          <button
            class="btn-icon btn-icon-detail"
            title="Preview"
            onclick="openPreviewReturnModal(${item.id})">
            <span class="ico ico-eye"></span>
          </button>

          <button
            class="btn-icon btn-icon-hapus"
            title="Hapus dari Return"
            onclick="hapusDariReturn(${item.id})">
            <span class="ico ico-trash"></span>
          </button>

        </div>
      </td>

    `;

    tbody.appendChild(tr);

  });

}


/* ==========================================================
   RETURN - PERIODE BULAN
   ========================================================== */

function tampilkanPeriodeReturn() {

  filterPeriodeReturn = document.getElementById("return-periode-bulan").value;

  renderTableReturn();

}

function resetPeriodeReturn() {

  filterPeriodeReturn = "";

  document.getElementById("return-periode-bulan").value = "";

}


/* ==========================================================
   RETURN - AKSI: GATE (barang keluar)
   Setelah disimpan, status barang menjadi RETURNED.
   ========================================================== */

function openGateReturnModal(id) {

  const item = cariItemById(id);

  if (!item || !item.ret) {
    return;
  }

  currentGateReturnId = id;

  resetFormGateReturn();

  /* Data Barang: terisi otomatis sesuai input awal */
  document.getElementById("rgate-kode").value = item.kode;
  document.getElementById("rgate-uraian").value = item.uraian;
  document.getElementById("rgate-jumlah").value = item.jumlah;
  document.getElementById("rgate-satuan").value = item.satuan;

  /* Rekam Keluar: default tanggal & waktu sekarang, boleh diubah */
  const sekarang = new Date();

  document.getElementById("rgate-tanggal").value = tanggalLokal(sekarang);
  document.getElementById("rgate-waktu").value = waktuLokal(sekarang);

  document
    .getElementById("modal-gate-return")
    .classList.add("active");

}

function closeGateReturnModal() {

  document
    .getElementById("modal-gate-return")
    .classList.remove("active");

  currentGateReturnId = null;

  returnFoto = { unit: "", label: "" };

}

function resetFormGateReturn() {

  returnFoto = { unit: "", label: "" };

  tampilkanFotoReturn("unit");
  tampilkanFotoReturn("label");

  setKesesuaianReturn("");

}

function pilihFotoReturn(jenis) {

  document.getElementById("rgate-file-" + jenis).click();

}

async function prosesFotoReturn(jenis, input) {

  const file = input.files && input.files[0];

  input.value = "";

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar.");
    return;
  }

  try {

    returnFoto[jenis] = await kompresFoto(file, 720, 0.65);

    tampilkanFotoReturn(jenis);

  } catch (error) {

    alert("Foto tidak dapat dibaca. Coba pilih foto lain.");

  }

}

function tampilkanFotoReturn(jenis) {

  const box = document.getElementById("rgate-preview-" + jenis);

  box.innerHTML = returnFoto[jenis]
    ? `<img src="${returnFoto[jenis]}" alt="Foto ${jenis}">`
    : "";

}

function setKesesuaianReturn(nilaiPilihan) {

  returnKesesuaian = nilaiPilihan;

  document
    .getElementById("rbtn-sesuai")
    .classList.toggle("active", nilaiPilihan === "SESUAI");

  document
    .getElementById("rbtn-tidak-sesuai")
    .classList.toggle("active", nilaiPilihan === "TIDAK SESUAI");

}

function simpanGateReturn() {

  if (currentGateReturnId === null) {
    return;
  }

  const item = cariItemById(currentGateReturnId);

  if (!item || !item.ret) {
    return;
  }

  const tanggal = document.getElementById("rgate-tanggal").value;
  const waktu = document.getElementById("rgate-waktu").value;

  if (!tanggal || !waktu) {
    alert("Tanggal dan Waktu wajib diisi.");
    return;
  }

  if (!returnKesesuaian) {
    alert("Pilih Kesesuaian Data: Sesuai atau Tidak Sesuai.");
    return;
  }

  /* cadangan, dipakai kalau penyimpanan browser gagal */
  const cadangan = {
    status: item.status,
    tglGate: item.ret.tglGate,
    gate: item.ret.gate
  };

  item.status = "RETURNED";
  item.ret.tglGate = new Date().toISOString();

  item.ret.gate = {
    tanggal: tanggal,
    waktu: waktu,
    fotoUnit: returnFoto.unit,
    fotoLabel: returnFoto.label,
    kesesuaian: returnKesesuaian
  };

  if (!saveData()) {

    item.status = cadangan.status;
    item.ret.tglGate = cadangan.tglGate;
    item.ret.gate = cadangan.gate;

    return;

  }

  closeGateReturnModal();

  renderTableNew();
  renderTableReceiving();
  renderTableReturn();

  alert("Data GATE Return berhasil disimpan.");

}


/* ==========================================================
   RETURN - AKSI: PREVIEW (ikon mata, tampilan baca-saja)
   ========================================================== */

function openPreviewReturnModal(id) {

  const item = cariItemById(id);

  if (!item || !item.ret) {
    return;
  }

  const r = item.ret;
  const g = r.gate || {};

  document.getElementById("preview-title").textContent = "PREVIEW RETURN";

  document.getElementById("preview-body").innerHTML = `

    <div class="preview-title">PERMINTAAN PENGEMBALIAN</div>

    <div class="pv-row pv-row-2">
      ${kotakPreview("Nama Requestor", r.requestor)}
      ${kotakPreview("Tanggal Requestor", formatTanggal(r.tglRequest))}
    </div>

    <div class="pv-row pv-row-2">
      ${kotakPreview("Departemen", r.departemen)}
      ${kotakPreview("Alasan Pengembalian", r.alasan)}
    </div>

    <div class="pv-row pv-row-2">
      ${kotakPreview("Nama Perusahaan / Penerima", r.penerima)}
      ${kotakPreview("Lokasi", r.lokasi)}
    </div>

    <div class="pv-row pv-row-4">
      ${kotakPreview("Kode Doc", r.kodeDoc)}
      ${kotakPreview("Nomor Pengajuan", r.nomorAju)}
      ${kotakPreview("Nomor Daftar", r.nomorDaftar)}
      ${kotakPreview("Tgl. Daftar", formatTanggal(r.tglDaftar))}
    </div>

    <div class="preview-title">DATA BARANG</div>

    <div class="pv-row pv-row-barang">
      ${kotakPreview("Kode Barang", item.kode)}
      ${kotakPreview("Uraian Barang", item.uraian)}
      ${kotakPreview("Jumlah", item.jumlah)}
      ${kotakPreview("Satuan", item.satuan)}
    </div>

    <div class="pv-row pv-row-3">
      ${kotakPreview("Perusahaan", item.perusahaan)}
      ${kotakPreview("Aset Nomor", item.aset)}
      ${kotakPreview("Status Aset", item.status)}
    </div>

    <div class="preview-title">WAKTU KELUAR</div>

    <div class="pv-row pv-row-2">
      ${kotakPreview("Tanggal", formatTanggal(g.tanggal))}
      ${kotakPreview("Waktu", g.waktu)}
    </div>

    <div class="pv-bawah">

      <div>
        <div class="preview-title">BUKTI FOTO</div>
        <div class="pv-foto-row">
          ${fotoPreviewHTML("Foto unit", g.fotoUnit)}
          ${fotoPreviewHTML("Foto label", g.fotoLabel)}
        </div>
      </div>

      <div>
        <div class="preview-title">KESESUAIAN DATA</div>
        ${kotakPreview("Kesesuaian", g.kesesuaian)}
      </div>

    </div>

  `;

  document
    .getElementById("modal-preview")
    .classList.add("active");

}


/* ==========================================================
   RETURN - AKSI: HAPUS (dari daftar Return saja)
   ========================================================== */

function hapusDariReturn(id) {

  const item = cariItemById(id);

  if (!item || !item.ret) {
    return;
  }

  const konfirmasi = confirm(
    `Hapus barang "${item.uraian}" dari Return?\n\n` +
    "Data BC dan data GATE Return akan direset, " +
    "dan barang kembali berstatus RECEIVED."
  );

  if (!konfirmasi) {
    return;
  }

  if (item.status === "RETURNED") {
    item.status = "RECEIVED";
  }

  item.ret = null;

  saveData();

  renderTableNew();
  renderTableReceiving();
  renderTableReturn();

}


/* ==========================================================
   REGISTER NEW - EDIT BARANG
   ========================================================== */

function openEditBarangModal(index) {

  currentEditIndex = index;

  const item = listBarang[index];

  if (!item) {
    return;
  }

  document.getElementById("edit-kode").value = item.kode;
  document.getElementById("edit-uraian").value = item.uraian;
  document.getElementById("edit-jumlah").value = item.jumlah;
  document.getElementById("edit-satuan").value = item.satuan;
  document.getElementById("edit-aset").value = item.aset;
  document.getElementById("edit-skk").value = item.skk;

  document.getElementById("edit-tgl-skk").value =
    item.tglSkk !== "-" ? item.tglSkk : "";

  document.getElementById("edit-perusahaan").value = item.perusahaan;
  document.getElementById("edit-doc").value = item.doc;

  document
    .getElementById("modal-edit-barang")
    .classList.add("active");

}

function closeEditBarangModal() {

  document
    .getElementById("modal-edit-barang")
    .classList.remove("active");

  currentEditIndex = null;

}

function simpanEditBarang() {

  if (currentEditIndex === null) {
    return;
  }

  const kode = document.getElementById("edit-kode").value.trim();
  const uraian = document.getElementById("edit-uraian").value.trim();
  const jumlah = document.getElementById("edit-jumlah").value.trim();
  const satuan = document.getElementById("edit-satuan").value.trim();
  const aset = document.getElementById("edit-aset").value.trim();
  const skk = document.getElementById("edit-skk").value.trim();
  const tglSkk = document.getElementById("edit-tgl-skk").value;
  const perusahaan = document.getElementById("edit-perusahaan").value.trim();
  const doc = document.getElementById("edit-doc").value.trim();

  if (!kode || !uraian || !jumlah || !satuan || !skk) {
    alert("Kode, Uraian, Jumlah, Satuan dan SKK wajib diisi.");
    return;
  }

  const item = listBarang[currentEditIndex];

  item.kode = kode;
  item.uraian = uraian;
  item.jumlah = jumlah;
  item.satuan = satuan;
  item.aset = aset || "-";
  item.skk = skk;
  item.tglSkk = tglSkk || "-";
  item.perusahaan = perusahaan || "-";
  item.doc = doc || "-";

  saveData();

  renderTableNew();
  renderTableReceiving();

  closeEditBarangModal();

  alert("Data barang berhasil diperbarui.");

}


/* ==========================================================
   REGISTER NEW - HAPUS BARANG
   ========================================================== */

function hapusBarangTerpilih() {

  const checkboxes = document.querySelectorAll(".row-checkbox:checked");

  if (checkboxes.length === 0) {
    alert("Pilih minimal satu barang yang ingin dihapus.");
    return;
  }

  const konfirmasi = confirm(
    "Apakah Anda yakin ingin menghapus barang yang dipilih?"
  );

  if (!konfirmasi) {
    return;
  }

  const indexes = Array.from(checkboxes)
    .map(checkbox => Number(checkbox.dataset.index));

  listBarang = listBarang.filter(
    (_, index) => !indexes.includes(index)
  );

  saveData();

  renderTableNew();
  renderTableReceiving();

  document.getElementById("check-all").checked = false;

}

function toggleSelectAll(master) {

  document
    .querySelectorAll(".row-checkbox")
    .forEach(checkbox => {
      checkbox.checked = master.checked;
    });

}


/* ==========================================================
   SEARCH TABLE (dipakai Register New)
   ========================================================== */

function cariTabel(tableId, query) {

  const table = document.getElementById(tableId);

  if (!table) {
    return;
  }

  const keyword = query.toLowerCase().trim();

  const rows = table.querySelectorAll("tbody tr");

  rows.forEach(row => {

    const text = row.innerText.toLowerCase();

    row.style.display = text.includes(keyword) ? "" : "none";

  });

}


/* ==========================================================
   HELPER
   ========================================================== */

function getStatusClass(status) {

  if (status === "RECEIVED" || status === "DITERIMA") {
    return "received";
  }

  if (status === "RETURNED") {
    return "returned";
  }

  return "registered";

}

/* "2026-09-20" -> "20-09-2026" */
function formatTanggal(tanggal) {

  if (!tanggal || tanggal === "-") {
    return "-";
  }

  const parts = tanggal.split("-");

  if (parts.length !== 3) {
    return tanggal;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}

/* ISO date-time -> "20-09-2026 14:30" */
function formatTanggalWaktu(iso) {

  if (!iso) {
    return "-";
  }

  const d = new Date(iso);

  if (isNaN(d.getTime())) {
    return "-";
  }

  const dua = angka => String(angka).padStart(2, "0");

  return `${dua(d.getDate())}-${dua(d.getMonth() + 1)}-${d.getFullYear()} ` +
         `${dua(d.getHours())}:${dua(d.getMinutes())}`;

}

/* ISO date-time -> "YYYY-MM" (untuk filter Periode Bulan) */
function ambilBulan(iso) {

  if (!iso) {
    return "";
  }

  const d = new Date(iso);

  if (isNaN(d.getTime())) {
    return "";
  }

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

}

/* Date -> "YYYY-MM-DD" (waktu lokal, untuk input type="date") */
function tanggalLokal(d) {

  const dua = angka => String(angka).padStart(2, "0");

  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;

}

/* Date -> "HH:MM" (waktu lokal, untuk input type="time") */
function waktuLokal(d) {

  const dua = angka => String(angka).padStart(2, "0");

  return `${dua(d.getHours())}:${dua(d.getMinutes())}`;

}

/* Teks aman untuk tabel; kosong ditampilkan sebagai "-" */
function nilai(value) {

  const teks = escapeHTML(value);

  return teks === "" ? "-" : teks;

}

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ==========================================================
   TUTUP MODAL SAAT KLIK DI LUAR KOTAK
   ========================================================== */

document
  .querySelectorAll(".modal-overlay")
  .forEach(modal => {

    modal.addEventListener("click", function (event) {

      if (event.target !== modal) {
        return;
      }

      modal.classList.remove("active");

      currentEditIndex = null;
      currentBcId = null;
      currentGateId = null;
      gateFoto = { unit: "", label: "" };
      pilihanSementara.clear();

      currentGateReturnId = null;
      returnFoto = { unit: "", label: "" };
      pilihanReturn.clear();

    });

  });


/* ==========================================================
   BUKA TAB DARI ALAMAT
   Contoh: register.html#receiving (dipakai link dari dashboard)
   ========================================================== */

function bukaTabDariHash() {

  const tab = location.hash.replace("#", "");

  if (["new", "receiving", "return"].includes(tab)) {
    bukaTab(tab);
  }

}


/* ==========================================================
   LABEL KOLOM UNTUK TAMPILAN HP
   Di HP tabel menjadi kartu; tiap isian diberi nama kolomnya
   (dibaca dari judul kolom tabel) lewat atribut data-label.
   ========================================================== */

const TABEL_KARTU = [
  "table-new",
  "table-receiving",
  "table-return",
  "table-pilih",
  "table-pilih-return"
];

function pasangLabelKolom(idTabel) {

  const tabel = document.getElementById(idTabel);

  if (!tabel) {
    return;
  }

  const judul = Array.from(tabel.querySelectorAll("thead th")).map(th =>
    th.querySelector("input[type=checkbox]")
      ? "Pilih"
      : th.textContent.trim()
  );

  tabel.querySelectorAll("tbody tr").forEach(tr => {

    Array.from(tr.children).forEach((td, index) => {

      if (!td.hasAttribute("colspan")) {
        td.setAttribute("data-label", judul[index] || "");
      }

    });

  });

}

/* Setiap isi tabel berubah, label dipasang ulang otomatis */
function aktifkanLabelKolom() {

  TABEL_KARTU.forEach(id => {

    const tbody = document.querySelector("#" + id + " tbody");

    if (!tbody) {
      return;
    }

    new MutationObserver(function () {
      pasangLabelKolom(id);
    }).observe(tbody, { childList: true });

    pasangLabelKolom(id);

  });

}


/* ==========================================================
   INITIALIZE
   ========================================================== */

loadData();

renderTableNew();

renderTableReceiving();

renderTableReturn();

bukaTabDariHash();

window.addEventListener("hashchange", bukaTabDariHash);

aktifkanLabelKolom();


/* Buka tab langsung dari link, misalnya dari Dashboard: register.html?tab=receiving */
const tabDariUrl = new URLSearchParams(window.location.search).get("tab");

if (["new", "receiving", "return"].includes(tabDariUrl)) {
  bukaTab(tabDariUrl);
}
