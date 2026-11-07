#include <Arduino.h>
// ============================================================
// TEST 4: RANGKAIAN DHT22 + SGP30
// Tujuan: memastikan DHT22 dan SGP30 bekerja bersamaan,
// termasuk kompensasi humidity SGP30 dari data DHT22 real-time
// ============================================================
#include "DHT.h"
#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <math.h>

#define DHTPIN 14
#define DHTTYPE DHT22
#define SDA_PIN 21
#define SCL_PIN 22

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SGP30 sgp;
bool sgp_available = false;

const int timemeasure = 5; // detik
unsigned long timeold = 0;

float temp, hum;
uint16_t eco2, tvoc;

uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  const float absoluteHumidity = 216.7f * ((humidity / 100.0f) * 6.112f *
    exp((17.62f * temperature) / (243.12f + temperature)) / (273.15f + temperature));
  return static_cast<uint32_t>(1000.0f * absoluteHumidity);
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== TEST DHT22 + SGP30 ===");

  dht.begin();

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setTimeOut(1000);

  if (sgp.begin()) {
    Serial.println("SGP30 terhubung!");
    sgp_available = true;
  } else {
    Serial.println("PERINGATAN: SGP30 tidak terdeteksi!");
  }

  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    temp = dht.readTemperature();
    hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
      Serial.println("Gagal membaca DHT22!");
    } else {
      Serial.printf("Suhu: %.2f C | Kelembapan: %.2f %%\n", temp, hum);
    }

    if (sgp_available) {
      if (!isnan(temp) && !isnan(hum)) {
        sgp.setHumidity(getAbsoluteHumidity(temp, hum));
      }
      if (sgp.IAQmeasure()) {
        eco2 = sgp.eCO2;
        tvoc = sgp.TVOC;
        Serial.printf("eCO2: %d ppm | TVOC: %d ppb\n", eco2, tvoc);
      } else {
        Serial.println("Gagal membaca SGP30!");
      }
    }

    Serial.println("----------------------------------------");
    timeold = millis();
  }
}
