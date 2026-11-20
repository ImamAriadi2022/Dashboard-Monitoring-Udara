# Pengujian Latensi & Performa REST API (Grafana k6)

Folder ini berisi skrip pengujian performa/latensi **Grafana k6**, generator laporan visual HTML/PNG siap dokumentasi Skripsi, dan hasil laporan aktual terhadap sistem **Archtera Air Safe Area**.

---

## 📁 Struktur Berkas

| Berkas | Fungsi |
| :--- | :--- |
| [`latency-suite.js`](./latency-suite.js) | Skrip utama k6 berisi **4 skenario beban berurutan**: Baseline (`1 VU`), Live Polling (`15 VU`), Analytics & Logs Load (`0 -> 25 VU`), dan Spike Test (`5 -> 40 VU`) pada `https://archtera.web.id/api`. |
| [`crud-isolated.js`](./crud-isolated.js) | Skrip k6 khusus operasi tulis CRUD (`POST`, `PUT`, `DELETE`) dengan pembersihan otomatis, dijalankan pada backend lokal/database terisolasi agar tidak mencemari database produksi. |
| [`run-crud-isolated.js`](./run-crud-isolated.js) | Runner otomatis Node.js yang menyalin database sementara, menyalakan Express di port `3318`, mengeksekusi `crud-isolated.js`, lalu membersihkan berkas sementara. |
| [`generate-report.js`](./generate-report.js) | Skrip Node.js untuk mengompilasi JSON hasil `k6` (`latency-summary.json`, `crud-summary.json`) dan log terminal menjadi **HTML Visual Report** serta **4 Screenshot PNG resolusi tinggi (`2x DPI`)**. |
| [`generate-flowchart.js`](./generate-flowchart.js) | Skrip Node.js untuk merender **Diagram Alur Prosedur Pengujian (`00_diagram_alur_pengujian_k6.png`)** resolusi tinggi (`2x DPI`). |
| [`generate_docx.py`](./generate_docx.py) | Skrip Python (`python-docx`) untuk menyusun laporan Bab IV Skripsi dalam format Microsoft Word (`.docx`) lengkap dengan tabel terformat, margin A4 4-3-3-3 cm, dan gambar tersemat. |
| [`LAPORAN_PENGUJIAN_LATENSI_k6.docx`](./LAPORAN_PENGUJIAN_LATENSI_k6.docx) | **Dokumen Microsoft Word siap cetak/tempel untuk Bab IV Skripsi** (Times New Roman 12 pt, spasi 1.5, lengkap dengan tabel & 5 gambar). |
| [`LAPORAN_PENGUJIAN_LATENSI.md`](./LAPORAN_PENGUJIAN_LATENSI.md) | Dokumen laporan versi Markdown & tabel analisis lengkap siap dikutip ke Bab IV Skripsi. |
| `reports/` | Menyimpan raw JSON summary, log CLI terminal (`k6-terminal-output.txt`), `laporan-latensi-k6.html`, dan folder `screenshots/`. |

---

## ▶️ Cara Menjalankan Ulang Pengujian

### 1. Menjalankan Skrip Utama ke Server Live VPS (`https://archtera.web.id/api`)
```bash
k6 run --summary-export=testing/k6/reports/latency-summary.json testing/k6/latency-suite.js
```
Jika ingin menguji ke backend **lokal** (`http://localhost:3000`):
```bash
k6 run -e BASE_URL=http://localhost:3000 --summary-export=testing/k6/reports/latency-summary.json testing/k6/latency-suite.js
```

### 2. Menjalankan Pengujian CRUD pada Backend Lokal Terisolasi
Cukup jalankan runner otomatis berikut (membuat salinan database sementara di folder `temp` sistem dan menutupnya kembali saat selesai):
```bash
node testing/k6/run-crud-isolated.js
```

### 3. Membuat Ulang Laporan HTML, Screenshot PNG, Diagram Alur, & File Word (`.docx`)
```bash
node testing/k6/generate-report.js
node testing/k6/generate-flowchart.js
python testing/k6/generate_docx.py
```
Screenshot siap tempel akan tersimpan di `testing/k6/reports/screenshots/`, dan dokumen Word siap Skripsi di [`LAPORAN_PENGUJIAN_LATENSI_k6.docx`](./LAPORAN_PENGUJIAN_LATENSI_k6.docx).
