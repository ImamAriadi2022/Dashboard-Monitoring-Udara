// ============================================================
// ESP32 MONITORING: DHT22 + SGP30 + ANEMOMETER + FAN TACHO + RELAY
// VERSI PENGUJIAN: WiFi + MQTT (1 topik JSON), dicocokkan dengan bridge.js
// Relay module: Songle SRD-12VDC-SL-C, ACTIVE-HIGH
//
// Konfigurasi Ruangan, WiFi SSID, dan Password diinput secara
// interaktif melalui Serial Monitor (115200 baud) tanpa hardcode.
// ============================================================
#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <math.h>

// --- Konfigurasi WiFi & MQTT (Diisi melalui input Serial Monitor) ---
String wifi_ssid     = "";
String wifi_password = "";
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

// --- ID Ruangan (sesuai kolom "room" di bridge.js, dipilih via Serial Monitor) ---
const char* ROOM_NAMES[4] = { "h5", "seminar", "lab_kom", "lab_td" };
int room_id = 0;   // 0 = belum dipilih; 1=h5, 2=seminar, 3=lab_kom, 4=lab_td

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
const float TEMP_SAFE_LIMIT  = 32.0;  // Â°C
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

// --- Helper: Auto-Detect pembacaan DHT22 maupun DHT11 tanpa perlu ganti kodingan ---
const char* dhtDetectedType = "DHT22/DHT11";
bool readDHTAuto(DHT &sensor, float &outTemp, float &outHum) {
  float tRaw = sensor.readTemperature();
  float hRaw = sensor.readHumidity();

  if (isnan(tRaw) || isnan(hRaw)) {
    return false;
  }

  // Jika nilai masih dalam rentang normal (<= 80 C dan <= 100 %), maka sensor adalah DHT22
  if (tRaw >= -20.0f && tRaw <= 80.0f && hRaw >= 1.0f && hRaw <= 100.0f) {
    outTemp = tRaw;
    outHum  = hRaw;
    dhtDetectedType = "DHT22";
    return true;
  }

  // Jika nilai > 80 C atau > 100 %, berarti yang terpasang adalah DHT11
  // (karena byte integer DHT11 berada di byte atas saat dibaca dengan mode DHT22)
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

// --- Helper: Baca 1 baris input dari Serial Monitor (dengan echo & anti-timeout) ---
String readSerialLineBlocking(const char* promptText) {
  // Bersihkan sisa karakter newline sebelumnya
  while (Serial.available()) {
    char c = Serial.peek();
    if (c == '\r' || c == '\n') Serial.read();
    else break;
  }

  String buffer = "";
  unsigned long lastPromptTime = millis();
  Serial.print(promptText);

  while (true) {
    // Jika user belum mengetik apa-apa selama 6 detik (misal baru membuka Serial Monitor),
    // tampilkan ulang prompt agar selalu terlihat di layar.
    if (buffer.length() == 0 && (millis() - lastPromptTime >= 6000)) {
      lastPromptTime = millis();
      Serial.println();
      Serial.print(promptText);
    }

    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\r' || c == '\n') {
        delay(15);
        while (Serial.available() && (Serial.peek() == '\r' || Serial.peek() == '\n')) {
          Serial.read();
        }
        buffer.trim();
        if (buffer.length() > 0) {
          Serial.println();
          return buffer;
        } else {
          Serial.println();
          Serial.print(promptText);
          lastPromptTime = millis();
        }
      } else if (c == '\b' || c == 127) {
        if (buffer.length() > 0) {
          buffer.remove(buffer.length() - 1);
          Serial.print("\b \b");
        }
      } else if (c >= 32) {
        buffer += c;
        Serial.print(c); // echo ke layar agar terlihat saat diketik
      }
    }
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

// --- Helper: Input Interaktif Pilih Ruangan via Serial Monitor ---
void promptRoomSelection() {
  Serial.println("\n==========================================================");
  Serial.println("  PILIH RUANGAN MONITORING UDARA");
  Serial.println("==========================================================");
  Serial.println("  1 = h5");
  Serial.println("  2 = seminar");
  Serial.println("  3 = lab_kom");
  Serial.println("  4 = lab_td");
  Serial.println("----------------------------------------------------------");

  while (true) {
    String in = readSerialLineBlocking(">> Ketik nomor/nama ruangan (1-4) lalu Enter: ");
    String lower = in;
    lower.toLowerCase();

    int id = in.toInt();
    if (id >= 1 && id <= 4) {
      room_id = id;
      break;
    } else if (lower == "h5") {
      room_id = 1; break;
    } else if (lower == "seminar") {
      room_id = 2; break;
    } else if (lower == "lab_kom") {
      room_id = 3; break;
    } else if (lower == "lab_td") {
      room_id = 4; break;
    }
    Serial.println("[!] Pilihan tidak valid. Ketik angka 1, 2, 3, atau 4.");
  }

  Serial.printf("[OK] Ruangan terpilih: %d -> %s\n", room_id, ROOM_NAMES[room_id - 1]);
}

// --- Helper: Input Interaktif WiFi SSID & Password via Serial Monitor ---
void promptWiFiCredentials() {
  Serial.println("\n==========================================================");
  Serial.println("  KONFIGURASI WIFI ESP32");
  Serial.println("==========================================================");
  Serial.println("Memindai jaringan WiFi di sekitar...");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  int n = WiFi.scanNetworks();
  if (n > 0) {
    Serial.printf("Ditemukan %d jaringan WiFi:\n", n);
    for (int i = 0; i < n && i < 10; i++) {
      Serial.printf("  [%d] %s (%d dBm)\n", i + 1, WiFi.SSID(i).c_str(), WiFi.RSSI(i));
    }
    Serial.println("----------------------------------------------------------");
    Serial.println("Tips: Anda bisa mengetik NAMA WiFi langsung, atau ketik");
    Serial.println("      NOMOR urut WiFi di atas (contoh: 1).");
  } else {
    Serial.println("(Tidak ada daftar scan, silakan ketik nama SSID manual)");
  }

  String ssidInput = readSerialLineBlocking(">> Masukkan Nama WiFi (SSID) lalu Enter: ");
  int chosenIdx = ssidInput.toInt();
  if (n > 0 && chosenIdx >= 1 && chosenIdx <= n && String(chosenIdx) == ssidInput) {
    wifi_ssid = WiFi.SSID(chosenIdx - 1);
  } else {
    wifi_ssid = ssidInput;
  }
  Serial.printf("[OK] Nama WiFi (SSID): %s\n", wifi_ssid.c_str());

  String passInput = readSerialLineBlocking(">> Masukkan Password WiFi lalu Enter (ketik - jika tanpa password): ");
  if (passInput == "-") {
    wifi_password = "";
  } else {
    wifi_password = passInput;
  }
  Serial.println("[OK] Password WiFi diterima.");
  Serial.printf("Menyambungkan ke WiFi \"%s\" ", wifi_ssid.c_str());

  WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt < 12000)) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[OK] WiFi Tersambung! IP: %s | RSSI: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("[!] WiFi belum tersambung (ESP32 akan terus mencoba di background).");
    Serial.println("    Ketik WIFI kapan saja di Serial Monitor jika ingin ganti SSID/Password.");
  }
  lastWifiAttempt = millis();
}

// --- Perintah Serial saat runtime: 1-4 (ruangan), WIFI, ROOM, ON/OFF/AUTO ---
String runtimeSerialBuf = "";
void handleSerialCommand() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r' || c == '\n') {
      runtimeSerialBuf.trim();
      if (runtimeSerialBuf.length() == 0) continue;

      String msg = runtimeSerialBuf;
      runtimeSerialBuf = "";
      String upper = msg;
      upper.toUpperCase();

      Serial.println();
      printTimestamp();
      Serial.printf("Perintah masuk: %s\n", msg.c_str());

      if (upper == "ON") {
        auto_mode = false;
        setRelay(true);
        return;
      } else if (upper == "OFF") {
        auto_mode = false;
        setRelay(false);
        return;
      } else if (upper == "AUTO") {
        auto_mode = true;
        printTimestamp();
        Serial.println("Mode relay: AUTO (berdasarkan CO2)");
        return;
      } else if (upper == "WIFI") {
        promptWiFiCredentials();
        timeold = millis();
        return;
      } else if (upper == "ROOM" || upper == "RUANGAN") {
        promptRoomSelection();
        if (client.connected()) client.disconnect();
        timeold = millis();
        return;
      }

      int id = msg.toInt();
      if (id >= 1 && id <= 4) {
        room_id = id;
        printTimestamp();
        Serial.printf("Ruangan diset: %d -> %s\n", room_id, ROOM_NAMES[room_id - 1]);
        if (client.connected()) client.disconnect();
      } else {
        Serial.println("Perintah: 1=h5, 2=seminar, 3=lab_kom, 4=lab_td | WIFI | ROOM | ON / OFF / AUTO");
      }
    } else if (c == '\b' || c == 127) {
      if (runtimeSerialBuf.length() > 0) {
        runtimeSerialBuf.remove(runtimeSerialBuf.length() - 1);
        Serial.print("\b \b");
      }
    } else if (c >= 32) {
      runtimeSerialBuf += c;
      Serial.print(c);
    }
  }
}

// --- WiFi & MQTT: NON-BLOCKING (sensor tetap terbaca walau koneksi gagal) ---
void maintainConnections() {
  if (wifi_ssid.length() == 0) return;

  // WiFi
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiAttempt > 10000) {
      lastWifiAttempt = millis();
      printTimestamp();
      Serial.printf("WiFi \"%s\" belum tersambung, mencoba menyambung...\n", wifi_ssid.c_str());
      WiFi.disconnect();
      WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
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
  Serial.println("\n=== ESP32 MONITORING UDARA (WiFi + MQTT DINAMIS) ===");

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

  // Interrupt dipasang SEBELUM WiFi
  pinMode(WIND_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_PIN), rpm_anemometer, RISING);

  pinMode(FAN_TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FAN_TACHO_PIN), fan_tacho_isr, FALLING);

  // 1. Minta user memilih ruangan via Serial Monitor
  promptRoomSelection();

  // 2. Minta user memasukkan WiFi SSID & Password via Serial Monitor
  promptWiFiCredentials();

  // 3. Siapkan MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setSocketTimeout(10);  // beri waktu cukup untuk koneksi ke broker publik
  client.setBufferSize(512);    // payload JSON > 256 byte (default PubSubClient)

  Serial.println("\nSetup selesai. Mulai pembacaan sensor...\n");
  Serial.println("Perintah saat jalan: 1-4 (Ganti Ruangan) | WIFI (Ganti WiFi) | ON / OFF / AUTO (Kipas)\n");
  timeold = millis();
}

void loop() {
  handleSerialCommand();
  maintainConnections();
  if (client.connected()) client.loop();

  if ((millis() - timeold) >= (timemeasure * 1000UL)) {

    // 1. Baca DHT (Otomatis deteksi DHT22 atau DHT11)
    float temp_raw = NAN, hum_raw = NAN;
    if (readDHTAuto(dht, temp_raw, hum_raw)) {
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

    // 3. Kontrol otomatis kipas berdasarkan CO2 (hysteresis: >= 600 ON, <= 450 OFF)
    if (auto_mode && millis() > WARMUP_MS) {
      if (!relay_state && co2_raw >= CO2_THRESHOLD_ON) {
        setRelay(true);
      } else if (relay_state && co2_raw <= CO2_THRESHOLD_OFF) {
        setRelay(false);
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
      Serial.println("Sensor DHT : GAGAL membaca (cek wiring/sensor DHT11/DHT22)");
    } else {
      Serial.printf("Sensor DHT : Terdeteksi otomatis sebagai %s\n", dhtDetectedType);
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
    Serial.printf("Relay      : %s (mode: %s)\n", relay_state ? "ON" : "OFF", auto_mode ? "AUTO" : "MANUAL");
    Serial.printf("WiFi: %s | MQTT: %s\n",
                  WiFi.status() == WL_CONNECTED ? "OK" : "TERPUTUS",
                  client.connected() ? "OK" : "TERPUTUS");
    Serial.println("==========================================================\n");
    timeold = millis();
  }

  vTaskDelay(1);
}
