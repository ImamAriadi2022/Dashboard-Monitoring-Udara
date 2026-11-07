#include <Arduino.h>
// ============================================================
// TEST DHT22 — GANTI PIN (isolasi masalah GPIO14)
// Coba pindahkan kabel DATA/OUT dari D14 ke GPIO4 (atau pin lain
// yang tersedia), lalu jalankan sketch ini
// ============================================================
#include "DHT.h"

#define DHTPIN 33     // <-- DIUBAH dari 14 ke 4, pindahkan kabel OUT ke sini
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

const int timemeasure = 5;
unsigned long timeold = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("=== TEST DHT22 DI GPIO4 ===");
  Serial.println("Pastikan kabel OUT/DATA sudah dipindah dari D14 ke D4!");
  dht.begin();
  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
      Serial.println("Masih gagal juga di GPIO4. Kemungkinan bukan soal pin, tapi library/sensor.");
    } else {
      Serial.printf("BERHASIL di GPIO4! Suhu: %.2f C | Kelembapan: %.2f %%\n", temp, hum);
    }
    timeold = millis();
  }
}
