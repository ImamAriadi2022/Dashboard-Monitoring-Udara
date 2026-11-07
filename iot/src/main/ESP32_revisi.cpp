#include <Arduino.h>
// ============================================================
// ESP32 MONITORING: DHT22 + SGP30 + ANEMOMETER + FAN TACHO + RELAY
// VERSI PENGUJIAN: WiFi + MQTT (1 topik JSON), dicocokkan dengan bridge.js
// Relay module: Songle SRD-12VDC-SL-C, ACTIVE-HIGH
//
// Perintah Serial Monitor (115200, Newline) untuk memilih ID ruangan:
//   1 = h5 (default)
//   2 = seminar
//   3 = lab_kom
//   4 = lab_td
// ============================================================
#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <math.h>

// --- Konfigurasi WiFi & MQTT (sesuai bridge.js) ---
const char* ssid        = "kandangrudi";
const char* password    = "persib1933";
const char* mqtt_server = "broker.emqx.io";
const int   mqtt_port   = 1883;

// --- Topik MQTT (sesuai MQTT_TOPIC di bridge.js) ---
const char* TOPIC_DATA = "monitoring_udara_ta/data";

// --- Pin Definitions ---
#define DHTPIN 14          // DHT22
#define DHTTYPE DHT22
#define WIND_PIN 18        // Anemometer
#define SDA_PIN 21         // SGP30 SDA
#define SCL_PIN 22         // SGP30 SCL
#define FAN_TACHO_PIN 32   // Tacho kipas 12V
#define RELAY_PIN 27       // Relay
#define RELAY_ACTIVE_LOW false
#define RELAY_ON_LEVEL  (RELAY_ACTIVE_LOW ? LOW  : HIGH)
#define RELAY_OFF_LEVEL (RELAY_ACTIVE_LOW ? HIGH : LOW)

// --- Objects ---
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SGP30 sgp;
WiFiClient espClient;
PubSubClient client(espClient);
bool sgp_available = false;

// --- ID Ruangan (sesuai kolom "room" di bridge.js) ---
const char* ROOM_NAMES[4] = { "h5", "seminar", "lab_kom", "lab_td" };
int room_id = 1;   // 1=h5 (default), 2=seminar, 3=lab_kom, 4=lab_td

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
bool relay_state = false;
bool auto_mode   = true;   // selalu AUTO (kontrol manual via Serial dihapus)

// --- Ambang CO2 untuk kontrol otomatis (hysteresis) ---
const int CO2_THRESHOLD_ON  = 600;
const int CO2_THRESHOLD_OFF = 450;
const unsigned long WARMUP_MS = 60000;

// ---- variabel kalibrasi
const float TEMP_OFFSET = -1.67;

// --- Timing ---
unsigned long timeold = 0;
const int timemeasure = 15;   // detik antar pembacaan

unsigned long lastWifiAttempt = 0;
unsigned long lastMqttAttempt = 0;

float temp = NAN, hum = NAN, wind_ms = 0;
uint16_t eco2 = 0, tvoc = 0;
int co2_raw = 0;
float fan_rpm = 0;

// ============================================================
// --- STATUS KUALITAS UDARA ---
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

// --- Helper: tekanan uap jenuh (hPa) untuk koreksi kelembapan ---
float satVP(float t) {
  return 6.112f * exp((17.62f * t) / (243.12f + t));
}

// --- Helper: Timestamp uptime [HH:MM:SS] ---
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

// --- Helper: Kompensasi Humidity SGP30 ---
uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  const float absoluteHumidity = 216.7f * ((humidity / 100.0f) * 6.112f *
    exp((17.62f * temperature) / (243.12f + temperature)) / (273.15f + temperature));
  return static_cast<uint32_t>(1000.0f * absoluteHumidity);
}

// --- Helper: Set Relay (logika tidak diubah) ---
void setRelay(bool state) {
  relay_state = state;
  digitalWrite(RELAY_PIN, state ? RELAY_ON_LEVEL : RELAY_OFF_LEVEL);
  printTimestamp();
  Serial.printf("Relay diset: %s\n", relay_state ? "ON" : "OFF");
}

String jsonNum(float v) {
  return isnan(v) ? String("null") : String(v);
}

// --- Perintah Serial: pilih ID ruangan (1-4) ---
void handleSerialCommand() {
  if (!Serial.available()) return;

  String msg = Serial.readStringUntil('\n');
  msg.trim();
  if (msg.length() == 0) return;

  printTimestamp();
  Serial.printf("Perintah masuk: %s\n", msg.c_str());

  int id = msg.toInt();
  if (id >= 1 && id <= 4) {
    room_id = id;
    printTimestamp();
    Serial.printf("Ruangan diset: %d -> %s\n", room_id, ROOM_NAMES[room_id - 1]);
  } else {
    Serial.println("Perintah tidak dikenal. Gunakan: 1=h5, 2=seminar, 3=lab_kom, 4=lab_td");
  }
}

// --- WiFi & MQTT: NON-BLOCKING (sensor tetap terbaca walau koneksi gagal) ---
void maintainConnections() {
  // WiFi
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiAttempt > 10000) {
      lastWifiAttempt = millis();
      printTimestamp();
      Serial.println("WiFi belum tersambung, mencoba menyambung...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
    return;
  }

  // MQTT
  if (!client.connected()) {
    if (millis() - lastMqttAttempt > 5000) {
      lastMqttAttempt = millis();
      String clientId = "ESP32_AirMon_" + String(ROOM_NAMES[room_id - 1]) + "_" + String((uint32_t)ESP.getEfuseMac(), HEX);
      printTimestamp();
      Serial.printf("Menyambung MQTT ke %s:%d (ID: %s) ... ", mqtt_server, mqtt_port, clientId.c_str());
      if (client.connect(clientId.c_str())) {
        Serial.println("tersambung");
      } else {
        Serial.printf("gagal, rc=%d\n", client.state());
      }
    }
  }
}

void setup() {
  digitalWrite(RELAY_PIN, RELAY_OFF_LEVEL);
  pinMode(RELAY_PIN, OUTPUT);
  relay_state = false;

  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=== ESP32 MONITORING (WiFi + MQTT, MODE PENGUJIAN) ===");
  Serial.println("Pilih ruangan: 1=h5 (default), 2=seminar, 3=lab_kom, 4=lab_td");
  Serial.printf("Ruangan saat ini: %d -> %s\n\n", room_id, ROOM_NAMES[room_id - 1]);

  dht.begin();

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setTimeOut(1000);
  if (sgp.begin()) {
    Serial.println("SGP30 terhubung!");
    sgp_available = true;
  } else {
    Serial.println("PERINGATAN: SGP30 tidak terdeteksi!");
    sgp_available = false;
  }

  // Interrupt dipasang SEBELUM WiFi, jadi tidak tergantung koneksi
  pinMode(WIND_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_PIN), rpm_anemometer, RISING);

  pinMode(FAN_TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FAN_TACHO_PIN), fan_tacho_isr, FALLING);

  // WiFi & MQTT: mulai koneksi, tidak ditunggu
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  client.setServer(mqtt_server, mqtt_port);
  client.setSocketTimeout(10);  // beri waktu cukup untuk koneksi ke broker publik
  client.setBufferSize(512);    // payload JSON > 256 byte (default PubSubClient)

  Serial.println("\nSetup selesai. Mulai pembacaan sensor...\n");
  timeold = millis();
}

void loop() {
  handleSerialCommand();
  maintainConnections();
  if (client.connected()) client.loop();

  if ((millis() - timeold) >= (timemeasure * 1000UL)) {

    // 1. Baca DHT22
    float temp_raw = dht.readTemperature();
    float hum_raw  = dht.readHumidity();

    if (!isnan(temp_raw) && !isnan(hum_raw)) {
      temp = temp_raw + TEMP_OFFSET;
      hum  = hum_raw * satVP(temp_raw) / satVP(temp);
      if (hum > 100) hum = 100;
    }

    // 2. Baca SGP30
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

    // 3. Kontrol otomatis kipas berdasarkan CO2
    //    (LOGIKA SENGAJA TIDAK DIUBAH: CO2 tinggi -> setRelay(false), CO2 rendah -> setRelay(true))
    if (auto_mode && millis() > WARMUP_MS) {
      if (!relay_state && co2_raw >= CO2_THRESHOLD_ON) {
        setRelay(false);
      } else if (relay_state && co2_raw <= CO2_THRESHOLD_OFF) {
        setRelay(true);
      }
    }

    // 4. Hitung kecepatan angin
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

    // 5. Hitung RPM kipas
    unsigned long fanPulseCopy = 0;
    portENTER_CRITICAL(&fanMux);
    fanPulseCopy = fan_pulse_count;
    fan_pulse_count = 0;
    portEXIT_CRITICAL(&fanMux);

    fan_rpm = ((float)fanPulseCopy / FAN_PULSES_PER_REV) * (60.0 / timemeasure);

    // 6. Klasifikasi kualitas per parameter
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

    // 7. JSON payload (sesuai field yang dibaca bridge.js, termasuk "room")
    unsigned long uptimeSec = millis() / 1000;
    String payload = "{";
    payload += "\"room\":\"" + String(ROOM_NAMES[room_id - 1]) + "\"";
    payload += ",\"temperature\":" + jsonNum(temp);
    payload += ",\"humidity\":" + jsonNum(hum);
    payload += ",\"wind_speed\":" + jsonNum(wind_ms);
    payload += ",\"co2\":" + String(co2_raw);
    payload += ",\"tvoc\":" + String(tvoc);
    payload += ",\"fan_rpm\":" + jsonNum(fan_rpm);
    payload += ",\"relay_state\":\"" + String(relay_state ? "ON" : "OFF") + "\"";
    payload += ",\"air_quality\":\"" + airQualityStatus + "\"";
    payload += ",\"uptime\":" + String(uptimeSec);
    payload += ",\"air_quality_detail\":{";
    payload += "\"temperature\":\"" + String(levelToString(tempLevel)) + "\"";
    payload += ",\"humidity\":\"" + String(levelToString(humLevel)) + "\"";
    payload += ",\"co2\":\"" + String(levelToString(co2Level)) + "\"";
    payload += "}";
    payload += "}";

    // 8. Publish MQTT (hanya jika tersambung)
    Serial.println("==========================================================");
    printTimestamp();
    if (client.connected()) {
      bool ok = client.publish(TOPIC_DATA, payload.c_str());
      Serial.printf("Publish %s -> %s\n", TOPIC_DATA, ok ? "OK" : "GAGAL");
    } else {
      Serial.println("MQTT tidak tersambung, data tidak dikirim");
    }
    Serial.print("Payload : "); Serial.println(payload);

    // 9. Tampilan Serial Monitor
    Serial.printf("Ruangan    : %d -> %s\n", room_id, ROOM_NAMES[room_id - 1]);
    if (isnan(temp) || isnan(hum)) {
      Serial.println("DHT22   : GAGAL membaca (cek wiring/sensor)");
    } else {
      Serial.printf("Suhu       : %.2f C   -> %s\n", temp, levelToString(tempLevel));
      Serial.printf("Kelembapan : %.2f %%  -> %s\n", hum, levelToString(humLevel));
    }

    if (sgp_available) {
      Serial.printf("CO2        : %d ppm  -> %s  (TVOC %d ppb)\n", co2_raw, levelToString(co2Level), tvoc);
    } else {
      Serial.println("SGP30      : TIDAK TERDETEKSI");
    }

    Serial.printf("Angin      : %d pulsa | %.2f m/s\n", countCopy, wind_ms);
    Serial.printf("Kipas      : %lu pulsa | %.1f RPM\n", fanPulseCopy, fan_rpm);
    Serial.printf("Relay      : %s (mode: AUTO)\n", relay_state ? "ON" : "OFF");
    Serial.printf("WiFi: %s | MQTT: %s\n",
                  WiFi.status() == WL_CONNECTED ? "OK" : "TERPUTUS",
                  client.connected() ? "OK" : "TERPUTUS");
    Serial.println("==========================================================\n");
    timeold = millis();
  }

  vTaskDelay(1);
}
