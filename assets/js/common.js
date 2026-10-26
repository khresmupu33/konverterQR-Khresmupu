/* common.js — dipakai semua halaman: toast, tema, menu mobile, loader pustaka.
   Diekspos sebagai window.KQR agar bisa dipakai file lain (generator.js, scanner.js). */
(function () {
    "use strict";

    var KQR = (window.KQR = window.KQR || {});

    /* ---------- Helper ---------- */
    KQR.$ = function (id) { return document.getElementById(id); };

    /* ---------- Toast ---------- */
    KQR.toast = function (message, type) {
        var container = KQR.$("toast-container");
        if (!container) return;
        var el = document.createElement("div");
        el.className = "toast" + (type === "error" ? " is-error" : "");
        el.textContent = message;
        container.appendChild(el);
        // Maksimal 3 toast sekaligus
        while (container.children.length > 3) container.removeChild(container.firstChild);
        setTimeout(function () {
            el.classList.add("is-leaving");
            setTimeout(function () { el.remove(); }, 300);
        }, 2800);
    };

    /* ---------- Loader pustaka eksternal (dimuat hanya saat dibutuhkan) ---------- */
    var loaded = {};
    KQR.loadScript = function (url) {
        if (loaded[url]) return loaded[url];
        loaded[url] = new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            s.src = url;
            s.async = true;
            s.onload = resolve;
            s.onerror = function () {
                delete loaded[url];
                reject(new Error("Gagal memuat " + url));
            };
            document.head.appendChild(s);
        });
        return loaded[url];
    };
    KQR.loadStyle = function (url) {
        if (loaded[url]) return loaded[url];
        loaded[url] = new Promise(function (resolve, reject) {
            var l = document.createElement("link");
            l.rel = "stylesheet";
            l.href = url;
            l.onload = resolve;
            l.onerror = function () {
                delete loaded[url];
                reject(new Error("Gagal memuat " + url));
            };
            document.head.appendChild(l);
        });
        return loaded[url];
    };

    /* ---------- Tema ---------- */
    function currentTheme() {
        return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function applyTheme(theme, persist) {
        document.documentElement.setAttribute("data-theme", theme);
        if (persist) {
            try { localStorage.setItem("kqr-theme", theme); } catch (e) { /* mode privat */ }
        }
        document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
            btn.setAttribute("aria-label", theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap");
            btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        });
    }

    function initTheme() {
        applyTheme(currentTheme(), false);
        document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
            });
        });
        // Ikuti perubahan tema sistem selama pengguna belum memilih manual
        if (window.matchMedia) {
            var mq = window.matchMedia("(prefers-color-scheme: dark)");
            var onChange = function (e) {
                var saved = null;
                try { saved = localStorage.getItem("kqr-theme"); } catch (err) { /* abaikan */ }
                if (!saved) applyTheme(e.matches ? "dark" : "light", false);
            };
            if (mq.addEventListener) mq.addEventListener("change", onChange);
            else if (mq.addListener) mq.addListener(onChange);
        }
    }

    /* ---------- Menu mobile ---------- */
    function initNav() {
        var toggle = document.querySelector(".nav-toggle");
        var nav = KQR.$("site-nav");
        if (!toggle || !nav) return;

        function setOpen(open) {
            nav.classList.toggle("is-open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
        }

        toggle.addEventListener("click", function () {
            setOpen(toggle.getAttribute("aria-expanded") !== "true");
        });
        nav.addEventListener("click", function (e) {
            if (e.target.closest("a")) setOpen(false);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") setOpen(false);
        });
        document.addEventListener("click", function (e) {
            if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
        });
        window.addEventListener("resize", function () {
            if (window.innerWidth > 860) setOpen(false);
        });
    }

    /* ---------- Tahun di footer ---------- */
    function initYear() {
        document.querySelectorAll("[data-year]").forEach(function (el) {
            el.textContent = new Date().getFullYear();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initTheme();
        initNav();
        initYear();
    });
})();
