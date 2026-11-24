# Archtera REST API - Postman Functional Testing Suite

Direktori ini berisi koleksi pengujian fungsionalitas otomatis (*functional testing suite*) menyeluruh untuk seluruh 8 route REST API dan 28 skenario operasional sistem **Archtera — Air Safe Area**.

---

## 📁 Berkas dalam Direktori
* **`Archtera_API_Functional_Testing.postman_collection.json`**: Berkas Postman Collection v2.1.0 resmi yang memuat seluruh 28 skenario pengujian dengan skrip assertion `pm.test` otomatis.
* **`generate_postman_collection.cjs`**: Skrip Node.js generator untuk memperbarui koleksi JSON jika terdapat penambahan endpoint atau skenario baru.

---

## 🎯 Ringkasan Skenario Pengujian (28 Kasus Uji)

| Folder Postman | Jumlah Request | Cakupan Pengujian |
| :--- | :---: | :--- |
| **01. Status & Health** | 6 | Health check sistem (`/status`) & telemetri terbaru per ruangan (`/latest?room=...`) |
| **02. Readings & Grafik Telemetri** | 8 | Agregasi deret waktu 1m, 15m, 30m, data mentah (`raw`), inkremental (`afterId`), dan list Admin (`DESC`) |
| **03. Log Riwayat Terpaginasi** | 6 | Paginasi server-side per ruangan (`h5`, `lab_td`, `lab_kom`, `seminar`), pencarian teks (`search`), dan riwayat lintas ruangan (`all`) |
| **04. Unduh Dataset CSV** | 5 | Ekspor file `text/csv` per ruangan (rentang 1d, 7d, 30d) dan backup seluruh database (`range=all`) |
| **05. CRUD Admin Data Sensor** | 3 | Siklus hidup data: `POST /readings` -> `PUT /readings/:id` -> `DELETE /readings/:id` |

---

## 🚀 Cara Menjalankan di Aplikasi Postman

1. Buka aplikasi **Postman** (Desktop atau Web).
2. Klik tombol **Import** di kiri atas.
3. Pilih berkas `Archtera_API_Functional_Testing.postman_collection.json`.
4. Periksa tab **Variables** pada koleksi:
   * `base_url`: `https://archtera.web.id/api` (default)
   * `ip_base_url`: `https://202.10.42.14/api` (jika menguji via IP VPS langsung)
5. Klik kanan pada koleksi -> **Run Collection** -> Klik **Run Archtera REST API...**.
6. Postman akan mengeksekusi ke-28 skenario secara otomatis dan memverifikasi seluruh kriteria assertion kelulusan (100% Pass).

---

## ⚡ Eksekusi Otomatis via Terminal (Newman CLI)

Anda juga dapat menjalankan pengujian langsung dari baris perintah menggunakan Newman:

```bash
# Instal newman jika belum ada
npm install -g newman

# Jalankan pengujian langsung
newman run testing/postman/Archtera_API_Functional_Testing.postman_collection.json --insecure
```

---

## 🌐 Dokumentasi Visual Interaktif
Dokumentasi visual interaktif lengkap dengan filter, pencarian, dan tombol salin cURL dapat diakses langsung pada halaman web sistem di rute:
👉 **`https://archtera.web.id/docs-postman`** atau **`https://202.10.42.14/docs-postman`**.
