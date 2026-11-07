#include <Arduino.h>
// ============================================================
// TEST 1: RANGKAIAN DHT22 SAJA
// Tujuan: memastikan sensor suhu & kelembapan terbaca dengan benar
// ============================================================

#include "DHT.h"

#define DHTPIN 14
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

const int timemeasure = 5; // detik, dipercepat untuk keperluan testing
unsigned long timeold = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("=== TEST DHT22 ===");
  dht.begin();
  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
      Serial.println("Gagal membaca DHT22! Cek wiring (pin 14, VCC, GND, pull-up).");
    } else {
      Serial.printf("Suhu: %.2f C | Kelembapan: %.2f %%\n", temp, hum);
    }

    timeold = millis();
  }
}
