/* ==========================================================
   ASTOM - MONITORING GATE (CEISA 4.0 INTEGRATED)
========================================================== */

const STORAGE_KEY_GATE = "astom_list_barang";

let semuaDataGate = [];
let dataGateTampil = [];

/* ==========================================================
   LOAD DATA
========================================================== */

function loadDataGate() {
  const data = localStorage.getItem(STORAGE_KEY_GATE);

  if (!data) {
    semuaDataGate = [];
    return;
  }

  try {
    semuaDataGate = JSON.parse(data) || [];
  } catch (error) {
    semuaDataGate = [];
  }

  migrasiDataGate();
}

/* ==========================================================
   MIGRASI DATA
========================================================== */

function migrasiDataGate() {
  semuaDataGate.forEach(item => {
    item.kodeDoc = item.kodeDoc || "";
    item.nomorAju = item.nomorAju || "";
    item.nomorDaftar = item.nomorDaftar || "";
    item.tglDaftar = item.tglDaftar || "";
    item.gate = item.gate || null;
    item.ret = item.ret || null;
  });
}

/* ==========================================================
   SAVE DATA
========================================================== */

function saveDataGate() {
  localStorage.setItem(
    STORAGE_KEY_GATE,
    JSON.stringify(semuaDataGate)
  );
}

/* ==========================================================
   DATA DOKUMEN
========================================================== */

function buatDataDokumen() {
  const hasil = [];

  semuaDataGate.forEach(item => {
    /*
     * BARANG MASUK (RECEIVING)
     */
    if (item.inReceiving) {
      hasil.push({
        id: item.id,
        seri: item.kode || "-",
        reg: "IN",
        kodeDoc: item.kodeDoc || "-",
        nomorAju: item.nomorAju || "-",
        nomorDaftar: item.nomorDaftar || "-",
        tglDaftar: item.tglDaftar || "",
        perusahaan: item.perusahaan || "-",
        status: item.status === "RECEIVED" ? "SESUAI" : "BELUM GATE",
        respon: item.gate
          ? (item.gate.kesesuaian || "BELUM VERIFIKASI")
          : "BELUM VERIFIKASI",
        jalur: tentukanJalur(item),
        tipe: "RECEIVING",
        item: item
      });
    }

    /*
     * BARANG RETURN
     */
    if (item.ret) {
      const r = item.ret;

      hasil.push({
        id: item.id,
        seri: item.kode || "-",
        reg: "OUT",
        kodeDoc: r.kodeDoc || "-",
        nomorAju: r.nomorAju || "-",
        nomorDaftar: r.nomorDaftar || "-",
        tglDaftar: r.tglDaftar || "",
        perusahaan: r.penerima || item.perusahaan || "-",
        status: item.status === "RETURNED" ? "SESUAI" : "BELUM GATE",
        respon: r.gate
          ? (r.gate.kesesuaian || "BELUM VERIFIKASI")
          : "BELUM VERIFIKASI",
        jalur: tentukanJalurReturn(item),
        tipe: "RETURN",
        item: item
      });
    }
  });

  return hasil;
}

/* ==========================================================
   TENTUKAN JALUR
========================================================== */

function tentukanJalur(item) {
  if (item.gate && item.gate.jalur) {
    return item.gate.jalur;
  }

  if (item.gate && item.gate.kesesuaian === "SESUAI") {
    return "HIJAU";
  }

  if (item.gate && item.gate.kesesuaian === "TIDAK SESUAI") {
    return "MERAH";
  }

  return "-";
}

function tentukanJalurReturn(item) {
  const gate = item.ret && item.ret.gate;

  if (gate && gate.jalur) {
    return gate.jalur;
  }

  if (gate && gate.kesesuaian === "SESUAI") {
    return "HIJAU";
  }

  if (gate && gate.kesesuaian === "TIDAK SESUAI") {
    return "MERAH";
  }

  return "-";
}

/* ==========================================================
   RENDER TABLE GATE
========================================================== */

function renderGate() {
  const tbody = document.getElementById("gate-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  dataGateTampil = buatDataDokumen();

  if (dataGateTampil.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="gate-empty">
          DATA BELUM TERSEDIA
        </td>
      </tr>
    `;
    return;
  }

  dataGateTampil.forEach((data, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHTML(String(index + 1))}</td>
      <td>${escapeHTML(data.reg)}</td>
      <td>${escapeHTML(data.kodeDoc)}</td>
      <td>${escapeHTML(data.nomorAju)}</td>
      <td>${renderRespon(data)}</td>
      <td>${escapeHTML(data.nomorDaftar)}</td>
      <td>${formatTanggalGate(data.tglDaftar)}</td>
      <td>${renderJalur(data.jalur)}</td>
      <td>${escapeHTML(data.perusahaan)}</td>
      <td>${renderStatus(data)}</td>
      <td>
        <div class="gate-action">
          <button type="button" class="gate-doc-button" onclick="bukaDoc(${data.id}, '${data.tipe}')">
            DOC
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ==========================================================
   RENDER RESPON
========================================================== */

function renderRespon(data) {
  const respon = data.respon || "";

  if (respon === "SESUAI") {
    return `
      <span class="gate-respon gate-respon-sesuai">
        SESUAI
      </span>
    `;
  }

  if (respon === "TIDAK SESUAI") {
    return `
      <span class="gate-respon gate-respon-tidak">
        TIDAK SESUAI
      </span>
    `;
  }

  return `
    <span class="gate-respon gate-respon-belum">
      BELUM VERIFIKASI
    </span>
  `;
}

/* ==========================================================
   RENDER JALUR
========================================================== */

function renderJalur(jalur) {
  if (!jalur || jalur === "-") {
    return "-";
  }

  const kelas =
    jalur === "HIJAU"
      ? "gate-jalur-hijau"
      : jalur === "KUNING"
        ? "gate-jalur-kuning"
        : "gate-jalur-merah";

  return `
    <span class="gate-jalur ${kelas}">
      ${escapeHTML(jalur)}
    </span>
  `;
}

/* ==========================================================
   RENDER STATUS BUTTON

   Verifikasi CEISA cuma masuk akal kalau barangnya sudah
   GATE secara fisik (data.status === "SESUAI", lihat
   buatDataDokumen()). Kalau belum GATE, tombol CEK
   disembunyikan dan diganti badge "BELUM GATE".
========================================================== */

function renderStatus(data) {
  if (data.status !== "SESUAI") {
    return `
      <span class="gate-ceisa-badge gate-ceisa-pending" title="Barang belum GATE, verifikasi CEISA belum bisa dilakukan">
        BELUM GATE
      </span>
    `;
  }

  return `
    <button
      type="button"
      id="btn-cek-${data.tipe}-${data.id}"
      class="gate-status-button"
      title="Verifikasi CEISA 4.0 (simulasi)"
      onclick="sinkronData(${data.id}, '${data.tipe}')">
      <span class="gate-sync-icon">⟳</span>
      <span>CEK</span>
    </button>
  `;
}

/* ==========================================================
   SINKRON DATA / VERIFIKASI CEISA 4.0  (SIMULASI)

   PENTING: fungsi ini TIDAK terhubung ke server CEISA yang
   sesungguhnya. Astom2 adalah aplikasi front-end murni (data
   disimpan di localStorage, tanpa server), sedangkan CEISA
   4.0 adalah sistem resmi Bea Cukai yang hanya bisa diakses
   lewat integrasi Host-to-Host dengan sertifikat elektronik
   terdaftar. Yang dilakukan di sini hanyalah mengecek
   kelengkapan data (Nomor Aju/Nomor Daftar/Tanggal Daftar)
   yang SUDAH ada di data lokal, lalu diberi jeda singkat +
   spinner supaya terasa seperti proses pengecekan.
========================================================== */

function sinkronData(id, tipe) {
  const item = semuaDataGate.find(barang => barang.id === id);
  if (!item) return;

  /* jaga-jaga: cek ulang barang sudah GATE atau belum */
  const sudahGate = tipe === "RETURN" ? item.status === "RETURNED" : item.status === "RECEIVED";

  if (!sudahGate) {
    alert("Barang ini belum GATE. Verifikasi CEISA belum bisa dilakukan.");
    return;
  }

  if (tipe === "RETURN") {
    if (!item.ret) return;
    if (!item.ret.gate) item.ret.gate = {};
  } else {
    if (!item.gate) item.gate = {};
  }

  const tombol = document.getElementById(`btn-cek-${tipe}-${id}`);

  if (tombol) {
    tombol.disabled = true;
    tombol.innerHTML = `<span class="gate-loading-spinner"></span><span>CEK...</span>`;
  }

  /* jeda singkat untuk mensimulasikan proses pengecekan */
  setTimeout(() => {

    const sumberGate = tipe === "RETURN" ? item.ret.gate : item.gate;
    const nomorAju = tipe === "RETURN" ? (item.ret.nomorAju || "") : (item.nomorAju || "");
    const nomorDaftar = tipe === "RETURN" ? (item.ret.nomorDaftar || "") : (item.nomorDaftar || "");
    const tglDaftar = tipe === "RETURN" ? (item.ret.tglDaftar || "") : (item.tglDaftar || "");

    let respon = "TIDAK SESUAI";
    let jalur = "MERAH";

    /* pengecekan kelengkapan data lokal (BUKAN verifikasi CEISA sungguhan) */
    if (nomorDaftar && tglDaftar && nomorAju !== "-" && nomorAju !== "") {
      respon = "SESUAI";
      jalur = "HIJAU";
    }

    sumberGate.kesesuaian = respon;
    sumberGate.jalur = jalur;
    sumberGate.tanggal = sumberGate.tanggal || new Date().toISOString().split("T")[0];
    sumberGate.waktu = sumberGate.waktu || new Date().toTimeString().split(" ")[0].substring(0, 5);

    saveDataGate();
    renderGate();

    if (respon === "SESUAI") {
      alert(`[Simulasi CEISA 4.0] Data lengkap.\nNomor Aju: ${nomorAju} dianggap SESUAI.`);
    } else {
      alert(`[Simulasi CEISA 4.0] Data belum lengkap.\nNomor Aju/Nomor Daftar/Tanggal Daftar belum terisi.`);
    }

  }, 700);
}

/* ==========================================================
   FILTER
========================================================== */

function bukaFilter() {
  document.getElementById("gate-filter-overlay").classList.add("active");
}

function tutupFilter() {
  document.getElementById("gate-filter-overlay").classList.remove("active");
}

function klikLuarFilter(event) {
  if (event.target.id === "gate-filter-overlay") {
    tutupFilter();
  }
}

function terapkanFilter() {
  const jenis = document.getElementById("filter-jenis").value.toLowerCase().trim();
  const nomorAju = document.getElementById("filter-nomor-aju").value.toLowerCase().trim();
  const nomorDaftar = document.getElementById("filter-nomor-daftar").value.toLowerCase().trim();
  const tanggalDaftar = document.getElementById("filter-tanggal-daftar").value;
  const perusahaan = document.getElementById("filter-perusahaan").value.toLowerCase().trim();

  let hasil = buatDataDokumen();

  hasil = hasil.filter(data => {
    const cocokJenis = !jenis || data.kodeDoc.toLowerCase().includes(jenis);
    const cocokAju = !nomorAju || data.nomorAju.toLowerCase().includes(nomorAju);
    const cocokDaftar = !nomorDaftar || data.nomorDaftar.toLowerCase().includes(nomorDaftar);
    const cocokTanggal = !tanggalDaftar || data.tglDaftar === tanggalDaftar;
    const cocokPerusahaan = !perusahaan || data.perusahaan.toLowerCase().includes(perusahaan);

    return cocokJenis && cocokAju && cocokDaftar && cocokTanggal && cocokPerusahaan;
  });

  dataGateTampil = hasil;
  renderDataHasilFilter();
  tutupFilter();
}

function renderDataHasilFilter() {
  const tbody = document.getElementById("gate-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (dataGateTampil.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="gate-empty">DATA TIDAK DITEMUKAN</td>
      </tr>
    `;
    return;
  }

  dataGateTampil.forEach((data, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHTML(data.reg)}</td>
      <td>${escapeHTML(data.kodeDoc)}</td>
      <td>${escapeHTML(data.nomorAju)}</td>
      <td>${renderRespon(data)}</td>
      <td>${escapeHTML(data.nomorDaftar)}</td>
      <td>${formatTanggalGate(data.tglDaftar)}</td>
      <td>${renderJalur(data.jalur)}</td>
      <td>${escapeHTML(data.perusahaan)}</td>
      <td>${renderStatus(data)}</td>
      <td>
        <button type="button" class="gate-doc-button" onclick="bukaDoc(${data.id}, '${data.tipe}')">
          DOC
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function resetFilter() {
  document.getElementById("filter-jenis").value = "";
  document.getElementById("filter-nomor-aju").value = "";
  document.getElementById("filter-nomor-daftar").value = "";
  document.getElementById("filter-tanggal-daftar").value = "";
  document.getElementById("filter-perusahaan").value = "";
  renderGate();
}

/* ==========================================================
   DOCUMENT POPUP
========================================================== */

function bukaDoc(id, tipe) {
  const item = semuaDataGate.find(barang => barang.id === id);
  if (!item) return;

  const isReturn = tipe === "RETURN";
  const sumber = isReturn ? item.ret : item;
  if (!sumber) return;

  const gate = sumber.gate || {};

  document.getElementById("gate-doc-title").textContent = isReturn
    ? "DOCUMENT - RETURN"
    : "DOCUMENT - RECEIVING";

  document.getElementById("gate-doc-content").innerHTML = `
    <div class="gate-doc-section-title">DATA DOKUMEN</div>
    <div class="gate-doc-grid">
      ${fieldDoc("Kode Doc", sumber.kodeDoc)}
      ${fieldDoc("Nomor Aju", sumber.nomorAju)}
      ${fieldDoc("Nomor Daftar", sumber.nomorDaftar)}
      ${fieldDoc("Tanggal Daftar", formatTanggalGate(sumber.tglDaftar))}
    </div>

    <div class="gate-doc-section-title">DATA BARANG</div>
    <div class="gate-doc-grid">
      ${fieldDoc("Kode Barang", item.kode)}
      ${fieldDoc("Uraian Barang", item.uraian)}
      ${fieldDoc("Jumlah", item.jumlah)}
      ${fieldDoc("Satuan", item.satuan)}
      ${fieldDoc("Aset No", item.aset)}
      ${fieldDoc("Perusahaan", item.perusahaan)}
    </div>

    <div class="gate-doc-section-title">GATE & CEISA 4.0</div>
    <div class="gate-doc-grid">
      ${fieldDoc("Tanggal Gate", gate.tanggal ? formatTanggalGate(gate.tanggal) : "-")}
      ${fieldDoc("Waktu Gate", gate.waktu || "-")}
      ${fieldDoc("Penerima", gate.penerima || "-")}
      ${fieldDoc("Lokasi", gate.lokasi || "-")}
      ${fieldDoc("Kesesuaian", gate.kesesuaian || "-")}
      ${fieldDoc("Jalur", gate.jalur || "-")}
    </div>

    <div class="gate-doc-section-title">KETERANGAN</div>
    <div class="gate-doc-note">
      ${escapeHTML(gate.keterangan || "-")}
    </div>
  `;

  document.getElementById("gate-doc-overlay").classList.add("active");
}

function fieldDoc(label, value) {
  return `
    <div class="gate-doc-field">
      <div class="gate-doc-label">${escapeHTML(label)}</div>
      <div class="gate-doc-value">${escapeHTML(value || "-")}</div>
    </div>
  `;
}

function tutupDoc() {
  document.getElementById("gate-doc-overlay").classList.remove("active");
}

function klikLuarDoc(event) {
  if (event.target.id === "gate-doc-overlay") {
    tutupDoc();
  }
}

/* ==========================================================
   HELPERS
========================================================== */

function formatTanggalGate(tanggal) {
  if (!tanggal || tanggal === "-") return "-";
  const parts = tanggal.split("-");
  if (parts.length !== 3) return escapeHTML(tanggal);
  return parts[2] + "-" + parts[1] + "-" + parts[0];
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
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

loadDataGate();
renderGate();

/* ==========================================================
   PENGAMAN: tutup paksa popup Filter/Document setiap halaman
   ini dibuka (termasuk saat di-restore dari cache browser
   lewat tombol Back/Forward). Tanpa ini, popup yang masih
   "active" bisa membuat seluruh halaman terasa tidak bisa
   diklik/menu terasa stuck.
========================================================== */

function tutupSemuaPopupGate() {
  const filter = document.getElementById("gate-filter-overlay");
  const doc = document.getElementById("gate-doc-overlay");

  if (filter) filter.classList.remove("active");
  if (doc) doc.classList.remove("active");
}

tutupSemuaPopupGate();

window.addEventListener("pageshow", tutupSemuaPopupGate);
