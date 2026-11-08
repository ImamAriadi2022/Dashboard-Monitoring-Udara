// ============================================================
// TEST 5: RANGKAIAN DHT22 + ANEMOMETER
// Tujuan: memastikan pembacaan suhu/kelembapan tidak terganggu
// oleh interrupt anemometer, dan sebaliknya
// ============================================================
#include "DHT.h"

#define DHTPIN 14
#define DHTTYPE DHT22
#define WIND_PIN 18

DHT dht(DHTPIN, DHTTYPE);

volatile int rpmcount = 0;
volatile unsigned long last_micros = 0;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

const int timemeasure = 5; // detik
unsigned long timeold = 0;

float temp, hum, wind_ms;

void IRAM_ATTR rpm_anemometer() {
  unsigned long current_micros = micros();
  if (current_micros - last_micros > 10000) {
    rpmcount++;
    last_micros = current_micros;
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== TEST DHT22 + ANEMOMETER ===");

  dht.begin();

  pinMode(WIND_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_PIN), rpm_anemometer, RISING);

  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
    // Suhu & kelembapan
    temp = dht.readTemperature();
    hum  = dht.readHumidity();
    if (isnan(temp) || isnan(hum)) {
      Serial.println("Gagal membaca DHT22!");
    } else {
      Serial.printf("Suhu: %.2f C | Kelembapan: %.2f %%\n", temp, hum);
    }

    // Angin
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
