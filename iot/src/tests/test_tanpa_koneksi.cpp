#include <Arduino.h>
// ============================================================
// ESP32 MONITORING: DHT22 + SGP30 + ANEMOMETER + FAN TACHO + RELAY
// VERSI TESTING: TANPA WiFi & MQTT (semua lewat Serial Monitor)
// Relay module: Songle SRD-12VDC-SL-C, ACTIVE-HIGH
//   -> HIGH on RELAY_PIN = relay energized = fan ON
//   -> LOW  on RELAY_PIN = relay de-energized = fan OFF
//
// Perintah Serial Monitor (115200, Newline):
//   ON   atau 1 = kipas ON  (mode MANUAL)
//   OFF  atau 0 = kipas OFF (mode MANUAL)
//   AUTO        = kontrol otomatis berdasarkan CO2
// ============================================================
#include "DHT.h"
#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <math.h>

// --- Pin Definitions ---
#define DHTPIN 14          // Pin D14 (DHT22)
#define DHTTYPE DHT22
#define WIND_PIN 18        // Pin D18 (Anemometer)
#define SDA_PIN 21         // Pin D21 (SDA SGP30)
#define SCL_PIN 22         // Pin D22 (SCL SGP30)
#define FAN_TACHO_PIN 32   // Pin D32 (Tacho kipas 12V)
#define RELAY_PIN 27       // Pin D27 (Kontrol Relay, ACTIVE-HIGH)

// --- Objects ---
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SGP30 sgp;
bool sgp_available = false;

// --- Variables: Anemometer ---
volatile int rpmcount = 0;
volatile unsigned long last_micros = 0;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

// --- Variables: Fan Tacho ---
volatile unsigned long fan_pulse_count = 0;
volatile unsigned long fan_last_micros = 0;
portMUX_TYPE fanMux = portMUX_INITIALIZER_UNLOCKED;
const int FAN_PULSES_PER_REV = 2;

// --- Variables: Relay ---
bool relay_state = false; // false = OFF (LOW), true = ON (HIGH)
bool auto_mode   = true;  // true = otomatis by CO2, false = manual via Serial

// --- Ambang batas CO2 untuk kontrol otomatis kipas (hysteresis) ---
const int CO2_THRESHOLD_ON  = 600;
const int CO2_THRESHOLD_OFF = 500;
const unsigned long WARMUP_MS = 60000; // tunggu 60 detik setelah boot

unsigned long timeold = 0;
const int timemeasure = 30; // Waktu antar pembacaan (detik)

float temp, hum, wind_ms;
uint16_t eco2, tvoc;
int co2_raw = 0;
float fan_rpm = 0;

// ============================================================
// --- STATUS KUALITAS UDARA (AMAN / PERINGATAN / BAHAYA) ---
// ============================================================
const float TEMP_SAFE_LIMIT  = 32.0;  // °C
const float TEMP_WARN_MARGIN = 2.0;
const float HUM_SAFE_LIMIT   = 70.0;  // %RH
const float HUM_WARN_MARGIN  = 5.0;
const int   CO2_SAFE_LIMIT   = 800;   // ppm
const int   CO2_WARN_MARGIN  = 100;

enum AirLevel { LEVEL_AMAN = 0, LEVEL_PERINGATAN = 1, LEVEL_BAHAYA = 2 };
String airQualityStatus = "AMAN";

const char* levelToString(AirLevel lvl) {
  switch (lvl) {
    case LEVEL_AMAN:       return "AMAN";
    case LEVEL_PERINGATAN: return "PERINGATAN";
    case LEVEL_BAHAYA:     return "BAHAYA";
  }
  return "UNKNOWN";
}

AirLevel classifyLevel(float value, float safeLimit, float margin) {
  if (value >= safeLimit) return LEVEL_BAHAYA;
  if (value >= (safeLimit - margin)) return LEVEL_PERINGATAN;
  return LEVEL_AMAN;
}

// --- Helper: Cetak Timestamp Uptime [HH:MM:SS] ---
void printTimestamp() {
  unsigned long totalSeconds = millis() / 1000;
  int hours = totalSeconds / 3600;
  int minutes = (totalSeconds % 3600) / 60;
  int seconds = totalSeconds % 60;
  Serial.printf("[%02d:%02d:%02d] ", hours, minutes, seconds);
}

// --- ISR: Anemometer (debounce 10ms) ---
void IRAM_ATTR rpm_anemometer() {
  unsigned long current_micros = micros();
  if (current_micros - last_micros > 10000) {
    rpmcount++;
    last_micros = current_micros;
  }
}

// --- ISR: Fan Tacho (debounce 0.5ms) ---
void IRAM_ATTR fan_tacho_isr() {
  unsigned long current_micros = micros();
  if (current_micros - fan_last_micros > 500) {
    fan_pulse_count++;
    fan_last_micros = current_micros;
  }
}

// --- Helper: Kompensasi Humidity untuk SGP30 ---
uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  const float absoluteHumidity = 216.7f * ((humidity / 100.0f) * 6.112f *
    exp((17.62f * temperature) / (243.12f + temperature)) / (273.15f + temperature));
  return static_cast<uint32_t>(1000.0f * absoluteHumidity);
}

// --- Helper: Set Relay (ACTIVE-HIGH: HIGH = ON) ---
void setRelay(bool state) {
  relay_state = state;
  digitalWrite(RELAY_PIN, relay_state ? HIGH : LOW);
  printTimestamp();
  Serial.printf("Relay diset: %s\n", relay_state ? "ON" : "OFF");
}

// --- Baca perintah dari Serial Monitor (pengganti callback MQTT) ---
void handleSerialCommand() {
  if (!Serial.available()) return;

  String msg = Serial.readStringUntil('\n');
  msg.trim();
  msg.toUpperCase();
  if (msg.length() == 0) return;

  printTimestamp();
  Serial.printf("Perintah masuk: %s\n", msg.c_str());

  if (msg == "AUTO") {
    auto_mode = true;
    printTimestamp();
    Serial.println("Mode relay: AUTO (berdasarkan CO2)");
  } else if (msg == "ON" || msg == "1") {
    auto_mode = false;
    setRelay(true);
  } else if (msg == "OFF" || msg == "0") {
    auto_mode = false;
    setRelay(false);
  } else {
    Serial.println("Perintah tidak dikenal. Gunakan: ON / OFF / AUTO");
  }
}

void setup() {
  // Relay pin PERTAMA: LOW menjamin kipas OFF saat boot
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=== ESP32 MONITORING (TESTING, TANPA WiFi/MQTT) ===");
  Serial.println("Perintah: ON / OFF / AUTO\n");

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

  // Setup Fan Tacho
  pinMode(FAN_TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FAN_TACHO_PIN), fan_tacho_isr, FALLING);

  Serial.println("\nSetup selesai. Mulai pembacaan sensor...\n");
  timeold = millis();
}

void loop() {
  handleSerialCommand();

  if ((millis() - timeold) >= (timemeasure * 1000UL)) {

    // 1. Baca DHT22
    temp = dht.readTemperature();
    hum  = dht.readHumidity();

    // 2. Baca SGP30 (kompensasi humidity dari DHT jika tersedia)
    if (sgp_available) {
      if (!isnan(temp) && !isnan(hum)) {
        sgp.setHumidity(getAbsoluteHumidity(temp, hum));
      }
      if (sgp.IAQmeasure()) {
        eco2 = sgp.eCO2;
        tvoc = sgp.TVOC;
        co2_raw = eco2;
      } else {
        eco2 = 0; tvoc = 0; co2_raw = 0;
      }
    } else {
      eco2 = 0; tvoc = 0; co2_raw = 0;
    }

    // 3a. Kontrol Otomatis Kipas berdasarkan CO2 (hysteresis)
    if (auto_mode && millis() > WARMUP_MS) {
      if (!relay_state && co2_raw >= CO2_THRESHOLD_ON) {
        setRelay(true);
      } else if (relay_state && co2_raw <= CO2_THRESHOLD_OFF) {
        setRelay(false);
      }
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

    // 4. Hitung RPM Kipas 12V
    unsigned long fanPulseCopy = 0;
    portENTER_CRITICAL(&fanMux);
    fanPulseCopy = fan_pulse_count;
    fan_pulse_count = 0;
    portEXIT_CRITICAL(&fanMux);

    fan_rpm = ((float)fanPulseCopy / FAN_PULSES_PER_REV) * (60.0 / timemeasure);

    // 4b. Klasifikasi Status Kualitas Udara
    AirLevel tempLevel = (!isnan(temp)) ? classifyLevel(temp, TEMP_SAFE_LIMIT, TEMP_WARN_MARGIN) : LEVEL_AMAN;
    AirLevel humLevel  = (!isnan(hum))  ? classifyLevel(hum, HUM_SAFE_LIMIT, HUM_WARN_MARGIN)     : LEVEL_AMAN;
    AirLevel co2Level  = classifyLevel((float)co2_raw, (float)CO2_SAFE_LIMIT, (float)CO2_WARN_MARGIN);

    int countBahaya     = (tempLevel == LEVEL_BAHAYA) + (humLevel == LEVEL_BAHAYA) + (co2Level == LEVEL_BAHAYA);
    int countPeringatan = (tempLevel >= LEVEL_PERINGATAN) + (humLevel >= LEVEL_PERINGATAN) + (co2Level >= LEVEL_PERINGATAN);

    AirLevel overallLevel;
    if (countBahaya >= 2)          overallLevel = LEVEL_BAHAYA;
    else if (countPeringatan >= 2) overallLevel = LEVEL_PERINGATAN;
    else                           overallLevel = LEVEL_AMAN;
    airQualityStatus = levelToString(overallLevel);

    // 5. Cetak Hasil ke Serial Monitor
    Serial.println("==========================================================");
    printTimestamp();
    Serial.println("Hasil pembacaan sensor:");

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
    Serial.printf("Kipas   : %lu pulsa | %.1f RPM\n", fanPulseCopy, fan_rpm);
    Serial.printf("Relay   : %s (mode: %s)\n", relay_state ? "ON" : "OFF", auto_mode ? "AUTO" : "MANUAL");
    Serial.printf("Kualitas Udara: %s  (Suhu: %s | Kelembapan: %s | CO2: %s)\n",
                  airQualityStatus.c_str(),
                  levelToString(tempLevel), levelToString(humLevel), levelToString(co2Level));
    Serial.println("==========================================================\n");

    timeold = millis();
  }

  vTaskDelay(1); // beri jatah waktu ke watchdog timer
}
