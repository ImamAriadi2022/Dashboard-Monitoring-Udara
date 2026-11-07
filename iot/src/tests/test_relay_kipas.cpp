#include <Arduino.h>
// ============================================================
// KODE UJI RELAY + KIPAS 12V (dengan tacho)
// ESP32 WROOM 38 pin
//
// Wiring (sesuai "pin revised"):
//   Relay IN   -> D27
//   Relay COM  -> 12V rail
//   Relay NO   -> VCC kipas
//   Kipas GND  -> GND rail
//   Kipas TACHO-> D34 (input only)
//
// Perintah via Serial Monitor (115200, Newline):
//   1 = kipas ON
//   0 = kipas OFF
//   a = mode otomatis (ON 10 detik, OFF 5 detik, berulang)
//   m = kembali ke mode manual
// ============================================================

// --- Pin ---
#define RELAY_PIN 18
#define TACHO_PIN 19

// --- Konfigurasi ---
// Modul relay umumnya ACTIVE LOW (LOW = relay menyala).
// Jika relay terbalik (ON saat seharusnya OFF), ubah ke false.
#define RELAY_ACTIVE_LOW true

// Kebanyakan kipas 12V 3-pin/4-pin mengeluarkan 2 pulsa per putaran
const int PULSES_PER_REV = 2;

// Mode otomatis
const unsigned long AUTO_ON_MS  = 10000;
const unsigned long AUTO_OFF_MS = 5000;

// --- Variabel ---
volatile unsigned long pulseCount = 0;
volatile unsigned long lastPulseMicros = 0;
portMUX_TYPE tachoMux = portMUX_INITIALIZER_UNLOCKED;

bool fanOn = false;
bool autoMode = false;
unsigned long lastAutoToggle = 0;
unsigned long lastRpmCalc = 0;

// --- ISR tacho ---
void IRAM_ATTR tachoISR() {
  unsigned long now = micros();
  if (now - lastPulseMicros > 500) {   // debounce 0,5 ms
    pulseCount++;
    lastPulseMicros = now;
  }
}

// --- Kontrol relay ---
void setFan(bool on) {
  fanOn = on;
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, on ? LOW : HIGH);
  } else {
    digitalWrite(RELAY_PIN, on ? HIGH : LOW);
  }
  Serial.print(">> Relay/Kipas: ");
  Serial.println(on ? "ON" : "OFF");
}

void printMenu() {
  Serial.println("\n=== UJI RELAY & KIPAS ===");
  Serial.println("1 = ON | 0 = OFF | a = auto | m = manual");
  Serial.println("=========================\n");
}

void setup() {
  Serial.begin(115200);

  // Set level OFF dulu sebelum pin jadi output (hindari relay klik saat boot)
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  pinMode(RELAY_PIN, OUTPUT);
  setFan(false);

  // GPIO34 tidak punya pull-up internal -> butuh pull-up eksternal ke 3V3
  pinMode(TACHO_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(TACHO_PIN), tachoISR, FALLING);

  printMenu();
  lastRpmCalc = millis();
}

void loop() {
  // 1. Perintah serial
  if (Serial.available()) {
    char c = Serial.read();
    if (c == '1')      { autoMode = false; setFan(true);  }
    else if (c == '0') { autoMode = false; setFan(false); }
    else if (c == 'a') {
      autoMode = true;
      lastAutoToggle = millis();
      setFan(true);
      Serial.println(">> Mode OTOMATIS");
    }
    else if (c == 'm') { autoMode = false; Serial.println(">> Mode MANUAL"); }
  }

  // 2. Mode otomatis
  if (autoMode) {
    unsigned long interval = fanOn ? AUTO_ON_MS : AUTO_OFF_MS;
    if (millis() - lastAutoToggle >= interval) {
      setFan(!fanOn);
      lastAutoToggle = millis();
    }
  }

  // 3. Hitung RPM tiap 1 detik
  if (millis() - lastRpmCalc >= 1000) {
    unsigned long count;
    portENTER_CRITICAL(&tachoMux);
    count = pulseCount;
    pulseCount = 0;
    portEXIT_CRITICAL(&tachoMux);

    float elapsed = (millis() - lastRpmCalc) / 1000.0;
    float rpm = (count / (float)PULSES_PER_REV) / elapsed * 60.0;
    lastRpmCalc = millis();

    Serial.printf("Relay: %s | Pulsa: %lu | RPM: %.0f\n",
                  fanOn ? "ON " : "OFF", count, rpm);

    // Diagnosa sederhana
    if (fanOn && count == 0) {
      Serial.println("   ! Kipas ON tapi tidak ada sinyal tacho (cek wiring/pull-up)");
    }
  }
}
