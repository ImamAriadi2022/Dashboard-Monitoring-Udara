# Firmware IoT & Pengujian Sensor (PlatformIO - ESP32)

Folder ini merupakan proyek **PlatformIO IDE** untuk memprogram mikrokontroler **ESP32** pada sistem **Dashboard Monitoring Kualitas Udara & Sirkulasi Ruangan**, lengkap dengan seluruh sketch pengujian sensor dan aktuator.

---

## Struktur Direktori

```text
iot/
├── platformio.ini            # Konfigurasi board, library otomatis, dan environment
├── hasil_testing.txt         # Catatan log hasil pengujian hardware
├── README.md                 # Dokumentasi panduan penggunaan PlatformIO
├── include/                  # Header tambahan (opsional)
├── lib/                      # Library kustom lokal (opsional)
└── src/
    ├── main/
    │   └── ESP32_revisi.cpp                  # [DEFAULT] Firmware utama (sinkron dengan bridge.js)
    ├── variants/
    │   ├── ESP32_mqtt_test1.cpp              # Pengujian MQTT + kontrol relay via Serial
    │   ├── ESP32_Monitoring_Gabungan_v2.cpp  # Firmware gabungan v2
    │   ├── ESP32_Monitoring_Kipas_On.cpp     # Firmware gabungan (kipas selalu ON)
    │   └── ESP32_Monitoring_Merged.cpp       # Firmware gabungan awal
    └── tests/
        ├── test0_esp32_board.cpp             # Sanity check ESP32 (Chip info, WiFi scan, Blink)
        ├── test0_esp32_board_active.cpp      # Uji GPIO 27 active-high
        ├── test1_dht_only.cpp                # Uji sensor DHT22 (GPIO 14)
        ├── test1_1_dht22_pin4.cpp            # Uji sensor DHT22 pindah pin (GPIO 33/4)
        ├── test1_2_dht22_dhtesp.cpp          # Uji sensor DHT22 dengan library DHTesp
        ├── test2_sgp30_only.cpp              # Uji gabungan tanpa WiFi (GPIO 33)
        ├── test2_1_sgp30_default_pins.cpp    # Uji SGP30 di pin default I2C (21/22) clock 50kHz
        ├── test3_anemometer_only.cpp         # Uji sensor Anemometer (interrupt pulsa -> m/s)
        ├── test4_dht_sgp30.cpp               # Uji kombinasi DHT22 + SGP30
        ├── test5_dht_anemometer.cpp          # Uji kombinasi DHT22 + Anemometer
        ├── test6_sgp30_anemometer.cpp        # Uji kombinasi SGP30 + Anemometer
        ├── test7_all_sensors.cpp             # Uji ketiga sensor (DHT22 + SGP30 + Anemometer)
        ├── test_led.cpp                      # Uji kedip LED / GPIO 27
        ├── test_mcu_dht22_esp8266.cpp        # Uji DHT22 khusus board ESP8266 (NodeMCU)
        ├── test_relay_input.cpp              # Uji kontrol kipas 12V + SGP30 + override CO2 via Serial
        ├── test_relay_kipas.cpp              # Uji relay + tacho kipas 12V (manual/auto timer)
        ├── test_relay_kipas2.cpp             # Uji relay NO + tacho kipas via input angka CO2
        ├── test_relay_kipas3.cpp             # Uji sekuens otomatis CO2 (100 - 600 ppm)
        └── test_tanpa_koneksi.cpp            # Sistem monitoring lengkap tanpa WiFi/MQTT
```

---

## Cara Membuka dan Menjalankan di VS Code (PlatformIO IDE)

1. **Instal Ekstensi PlatformIO IDE** di VS Code (jika belum terpasang).
2. Buka folder **`iot`** ini di VS Code (`File` -> `Open Folder...` -> pilih folder `iot`), atau tambahkan ke Workspace.
3. PlatformIO akan otomatis membaca file `platformio.ini` dan mengunduh semua library yang dibutuhkan:
   - `PubSubClient` (MQTT)
   - `Adafruit DHT sensor library` & `Adafruit Unified Sensor`
   - `Adafruit SGP30 Sensor`
   - `DHTesp`
4. **Memilih Sketch / Environment:**
   - Lihat **Status Bar** di bagian bawah jendela VS Code.
   - Klik tombol environment (secara default bertuliskan `env:esp32_revisi`).
   - Pilih environment yang ingin Anda *compile* atau *upload* (misalnya `env:esp32_revisi` untuk produksi, atau `env:test3_anemometer_only` untuk mengetes anemometer).
5. **Compile & Upload:**
   - Klik ikon **Centang (`✓`)** di Status Bar bawah untuk **Build / Verify**.
   - Hubungkan ESP32 via kabel USB, lalu klik ikon **Panah Kanan (`→`)** untuk **Upload** ke board.
   - Klik ikon **Steker (`🔌`)** untuk membuka **Serial Monitor** (baudrate sudah diset otomatis `115200`).

---

## Konfigurasi Pin Firmware Utama (`ESP32_revisi.cpp`)

| Komponen / Sensor | Pin ESP32 | Keterangan |
| :--- | :--- | :--- |
| **DHT22 (Data)** | `GPIO 14` | Sensor Suhu & Kelembapan |
| **Anemometer** | `GPIO 18` | Interrupt pulsa kecepatan angin (`INPUT_PULLUP`, `RISING`) |
| **SGP30 (SDA)** | `GPIO 21` | I2C Data (eCO2 & TVOC) |
| **SGP30 (SCL)** | `GPIO 22` | I2C Clock |
| **Fan Tachometer** | `GPIO 32` | Pembaca RPM kipas 12V (`INPUT_PULLUP`, `FALLING`) |
| **Modul Relay** | `GPIO 27` | Kontrol ON/OFF kipas (`ACTIVE-HIGH`) |

### Pilihan ID Ruangan via Serial Monitor (`ESP32_revisi.cpp`)
Saat ESP32 menyala dan terhubung ke Serial Monitor (`115200`), ketik angka berikut lalu tekan Enter untuk mengganti ruangan target pengiriman MQTT:
- `1` = `h5` *(Default)*
- `2` = `seminar`
- `3` = `lab_kom`
- `4` = `lab_td`
