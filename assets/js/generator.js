/* generator.js — logika tab "Buat QR Code".
   Bergantung pada common.js (window.KQR). Hanya aktif jika #qr-card ada di halaman. */
(function () {
    "use strict";

    var KQR = window.KQR;
    if (!KQR) return;
    var $ = KQR.$;

    var QR_API = "https://api.qrserver.com/v1/create-qr-code/";
    var HTML2CANVAS = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    var MAX_URL_LENGTH = 1900; // batas aman panjang URL permintaan ke API
    var DEFAULTS = { dark: "#d81b60", light: "#ffffff", size: "300x300" };
    var TYPES = ["text", "wifi", "vcard", "whatsapp"];

    var el = {};
    var state = { type: "text", label: "", url: "", token: 0, timer: null };

    /* ---------------------------------------------------------------
       Pembentuk data QR
       --------------------------------------------------------------- */
    function escapeWifi(s) { return s.replace(/([\\;,:"])/g, "\\$1"); }
    function escapeVcard(s) {
        return s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
    }

    // Menormalkan nomor ke format internasional tanpa "+" (contoh: 0812... -> 62812...)
    function normalizePhone(raw) {
        var trimmed = raw.trim();
        var digits = trimmed.replace(/\D/g, "");
        if (!digits) return "";
        if (trimmed.charAt(0) === "+") return digits;
        if (digits.indexOf("00") === 0) return digits.slice(2);
        if (digits.charAt(0) === "0") return "62" + digits.slice(1);
        return digits;
    }
    function isValidPhone(digits) { return digits.length >= 8 && digits.length <= 15; }

    // Mengembalikan { payload, label } atau null jika data belum lengkap/valid
    function build(type) {
        var v;
        if (type === "text") {
            v = el.text.value.trim();
            return v ? { payload: v, label: v } : null;
        }

        if (type === "wifi") {
            var ssid = el.wifiSsid.value.trim();
            if (!ssid) return null;
            var enc = el.wifiType.value;
            var pass = el.wifiPass.value;
            var payload = "WIFI:S:" + escapeWifi(ssid) + ";T:" + enc + ";";
            if (enc !== "nopass") payload += "P:" + escapeWifi(pass) + ";";
            payload += ";";
            return { payload: payload, label: "Wi-Fi: " + ssid };
        }

        if (type === "vcard") {
            var name = el.vName.value.trim();
            var phone = el.vPhone.value.trim();
            var email = el.vEmail.value.trim();
            var company = el.vCompany.value.trim();
            if (!name && !phone) return null;
            var lines = ["BEGIN:VCARD", "VERSION:3.0"];
            lines.push("N:;" + escapeVcard(name || phone) + ";;;");
            lines.push("FN:" + escapeVcard(name || phone));
            if (phone) lines.push("TEL;TYPE=CELL:" + phone.replace(/[^\d+]/g, ""));
            if (email) lines.push("EMAIL:" + escapeVcard(email));
            if (company) lines.push("ORG:" + escapeVcard(company));
            lines.push("END:VCARD");
            return { payload: lines.join("\n"), label: "Kontak: " + (name || phone) };
        }

        if (type === "whatsapp") {
            var num = normalizePhone(el.waNumber.value);
            if (!isValidPhone(num)) return null;
            var msg = el.waMessage.value.trim();
            var link = "https://wa.me/" + num + (msg ? "?text=" + encodeURIComponent(msg) : "");
            return { payload: link, label: "WhatsApp: +" + num };
        }
        return null;
    }

    /* ---------------------------------------------------------------
       Render kartu & QR
       --------------------------------------------------------------- */
    function setError(msg) {
        el.error.hidden = !msg;
        el.error.textContent = msg || "";
    }

    function setExportEnabled(enabled) {
        el.btnPng.disabled = !enabled;
        el.btnPrint.disabled = !enabled;
    }

    function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

    function fillSlot(node, value) {
        if (value) {
            node.textContent = value;
            node.classList.remove("is-placeholder");
        } else {
            node.textContent = node.getAttribute("data-ph");
            node.classList.add("is-placeholder");
        }
    }

    function updateCard() {
        fillSlot(el.cardTitle, el.title.value.trim());
        fillSlot(el.cardSub, el.subtitle.value.trim());
        fillSlot(el.cardFoot, el.footer.value.trim());

        var showData = el.toggleData.checked && !!state.label && el.card.classList.contains("has-qr");
        el.cardData.hidden = !showData;
        el.cardData.textContent = showData ? truncate(state.label, 160) : "";
    }

    function clearQR() {
        state.token++;
        state.url = "";
        state.label = "";
        el.img.removeAttribute("src");
        el.card.classList.remove("has-qr", "is-loading");
        setExportEnabled(false);
        updateCard();
    }

    // Kontras warna: QR sulit dipindai jika pola tidak jauh lebih gelap dari latar
    function luminance(hex) {
        var c = [1, 3, 5].map(function (i) {
            var v = parseInt(hex.substr(i, 2), 16) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    function checkContrast() {
        var a = luminance(el.dark.value);
        var b = luminance(el.light.value);
        var ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        var bad = a >= b || ratio < 3;
        el.contrast.hidden = !bad;
    }

    function syncPresets() {
        el.presets.forEach(function (btn) {
            var on = btn.getAttribute("data-dark").toLowerCase() === el.dark.value.toLowerCase() &&
                     btn.getAttribute("data-light").toLowerCase() === el.light.value.toLowerCase();
            btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
    }

    function generate() {
        clearTimeout(state.timer);
        checkContrast();
        syncPresets();

        var data = build(state.type);
        if (!data) { clearQR(); return; }

        var dark = el.dark.value.replace("#", "");
        var light = el.light.value.replace("#", "");
        var url = QR_API + "?size=" + el.size.value +
            "&data=" + encodeURIComponent(data.payload) +
            "&color=" + dark + "&bgcolor=" + light + "&ecc=M&format=png";

        if (url.length > MAX_URL_LENGTH) {
            clearQR();
            setError("Isi terlalu panjang untuk dijadikan QR Code. Persingkat teks atau link Anda.");
            return;
        }
        setError(null);

        state.label = data.label;
        if (url === state.url && el.img.getAttribute("src")) { updateCard(); return; }

        state.url = url;
        var token = ++state.token;
        el.card.classList.add("is-loading");
        setExportEnabled(false);

        el.img.onload = function () {
            if (token !== state.token) return;
            el.card.classList.remove("is-loading");
            el.card.classList.add("has-qr");
            setExportEnabled(true);
            updateCard();
        };
        el.img.onerror = function () {
            if (token !== state.token) return;
            el.card.classList.remove("is-loading", "has-qr");
            setExportEnabled(false);
            KQR.toast("Gagal memuat QR Code. Periksa koneksi internet Anda.", "error");
        };
        el.img.src = url;
        updateCard();
    }

    // Parameter dibaca dari query (?a=b) dan dari hash (#a=b). Hash lebih andal karena
    // tidak dikirim ke server dan tidak hilang saat hosting melakukan redirect.
    function readParams() {
        var params = new URLSearchParams(window.location.search);
        var hash = window.location.hash.replace(/^#/, "");
        if (hash.indexOf("=") !== -1) {
            new URLSearchParams(hash).forEach(function (value, key) { params.set(key, value); });
        }
        return params;
    }

    // Menerima "d81b60" atau "#d81b60"; mengembalikan "#d81b60" atau null
    function cleanHex(v) {
        v = (v || "").replace(/^#/, "");
        return /^[0-9a-f]{6}$/i.test(v) ? "#" + v.toLowerCase() : null;
    }

    function schedule() {
        clearTimeout(state.timer);
        state.timer = setTimeout(generate, 250);
    }

    /* ---------------------------------------------------------------
       Interaksi
       --------------------------------------------------------------- */
    function switchType(type) {
        if (TYPES.indexOf(type) === -1) type = "text";
        state.type = type;
        el.chips.forEach(function (chip) {
            chip.setAttribute("aria-pressed", chip.getAttribute("data-qr-type") === type ? "true" : "false");
        });
        TYPES.forEach(function (t) {
            $("form-" + t).classList.toggle("is-active", t === type);
        });
        setError(null);
        generate();
    }

    function applyPreset(btn) {
        el.dark.value = btn.getAttribute("data-dark");
        el.light.value = btn.getAttribute("data-light");
        generate();
        KQR.toast("Palet warna diterapkan");
    }

    function resetAll() {
        var form = $("qr-form");
        if (form) form.reset();
        [el.title, el.subtitle, el.footer].forEach(function (i) { i.value = ""; });
        el.dark.value = DEFAULTS.dark;
        el.light.value = DEFAULTS.light;
        el.size.value = DEFAULTS.size;
        el.toggleData.checked = true;
        setError(null);
        generate();
        KQR.toast("Form dan pengaturan berhasil direset");
    }

    function pasteFromClipboard() {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            KQR.toast("Browser belum mendukung tempel otomatis. Tempel manual dengan menekan lama / Ctrl+V.", "error");
            return;
        }
        navigator.clipboard.readText().then(function (text) {
            el.text.value = text.trim();
            switchType("text");
            KQR.toast("Teks berhasil ditempel");
        }).catch(function () {
            KQR.toast("Tidak bisa membaca clipboard. Izinkan akses atau tempel manual.", "error");
        });
    }

    function buildFileName() {
        var base = el.title.value.trim() || state.label || "QR_Code";
        base = base.replace(/^https?:\/\//i, "").replace(/[\/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_");
        if (base.length > 30) base = base.slice(0, 30);
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, "0"); };
        var stamp = p(d.getDate()) + "-" + p(d.getMonth() + 1) + "-" + d.getFullYear() +
            "_" + p(d.getHours()) + "-" + p(d.getMinutes()) + "-" + p(d.getSeconds());
        return (base || "QR_Code") + "_" + stamp + ".png";
    }

    function downloadPNG() {
        if (!el.card.classList.contains("has-qr")) {
            KQR.toast("Buat QR Code terlebih dahulu", "error");
            return;
        }
        var btn = el.btnPng;
        var original = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = "Menyiapkan…";

        function restore() { btn.innerHTML = original; btn.disabled = false; }

        KQR.loadScript(HTML2CANVAS).then(function () {
            // Skala dihitung agar lebar QR di gambar = resolusi yang dipilih (mis. 800px)
            var target = parseInt(el.size.value, 10) || 300;
            var shown = el.img.getBoundingClientRect().width || 240;
            var scale = Math.min(5, Math.max(1, target / shown));

            return window.html2canvas(el.card, {
                useCORS: true,
                scale: scale,
                backgroundColor: "#ffffff",
                logging: false,
                onclone: function (doc) {
                    // Placeholder hanya panduan di layar; tidak ikut masuk ke gambar
                    doc.querySelectorAll(".is-placeholder").forEach(function (n) { n.remove(); });
                    var c = doc.getElementById("qr-card");
                    if (c) c.style.boxShadow = "none";
                }
            });
        }).then(function (canvas) {
            canvas.toBlob(function (blob) {
                if (!blob) { restore(); KQR.toast("Gagal membuat gambar PNG.", "error"); return; }
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = buildFileName();
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
                restore();
                KQR.toast("Kartu QR berhasil diunduh sebagai PNG");
            }, "image/png");
        }).catch(function () {
            restore();
            KQR.toast("Gagal mengunduh PNG. Periksa koneksi internet lalu coba lagi.", "error");
        });
    }

    function printCard() {
        if (!el.card.classList.contains("has-qr")) {
            KQR.toast("Buat QR Code terlebih dahulu", "error");
            return;
        }
        window.print();
    }

    /* ---------------------------------------------------------------
       Inisialisasi
       --------------------------------------------------------------- */
    function init() {
        if (!$("qr-card")) return;

        el = {
            card: $("qr-card"), img: $("qr-img"), error: $("qr-error"),
            cardTitle: $("card-title"), cardSub: $("card-sub"), cardData: $("card-data"), cardFoot: $("card-foot"),
            text: $("input-text"),
            wifiSsid: $("wifi-ssid"), wifiPass: $("wifi-password"), wifiType: $("wifi-type"),
            vName: $("vcard-name"), vPhone: $("vcard-phone"), vEmail: $("vcard-email"), vCompany: $("vcard-company"),
            waNumber: $("wa-number"), waMessage: $("wa-message"),
            title: $("edit-title"), subtitle: $("edit-subtitle"), footer: $("edit-footer"), toggleData: $("toggle-data"),
            dark: $("qr-color-dark"), light: $("qr-color-light"), size: $("qr-size"), contrast: $("contrast-warning"),
            btnPng: $("btn-png"), btnPrint: $("btn-print"),
            chips: Array.prototype.slice.call(document.querySelectorAll("[data-qr-type]")),
            presets: Array.prototype.slice.call(document.querySelectorAll("[data-preset]"))
        };

        // Input yang memengaruhi isi QR (debounce agar tidak membanjiri API)
        [el.text, el.wifiSsid, el.wifiPass, el.vName, el.vPhone, el.vEmail, el.vCompany, el.waNumber, el.waMessage]
            .forEach(function (i) { i.addEventListener("input", function () { setError(null); schedule(); }); });
        [el.wifiType, el.size].forEach(function (i) { i.addEventListener("change", generate); });
        [el.dark, el.light].forEach(function (i) { i.addEventListener("input", schedule); });

        // Input label kartu (tidak perlu memanggil API)
        [el.title, el.subtitle, el.footer].forEach(function (i) { i.addEventListener("input", updateCard); });
        el.toggleData.addEventListener("change", updateCard);

        // Validasi nomor WhatsApp saat selesai mengetik
        el.waNumber.addEventListener("blur", function () {
            var raw = el.waNumber.value.trim();
            if (raw && !isValidPhone(normalizePhone(raw))) {
                el.waNumber.setAttribute("aria-invalid", "true");
                setError("Nomor WhatsApp tidak valid. Contoh: 08123456789 atau 628123456789.");
            }
        });
        el.waNumber.addEventListener("input", function () { el.waNumber.removeAttribute("aria-invalid"); });

        el.chips.forEach(function (chip) {
            chip.addEventListener("click", function () { switchType(chip.getAttribute("data-qr-type")); });
        });
        el.presets.forEach(function (btn) {
            btn.addEventListener("click", function () { applyPreset(btn); });
        });

        $("btn-paste").addEventListener("click", pasteFromClipboard);
        $("btn-reset").addEventListener("click", resetAll);
        el.btnPng.addEventListener("click", downloadPNG);
        el.btnPrint.addEventListener("click", printCard);
        $("qr-form").addEventListener("submit", function (e) { e.preventDefault(); });

        // Parameter URL (dipakai tombol di website lain, lihat integrasi.html):
        // ?data= (atau url/text/link)  &title=  &subtitle=  &footer=  &color=RRGGBB  &bg=RRGGBB  &type=
        var params = readParams();
        var type = params.get("type");
        var external = params.get("data") || params.get("url") || params.get("text") || params.get("link");
        if (external) el.text.value = external.slice(0, 1000);
        el.title.value = (params.get("title") || "").slice(0, 80);
        el.subtitle.value = (params.get("subtitle") || "").slice(0, 120);
        el.footer.value = (params.get("footer") || "").slice(0, 120);
        var c1 = cleanHex(params.get("color"));
        var c2 = cleanHex(params.get("bg"));
        if (c1) el.dark.value = c1;
        if (c2) el.light.value = c2;
        switchType(TYPES.indexOf(type) !== -1 ? type : "text");

        updateCard();
        checkContrast();
        syncPresets();
        setExportEnabled(false);
    }

    document.addEventListener("DOMContentLoaded", init);
})();
