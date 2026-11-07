#include <Arduino.h>
/*============================================================
 * UJI KIPAS 12V BERDASARKAN SENSOR SGP30
 * ESP32 WROOM 38 PIN
 *
 * Relay     : GPIO18 (ACTIVE-HIGH secara default)
 * Fan Tacho : GPIO19
 * SGP30 SDA : GPIO21
 * SGP30 SCL : GPIO22
 *
 * Pembacaan SGP30 : setiap 1 detik
 * Laporan Serial  : setiap 10 detik
 *
 * Kontrol otomatis dengan hysteresis:
 * eCO2 >= 600 ppm -> KIPAS ON
 * eCO2 <= 500 ppm -> KIPAS OFF
 * 500 < eCO2 < 600 -> pertahankan kondisi sebelumnya
 *
 * Serial Monitor: 115200 baud, Newline
 * AUTO      = mode otomatis
 * ON / 1    = kipas ON manual
 * OFF / 0   = kipas OFF manual
============================================================*/

#include <Wire.h>
#include <math.h>
#include "DHT.h"
#include "Adafruit_SGP30.h"

#define RELAY_PIN 18
#define TACHO_PIN 19
#define SDA_PIN 21
#define SCL_PIN 22
#define DHTPIN 23
#define DHTTYPE DHT22

// Relay aktif-HIGH
#define RELAY_ACTIVE_LOW false
#define RELAY_ON_LEVEL  (RELAY_ACTIVE_LOW ? LOW : HIGH)
#define RELAY_OFF_LEVEL (RELAY_ACTIVE_LOW ? HIGH : LOW)

// ============================================================
// OBJEK SENSOR
// ============================================================
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SGP30 sgp;

bool sgp_available = false;
bool dht_available = false;
bool sgp_reading_valid = false;
bool dht_reading_valid = false;

// Data DHT22
float temp = NAN;
float hum = NAN;

// Data SGP30
uint16_t eco2 = 0;
uint16_t tvoc = 0;

//data paksa
bool forcedCO2 = false;
int forcedCO2Value = 0;

// Jika kalibrasi -1.67 C memang sudah divalidasi,
// pertahankan nilainya. Jika belum, ubah menjadi 0.0.
const float TEMP_OFFSET = -1.67f;

// ============================================================
// KONTROL RELAY
// ============================================================
const int CO2_THRESHOLD_ON = 600;
const int CO2_THRESHOLD_OFF = 500;

const unsigned long WARMUP_MS = 60000;

bool fanOn = false;
bool autoMode = true;

// ============================================================
// TACHOMETER KIPAS
// ============================================================
const int PULSES_PER_REV = 2;

volatile unsigned long pulseCount = 0;
volatile unsigned long lastPulseMicros = 0;

portMUX_TYPE tachoMux = portMUX_INITIALIZER_UNLOCKED;

float fanRPM = 0;

// ============================================================
// INTERVAL PEMBACAAN
// ============================================================
const unsigned long DHT_INTERVAL_MS = 2000;
const unsigned long SGP_INTERVAL_MS = 1000;
const unsigned long REPORT_INTERVAL_MS = 10000;

unsigned long startTime = 0;
unsigned long lastDHTRead = 0;
unsigned long lastSGPRead = 0;
unsigned long lastReport = 0;

// ============================================================
// PERHITUNGAN TEKANAN UAP JENUH
// ============================================================
float satVP(float t) {
  return 6.112f * exp(
    (17.62f * t) / (243.12f + t)
  );
}

// ============================================================
// KOMPENSASI KELEMBAPAN ABSOLUT SGP30
// ============================================================
uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  const float absoluteHumidity =
    216.7f *
    ((humidity / 100.0f) * 6.112f *
    exp((17.62f * temperature) /
    (243.12f + temperature)) /
    (273.15f + temperature));

  return static_cast<uint32_t>(
    1000.0f * absoluteHumidity
  );
}

// ============================================================
// INTERRUPT TACHOMETER
// ============================================================
void IRAM_ATTR tachoISR() {
  unsigned long now = micros();

  if (now - lastPulseMicros > 500) {
    portENTER_CRITICAL_ISR(&tachoMux);
    pulseCount++;
    portEXIT_CRITICAL_ISR(&tachoMux);

    lastPulseMicros = now;
  }
}

// ============================================================
// KONTROL RELAY
// ============================================================
void setFan(bool state) {
  fanOn = state;

  digitalWrite(
    RELAY_PIN,
    state ? RELAY_ON_LEVEL : RELAY_OFF_LEVEL
  );

  Serial.printf(
    "[KIPAS] Status: %s\n",
    fanOn ? "ON" : "OFF"
  );
}

// ============================================================
// PERINTAH SERIAL
// ============================================================

void handleSerialCommand() {
  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toUpperCase();

  // Memasukkan CO2 paksa: CO2 700
  if (cmd.startsWith("CO2 ")) {
    String value = cmd.substring(4);
    value.trim();

    if (value == "OFF") {
      forcedCO2 = false;
      Serial.println(
        "[CO2] Override dinonaktifkan. "
        "Kembali menggunakan SGP30."
      );
      return;
    }

    // Pastikan input hanya berisi angka
    bool validInteger = value.length() > 0;

    for (unsigned int i = 0; i < value.length(); i++) {
      if (!isDigit(value[i])) {
        validInteger = false;
        break;
      }
    }

    long parsedValue = value.toInt();

    if (validInteger &&
        parsedValue >= 0 &&
        parsedValue <= 10000) {

      forcedCO2Value = (int)parsedValue;
      forcedCO2 = true;

      Serial.printf(
        "[CO2] Nilai paksa diatur: %d ppm\n",
        forcedCO2Value
      );
    } else {
      Serial.println(
        "[ERROR] Gunakan CO2 <angka 0-10000> "
        "atau CO2 OFF."
      );
    }

    return;
  }

  if (cmd == "AUTO") {
    autoMode = true;
    Serial.println("[MODE] AUTO berdasarkan CO2");
  }
  else if (cmd == "ON" || cmd == "1") {
    autoMode = false;
    setFan(true);
    Serial.println("[MODE] MANUAL ON");
  }
  else if (cmd == "OFF" || cmd == "0") {
    autoMode = false;
    setFan(false);
    Serial.println("[MODE] MANUAL OFF");
  }
  else {
    Serial.println(
      "Gunakan AUTO, ON, OFF, 1, 0, "
      "CO2 <angka>, atau CO2 OFF."
    );
  }
}

// ============================================================
// BACA DHT22
// ============================================================
void readDHT22() {
  float tempRaw = dht.readTemperature();
  float humRaw = dht.readHumidity();

  if (isnan(tempRaw) || isnan(humRaw) ||
      humRaw < 0 || humRaw > 100) {
    dht_reading_valid = false;
    Serial.println("[ERROR] Pembacaan DHT22 gagal");
    return;
  }

  // Koreksi suhu berdasarkan hasil kalibrasi
  float correctedTemp = tempRaw + TEMP_OFFSET;

  // Koreksi RH untuk mempertahankan tekanan uap
  // ketika suhu dikoreksi.
  float correctedHum =
    humRaw * satVP(tempRaw) / satVP(correctedTemp);

  if (!isfinite(correctedTemp) ||
      !isfinite(correctedHum) ||
      correctedHum < 0 ||
      correctedHum > 100) {
    dht_reading_valid = false;
    Serial.println("[ERROR] Hasil koreksi DHT22 tidak valid");
    return;
  }

  temp = correctedTemp;
  hum = correctedHum;
  dht_reading_valid = true;
}

// ============================================================
// BACA SGP30 + KOMPENSASI DHT22
// ============================================================
void readSGP30() {
  if (!sgp_available) {
    sgp_reading_valid = false;
    return;
  }

  // Gunakan data DHT22 terbaru yang valid.
  // Jika DHT22 gagal dibaca, gunakan kompensasi terakhir
  // yang valid jika pernah tersedia.
  if (dht_reading_valid &&
      isfinite(temp) && isfinite(hum)) {
    uint32_t absHumidity =
      getAbsoluteHumidity(temp, hum);

    sgp.setHumidity(absHumidity);
  }

  if (sgp.IAQmeasure()) {
    eco2 = sgp.eCO2;
    tvoc = sgp.TVOC;

    sgp_reading_valid = true;
  } else {
    sgp_reading_valid = false;
    Serial.println("[ERROR] Pembacaan SGP30 gagal");
  }
}

// ============================================================
// KONTROL OTOMATIS BERDASARKAN eCO2
// ============================================================

void updateFanControl() {
  if (!autoMode) return;

  // Jika tidak menggunakan CO2 paksa,
  // SGP30 harus tersedia dan datanya valid.
  if (!forcedCO2 &&
      (!sgp_available || !sgp_reading_valid)) {
    return;
  }

  // Tetap mengikuti waktu pemanasan awal 60 detik
  if (millis() - startTime < WARMUP_MS) {
    return;
  }

  // Pilih sumber CO2
  int controlCO2 = forcedCO2
                 ? forcedCO2Value
                 : (int)eco2;

  if (!fanOn && controlCO2 >= CO2_THRESHOLD_ON) {
    setFan(true);
    Serial.printf(
      "[AUTO] CO2 %d ppm -> kipas ON\n",
      controlCO2
    );
  }
  else if (fanOn &&
           controlCO2 <= CO2_THRESHOLD_OFF) {
    setFan(false);
    Serial.printf(
      "[AUTO] CO2 %d ppm -> kipas OFF\n",
      controlCO2
    );
  }
}

// ============================================================
// HITUNG RPM
// ============================================================
void updateFanRPM() {
  unsigned long count;

  portENTER_CRITICAL(&tachoMux);
  count = pulseCount;
  pulseCount = 0;
  portEXIT_CRITICAL(&tachoMux);

  // Fungsi dipanggil kira-kira setiap 1 detik
  fanRPM =
    (count / (float)PULSES_PER_REV) * 60.0f;
}

// ============================================================
// LAPORAN SERIAL SETIAP 10 DETIK
// ============================================================
void printReport() {
  Serial.println("\n========================================");

  Serial.printf(
    "Waktu aktif : %lu detik\n",
    millis() / 1000
  );
  
if (forcedCO2) {
  Serial.printf(
    "CO2 paksa   : %d ppm (OVERRIDE)\n",
    forcedCO2Value
  );

  if (sgp_available && sgp_reading_valid) {
    Serial.printf(
      "SGP30 eCO2  : %u ppm (aktual)\n",
      eco2
    );
  } else {
    Serial.println(
      "SGP30       : DATA TIDAK VALID"
    );
  }
}
else if (sgp_available && sgp_reading_valid) {
  Serial.printf("eCO2        : %u ppm\n", eco2);
  Serial.printf("TVOC        : %u ppb\n", tvoc);
}
else {
  Serial.println("SGP30       : DATA TIDAK VALID");
}


  if (dht_reading_valid) {
    Serial.printf("Suhu        : %.2f C\n", temp);
    Serial.printf("Kelembapan  : %.2f %%RH\n", hum);
  } else {
    Serial.println("DHT22       : DATA TIDAK VALID");
  }

  if (sgp_available && sgp_reading_valid) {
    Serial.printf("eCO2        : %u ppm\n", eco2);
    Serial.printf("TVOC        : %u ppb\n", tvoc);
  } else {
    Serial.println("SGP30       : DATA TIDAK VALID");
  }

  unsigned long elapsed = millis() - startTime;

  if (elapsed < WARMUP_MS) {
    Serial.printf(
      "Pemanasan  : %lu detik tersisa\n",
      (WARMUP_MS - elapsed + 999) / 1000
    );
  }

  Serial.printf("Kipas       : %s\n", fanOn ? "ON" : "OFF");
  Serial.printf("Mode        : %s\n", autoMode ? "AUTO" : "MANUAL");
  Serial.printf("RPM kipas   : %.0f\n", fanRPM);

  Serial.printf(
    "Ambang ON/OFF: %d / %d ppm\n",
    CO2_THRESHOLD_ON,
    CO2_THRESHOLD_OFF
  );

  Serial.println("========================================\n");
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  Serial.setTimeout(50);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_OFF_LEVEL);
  fanOn = false;

  Serial.println("\n=== UJI KIPAS: DHT22 + SGP30 ===");

  // DHT22
  dht.begin();
  dht_available = true;

  // I2C SGP30
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setTimeOut(1000);

  if (sgp.begin()) {
    sgp_available = true;
    Serial.println("SGP30 berhasil terhubung.");
  } else {
    sgp_available = false;
    Serial.println("ERROR: SGP30 tidak terdeteksi.");
  }

  // Tachometer
  pinMode(TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(
    digitalPinToInterrupt(TACHO_PIN),
    tachoISR,
    FALLING
  );

  startTime = millis();

  // Jadwalkan pembacaan pertama tanpa menunggu 10 detik
  lastDHTRead = millis() - DHT_INTERVAL_MS;
  lastSGPRead = millis() - SGP_INTERVAL_MS;
  lastReport = millis();

  Serial.println("DHT22 : pembacaan setiap 2 detik");
  Serial.println("SGP30 : pembacaan setiap 1 detik");
  Serial.println("Laporan: setiap 10 detik");
  Serial.println("Perintah: AUTO, ON, OFF");
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  handleSerialCommand();

  unsigned long now = millis();

  // 1. DHT22 dibaca setiap 2 detik
  if (now - lastDHTRead >= DHT_INTERVAL_MS) {
    lastDHTRead = now;
    readDHT22();
  }

  // 2. SGP30 dibaca setiap 1 detik
  if (now - lastSGPRead >= SGP_INTERVAL_MS) {
    lastSGPRead = now;

    readSGP30();
    updateFanControl();
    updateFanRPM();
  }

  // 3. Laporan setiap 10 detik
  if (now - lastReport >= REPORT_INTERVAL_MS) {
    lastReport = now;
    printReport();
  }

  delay(1);
}
