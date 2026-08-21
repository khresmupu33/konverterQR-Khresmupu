       let currentQRUrl = "";
        let html5QrCode = null;
        let isCameraActive = false;
        let cropper = null;

        function switchTab(tab) {
            const buttons = document.querySelectorAll('.tab-btn');
            const contents = document.querySelectorAll('.tab-content');

            buttons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            contents.forEach(content => content.classList.remove('active'));

            if (tab === 'generate') {
                buttons[0].classList.add('active');
                buttons[0].setAttribute('aria-selected', 'true');
                document.getElementById('tab-generate').classList.add('active');
                stopCamera();
            } else {
                buttons[1].classList.add('active');
                buttons[1].setAttribute('aria-selected', 'true');
                document.getElementById('tab-scan').classList.add('active');
            }
        }

        function generateQR() {
            const inputVal = document.getElementById('input-text').value.trim();
            const resultWrapper = document.getElementById('generator-result-wrapper');
            const qrImg = document.getElementById('qr-img');
            const exportBtns = document.getElementById('export-buttons');

            if (!inputVal) {
                resultWrapper.style.display = "none";
                exportBtns.style.display = "none";
                qrImg.src = "";
                currentQRUrl = "";
                return;
            }

            currentQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inputVal)}`;
            qrImg.src = currentQRUrl;
            
            resultWrapper.style.display = "flex";
            exportBtns.style.display = "grid";

            updateCardPreview();
        }

        function updateCardPreview() {
            const inputVal = document.getElementById('input-text').value.trim();
            
            const customTitle = document.getElementById('edit-title').value.trim();
            const customSubtitle = document.getElementById('edit-subtitle').value.trim();
            const customFooter = document.getElementById('edit-footer').value.trim();
            const showUrl = document.getElementById('toggle-url-preview').checked;

            const renderTitle = document.getElementById('render-title');
            const renderSubtitle = document.getElementById('render-subtitle');
            const renderPreview = document.getElementById('qr-preview');
            const renderFooter = document.getElementById('render-footer');

            // Judul / Tempat
            if (customTitle !== "") {
                renderTitle.innerText = customTitle;
                renderTitle.classList.remove('is-placeholder');
            } else {
                renderTitle.innerText = "[ Posisi Judul / Nama Tempat ]";
                renderTitle.classList.add('is-placeholder');
            }

            // Sub-Judul
            if (customSubtitle !== "") {
                renderSubtitle.innerText = customSubtitle;
                renderSubtitle.classList.remove('is-placeholder');
                renderSubtitle.style.display = "block";
            } else {
                renderSubtitle.innerText = "[ Posisi Sub-Judul ]";
                renderSubtitle.classList.add('is-placeholder');
                renderSubtitle.style.display = "block";
            }

            // Preview URL
            if (showUrl && inputVal !== "") {
                renderPreview.innerText = inputVal;
                renderPreview.style.display = "block";
            } else {
                renderPreview.style.display = "none";
            }

            // Deskripsi / Catatan Bawah
            if (customFooter !== "") {
                renderFooter.innerText = customFooter;
                renderFooter.classList.remove('is-placeholder');
                renderFooter.style.display = "block";
            } else {
                renderFooter.innerText = "[ Posisi Deskripsi / Catatan Bawah ]";
                renderFooter.classList.add('is-placeholder');
                renderFooter.style.display = "block";
            }
        }

        async function pasteText() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('input-text').value = text;
                generateQR();
            } catch (err) {
                alert('Gagal membaca clipboard. Izinkan akses clipboard pada pengaturan browser Anda.');
            }
        }

        function resetForm() {
            document.getElementById('input-text').value = "";
            document.getElementById('edit-title').value = "";
            document.getElementById('edit-subtitle').value = "";
            document.getElementById('edit-footer').value = "";
            document.getElementById('toggle-url-preview').checked = true;
            generateQR();
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
            const inputVal = document.getElementById('input-text').value.trim();
            if (!inputVal) return;

            const renderTitle = document.getElementById('render-title');
            const renderSubtitle = document.getElementById('render-subtitle');
            const renderFooter = document.getElementById('render-footer');

            // Cek apakah elemen masih berupa placeholder
            const titleIsPlaceholder = renderTitle.classList.contains('is-placeholder');
            const subIsPlaceholder = renderSubtitle.classList.contains('is-placeholder');
            const footIsPlaceholder = renderFooter.classList.contains('is-placeholder');

            // Sembunyikan placeholder agar tidak ikut terunduh
            if (titleIsPlaceholder) renderTitle.style.display = "none";
            if (subIsPlaceholder) renderSubtitle.style.display = "none";
            if (footIsPlaceholder) renderFooter.style.display = "none";

            const cardElement = document.getElementById('qr-card-render');

            html2canvas(cardElement, {
                useCORS: true,
                scale: 2,
                backgroundColor: "#ffffff"
            }).then(canvas => {
                const image = canvas.toDataURL("image/png");
                const fileName = generateFileName(inputVal);

                const link = document.createElement('a');
                link.href = image;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Kembalikan ke tampilan semula setelah selesai diunduh
                if (titleIsPlaceholder) renderTitle.style.display = "block";
                if (subIsPlaceholder) renderSubtitle.style.display = "block";
                if (footIsPlaceholder) renderFooter.style.display = "block";
            }).catch(() => {
                if (titleIsPlaceholder) renderTitle.style.display = "block";
                if (subIsPlaceholder) renderSubtitle.style.display = "block";
                if (footIsPlaceholder) renderFooter.style.display = "block";
                alert("Terjadi kesalahan saat mengunduh gambar PNG.");
            });
        }

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
                        alert("QR Code tidak dapat terdeteksi. Silakan sesuaikan kembali area crop.");
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
                    alert("Akses kamera ditolak atau perangkat tidak mendukung.");
                    resetScanUI();
                });
            }
        }

        function stopCamera() {
            if (html5QrCode && isCameraActive) {
                html5QrCode.stop().then(() => {
                    document.getElementById('reader').style.display = "none";
                    document.getElementById('btn-camera').innerText = "📷 Buka Kamera Scan";
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
                alert("Hasil scan berhasil disalin ke clipboard!");
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

        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const externalData = urlParams.get('data') || urlParams.get('text') || urlParams.get('link');

            if (externalData) {
                document.getElementById('input-text').value = externalData;
            }

            generateQR();
        });