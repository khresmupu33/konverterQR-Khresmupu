# konverterQR Khresmupu

Generator dan scanner QR Code gratis (Link/Teks, Wi-Fi, vCard, WhatsApp). Situs statis: HTML, CSS, dan JavaScript murni tanpa build step.

## Struktur folder

```text
.
├── index.html                  # Beranda (landing page + FAQ)
├── tools.html                  # Tools: Buat QR & Scan QR
├── integrasi.html              # Dokumentasi: pasang tombol QR di website lain
├── 404.html                    # Halaman 404 (noindex)
├── favicon.ico
├── site.webmanifest            # Metadata PWA / ikon
├── robots.txt                  # Aturan crawler + lokasi sitemap
├── sitemap.xml                 # Daftar URL untuk Google
├── google395259613be6fb9e.html # Verifikasi Google Search Console (jangan dihapus)
├── _headers                    # Header keamanan & cache (Netlify)
├── _redirects                  # Redirect (Netlify)
└── assets/
    ├── css/
    │   ├── tokens.css          # Warna, radius, bayangan (tema terang/gelap)
    │   ├── base.css            # Reset, tipografi, aksesibilitas
    │   ├── layout.css          # Container, header, footer
    │   ├── components.css      # Tombol, form, tab, accordion, toast
    │   ├── pages.css           # Gaya khusus beranda, tools, 404
    │   └── print.css           # Gaya cetak (hanya kartu QR yang dicetak)
    ├── js/
    │   ├── theme-init.js       # Set tema sebelum render (tanpa kilat)
    │   ├── common.js           # Toast, tema, menu mobile, loader pustaka
    │   ├── embed.js            # Script publik untuk website LAIN (tombol Buat QR Code)
    │   ├── integrasi.js        # Builder kode & tombol salin di integrasi.html
    │   ├── generator.js        # Tab "Buat QR"
    │   ├── scanner.js          # Tab "Scan QR" (kamera, upload, crop)
    │   └── tools.js            # Tab utama + routing #scan
    └── img/                    # Favicon (logo), ikon aplikasi, gambar OG, ilustrasi hero
```

## Cara mengembangkan

- Ubah warna/tema di `assets/css/tokens.css`.
- Jalankan lokal dengan server statis, misalnya `python3 -m http.server 8000`, lalu buka `http://localhost:8000`.
- Setelah mengubah CSS/JS, naikkan angka `?v=5` pada tag `<link>`/`<script>` di setiap HTML agar cache browser diperbarui.
- Parameter URL di `tools.html`: `?type=wifi|vcard|whatsapp|text`, `?data=<teks>` (alias `url`), `&title=`, `&subtitle=`, `&footer=`, `&color=RRGGBB`, `&bg=RRGGBB`, dan `#scan` untuk membuka tab scan. Parameter yang sama juga bisa ditaruh setelah `#` (mis. `tools.html#data=...&title=...`); bentuk ini dipakai `embed.js` karena tidak hilang oleh redirect hosting.

## Integrasi ke website lain

Website lain cukup menempel dua baris ini (di dalam `<body>`):

```html
<script src="https://konverterqr-khresmupu.netlify.app/assets/js/embed.js"
        data-title="Toko Berkah Jaya" data-subtitle="Scan untuk lihat menu" defer></script>
```

Tombol "Buat QR Code" muncul, dan saat diklik Tools terbuka dengan form terisi. Pengunjung tinggal klik Unduh PNG atau Cetak / PDF. Dokumentasi lengkap, tabel atribut, dan builder kode ada di `integrasi.html`. Tiga cara pemasangan: script otomatis, link biasa, atau tombol buatan sendiri (`data-kqr`).

Catatan: `embed.js` mengambil domain dari alamat file-nya sendiri, sehingga tidak perlu diubah jika domain berpindah. Namun contoh kode statis di `integrasi.html` dan snippet builder memakai domain dari `<link rel="canonical">`.

## SEO

- Domain kanonis: `https://konverterqr-khresmupu.netlify.app`. Jika domain berubah, ganti di `index.html`, `tools.html`, `sitemap.xml`, `robots.txt`, dan `site.webmanifest`.
- Setiap halaman memiliki title, description, canonical, Open Graph, Twitter Card, dan JSON-LD (WebSite, FAQPage, WebApplication, BreadcrumbList).
- Setelah deploy: kirim `sitemap.xml` di Google Search Console, lalu minta pengindeksan untuk `/` dan `/tools.html`.

## Pustaka eksternal (dimuat hanya saat dibutuhkan)

| Pustaka | Fungsi | Dimuat saat |
|---|---|---|
| QR Server API | Merender gambar QR | QR dibuat |
| html2canvas 1.4.1 | Ekspor kartu ke PNG | Klik Unduh PNG |
| html5-qrcode 2.3.8 | Scan kamera / gambar | Membuka kamera atau mengunggah gambar |
| Cropper.js 1.5.13 | Crop gambar QR | Scan otomatis gagal |

## Gambar QR

Ilustrasi hero (`qr-illustration.svg`), gambar OG (`og-image.png`), dan ikon aplikasi (`icon-192/512`, `icon-maskable-512`, `apple-touch-icon`) berisi QR Code asli yang mengarah ke `https://portofolio-khresmupu.netlify.app/` dan sudah diuji bisa dipindai. Favicon kecil (`favicon.svg`, `favicon-32.png`, `favicon.ico`) memakai logo sederhana karena QR tidak terbaca pada ukuran 16-32 px.
