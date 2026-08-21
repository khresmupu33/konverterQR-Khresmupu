let currentQRUrl = "";
let html5QrCode = null;
let isCameraActive = false;
let cropper = null;
let activeQrType = "text";

// Toast Notification
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Switch main tabs (Dua tab utama: Buat QR & Scan QR)
function switchTab(tab) {
    const buttons = document.querySelectorAll('.tab-container .tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    contents.forEach(content => content.classList.remove('active'));

    // Otomatis reset input/form dan QR saat berpindah tab utama
    resetForm();

    if (tab === 'generate') {
        buttons[0].classList.add('active');
        buttons[0].setAttribute('aria-selected', 'true');
        document.getElementById('tab-generate').classList.add('active');
        stopCamera();
    } else if (tab === 'scan') {
        buttons[1].classList.add('active');
        buttons[1].setAttribute('aria-selected', 'true');
        document.getElementById('tab-scan').classList.add('active');
    }
}

// Switch sub-type (Link, WiFi, vCard, WhatsApp) dengan fitur AUTO RESET OTOMATIS
function switchQrType(type) {
    activeQrType = type;
    const buttons = document.querySelectorAll('.type-btn');
    const forms = document.querySelectorAll('.type-form-block');

    buttons.forEach(btn => btn.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));

    // Temukan tombol yang sesuai dengan tipe
    const targetBtn = Array.from(buttons).find(b => b.getAttribute('onclick').includes(`'${type}'`));
    if (targetBtn) targetBtn.classList.add('active');
    
    document.getElementById(`form-type-${type}`).classList.add('active');

    // MERE-SET SEMUA INPUT & WARNA OTOMATIS SETIAP GANTI KE FITUR LAIN
    resetFormSilently();

    showToast(`Beralih ke mode: ${type.toUpperCase()}`);
}

// Apply Preset Color Palette
function applyColorPreset(darkColor, lightColor) {
    document.getElementById('qr-color-dark').value = darkColor;
    document.getElementById('qr-color-light').value = lightColor;
    generateQR();
    showToast("Palet warna berhasil diterapkan!");
}

// Toggle Advanced Color Options Panel
function toggleAdvancedOptions() {
    const panel = document.getElementById('advanced-options');
    const arrow = document.getElementById('adv-arrow');
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        arrow.innerText = '▼';
    } else {
        panel.style.display = 'block';
        arrow.innerText = '▲';
    }
}

// Build Special Data Structures
function buildSpecialQR(type) {
    let textResult = "";
    if (type === 'wifi') {
        const ssid = document.getElementById('wifi-ssid').value.trim();
        const pass = document.getElementById('wifi-password').value.trim();
        const enc = document.getElementById('wifi-type').value;
        if (ssid) {
            textResult = `WIFI:S:${ssid};T:${enc};P:${pass};;`;
        }
    } else if (type === 'vcard') {
        const name = document.getElementById('vcard-name').value.trim();
        const phone = document.getElementById('vcard-phone').value.trim();
        const email = document.getElementById('vcard-email').value.trim();
        const company = document.getElementById('vcard-company').value.trim();
        if (name || phone) {
            textResult = `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${company}\nEND:VCARD`;
        }
    } else if (type === 'whatsapp') {
        const phone = document.getElementById('wa-number').value.trim();
        const msg = encodeURIComponent(document.getElementById('wa-message').value.trim());
        if (phone) {
            textResult = `https://wa.me/${phone}?text=${msg}`;
        }
    }

    if (textResult) {
        generateQRFromText(textResult);
    } else {
        hideResultWrapper();
    }
}

function generateQR() {
    if (activeQrType !== 'text') {
        buildSpecialQR(activeQrType);
        return;
    }
    const inputVal = document.getElementById('input-text').value.trim();
    if (!inputVal) {
        hideResultWrapper();
        return;
    }
    generateQRFromText(inputVal);
}

// Update fungsi generateQRFromText[cite: 2]
function generateQRFromText(textVal) {
    const resultWrapper = document.getElementById('generator-result-wrapper');
    const qrImg = document.getElementById('qr-img');
    const exportBtns = document.getElementById('export-buttons');

    const darkColor = document.getElementById('qr-color-dark').value.replace('#', '');
    const lightColor = document.getElementById('qr-color-light').value.replace('#', '');
    const size = document.getElementById('qr-size-select').value;

    currentQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(textVal)}&color=${darkColor}&bgcolor=${lightColor}`;
    qrImg.src = currentQRUrl;

    resultWrapper.style.display = "flex";
    exportBtns.style.display = "grid";

    // TAMPILKAN TOMBOL ADVANCED SAAT QR BERHASIL DIBUAT
    setAdvancedToggleVisibility(true);

    updateCardPreview();
}

// Update fungsi hideResultWrapper[cite: 2]
function hideResultWrapper() {
    const resultWrapper = document.getElementById('generator-result-wrapper');
    const exportBtns = document.getElementById('export-buttons');
    const qrImg = document.getElementById('qr-img');

    resultWrapper.style.display = "none";
    exportBtns.style.display = "none";
    qrImg.src = "";
    currentQRUrl = "";

    // SEMBUNYIKAN TOMBOL ADVANCED SAAT QR KOSONG
    setAdvancedToggleVisibility(false);
}

function updateCardPreview() {
    let inputVal = "";
    if (activeQrType === 'text') {
        inputVal = document.getElementById('input-text').value.trim();
    } else {
        inputVal = "[ Format Spesial QR Terenkripsi ]";
    }

    const customTitle = document.getElementById('edit-title').value.trim();
    const customSubtitle = document.getElementById('edit-subtitle').value.trim();
    const customFooter = document.getElementById('edit-footer').value.trim();
    const showUrl = document.getElementById('toggle-url-preview').checked;

    const renderTitle = document.getElementById('render-title');
    const renderSubtitle = document.getElementById('render-subtitle');
    const renderPreview = document.getElementById('qr-preview');
    const renderFooter = document.getElementById('render-footer');

    if (customTitle !== "") {
        renderTitle.innerText = customTitle;
        renderTitle.classList.remove('is-placeholder');
    } else {
        renderTitle.innerText = "[ Posisi Judul / Nama Tempat / Toko ]";
        renderTitle.classList.add('is-placeholder');
    }

    if (customSubtitle !== "") {
        renderSubtitle.innerText = customSubtitle;
        renderSubtitle.classList.remove('is-placeholder');
        renderSubtitle.style.display = "block";
    } else {
        renderSubtitle.innerText = "[ Posisi Sub-Judul / Keterangan Promosi ]";
        renderSubtitle.classList.add('is-placeholder');
        renderSubtitle.style.display = "block";
    }

    if (showUrl && inputVal !== "") {
        renderPreview.innerText = inputVal;
        renderPreview.style.display = "block";
    } else {
        renderPreview.style.display = "none";
    }

    if (customFooter !== "") {
        renderFooter.innerText = customFooter;
        renderFooter.classList.remove('is-placeholder');
        renderFooter.style.display = "block";
    } else {
        renderFooter.innerText = "[ Posisi Deskripsi / Jam Operasional / Catatan Bawah ]";
        renderFooter.classList.add('is-placeholder');
        renderFooter.style.display = "block";
    }
}

async function pasteText() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('input-text').value = text;
        generateQR();
        showToast("Teks berhasil ditempel dari clipboard!");
    } catch (err) {
        showToast("Gagal membaca clipboard.");
    }
}

// Reset Silent tanpa Notifikasi
function resetFormSilently() {
    // Reset ketersediaan input teks/tautan
    const inputIds = [
        'input-text', 'wifi-ssid', 'wifi-password', 
        'vcard-name', 'vcard-phone', 'vcard-email', 'vcard-company', 
        'wa-number', 'wa-message', 'edit-title', 'edit-subtitle', 'edit-footer'
    ];
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // Reset warna dan pengaturan tingkat lanjut ke default
    document.getElementById('qr-color-dark').value = "#d81b60";
    document.getElementById('qr-color-light').value = "#ffffff";
    document.getElementById('qr-size-select').value = "300x300";
    document.getElementById('toggle-url-preview').checked = true;

    hideResultWrapper();
    updateCardPreview();
}

function resetForm() {
    resetFormSilently();
    showToast("Form dan Pengaturan Warna Berhasil Direset!");
}

function generateFileName(input) {
    const customTitle = document.getElementById('edit-title').value.trim();
    let baseName = customTitle !== "" ? customTitle : input.replace(/^https?:\/\//i, '');
    let cleanText = baseName.replace(/[\/\\?%*:|"<>]/g, '-').trim();
    if (cleanText.length > 30) cleanText = cleanText.substring(0, 30);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    return `${cleanText || 'QR_Code'}_${timestamp}.png`;
}

function downloadPNGCard() {
    const cardElement = document.getElementById('qr-card-render');
    const renderTitle = document.getElementById('render-title');
    const renderSubtitle = document.getElementById('render-subtitle');
    const renderFooter = document.getElementById('render-footer');

    const titleIsPlaceholder = renderTitle.classList.contains('is-placeholder');
    const subIsPlaceholder = renderSubtitle.classList.contains('is-placeholder');
    const footIsPlaceholder = renderFooter.classList.contains('is-placeholder');

    if (titleIsPlaceholder) renderTitle.style.display = "none";
    if (subIsPlaceholder) renderSubtitle.style.display = "none";
    if (footIsPlaceholder) renderFooter.style.display = "none";

    html2canvas(cardElement, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff"
    }).then(canvas => {
        const image = canvas.toDataURL("image/png");
        const fileName = generateFileName("QR_Code_Khresmupu");

        const link = document.createElement('a');
        link.href = image;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (titleIsPlaceholder) renderTitle.style.display = "block";
        if (subIsPlaceholder) renderSubtitle.style.display = "block";
        if (footIsPlaceholder) renderFooter.style.display = "block";
        showToast("Kartu QR berhasil diunduh sebagai PNG!");
    }).catch(() => {
        if (titleIsPlaceholder) renderTitle.style.display = "block";
        if (subIsPlaceholder) renderSubtitle.style.display = "block";
        if (footIsPlaceholder) renderFooter.style.display = "block";
        showToast("Terjadi kesalahan saat mengunduh PNG.");
    });
}

// CROP & SCAN LOGIC
function initCropImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const cropImg = document.getElementById('image-to-crop');
        cropImg.src = e.target.result;
        document.getElementById('crop-container').style.display = 'block';

        if (cropper) cropper.destroy();

        cropper = new Cropper(cropImg, {
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true
        });
    };
    reader.readAsDataURL(file);
}

function processCroppedImage() {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas();
    canvas.toBlob((blob) => {
        const croppedFile = new File([blob], "cropped_qr.png", { type: "image/png" });

        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }

        html5QrCode.scanFile(croppedFile, true)
            .then(qrCodeMessage => {
                displayScanResult(qrCodeMessage, 'upload');
                document.getElementById('crop-container').style.display = 'none';
            })
            .catch(() => {
                showToast("QR Code tidak terdeteksi. Sesuaikan kembali area crop.");
            });
    });
}

function toggleCamera() {
    const readerDiv = document.getElementById('reader');
    const btnCam = document.getElementById('btn-camera');
    const uploadWrapper = document.getElementById('upload-wrapper');

    if (isCameraActive) {
        stopCamera();
    } else {
        document.getElementById('crop-container').style.display = 'none';
        uploadWrapper.style.display = 'none';
        readerDiv.style.display = "block";
        btnCam.innerText = "🛑 Tutup Kamera";
        isCameraActive = true;

        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }

        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
                displayScanResult(decodedText, 'camera');
                stopCamera();
            },
            () => {}
        ).catch(() => {
            showToast("Akses kamera ditolak atau tidak didukung.");
            resetScanUI();
        });
    }
}

function stopCamera() {
    if (html5QrCode && isCameraActive) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = "none";
            document.getElementById('btn-camera').innerText = "📷 Buka Kamera Live Pemindai";
            isCameraActive = false;
        }).catch(err => console.error(err));
    }
}

function displayScanResult(text, mode) {
    const resultBox = document.getElementById('scan-result');
    const resultText = document.getElementById('scan-result-text');
    const btnOpenUrl = document.getElementById('btn-open-url');
    const btnCamera = document.getElementById('btn-camera');
    const uploadWrapper = document.getElementById('upload-wrapper');

    resultText.innerText = text;
    resultBox.style.display = "block";

    if (isValidURL(text)) {
        const formattedUrl = text.startsWith('http://') || text.startsWith('https://') ? text : 'https://' + text;
        btnOpenUrl.href = formattedUrl;
        btnOpenUrl.style.display = "inline-block";
    } else {
        btnOpenUrl.style.display = "none";
    }

    if (mode === 'upload') {
        btnCamera.style.display = 'none';
    } else if (mode === 'camera') {
        uploadWrapper.style.display = 'none';
    }
}

function isValidURL(string) {
    try {
        const url = new URL(string.startsWith('http') ? string : 'https://' + string);
        return url.hostname.includes('.');
    } catch {
        return false;
    }
}

function copyScanResult() {
    const text = document.getElementById('scan-result-text').innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Hasil scan berhasil disalin!");
    });
}

function resetScanUI() {
    stopCamera();
    document.getElementById('scan-result').style.display = "none";
    document.getElementById('crop-container').style.display = "none";
    document.getElementById('upload-wrapper').style.display = "block";
    document.getElementById('btn-camera').style.display = "flex";
    document.getElementById('qr-file-input').value = "";
    if (cropper) cropper.destroy();
}

// FAQ ACCORDION
function toggleAccordion(btn) {
    const body = btn.nextElementSibling;
    const icon = btn.querySelector('.acc-icon');
    if (body.style.display === "block") {
        body.style.display = "none";
        icon.innerText = "+";
    } else {
        body.style.display = "block";
        icon.innerText = "-";
    }
}

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const externalData = urlParams.get('data') || urlParams.get('text') || urlParams.get('link');

    if (externalData) {
        document.getElementById('input-text').value = externalData;
        generateQR();
    }
});



// Tambahkan fungsi pembantu untuk kontrol tampil/sembunyi tombol lanjutan
function setAdvancedToggleVisibility(visible) {
    const toggleWrapper = document.querySelector('.advanced-toggle-wrapper');
    const panel = document.getElementById('advanced-options');
    const arrow = document.getElementById('adv-arrow');

    if (toggleWrapper) {
        toggleWrapper.style.display = visible ? 'block' : 'none';
    }

    // Jika disembunyikan, tutup juga panel opsi lanjutan bila sedang terbuka
    if (!visible && panel) {
        panel.style.display = 'none';
        if (arrow) arrow.innerText = '▼';
    }
}
