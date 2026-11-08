// ============================================================
// TEST DHT22 â€” UNTUK BOARD ESP8266 (NodeMCU / Wemos D1 Mini)
// Tujuan: memastikan sensor DHT22 terbaca dengan benar di ESP8266
// ============================================================
#include "DHT.h"

// [PENTING] Penomoran pin ESP8266 beda dengan ESP32.
// Gunakan D2 (=GPIO4) - pin ini AMAN dipakai, tidak terlibat proses boot.
// HINDARI pin berikut untuk sensor/data pin:
//   D0 (GPIO16) - tidak mendukung interrupt/pull-up dengan baik
//   D3 (GPIO0)  - dipakai untuk boot mode, harus HIGH saat boot
//   D4 (GPIO2)  - dipakai untuk boot mode + LED onboard, harus HIGH saat boot
//   D8 (GPIO15) - dipakai untuk boot mode, harus LOW saat boot
#define DHTPIN D2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

const int timemeasure = 5; // detik
unsigned long timeold = 0;

void setup() {
  Serial.begin(115200);
  delay(2000); // beri waktu sensor stabil setelah power-on
  Serial.println("\n=== TEST DHT22 DI ESP8266 ===");
  Serial.printf("Pin data yang dipakai: D2 (GPIO4)\n");
  Serial.println("Pastikan wiring: VCC->3V3, GND->GND, OUT->D2");
  Serial.println("Jika sensor bare 4-pin (bukan modul breakout), tambahkan");
  Serial.println("resistor pull-up 4.7k-10k antara OUT dan VCC.\n");

  dht.begin();
  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
      Serial.println("Gagal membaca DHT22! Cek wiring (D2, VCC, GND, pull-up).");
    } else {
      Serial.printf("Suhu: %.2f C | Kelembapan: %.2f %%\n", temp, hum);
    }

    timeold = millis();
  }
}
