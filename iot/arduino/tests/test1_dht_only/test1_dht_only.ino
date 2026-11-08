// ============================================================
// TEST 1: RANGKAIAN SENSOR DHT SAJA (AUTO-DETECT DHT11 / DHT22)
// Tujuan: memastikan sensor suhu & kelembapan (baik DHT11 maupun
// DHT22) terbaca dengan benar secara otomatis tanpa ubah kodingan
// ============================================================

#include "DHT.h"
#include <math.h>

#define DHTPIN 14
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

const int timemeasure = 5; // detik, dipercepat untuk keperluan testing
unsigned long timeold = 0;

const char* dhtDetectedType = "DHT22/DHT11";
bool readDHTAuto(DHT &sensor, float &outTemp, float &outHum) {
  float tRaw = sensor.readTemperature();
  float hRaw = sensor.readHumidity();

  if (isnan(tRaw) || isnan(hRaw)) {
    return false;
  }

  if (tRaw >= -20.0f && tRaw <= 80.0f && hRaw >= 1.0f && hRaw <= 100.0f) {
    outTemp = tRaw;
    outHum  = hRaw;
    dhtDetectedType = "DHT22";
    return true;
  }

  uint16_t rawT = (uint16_t)roundf(fabsf(tRaw) * 10.0f);
  uint16_t rawH = (uint16_t)roundf(fabsf(hRaw) * 10.0f);
  uint8_t d0 = (rawH >> 8) & 0x7F;
  uint8_t d1 = rawH & 0xFF;
  uint8_t d2 = (rawT >> 8) & 0x7F;
  uint8_t d3 = rawT & 0xFF;

  float t11 = (float)d2 + (float)(d3 & 0x0F) * 0.1f;
  if (tRaw < 0 || (d3 & 0x80)) t11 = -t11;
  float h11 = (float)d0 + (float)d1 * 0.1f;

  if (t11 >= 0.0f && t11 <= 60.0f && h11 >= 5.0f && h11 <= 100.0f) {
    outTemp = t11;
    outHum  = h11;
    dhtDetectedType = "DHT11";
    return true;
  }

  return false;
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== TEST SENSOR DHT (AUTO-DETECT DHT11 / DHT22) ===");
  dht.begin();
  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    float temp = NAN, hum = NAN;

    if (!readDHTAuto(dht, temp, hum)) {
      Serial.println("Gagal membaca DHT11/DHT22! Cek wiring (pin 14, VCC, GND, pull-up).");
    } else {
      Serial.printf("[%s] Suhu: %.2f C | Kelembapan: %.2f %%\n", dhtDetectedType, temp, hum);
    }

    timeold = millis();
  }
}
