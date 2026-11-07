#include <Arduino.h>
// ============================================================
// TEST GABUNGAN: DHT22 + SGP30 + ANEMOMETER (TANPA WIFI/MQTT)
// Tujuan: menguji ketiga sensor bekerja bersamaan di board yang
// sama, tanpa koneksi WiFi, murni cetak hasil ke Serial Monitor
// ============================================================
#include "DHT.h"
#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <math.h>

// --- Pin Definitions ---
#define DHTPIN 14
#define DHTTYPE DHT22
#define WIND_PIN 18
#define SDA_PIN 21
#define SCL_PIN 22

// --- Objects ---
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SGP30 sgp;
bool sgp_available = false;

// --- Variables ---
volatile int rpmcount = 0;
volatile unsigned long last_micros = 0;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

const int timemeasure = 5; // detik, dipercepat untuk testing (aslinya 30)
unsigned long timeold = 0;

float temp, hum, wind_ms;
uint16_t eco2, tvoc;

// --- Interrupt Anemometer ---
void IRAM_ATTR rpm_anemometer() {
  unsigned long current_micros = micros();
  if (current_micros - last_micros > 10000) { // debounce 10ms
    rpmcount++;
    last_micros = current_micros;
  }
}

// --- Helper: Kompensasi Humidity untuk SGP30 ---
uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  const float absoluteHumidity = 216.7f * ((humidity / 100.0f) * 6.112f *
    exp((17.62f * temperature) / (243.12f + temperature)) / (273.15f + temperature));
  return static_cast<uint32_t>(1000.0f * absoluteHumidity);
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=== TEST GABUNGAN DHT22 + SGP30 + ANEMOMETER (TANPA WIFI) ===\n");

  // Setup DHT22
  dht.begin();

  // Setup SGP30
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setTimeOut(1000);
  if (sgp.begin()) {
    Serial.println("SGP30 terhubung!");
    sgp_available = true;
  } else {
    Serial.println("PERINGATAN: SGP30 tidak terdeteksi!");
    sgp_available = false;
  }

  // Setup Anemometer
  pinMode(WIND_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_PIN), rpm_anemometer, RISING);

  Serial.println("\nSetup selesai. Mulai pembacaan sensor...\n");
  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {

    // 1. Baca DHT22
    temp = dht.readTemperature();
    hum  = dht.readHumidity();

    // 2. Baca SGP30 (dengan kompensasi humidity dari DHT jika tersedia)
    if (sgp_available) {
      if (!isnan(temp) && !isnan(hum)) {
        sgp.setHumidity(getAbsoluteHumidity(temp, hum));
      }
      if (sgp.IAQmeasure()) {
        eco2 = sgp.eCO2;
        tvoc = sgp.TVOC;
      } else {
        eco2 = 0;
        tvoc = 0;
      }
    } else {
      eco2 = 0;
      tvoc = 0;
    }

    // 3. Hitung Kecepatan Angin
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

    // 4. Cetak Hasil Semua Sensor
    Serial.println("==========================================================");
    if (isnan(temp) || isnan(hum)) {
      Serial.println("DHT22   : GAGAL membaca (cek wiring/sensor)");
    } else {
      Serial.printf("DHT22   : Suhu %.2f C | Kelembapan %.2f %%\n", temp, hum);
    }

    if (sgp_available) {
      Serial.printf("SGP30   : eCO2 %d ppm | TVOC %d ppb\n", eco2, tvoc);
    } else {
      Serial.println("SGP30   : TIDAK TERDETEKSI");
    }

    Serial.printf("Angin   : %d pulsa | %.2f m/s\n", countCopy, wind_ms);
    Serial.println("==========================================================\n");

    timeold = millis();
  }

  vTaskDelay(1); // beri jatah waktu ke watchdog timer
}
