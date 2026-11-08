// ============================================================
// ESP32 MONITORING: DHT22 + SGP30 + ANEMOMETER + FAN TACHO
// + RELAY CONTROL + WIFI/MQTT
// ============================================================
#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <math.h>

// --- Konfigurasi WiFi & MQTT ---
const char* ssid = "Kandang rudi";
const char* password = "persib1933";
const char* mqtt_server = "172.29.223.153";

// --- Topik MQTT ---
const char* TOPIC_DATA       = "home/weather";
const char* TOPIC_RELAY_SET  = "home/relay/set";   // subscribe: kirim "ON"/"OFF" untuk kontrol relay
const char* TOPIC_RELAY_STATE= "home/relay/state"; // publish balik status relay

// --- Pin Definitions ---
#define DHTPIN 14          // Pin D14 (DHT22)
#define DHTTYPE DHT22
#define WIND_PIN 18        // Pin D18 (Anemometer)
#define SDA_PIN 21         // Pin D21 (SDA SGP30)
#define SCL_PIN 22         // Pin D22 (SCL SGP30)
#define FAN_TACHO_PIN 32   // Pin D32 (Tacho kipas 12V)
#define RELAY_PIN 27       // Pin D27 (Kontrol Relay)

// --- Objects ---
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SGP30 sgp;
WiFiClient espClient;
PubSubClient client(espClient);
bool sgp_available = false;

// --- Variables: Anemometer ---
volatile int rpmcount = 0;
volatile unsigned long last_micros = 0;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

// --- Variables: Fan Tacho ---
volatile unsigned long fan_pulse_count = 0;
volatile unsigned long fan_last_micros = 0;
portMUX_TYPE fanMux = portMUX_INITIALIZER_UNLOCKED;
// Kebanyakan kipas 12V (tipe PC fan 3-pin/4-pin) mengirim 2 pulsa per putaran
const int FAN_PULSES_PER_REV = 2;

// --- Variables: Relay ---
bool relay_state = false; // false = OFF, true = ON
bool auto_mode = true;    // true = kontrol otomatis by CO2, false = manual via MQTT

// --- Ambang batas CO2 untuk kontrol otomatis kipas (dengan hysteresis) ---
const int CO2_THRESHOLD_ON  = 600; // kipas nyala jika CO2 >= ini
const int CO2_THRESHOLD_OFF = 500; // kipas mati jika CO2 <= ini

unsigned long timeold = 0;
const int timemeasure = 30; // Waktu antar pengiriman data (detik)

float temp, hum, wind_ms;
uint16_t eco2, tvoc;
int co2_raw = 0;
float fan_rpm = 0;

// --- Helper: Cetak Timestamp Uptime [HH:MM:SS] ---
void printTimestamp() {
  unsigned long totalSeconds = millis() / 1000;
  int hours = totalSeconds / 3600;
  int minutes = (totalSeconds % 3600) / 60;
  int seconds = totalSeconds % 60;
  Serial.printf("[%02d:%02d:%02d] ", hours, minutes, seconds);
}

// --- ISR: Anemometer ---
void IRAM_ATTR rpm_anemometer() {
  unsigned long current_micros = micros();
  if (current_micros - last_micros > 10000) { // debounce 10ms
    rpmcount++;
    last_micros = current_micros;
  }
}

// --- ISR: Fan Tacho ---
void IRAM_ATTR fan_tacho_isr() {
  unsigned long current_micros = micros();
  if (current_micros - fan_last_micros > 500) { // debounce 0.5ms (fan bisa berputar cepat)
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

// --- Helper: Set & Publish Status Relay ---
void setRelay(bool state) {
  relay_state = state;
  digitalWrite(RELAY_PIN, relay_state ? HIGH : LOW);
  client.publish(TOPIC_RELAY_STATE, relay_state ? "ON" : "OFF", true); // retained
  printTimestamp();
  Serial.printf("Relay diset: %s\n", relay_state ? "ON" : "OFF");
}

// --- Callback MQTT: Menangani perintah kontrol relay ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();
  msg.toUpperCase();

  printTimestamp();
  Serial.printf("Pesan masuk [%s]: %s\n", topic, msg.c_str());

  if (String(topic) == TOPIC_RELAY_SET) {
    if (msg == "AUTO") {
      auto_mode = true;
      printTimestamp();
      Serial.println("Mode relay: AUTO (berdasarkan CO2)");
    } else if (msg == "ON" || msg == "1") {
      auto_mode = false; // perintah manual menonaktifkan auto
      setRelay(true);
    } else if (msg == "OFF" || msg == "0") {
      auto_mode = false; // perintah manual menonaktifkan auto
      setRelay(false);
    }
  }
}

// --- WiFi Setup ---
void setup_wifi() {
  delay(10);
  Serial.print("\nConnecting to "); Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.print("\n");
  printTimestamp();
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());
}

// --- MQTT Reconnect ---
void reconnect() {
  while (!client.connected()) {
    printTimestamp();
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32_Monitoring")) {
      Serial.println("connected");
      client.subscribe(TOPIC_RELAY_SET);
      client.publish(TOPIC_RELAY_STATE, relay_state ? "ON" : "OFF", true);
    } else {
      Serial.print("failed, rc="); Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      vTaskDelay(5000 / portTICK_PERIOD_MS); // cegah reset WDT saat reconnect
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=== ESP32 MONITORING: DHT22 + SGP30 + ANEMOMETER + FAN TACHO + RELAY ===\n");

  // Setup DHT22
  dht.begin();

  // Setup SGP30
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setTimeOut(1000); // timeout I2C agar tidak locking CPU
  if (sgp.begin()) {
    Serial.println("SGP30 terhubung!");
    sgp_available = true;
  } else {
    Serial.println("PERINGATAN: SGP30 tidak terdeteksi!");
    sgp_available = false;
  }

  // Setup WiFi & MQTT
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(mqttCallback);

  // Setup Anemometer
  pinMode(WIND_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_PIN), rpm_anemometer, RISING);

  // Setup Fan Tacho
  pinMode(FAN_TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FAN_TACHO_PIN), fan_tacho_isr, FALLING);

  // Setup Relay
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // default OFF

  Serial.println("\nSetup selesai. Mulai pembacaan sensor...\n");
  timeold = millis();
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

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
        co2_raw = eco2;
      } else {
        eco2 = 0;
        tvoc = 0;
        co2_raw = 0;
      }
    } else {
      eco2 = 0;
      tvoc = 0;
      co2_raw = 0;
    }

    // 3a. Kontrol Otomatis Kipas berdasarkan CO2 (hysteresis, hanya jika mode AUTO)
    if (auto_mode) {
      if (!relay_state && co2_raw >= CO2_THRESHOLD_ON) {
        setRelay(true);
      } else if (relay_state && co2_raw <= CO2_THRESHOLD_OFF) {
        setRelay(false);
      }
      // di antara CO2_THRESHOLD_OFF dan CO2_THRESHOLD_ON: biarkan kondisi relay tetap
    }

    // 3. Hitung Kecepatan Angin (Anemometer)
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

    // 4. Hitung RPM Kipas 12V (Fan Tacho)
    unsigned long fanPulseCopy = 0;
    portENTER_CRITICAL(&fanMux);
    fanPulseCopy = fan_pulse_count;
    fan_pulse_count = 0;
    portEXIT_CRITICAL(&fanMux);

    // rpm = (pulsa / pulsa_per_putaran) / (detik/60)
    fan_rpm = ((float)fanPulseCopy / FAN_PULSES_PER_REV) * (60.0 / timemeasure);

    unsigned long totalSeconds = millis() / 1000;

    // 5. Susun JSON Payload
    String payload = "{";
    payload += "\"temperature\":" + String(temp);
    payload += ",\"humidity\":" + String(hum);
    payload += ",\"wind_speed\":" + String(wind_ms);
    payload += ",\"co2\":" + String(co2_raw);
    payload += ",\"tvoc\":" + String(tvoc);
    payload += ",\"fan_rpm\":" + String(fan_rpm);
    payload += ",\"relay_state\":\"" + String(relay_state ? "ON" : "OFF") + "\"";
    payload += ",\"uptime\":" + String(totalSeconds);
    payload += "}";

    // 6. Publish MQTT
    Serial.println("==========================================================");
    printTimestamp();
    Serial.print("Publishing: "); Serial.println(payload);
    client.publish(TOPIC_DATA, payload.c_str());

    // 7. Cetak Detail Hasil Semua Sensor
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

    Serial.printf("Angin   : %lu pulsa | %.2f m/s\n", countCopy, wind_ms);
    Serial.printf("Kipas   : %lu pulsa | %.1f RPM\n", fanPulseCopy, fan_rpm);
    Serial.printf("Relay   : %s (mode: %s)\n", relay_state ? "ON" : "OFF", auto_mode ? "AUTO" : "MANUAL");
    Serial.println("==========================================================\n");

    timeold = millis();
  }

  vTaskDelay(1); // beri jatah waktu ke watchdog timer
}
