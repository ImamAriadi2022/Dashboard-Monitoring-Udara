# Koleksi Sketsa Arduino IDE (.ino)

Folder ini berisi versi **Arduino IDE** resmi dari seluruh 24 sketsa program ESP32 / ESP8266 sistem Monitoring Kualitas Udara.

Semua sketsa di folder ini telah menggunakan pembaruan kode terbaru yang telah diuji langsung pada perangkat keras (hardware) dan lolos uji 100%.

---

## Struktur Folder

Sesuai aturan standar Arduino IDE, setiap file sketsa `.ino` berada di dalam subfolder dengan nama yang sama persis:

```text
iot/arduino/
├── main/
│   └── ESP32_revisi/
│       └── ESP32_revisi.ino               <-- FIRMWARE UTAMA PRODUKSI
├── tests/                                 <-- 19 SKETSA PENGUJIAN KOMPONEN
│   ├── test0_esp32_board/
│   │   └── test0_esp32_board.ino
│   ├── test0_esp32_board_active/
│   │   └── test0_esp32_board_active.ino
│   ├── test1_dht_only/
│   │   └── test1_dht_only.ino
│   ├── test1_1_dht22_pin4/
│   │   └── test1_1_dht22_pin4.ino
│   ├── test1_2_dht22_dhtesp/
│   │   └── test1_2_dht22_dhtesp.ino
│   ├── test2_sgp30_only/
│   │   └── test2_sgp30_only.ino
│   ├── test2_1_sgp30_default_pins/
│   │   └── test2_1_sgp30_default_pins.ino
│   ├── test3_anemometer_only/
│   │   └── test3_anemometer_only.ino
│   ├── test4_dht_sgp30/
│   │   └── test4_dht_sgp30.ino
│   ├── test5_dht_anemometer/
│   │   └── test5_dht_anemometer.ino
│   ├── test6_sgp30_anemometer/
│   │   └── test6_sgp30_anemometer.ino
│   ├── test7_all_sensors/
│   │   └── test7_all_sensors.ino
│   ├── test_led/
│   │   └── test_led.ino
│   ├── test_mcu_dht22_esp8266/
│   │   └── test_mcu_dht22_esp8266.ino
│   ├── test_relay_input/
│   │   └── test_relay_input.ino
│   ├── test_relay_kipas/
│   │   └── test_relay_kipas.ino
│   ├── test_relay_kipas2/
│   │   └── test_relay_kipas2.ino
│   ├── test_relay_kipas3/
│   │   └── test_relay_kipas3.ino
│   └── test_tanpa_koneksi/
│       └── test_tanpa_koneksi.ino         <-- Uji semua sensor + Kipas offline
└── variants/                              <-- 4 VARIAN PENGEMBANGAN LAINNYA
    ├── ESP32_Monitoring_Gabungan_v2/
    │   └── ESP32_Monitoring_Gabungan_v2.ino
    ├── ESP32_Monitoring_Kipas_On/
    │   └── ESP32_Monitoring_Kipas_On.ino
    ├── ESP32_Monitoring_Merged/
    │   └── ESP32_Monitoring_Merged.ino
    └── ESP32_mqtt_test1/
        └── ESP32_mqtt_test1.ino
```

---

## Cara Membuka & Mengunggah di Arduino IDE

1. Buka **Arduino IDE** (versi 1.8.x atau 2.x).
2. Klik menu **File > Open...** (atau tekan `Ctrl + O`).
3. Masuk ke folder sketsa yang ingin dibuka (misalnya `iot/arduino/main/ESP32_revisi/ESP32_revisi.ino`).
4. Pastikan Board & Port sudah terpilih:
   - **Tools > Board > esp32 > ESP32 Dev Module**
   - **Tools > Port > COM3** (atau port COM sesuai device manager)
   - **Tools > Upload Speed > 921600** (atau 115200)
5. Klik tombol **Verify (✓)** atau **Upload (➔)**.
6. Buka **Serial Monitor** pada baudrate **`115200`** (Newline).

---

## Library yang Diperlukan (Install via Arduino Library Manager)

Buka menu **Sketch > Include Library > Manage Libraries...** lalu cari dan install:
1. `PubSubClient` by Nick O'Leary
2. `DHT sensor library` by Adafruit
3. `Adafruit Unified Sensor` by Adafruit
4. `Adafruit SGP30 Sensor` by Adafruit
5. `DHTesp` by Bernhard Guillon *(hanya untuk sketch `test1_2_dht22_dhtesp`)*
