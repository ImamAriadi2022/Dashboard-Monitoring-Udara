#include <Arduino.h>
// ============================================================
// TEST 6: RANGKAIAN SGP30 + ANEMOMETER
// Tujuan: memastikan pembacaan I2C (SGP30) tidak terganggu
// oleh interrupt anemometer, dan sebaliknya
// Catatan: karena tidak ada DHT, humidity compensation SGP30
// memakai nilai statis (suhu 27C, kelembapan 65%)
// ============================================================
#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <math.h>

#define SDA_PIN 22
#define SCL_PIN 23
#define WIND_PIN 18

Adafruit_SGP30 sgp;
bool sgp_available = false;

volatile int rpmcount = 0;
volatile unsigned long last_micros = 0;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

// Nilai statis pengganti DHT
const float STATIC_TEMP = 27.0;
const float STATIC_HUM  = 65.0;

const int timemeasure = 5; // detik
unsigned long timeold = 0;

float wind_ms;

uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  const float absoluteHumidity = 216.7f * ((humidity / 100.0f) * 6.112f *
    exp((17.62f * temperature) / (243.12f + temperature)) / (273.15f + temperature));
  return static_cast<uint32_t>(1000.0f * absoluteHumidity);
}

void IRAM_ATTR rpm_anemometer() {
  unsigned long current_micros = micros();
  if (current_micros - last_micros > 10000) {
    rpmcount++;
    last_micros = current_micros;
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== TEST SGP30 + ANEMOMETER ===");

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setTimeOut(1000);

  if (sgp.begin()) {
    Serial.println("SGP30 terhubung!");
    sgp_available = true;
    sgp.setHumidity(getAbsoluteHumidity(STATIC_TEMP, STATIC_HUM));
  } else {
    Serial.println("PERINGATAN: SGP30 tidak terdeteksi!");
  }

  pinMode(WIND_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_PIN), rpm_anemometer, RISING);

  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    // SGP30
    if (sgp_available) {
      if (sgp.IAQmeasure()) {
        Serial.printf("eCO2: %d ppm | TVOC: %d ppb\n", sgp.eCO2, sgp.TVOC);
      } else {
        Serial.println("Gagal membaca SGP30!");
      }
    }

    // Anemometer
    int countCopy = 0;
    portENTER_CRITICAL(&timerMux);
    countCopy = rpmcount;
    rpmcount = 0;
    portEXIT_CRITICAL(&timerMux);

    float rps = (float)countCopy / (float)timemeasure;
    if (rps == 0) {
      wind_ms = 0;
    } else {
      wind_ms = ((-0.0181 * (rps * rps)) + (1.3859 * rps) + 1.4055);
      if (wind_ms < 0) wind_ms = 0;
    }
    Serial.printf("Kecepatan angin: %.2f m/s\n", wind_ms);

    Serial.println("----------------------------------------");
    timeold = millis();
  }

  vTaskDelay(1);
}
