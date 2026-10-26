/* integrasi.js — halaman dokumentasi: builder kode, tab, syntax highlight, tombol salin. */
(function () {
    "use strict";

    var KQR = window.KQR;
    if (!KQR) return;
    var $ = KQR.$;

    /* ---------- Helper ---------- */
    function origin() {
        var c = document.querySelector('link[rel="canonical"]');
        try { return new URL(c.href).origin; } catch (e) { return window.location.origin; }
    }

    function escAttr(s) {
        return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function hex(v) {
        v = (v || "").replace(/^#/, "");
        return /^[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : "";
    }

    // Pewarnaan sintaks HTML sederhana (satu kali lewat, tanpa tumpang tindih)
    function highlight(text) {
        var safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return safe.replace(/(&lt;\/?)([\w-]+)|([\w:-]+)=("[^"]*")|(\/?&gt;)/g, function (m, open, tag, attr, str, close) {
            if (tag) return open + '<span class="tk-tag">' + tag + "</span>";
            if (attr) return '<span class="tk-attr">' + attr + '</span>=<span class="tk-str">' + str + "</span>";
            return '<span class="tk-tag">' + close + "</span>";
        });
    }

    function setCode(id, text) {
        var el = $(id);
        el.setAttribute("data-raw", text);
        el.innerHTML = highlight(text);
    }

    /* ---------- Builder ---------- */
    function values() {
        var useColor = $("b-use-color").checked;
        return {
            url: $("b-url").value.trim(),
            title: $("b-title").value.trim(),
            subtitle: $("b-subtitle").value.trim(),
            footer: $("b-footer").value.trim(),
            color: useColor ? hex($("b-color").value) : "",
            bg: useColor ? hex($("b-bg").value) : "",
            label: $("b-label").value.trim()
        };
    }

    function render() {
        var o = origin();
        var v = values();
        var label = v.label || "Buat QR Code";

        // Cara 2: link biasa (parameter di hash agar tidak hilang oleh redirect hosting)
        var p = new URLSearchParams();
        p.set("data", v.url || "https://contoh.com");
        ["title", "subtitle", "footer", "color", "bg"].forEach(function (k) { if (v[k]) p.set(k, v[k]); });
        var query = p.toString().replace(/\+/g, "%20");
        var link = o + "/tools.html#" + query;
        setCode("code-link", '<a href="' + escAttr(link) + '" target="_blank" rel="noopener">\n  ' + escAttr(label) + "\n</a>");

        // Cara 1: script tombol otomatis
        var attrs = [];
        if (v.url) attrs.push('data-url="' + escAttr(v.url) + '"');
        if (v.title) attrs.push('data-title="' + escAttr(v.title) + '"');
        if (v.subtitle) attrs.push('data-subtitle="' + escAttr(v.subtitle) + '"');
        if (v.footer) attrs.push('data-footer="' + escAttr(v.footer) + '"');
        if (v.color) attrs.push('data-color="' + v.color + '"');
        if (v.bg) attrs.push('data-bg="' + v.bg + '"');
        var scriptAttrs = attrs.concat(v.label ? ['data-label="' + escAttr(v.label) + '"'] : []);
        setCode("code-script", '<script src="' + o + '/assets/js/embed.js"' +
            (scriptAttrs.length ? "\n        " + scriptAttrs.join("\n        ") : "") + "\n        defer></" + "script>");

        // Cara 3: tombol buatan sendiri
        var btnAttrs = ["data-kqr"].concat(attrs);
        setCode("code-custom", "<button " + btnAttrs.join("\n        ") + ">\n  " + escAttr(label) + "\n</button>\n\n" +
            '<script src="' + o + '/assets/js/embed.js" data-button="false" defer></' + "script>");

        // Tombol uji: membuka Tools di situs yang sedang dibuka (bukan domain produksi)
        var here = /^https?:$/.test(window.location.protocol) ? window.location.origin + "/tools.html" : "tools.html";
        $("b-open").href = here + "#" + query;
    }

    /* ---------- Tab kode ---------- */
    function initTabs() {
        var tabs = Array.prototype.slice.call(document.querySelectorAll(".code-tab"));
        if (!tabs.length) return;

        function select(tab, focus) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.setAttribute("aria-selected", on ? "true" : "false");
                t.tabIndex = on ? 0 : -1;
                $(t.getAttribute("aria-controls")).hidden = !on;
            });
            if (focus) tab.focus();
        }

        tabs.forEach(function (tab, i) {
            tab.addEventListener("click", function () { select(tab, false); });
            tab.addEventListener("keydown", function (e) {
                var next = null;
                if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
                else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
                else if (e.key === "Home") next = tabs[0];
                else if (e.key === "End") next = tabs[tabs.length - 1];
                if (next) { e.preventDefault(); select(next, true); }
            });
        });
    }

    /* ---------- Tombol salin ---------- */
    function copy(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
        return new Promise(function (resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
            document.body.removeChild(ta);
        });
    }

    function initCopy() {
        document.querySelectorAll("[data-copy]").forEach(function (btn) {
            var label = btn.querySelector("span");
            btn.addEventListener("click", function () {
                var target = $(btn.getAttribute("data-copy"));
                if (!target) return;
                var text = target.getAttribute("data-raw") || target.textContent;
                copy(text).then(function () {
                    KQR.toast("Kode berhasil disalin");
                    btn.classList.add("is-done");
                    label.textContent = "Tersalin";
                    setTimeout(function () { btn.classList.remove("is-done"); label.textContent = "Salin"; }, 1600);
                }, function () {
                    KQR.toast("Gagal menyalin. Blok dan salin manual.", "error");
                });
            });
        });
    }

    function init() {
        if (!$("b-url")) return;

        ["b-url", "b-title", "b-subtitle", "b-footer", "b-label", "b-color", "b-bg", "b-use-color"].forEach(function (id) {
            $(id).addEventListener("input", render);
            $(id).addEventListener("change", render);
        });

        // Blok kode statis (contoh di bagian Referensi)
        document.querySelectorAll("code[data-hl]").forEach(function (el) {
            var raw = el.textContent;
            el.setAttribute("data-raw", raw);
            el.innerHTML = highlight(raw);
        });

        initTabs();
        initCopy();
        render();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
