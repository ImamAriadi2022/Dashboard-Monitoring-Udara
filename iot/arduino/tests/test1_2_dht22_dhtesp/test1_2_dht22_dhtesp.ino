// ============================================================
// TEST DHT22 â€” LIBRARY ALTERNATIF (DHTesp)
// Library "DHTesp" dibuat khusus menangani timing ESP32 dengan
// lebih baik dibanding library "DHT" (Adafruit) yang aslinya
// untuk Arduino Uno/timing lebih lambat.
//
// CARA INSTALL:
// Arduino IDE -> Tools -> Manage Libraries -> cari "DHTesp"
// karya "beegee_tokyo" -> Install
// ============================================================
#include "DHTesp.h"

#define DHTPIN 14   // tetap di pin 14 dulu, untuk bandingkan hasil dengan library lama

DHTesp dht;

const int timemeasure = 5;
unsigned long timeold = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("=== TEST DHT22 DENGAN LIBRARY DHTesp ===");
  dht.setup(DHTPIN, DHTesp::DHT22);
  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    TempAndHumidity data = dht.getTempAndHumidity();

    if (dht.getStatus() != 0) {
      Serial.print("Gagal membaca DHT22 (DHTesp)! Status: ");
      Serial.println(dht.getStatusString());
    } else {
      Serial.printf("BERHASIL! Suhu: %.2f C | Kelembapan: %.2f %%\n",
                    data.temperature, data.humidity);
    }
    timeold = millis();
  }
}
