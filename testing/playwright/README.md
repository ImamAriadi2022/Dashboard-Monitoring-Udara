# Archtera - Playwright E2E & Functional Testing Suite

Direktori ini berisi seluruh suite pengujian fungsionalitas antarmuka pengguna (*End-to-End / Functional UI Testing*) untuk sistem **Archtera — Air Safe Area** menggunakan perkakas **Playwright**.

---

## 📁 Struktur Direktori Pengujian
* **`playwright.config.js`**: Konfigurasi global Playwright (baseURL, browser engines, viewport, timeouts, SSL ignore, dan report).
* **`tests/01_landing.spec.js`**: Skenario uji Landing Page (Hero, Live Widget, Indikator Kualitas Udara, Navigasi).
* **`tests/02_dashboard.spec.js`**: Skenario uji Dashboard 4 Ruangan (Tab Switching, Metrik Sensor, Range Filter 1d/7d/30d, Chart Canvas, Log Riwayat, Unduh CSV).
* **`tests/03_admin_crud.spec.js`**: Skenario uji Panel Admin (Daftar Record, Form Tambah Data, Edit, Hapus).
* **`tests/04_docs_navigation.spec.js`**: Skenario uji Navigasi Dokumen (/docs-all, /docs-arch, /docs-backend, /docs-postman, /docs-playwright, /docs-iot, /docs-vps).

---

## 🚀 Prosedur Instalasi & Setup Playwright

### 1. Masuk ke Direktori & Instal Dependensi
```bash
cd testing/playwright
npm install
```

### 2. Instal Browser Binaries Playwright
```bash
npx playwright install --with-deps
```

---

## ⚡ Eksekusi Pengujian

```bash
# Menjalankan seluruh pengujian (Headless mode)
npx playwright test

# Menjalankan pengujian dengan browser terlihat (Headed mode)
npx playwright test --headed

# Menjalankan pengujian dengan antarmuka grafis interaktif (UI Mode)
npx playwright test --ui

# Menjalankan pengujian khusus pada browser tertentu
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Menjalankan pengujian tampilan ponsel (Mobile Viewport)
npx playwright test --project="Mobile Chrome"
```

---

## 📊 Melihat Laporan Pengujian (HTML Report)
Setelah pengujian selesai, buka laporan grafis interaktif dengan:
```bash
npx playwright show-report
```

---

## 🌐 Dokumentasi Visual Interaktif
Spesifikasi skenario pengujian fungsional Playwright ini dapat diakses secara visual di web sistem pada rute:
👉 **`https://archtera.web.id/docs-playwright`** atau **`https://202.10.42.14/docs-playwright`**.
