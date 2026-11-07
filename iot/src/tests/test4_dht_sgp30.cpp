#include <Arduino.h>
// ============================================================
// TEST 4: RANGKAIAN DHT (AUTO-DETECT DHT11/DHT22) + SGP30
// Tujuan: memastikan DHT11/DHT22 dan SGP30 bekerja bersamaan,
// termasuk kompensasi humidity SGP30 dari data DHT real-time
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

float temp = NAN, hum = NAN;
uint16_t eco2, tvoc;

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

uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  const float absoluteHumidity = 216.7f * ((humidity / 100.0f) * 6.112f *
    exp((17.62f * temperature) / (243.12f + temperature)) / (273.15f + temperature));
  return static_cast<uint32_t>(1000.0f * absoluteHumidity);
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== TEST DHT (AUTO DHT11/DHT22) + SGP30 ===");

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
    if (!readDHTAuto(dht, temp, hum)) {
      temp = NAN;
      hum  = NAN;
      Serial.println("Gagal membaca DHT11/DHT22!");
    } else {
      Serial.printf("[%s] Suhu: %.2f C | Kelembapan: %.2f %%\n", dhtDetectedType, temp, hum);
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
