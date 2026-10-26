/* scanner.js — logika tab "Scan QR".
   Pustaka berat (html5-qrcode, Cropper.js) dimuat hanya saat pengguna benar-benar memakainya. */
(function () {
    "use strict";

    var KQR = window.KQR;
    if (!KQR) return;
    var $ = KQR.$;

    var LIB_QR = "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js";
    var LIB_CROP_JS = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js";
    var LIB_CROP_CSS = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css";
    var MAX_FILE_MB = 20;

    var el = {};
    var camScanner = null;
    var fileScanner = null;
    var cameraOn = false;
    var cameraBusy = false;
    var cropper = null;
    var cropObjectUrl = null;

    /* ---------------------------------------------------------------
       Helper
       --------------------------------------------------------------- */
    function loadQrLib() {
        return KQR.loadScript(LIB_QR).catch(function (err) {
            KQR.toast("Gagal memuat pemindai. Periksa koneksi internet Anda.", "error");
            throw err;
        });
    }

    // Mengembalikan URL aman (http/https) atau null jika teks bukan tautan
    function toSafeUrl(text) {
        var t = text.trim();
        if (!t || /\s/.test(t)) return null;
        try {
            if (/^https?:\/\//i.test(t)) return new URL(t).href;
            if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([\/?#].*)?$/i.test(t)) return new URL("https://" + t).href;
        } catch (e) { /* bukan URL valid */ }
        return null;
    }

    function detectKind(text) {
        if (toSafeUrl(text)) return "Tautan";
        if (/^WIFI:/i.test(text)) return "Jaringan Wi-Fi";
        if (/^BEGIN:VCARD/i.test(text)) return "Kontak (vCard)";
        if (/^(mailto:|tel:|sms:|smsto:)/i.test(text)) return "Email / Telepon / SMS";
        return "Teks";
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
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

    function cameraErrorMessage(err) {
        var name = err && (err.name || err.toString());
        var msg = String(name || "");
        if (/NotAllowed|Permission/i.test(msg)) return "Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser.";
        if (/NotFound|Devices/i.test(msg)) return "Kamera tidak ditemukan di perangkat ini.";
        if (/NotReadable|TrackStart/i.test(msg)) return "Kamera sedang dipakai aplikasi lain.";
        if (!window.isSecureContext) return "Kamera hanya bisa dipakai lewat koneksi aman (HTTPS).";
        return "Tidak bisa membuka kamera. Coba unggah gambar QR sebagai gantinya.";
    }

    /* ---------------------------------------------------------------
       Hasil
       --------------------------------------------------------------- */
    function showResult(text) {
        closeCropper();
        el.resultText.textContent = text;
        el.resultKind.textContent = detectKind(text);

        var url = toSafeUrl(text);
        if (url) {
            el.btnOpen.href = url;
            el.btnOpen.hidden = false;
        } else {
            el.btnOpen.hidden = true;
            el.btnOpen.removeAttribute("href");
        }
        el.result.hidden = false;
        el.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* abaikan */ } }
    }

    /* ---------------------------------------------------------------
       Upload gambar -> auto scan -> fallback crop
       --------------------------------------------------------------- */
    function closeCropper() {
        if (cropper) { cropper.destroy(); cropper = null; }
        if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); cropObjectUrl = null; }
        el.cropBox.hidden = true;
        el.cropImg.removeAttribute("src");
    }

    function openCropper(file) {
        Promise.all([KQR.loadStyle(LIB_CROP_CSS), KQR.loadScript(LIB_CROP_JS)]).then(function () {
            closeCropper();
            cropObjectUrl = URL.createObjectURL(file);
            el.cropImg.onload = function () {
                if (cropper) cropper.destroy();
                cropper = new window.Cropper(el.cropImg, {
                    viewMode: 1,
                    autoCropArea: 0.8,
                    responsive: true,
                    background: false
                });
            };
            el.cropImg.src = cropObjectUrl;
            el.cropBox.hidden = false;
            el.cropBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
            KQR.toast("QR belum terbaca otomatis. Pilih area QR lalu tekan “Crop & Scan”.");
        }).catch(function () {
            KQR.toast("QR Code tidak terdeteksi pada gambar ini.", "error");
        });
    }

    function handleFile(file) {
        if (!file) return;
        if (!/^image\//.test(file.type)) {
            KQR.toast("File harus berupa gambar (PNG, JPG, WEBP).", "error");
            return;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            KQR.toast("Ukuran gambar maksimal " + MAX_FILE_MB + " MB.", "error");
            return;
        }
        stopCamera();
        el.result.hidden = true;
        closeCropper();

        var scanning = loadQrLib().then(function () {
            if (!fileScanner) fileScanner = new window.Html5Qrcode("reader-file", false);
            return fileScanner.scanFile(file, false).then(
                function (text) { showResult(text); },
                function () { openCropper(file); }
            );
        });
        scanning.catch(function () { /* pesan error sudah ditampilkan oleh loadQrLib */ });
    }

    function cropAndScan() {
        if (!cropper) return;
        var canvas = cropper.getCroppedCanvas({ maxWidth: 2000, maxHeight: 2000, imageSmoothingQuality: "high" });
        if (!canvas) { KQR.toast("Pilih area gambar terlebih dahulu.", "error"); return; }
        canvas.toBlob(function (blob) {
            if (!blob) { KQR.toast("Gagal memproses gambar.", "error"); return; }
            var file = new File([blob], "cropped_qr.png", { type: "image/png" });
            fileScanner.scanFile(file, false).then(showResult).catch(function () {
                KQR.toast("QR Code tidak terdeteksi. Sesuaikan area crop lalu coba lagi.", "error");
            });
        }, "image/png");
    }

    /* ---------------------------------------------------------------
       Kamera
       --------------------------------------------------------------- */
    function setCameraButton(on) {
        el.btnCamera.querySelector("[data-label]").textContent = on ? "Tutup kamera" : "Buka kamera";
        el.btnCamera.classList.toggle("btn-primary", on);
        el.btnCamera.classList.toggle("btn-secondary", !on);
    }

    function startCamera() {
        if (cameraBusy || cameraOn) return;
        cameraBusy = true;
        el.btnCamera.disabled = true;

        loadQrLib().then(function () {
            el.result.hidden = true;
            closeCropper();
            if (!camScanner) camScanner = new window.Html5Qrcode("reader", false);
            el.reader.hidden = false;

            return camScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: function (w, h) {
                        var s = Math.max(120, Math.floor(Math.min(w, h) * 0.7));
                        return { width: s, height: s };
                    }
                },
                function (text) { showResult(text); stopCamera(); },
                function () { /* frame tanpa QR: abaikan */ }
            );
        }).then(function () {
            cameraOn = true;
            setCameraButton(true);
        }).catch(function (err) {
            el.reader.hidden = true;
            cameraOn = false;
            setCameraButton(false);
            if (err && !/Gagal memuat/.test(err.message || "")) KQR.toast(cameraErrorMessage(err), "error");
        }).then(function () {
            cameraBusy = false;
            el.btnCamera.disabled = false;
        });
    }

    function stopCamera() {
        if (!camScanner || !cameraOn) return Promise.resolve();
        cameraOn = false;
        return camScanner.stop().catch(function () { /* sudah berhenti */ }).then(function () {
            try { camScanner.clear(); } catch (e) { /* abaikan */ }
            el.reader.hidden = true;
            setCameraButton(false);
        });
    }

    function toggleCamera() {
        if (cameraOn) stopCamera(); else startCamera();
    }

    /* ---------------------------------------------------------------
       Reset
       --------------------------------------------------------------- */
    function resetScan() {
        stopCamera();
        closeCropper();
        el.result.hidden = true;
        el.fileInput.value = "";
    }

    /* ---------------------------------------------------------------
       Inisialisasi
       --------------------------------------------------------------- */
    function init() {
        if (!$("panel-scan")) return;

        el = {
            fileInput: $("qr-file-input"), dropzone: $("dropzone"),
            btnCamera: $("btn-camera"), reader: $("reader"),
            cropBox: $("crop-box"), cropImg: $("image-to-crop"),
            result: $("scan-result"), resultText: $("scan-result-text"), resultKind: $("scan-kind"),
            btnOpen: $("btn-open-url")
        };

        el.fileInput.addEventListener("change", function () {
            handleFile(el.fileInput.files && el.fileInput.files[0]);
            el.fileInput.value = ""; // izinkan memilih file yang sama lagi
        });

        ["dragenter", "dragover"].forEach(function (evt) {
            el.dropzone.addEventListener(evt, function (e) { e.preventDefault(); el.dropzone.classList.add("is-over"); });
        });
        ["dragleave", "drop"].forEach(function (evt) {
            el.dropzone.addEventListener(evt, function (e) { e.preventDefault(); el.dropzone.classList.remove("is-over"); });
        });
        el.dropzone.addEventListener("drop", function (e) {
            handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
        });

        el.btnCamera.addEventListener("click", toggleCamera);
        $("btn-crop-scan").addEventListener("click", cropAndScan);
        $("btn-crop-cancel").addEventListener("click", closeCropper);
        $("btn-scan-again").addEventListener("click", resetScan);
        $("btn-copy").addEventListener("click", function () {
            copyText(el.resultText.textContent).then(
                function () { KQR.toast("Hasil scan berhasil disalin"); },
                function () { KQR.toast("Gagal menyalin. Salin manual dari kotak hasil.", "error"); }
            );
        });

        // Matikan kamera saat halaman ditutup / tab browser disembunyikan
        document.addEventListener("visibilitychange", function () { if (document.hidden) stopCamera(); });
        window.addEventListener("pagehide", function () { stopCamera(); });
    }

    KQR.scanner = { stopCamera: stopCamera, reset: resetScan };
    document.addEventListener("DOMContentLoaded", init);
})();
