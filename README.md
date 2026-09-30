# 📱 konverterQR Khresmupu

**konverterQR Khresmupu** adalah aplikasi pembuat (generator) dan pemindai (scanner) QR Code berbasis web *all-in-one* yang cepat, efisien, dan tampil estetis dengan tema warna serba *pink*. Aplikasi ini dirancang *responsive* agar nyaman digunakan baik di perangkat seluler (HP) maupun desktop.

---

## ✨ Fitur Utama

### 1. 🎨 Generator QR Code Instant
* **Real-time Generation:** QR Code langsung terbentuk secara otomatis saat Anda mengetik atau menempel (*paste*) teks/link.
* **Fitur Clipboard Fast-Paste:** Salin link lalu tekan tombol **📋 Paste** untuk mempercepat input.
* **URL Parameter Integration:** Mendukung pemuatan data awal via URL query string (contoh: `?data=https://example.com`, `?text=...`, atau `?link=...`).

### 2. 📥 Ekspor & Cetak Mudah
* **Unduh PNG Otomatis:** Menyimpan kartu QR Code sebagai gambar PNG lengkap dengan sistem penamaan file otomatis berdasarkan teks input dan stempel waktu (*timestamp*).
* **Unduh/Cetak PDF:** Tampilan khusus *Print Media Query* CSS yang dikustomisasi sehingga siap dicetak atau disimpan ke PDF dengan rapi tanpa elemen tombol/UI yang mengganggu.

### 3. 🔍 Pemindai (Scanner) QR Code
* **Scan via Kamera:** Mendukung pemindaian langsung menggunakan kamera bawaan perangkat (kamera belakang/environment).
* **Upload File & Crop Image:** Unggah gambar QR Code dari galeri dan gunakan fitur **Crop** bawaan (Cropper.js) untuk memperjelas area QR sebelum dipindai.
* **Deteksi URL Otomatis:** Menampilkan opsi **🌐 Buka Link** secara otomatis jika hasil pemindaian terdeteksi sebagai URL/link valid.
* **Salin Hasil Scan:** Menyalin teks/link hasil pemindaian ke clipboard hanya dengan satu klik.

---

## 🛠️ Teknologi & Pustaka yang Digunakan

Aplikasi ini dibuat murni menggunakan **HTML5, CSS3, dan JavaScript (Vanilla JS)** tanpa *framework* berat, serta memanfaatkan beberapa pustaka eksternal terpercaya:

* **[Google Fonts (Poppins)](https://fonts.google.com/specimen/Poppins):** Tipografi modern dan bersih.
* **[QR Server API](https://goqr.me/api/):** Layanan API cepat untuk me-render gambar QR Code.
* **[html5-qrcode](https://github.com/mebjas/html5-qrcode):** Untuk pemindaian QR Code via kamera dan pembacaan file gambar.
* **[Cropper.js](https://fengyuanchen.github.io/cropperjs/):** Pustaka interaktif untuk memotong (*crop*) gambar sebelum dipindai.
* **[html2canvas](https://html2canvas.hertzen.com/):** Konversi elemen DOM/HTML menjadi gambar canvas untuk proses ekspor ke PNG.

---

## 📁 Struktur Berkas Repositori

```text
.
├── index.html               # File utama HTML (mengandung CSS & JS terintegrasi)
├── KasKeuanganKhresmupu.png # Favicon / Icon OpenGraph
└── README.md                # Dokumentasi proyek
