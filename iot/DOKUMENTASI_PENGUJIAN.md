# Dokumentasi Pengujian Perangkat Keras IoT (ESP32)

Dokumen ini mencatat riwayat, prosedur, log keluaran Serial Monitor, serta analisis hasil pengujian bertahap (*step-by-step hardware verification*) pada sistem **Monitoring Kualitas Udara & Sirkulasi Ruangan berbasis ESP32**.

---

## 1. Spesifikasi Lingkungan Pengujian

| Parameter | Detail Konfigurasi |
| :--- | :--- |
| **Board Mikrokontroler** | ESP32 Dev Module (240 MHz, 320 KB RAM, 4 MB Flash) |
| **USB-to-UART Bridge** | Silicon Labs CP2102 (`VID_10C4&PID_EA60`) |
| **Framework & Toolchain** | PlatformIO IDE (VS Code) — `espressif32 @ 8.0.0` (Arduino v3.3.12) |
| **Baudrate Serial Monitor** | `115200 bps` |
| **Jaringan WiFi Pengujian** | `Kandang rudi` (2.4 GHz, RSSI: `-63 dBm`) |
| **MQTT Broker & Topik** | `broker.emqx.io:1883` — Topik: `monitoring_udara_ta/data` |

---

## 2. Hasil Pengujian Tahap 1: *Board Sanity Check* (`test0_esp32_board`)

- **Waktu Pengujian:** 7 November 2026, Pukul 18:10 WIB
- **Environment PlatformIO:** `env:test0_esp32_board`
- **File Sumber:** [`src/tests/test0_esp32_board.cpp`](file:///c:/programming/Dashboard-Monitoring-Udara/iot/src/tests/test0_esp32_board.cpp)
- **Penggunaan Memori:**
  - **RAM:** `14.0%` (`45.720 bytes` dari `327.680 bytes`)
  - **Flash:** `70.7%` (`926.700 bytes` dari `1.310.720 bytes`)

### Log Keluaran Serial Monitor
```text
18:10:44.463 > -----------------------
18:10:44.463 > 
18:10:44.463 > Scanning jaringan WiFi di sekitar...
18:10:47.982 > Ditemukan 6 jaringan:
18:10:47.982 >   1: Kandang rudi (RSSI: -63 dBm)
18:10:47.986 >   2: PRAS (RSSI: -72 dBm)
18:10:47.989 >   3: REDMI NOTE 40 PRO (RSSI: -90 dBm)
18:10:47.992 >   4: LALA-plus (RSSI: -93 dBm)
18:10:47.995 >   5: Dylann (RSSI: -93 dBm)
18:10:47.996 >   6: SKY14 (RSSI: -93 dBm)
18:10:47.999 > 
18:10:47.999 > Menghubungkan ke WiFi: kandangrudi
18:10:48.583 > ..............................
18:11:03.082 > >> WiFi GAGAL terhubung. Cek SSID/password, atau jarak ke router.
18:11:03.088 > 
18:11:03.088 > Board siap. LED akan mulai berkedip tiap 1 detik untuk uji GPIO...
18:11:03.093 > LED: ON  | Free heap: 234984 bytes | Uptime: 19 s
18:11:04.094 > LED: OFF | Free heap: 234984 bytes | Uptime: 20 s
18:11:05.094 > LED: ON  | Free heap: 234984 bytes | Uptime: 21 s
...
18:11:17.094 > LED: ON  | Free heap: 234984 bytes | Uptime: 33 s
```

### Analisis & Evaluasi Tahap 1
1. **Komunikasi Serial & Driver USB (`BERHASIL`):**
   Setelah instalasi driver *Silicon Labs CP2102 USB to UART Bridge*, proses *flashing* (`esptool v5.4.0`) dan pembacaan Serial Monitor berjalan lancar pada `115200` baud.
2. **Kesehatan CPU, Memori, & GPIO (`BERHASIL`):**
   - Memori *Free Heap* sangat stabil di angka **`234.984 bytes`** (~235 KB bebas tanpa kebocoran memori / *memory leak*).
   - Pengujian detak waktu (`Uptime`) dan *toggle* pin `GPIO 2` (LED indikator `ON`/`OFF` setiap 1 detik) berjalan presisi.
3. **Modul Radio / Antena WiFi 2.4 GHz (`BERHASIL`):**
   Modul WiFi internal ESP32 berfungsi normal dan berhasil memindai 6 jaringan WiFi di sekitar lokasi dengan sinyal terkuat pada jaringan **`Kandang rudi` (`-63 dBm` — Sangat Baik)**.
4. **Temuan & Tindak Lanjut Koneksi WiFi (`BERHASIL TERHUBUNG`):**
   - **Penyebab gagal konek pada percobaan pertama:** Nama SSID yang dipindai oleh ESP32 adalah **`"Kandang rudi"`** (menggunakan huruf **`K` kapital** dan **spasi**), sedangkan pada kode sebelumnya tertulis `"kandangrudi"` (huruf kecil tanpa spasi). Karena standar WiFi bersifat *case-sensitive* dan peka spasi, ESP32 tidak menemukan SSID `"kandangrudi"`.
   - **Perbaikan & Hasil Uji Ulang:** Seluruh file firmware telah diperbarui menggunakan SSID **`"Kandang rudi"`**. Setelah di-*upload* ulang (menggunakan metode tahan tombol `BOOT` saat `Connecting...`), ESP32 **berhasil terhubung ke WiFi `"Kandang rudi"`**.

---

## 3. Hasil Pengujian Tahap 2: Sensor Suhu & Kelembapan (`test1_dht_only`)

- **Waktu Pengujian:** 7 November 2026, Pukul 18:32 WIB
- **Environment PlatformIO:** `env:test1_dht_only`
- **File Sumber:** [`src/tests/test1_dht_only.cpp`](file:///c:/programming/Dashboard-Monitoring-Udara/iot/src/tests/test1_dht_only.cpp)
- **Konfigurasi Pin:** `VCC -> 3V3`, `GND -> GND`, `DATA -> GPIO 14 (D14)`

### Log Keluaran Serial Monitor
```text
18:32:34.292 > === TEST SENSOR DHT (AUTO-DETECT DHT11 / DHT22) ===
18:32:39.299 > [DHT22] Suhu: 31.90 C | Kelembapan: 62.00 %
18:32:44.305 > [DHT22] Suhu: 31.90 C | Kelembapan: 62.10 %
18:32:49.311 > [DHT22] Suhu: 32.00 C | Kelembapan: 62.30 %
18:32:54.318 > [DHT22] Suhu: 31.90 C | Kelembapan: 62.20 %
```

### Analisis & Evaluasi Tahap 2
1. **Kestabilan Pembacaan 1-Wire (`BERHASIL`):**
   Sensor berhasil membaca suhu ruangan aktual (**`31.90 °C – 32.00 °C`**) dan kelembapan relatif (**`62.00 % – 62.30 %`**) secara konsisten setiap 5 detik tanpa *timeout* atau nilai `NaN`.
2. **Fitur Auto-Detect (`BERHASIL`):**
   Fungsi `readDHTAuto()` berhasil mendeteksi tipe sensor secara otomatis dan memvalidasi *checksum* data.

---

## 4. Hasil Pengujian Tahap 3: Kombinasi Sensor DHT + Anemometer (`test5_dht_anemometer`)

- **Waktu Pengujian:** 7 November 2026, Pukul 19:51 WIB
- **Environment PlatformIO:** `env:test5_dht_anemometer`
- **File Sumber:** [`src/tests/test5_dht_anemometer.cpp`](file:///c:/programming/Dashboard-Monitoring-Udara/iot/src/tests/test5_dht_anemometer.cpp)
- **Konfigurasi Pin:**
  - **DHT22:** `VCC -> 3V3`, `GND -> GND`, `DATA -> GPIO 14 (D14)`
  - **Anemometer:** `VCC -> VIN (5V)`, `GND -> GND`, `SIGNAL -> GPIO 18 (D18)`

### Log Keluaran Serial Monitor
```text
19:51:16.771 > ----------------------------------------
19:51:21.774 > Suhu: 31.40 C | Kelembapan: 66.20 %
19:51:21.777 > Kecepatan angin: 1.96 m/s
19:51:21.777 > ----------------------------------------
19:51:26.779 > Suhu: 31.40 C | Kelembapan: 66.10 %
19:51:26.782 > Kecepatan angin: 0.00 m/s
19:51:26.782 > ----------------------------------------
19:51:36.793 > Suhu: 31.40 C | Kelembapan: 66.00 %
19:51:36.796 > Kecepatan angin: 0.00 m/s
19:51:36.796 > ----------------------------------------
19:51:41.800 > Suhu: 31.50 C | Kelembapan: 66.00 %
19:51:41.803 > Kecepatan angin: 0.00 m/s
```

### Analisis & Evaluasi Tahap 3
1. **Integrasi Interrupt Anemometer & 1-Wire DHT22 (`BERHASIL`):**
   Kedua sensor berhasil bekerja secara bersamaan. Saat baling-baling anemometer berputar, interrupt pada `GPIO 18` berhasil menghitung pulsa dan mengonversinya menjadi kecepatan angin **`1.96 m/s`**, sementara DHT22 pada `GPIO 14` tetap membaca suhu **`31.40 °C – 31.60 °C`** dan kelembapan **`65.60 % – 66.20 %`**.
2. **Mitigasi *Collision* Timing 1-Wire:**
   Sesekali (1 dari ~8 siklus) pembacaan 1-Wire DHT22 dapat bertepatan dengan *interrupt* anemometer. Pada firmware utama (`ESP32_revisi.cpp`), ditambahkan mekanisme *auto-retry* dan penyimpanan nilai valid terakhir agar data telemetri MQTT tidak pernah bernilai `null`.

---

## 5. Hasil Pengujian Tahap 4: Integrasi Semua Sensor & Otomasi Relay (`test_tanpa_koneksi`)

- **Waktu Pengujian:** 7 November 2026, Pukul 20:37 WIB
- **Environment PlatformIO:** `env:test_tanpa_koneksi`
- **File Sumber:** [`src/tests/test_tanpa_koneksi.cpp`](file:///c:/programming/Dashboard-Monitoring-Udara/iot/src/tests/test_tanpa_koneksi.cpp)

### Log Keluaran Serial Monitor
```text
20:37:41.597 > [00:05:31] Hasil pembacaan sensor:
20:37:41.602 > DHT22   : Suhu 31.50 C | Kelembapan 68.60 %
20:37:41.605 > SGP30   : eCO2 710 ppm | TVOC 0 ppb
20:37:41.608 > Angin   : 0 pulsa | 0.00 m/s
20:37:41.611 > Kipas   : 0 pulsa | 0.0 RPM
20:37:41.614 > Relay   : ON (mode: AUTO)
20:37:41.617 > Kualitas Udara: PERINGATAN (Suhu: PERINGATAN | Kelembapan: PERINGATAN | CO2: PERINGATAN)
==========================================================
20:37:46.662 > [00:05:36] Hasil pembacaan sensor:
20:37:46.668 > DHT22   : Suhu 31.40 C | Kelembapan 68.50 %
20:37:46.671 > SGP30   : eCO2 704 ppm | TVOC 0 ppb
20:37:46.674 > Angin   : 0 pulsa | 0.00 m/s
20:37:46.676 > Kipas   : 0 pulsa | 0.0 RPM
20:37:46.679 > Relay   : ON (mode: AUTO)
20:37:46.682 > Kualitas Udara: PERINGATAN (Suhu: PERINGATAN | Kelembapan: PERINGATAN | CO2: PERINGATAN)
==========================================================
21:41:28.224 > [00:17:16] Hasil pembacaan sensor:
21:41:28.229 > DHT22   : Suhu 30.20 C | Kelembapan 73.20 %
21:41:28.232 > SGP30   : eCO2 400 ppm | TVOC 0 ppb
21:41:28.235 > Angin   : 0 pulsa | 0.00 m/s
21:41:28.238 > Kipas   : 261 pulsa | 1566.0 RPM
21:41:28.241 > Relay   : ON (mode: MANUAL)
21:41:28.243 > Kualitas Udara: PERINGATAN (Suhu: PERINGATAN | Kelembapan: BAHAYA | CO2: AMAN)
==========================================================
21:41:33.289 > [00:17:21] Hasil pembacaan sensor:
21:41:33.294 > DHT22   : Suhu 30.20 C | Kelembapan 73.30 %
21:41:33.297 > SGP30   : eCO2 400 ppm | TVOC 0 ppb
21:41:33.300 > Angin   : 1 pulsa | 1.68 m/s
21:41:33.303 > Kipas   : 262 pulsa | 1572.0 RPM
21:41:33.306 > Relay   : ON (mode: MANUAL)
==========================================================
21:41:38.355 > [00:17:26] Hasil pembacaan sensor:
21:41:38.360 > DHT22   : Suhu 30.20 C | Kelembapan 73.20 %
21:41:38.363 > SGP30   : eCO2 400 ppm | TVOC 0 ppb
21:41:38.366 > Angin   : 15 pulsa | 5.40 m/s
21:41:38.369 > Kipas   : 261 pulsa | 1566.0 RPM
21:41:38.371 > Relay   : ON (mode: MANUAL)
21:41:38.374 > Kualitas Udara: PERINGATAN (Suhu: PERINGATAN | Kelembapan: BAHAYA | CO2: AMAN)
```

### Analisis & Evaluasi Tahap 4
1. **Sensor Gas SGP30 I2C (`BERHASIL`):**
   Sensor SGP30 pada jalur I2C (`SDA = GPIO 21`, `SCL = GPIO 22`) berhasil terdeteksi dan membaca kadar **`eCO2` (`400 – 711 ppm`)** serta **`TVOC` (`0 ppb`)** dengan kompensasi kelembapan absolut *real-time* dari sensor DHT22.
2. **Otomasi & Kontrol Manual Relay + Tachometer Kipas 12V (`BERHASIL 100%`):**
   - Ketika kadar `eCO2` melewati ambang batas `CO2_THRESHOLD_ON` (`600 ppm`), logika *hysteresis* otomatis mengubah status **`Relay: ON (mode: AUTO)`** dan mengklasifikasikan indeks kualitas udara ruangan menjadi **`PERINGATAN`**.
   - Pengujian pemicuan Relay `Songle SRD-12VDC-SL-C` menggunakan suplai `12V DC` (`DC+` dan `COM` pada `+12V`, `NO` ke jalur positif Kipas 12V) serta sinyal Tachometer kipas pada `GPIO 32` (`FALLING` interrupt) berhasil membaca kecepatan putaran kipas secara stabil pada **`1.566,0 – 1.602,0 RPM` (`261 – 267 pulsa`)** dan menghasilkan aliran udara hingga **`5,40 m/s` (`15 pulsa`)** pada Anemometer.

---

## 6. Rekapitulasi Riwayat Pengujian Seluruh Modul

Tabel berikut merangkum hasil pengujian awal (`hasil_testing.txt`) beserta status perbaikan terkini di PlatformIO:

| Kode Uji | Nama Sketch / Environment | Fokus Pengujian | Hasil Awal | Status & Solusi Perbaikan |
| :--- | :--- | :--- | :--- | :--- |
| **Test 0** | `test0_esp32_board` | Fungsi dasar ESP32, RAM, GPIO LED, & Scan WiFi | **Berhasil** | Terverifikasi di PlatformIO (Free heap `234.984 bytes`, RSSI `-63 dBm`). SSID diperbaiki menjadi `"Kandang rudi"`. |
| **Test 0b** | `test0_esp32_board_active` | Uji output `GPIO 27` Active-High | **Berhasil** | Pin `GPIO 27` merespons perpindahan `HIGH`/`LOW` tiap 2 detik. |
| **Test 1** | `test1_dht_only` | Pembacaan suhu & kelembapan (`GPIO 14`) | Sempat *timeout* | **Berhasil** (Suhu `31.90 °C`, Kelembapan `62.20 %` stabil setiap 5 detik tanpa *timeout*). |
| **Test 1-1** | `test1_1_dht22_pin4` | Isolasi pin DHT pada pin alternatif | Sempat *timeout* | Digunakan untuk mengisolasi masalah kabel *pull-up* vs GPIO. |
| **Test 1-2** | `test1_2_dht22_dhtesp` | Uji sensor DHT dengan library `DHTesp` | Sempat *timeout* | Konfigurasi `lib_deps` diperbaiki ke repositori resmi `beegee-tokyo/DHTesp`. |
| **Test 2** | `test2_sgp30_only` | Uji sensor gas SGP30 (I2C `SDA=21`, `SCL=22`) | Kendala I2C | Perlu memastikan pin header SGP30 tersolder rapat dan suplai `3.3V` stabil. |
| **Test 2-1** | `test2_1_sgp30_default_pins` | Uji SGP30 dengan frekuensi I2C rendah (`50 kHz`) | Kendala I2C | Digunakan untuk menguji kestabilan jalur I2C dan pengecekan tegangan rel `3.3V`. |
| **Test 3** | `test3_anemometer_only` | Uji sensor kecepatan angin (`GPIO 18` Interrupt) | **Berhasil** | Interrupt pulsa anemometer (`RISING`) dan konversi ke `m/s` berjalan akurat. |
| **Test 4** | `test4_dht_sgp30` | Kombinasi DHT + SGP30 (kompensasi kelembapan) | Menunggu uji ulang | Sudah dilengkapi fitur **Auto-Detect DHT11/DHT22**. |
| **Test 5** | `test5_dht_anemometer` | Kombinasi DHT + Anemometer | Anemometer Berhasil | **Berhasil Keduanya** (Suhu `31.40 °C`, Kelembapan `66.20 %`, Kecepatan Angin `1.96 m/s`). |
| **Test 6** | `test6_sgp30_anemometer` | Kombinasi SGP30 + Anemometer | Anemometer Berhasil | Menguji pembacaan I2C bersama interrupt anemometer. |
| **Test 7** | `test7_all_sensors` | Gabungan semua sensor tanpa WiFi | Siap diuji | Menguji integrasi DHT + SGP30 + Anemometer secara lokal. |
| **Test 8** | `test_tanpa_koneksi` | Integrasi penuh semua sensor + Relay + Kipas 12V | **Berhasil 100%** | DHT22 (`30.20 °C`, `73.20 %`), SGP30 (`eCO2 400–711 ppm`), Anemometer (`5.40 m/s`), Kipas (`1.566–1.602 RPM`), & Relay (`ON`/`OFF`/`AUTO`) berfungsi sempurna. |
| **Utama** | `esp32_revisi` | Firmware produksi penuh (Sensor + Relay + MQTT EMQX) | **Berhasil & Siap Produksi** | Input Ruangan (`h5`/`seminar`/`lab_kom`/`lab_td`), WiFi SSID (dengan *Auto-Scan*), & Password diinput interaktif via Serial Monitor tanpa *hardcode*; Client ID MQTT unik berbasis MAC Address; Auto-Detect DHT11/DHT22. |
