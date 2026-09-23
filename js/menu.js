/* ==========================================================
   CARI MENU (kotak pencarian di sidebar)
   Dipakai bersama oleh dashboard.html dan register.html
   ========================================================== */

function aktifkanCariMenu() {

  const input = document.querySelector(".sidebar .search-box input");

  if (!input) {
    return;
  }

  input.addEventListener("input", function () {

    const keyword = input.value.toLowerCase().trim();

    document
      .querySelectorAll(".sidebar .menu-group")
      .forEach(group => {

        const judul = group.querySelector(".menu-title");
        const links = group.querySelectorAll(".menu-link");

        const judulCocok =
          judul && judul.textContent.toLowerCase().includes(keyword);

        let adaLinkCocok = false;

        links.forEach(link => {

          const cocok =
            keyword === "" ||
            judulCocok ||
            link.textContent.toLowerCase().includes(keyword);

          link.style.display = cocok ? "" : "none";

          if (cocok) {
            adaLinkCocok = true;
          }

        });

        /* grup tanpa link (LOG HISTORY / LOGOUT) dicocokkan lewat teksnya */
        const tampil =
          keyword === "" ||
          adaLinkCocok ||
          (links.length === 0 &&
            group.textContent.toLowerCase().includes(keyword));

        group.style.display = tampil ? "" : "none";

      });

  });

}

aktifkanCariMenu();


/* ==========================================================
   MENU GESER DI HP
   Tombol tiga garis di header membuka / menutup sidebar.
   Di layar lebar tombol ini tersembunyi (diatur di css/astom.css).
   ========================================================== */

function aktifkanMenuHP() {

  const sidebar = document.querySelector(".sidebar");
  const tombol = document.getElementById("tombol-menu");

  if (!sidebar || !tombol) {
    return;
  }

  /* jangan dipasang dua kali (mis. bila file ini termuat ganda) */
  if (document.querySelector(".sidebar-latar")) {
    return;
  }

  const latar = document.createElement("div");

  latar.className = "sidebar-latar";

  document.body.appendChild(latar);

  /* tombol X di dalam menu, supaya jelas cara menutupnya */
  const tombolTutup = document.createElement("button");

  tombolTutup.type = "button";
  tombolTutup.className = "btn-tutup-menu";
  tombolTutup.setAttribute("aria-label", "Tutup menu");
  tombolTutup.innerHTML = '<span class="ico ico-x"></span>';

  sidebar.appendChild(tombolTutup);

  function buka() {
    sidebar.classList.add("terbuka");
    latar.classList.add("tampil");
  }

  function tutup() {
    sidebar.classList.remove("terbuka");
    latar.classList.remove("tampil");
  }

  tombol.addEventListener("click", function () {

    if (sidebar.classList.contains("terbuka")) {
      tutup();
    } else {
      buka();
    }

  });

  latar.addEventListener("click", tutup);

  tombolTutup.addEventListener("click", tutup);

  /* halaman dibuka lagi lewat tombol Kembali -> menu selalu mulai dalam keadaan tertutup */
  window.addEventListener("pageshow", tutup);

  /* pilih menu -> sidebar menutup sendiri */
  sidebar.addEventListener("click", function (event) {

    if (event.target.closest(".menu-link, .menu-item-main")) {
      tutup();
    }

  });

  document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
      tutup();
    }

  });

  /* layar dilebarkan (mis. HP diputar) -> tutup menu geser */
  window.addEventListener("resize", function () {

    if (window.innerWidth > 768) {
      tutup();
    }

  });

}

aktifkanMenuHP();
