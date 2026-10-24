# Dashboard Monitoring Kualitas Udara & Sirkulasi (RuangSehat IoT)

Sistem pemantauan kualitas udara dan sirkulasi ruangan berbasis **IoT (Internet of Things)** dan **Web Modern**, menggunakan **React.js** (Feature-based & Component-based Architecture) di sisi frontend dan **Node.js Express + MQTT** di sisi backend.

---

## 🏗️ Struktur Arsitektur Proyek

```
Dashboard-Monitoring-Udara/
├── backend/                         # Backend Server & API Bridge
│   ├── bridge.js                    # MQTT Subscriber (EMQX) & Express REST API
│   ├── air_data.db                  # Database lokal SQLite untuk riwayat sensor
│   └── package.json                 # Dependensi backend (express, mqtt, better-sqlite3)
│
├── frontend/                        # Aplikasi Frontend Modern (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/              # Shared / Reusable UI Components
│   │   │   ├── Navbar.jsx           # Header Navigasi Minimalis
│   │   │   ├── Footer.jsx           # Footer Proyek
│   │   │   └── StatusBadge.jsx      # Indikator Status Koneksi (LIVE / OFFLINE)
│   │   │
│   │   ├── features/                # Feature-Based Modules
│   │   │   ├── landing/             # 1. Feature: Landing Page
│   │   │   │   ├── components/
│   │   │   │   │   ├── HeroSection.jsx               # Hero & Tombol Buka Dashboard
│   │   │   │   │   ├── AirQualityOverviewSection.jsx # Detail Parameter & Tips Udara
│   │   │   │   │   ├── SensorsSection.jsx            # Spesifikasi Sensor & Aktuator
│   │   │   │   │   └── AboutSection.jsx              # Penjelasan Sistem & Baku Mutu
│   │   │   │   └── LandingPage.jsx                   # Kontainer Halaman Depan
│   │   │   │
│   │   │   └── dashboard/           # 2. Feature: Dashboard Telemetri
│   │   │       ├── roomsConfig.js   # Konfigurasi Ruangan (H5, H18, Seminar, H17)
│   │   │       ├── components/
│   │   │       │   ├── RoomSelector.jsx    # Dropdown Pemilih Ruangan
│   │   │       │   ├── Sidebar.jsx         # Sidebar Navigasi Berdasarkan Topik & Dropdown
│   │   │       │   ├── MetricCard.jsx      # Kartu Parameter Sensor Interaktif
│   │   │       │   ├── SensorChart.jsx     # Grafik Chart.js Real-time
│   │   │       │   ├── OverviewTab.jsx     # Topik 1: Ringkasan Sistem
│   │   │       │   ├── TempHumidTab.jsx    # Topik 2: Suhu & Kelembapan (DHT22)
│   │   │       │   ├── AirQualityTab.jsx   # Topik 3: Kualitas Gas & CO₂ (SGP30)
│   │   │       │   ├── CirculationTab.jsx  # Topik 4: Sirkulasi & Kipas (Anemometer & Relay)
│   │   │       │   └── HistoryLogsTab.jsx  # Topik 5: Log Riwayat & Ekspor CSV
│   │   │       ├── hooks/
│   │   │       │   └── useSensorData.js    # Custom Hook Polling & Status Telemetri
│   │   │       └── DashboardPage.jsx       # Kontainer Dashboard
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # Service API REST Backend
│   │   ├── theme/
│   │   │   └── designSystem.js      # Design System Tokens & Helper Classes
│   │   ├── App.jsx                  # Root App & State Navigasi
│   │   ├── main.jsx                 # Entrypoint React 19
│   │   └── index.css                # Styling Tailwind CSS Light Mode
│   └── package.json
│
├── Monitor_ruang_sehat.html         # Versi HTML Dashboard Lama (Legacy)
└── README.md
```

---

## 🏢 Dropdown Ruangan pada Dashboard

Tersedia pemilih ruangan interaktif dengan karakteristik pemantauan masing-masing:
1. **Ruang H5** (Ruang Kelas — Terhubung langsung ke data live hardware mikrokontroler)
2. **Ruang H18** (Laboratorium Komputer)
3. **Ruang Seminar** (Auditorium / Aula Kapasitas Besar)
4. **Ruang H17** (Ruang Dosen & Riset)

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Backend API
```bash
cd backend
npm start
```

### 2. Menjalankan Frontend React
```bash
cd frontend
npm run dev
```
Buka browser di `http://localhost:5173`.
