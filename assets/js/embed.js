/* embed.js — dipasang di WEBSITE LAIN untuk menampilkan tombol "Buat QR Code".
   Klik tombol membuka konverterQR Khresmupu dengan form (link, judul, subjudul, catatan, warna)
   sudah terisi. Pengunjung tinggal klik Unduh PNG atau Cetak / PDF.
   Dokumentasi: integrasi.html. Tidak butuh API key, server, atau library lain. */
(function () {
    "use strict";

    var script = document.currentScript;
    var DEFAULT_ORIGIN = "https://konverterqr-khresmupu.netlify.app";
    var ORIGIN = DEFAULT_ORIGIN;
    try { if (script && script.src) ORIGIN = new URL(script.src).origin; } catch (e) { /* pakai default */ }
    // Dibuka dari file:// atau origin tidak valid -> pakai domain bawaan
    if (!/^https?:\/\//.test(ORIGIN)) ORIGIN = DEFAULT_ORIGIN;
    // Opsional: data-origin="https://domain-anda.com" pada tag <script> untuk domain sendiri / uji lokal
    var override = script && script.getAttribute("data-origin");
    if (override && /^https?:\/\//.test(override)) ORIGIN = override.replace(/\/+$/, "");
    var TOOLS_URL = ORIGIN + "/tools.html";

    function attr(el, name) {
        var v = el.getAttribute("data-" + name);
        return v == null ? "" : v.trim();
    }

    // Menyusun URL Tools dari atribut data-* sebuah elemen
    function buildUrl(el) {
        var p = new URLSearchParams();
        p.set("data", attr(el, "url") || window.location.href.split("#")[0]);
        var title = attr(el, "title") || document.title;
        if (title) p.set("title", title);
        ["subtitle", "footer", "color", "bg"].forEach(function (k) {
            var v = attr(el, k);
            if (v) p.set(k, v);
        });
        // Parameter ditaruh setelah "#" agar tidak hilang oleh redirect hosting
        return TOOLS_URL + "#" + p.toString().replace(/\+/g, "%20");
    }

    // Menghubungkan elemen apa pun (tombol, link, gambar) ke Tools
    function upgrade(el) {
        if (el.__kqr) return;
        el.__kqr = true;
        var url = buildUrl(el);
        if (el.tagName === "A") {
            el.href = url;
            el.target = "_blank";
            el.rel = "noopener";
        } else {
            el.style.cursor = "pointer";
            if (!el.hasAttribute("role")) el.setAttribute("role", "link");
            if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
            var open = function () { window.open(url, "_blank", "noopener"); };
            el.addEventListener("click", open);
            el.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
            });
        }
    }

    // Tombol otomatis yang dibentuk dari atribut pada tag <script> itu sendiri
    function autoButton() {
        if (!script || attr(script, "button") === "false") return;
        if (!script.parentNode || script.parentNode === document.head) {
            if (window.console) console.warn("konverterQR: letakkan <script> di dalam <body> agar tombol muncul di posisi yang Anda inginkan.");
            return;
        }
        var a = document.createElement("a");
        a.setAttribute("data-url", attr(script, "url"));
        ["title", "subtitle", "footer", "color", "bg"].forEach(function (k) {
            if (attr(script, k)) a.setAttribute("data-" + k, attr(script, k));
        });
        a.style.cssText = "display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:12px;" +
            "background:#d81b60;color:#fff;font:600 15px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;" +
            "text-decoration:none;cursor:pointer;box-shadow:0 4px 12px rgba(216,27,96,.3)";
        a.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/>' +
            '<path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v1"/></svg>';
        var label = document.createElement("span");
        label.textContent = attr(script, "label") || "Buat QR Code";
        a.appendChild(label);
        upgrade(a);
        script.parentNode.insertBefore(a, script.nextSibling);
    }

    function run() {
        autoButton();
        var nodes = document.querySelectorAll("[data-kqr]");
        for (var i = 0; i < nodes.length; i++) upgrade(nodes[i]);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
})();
