#include <Arduino.h>
// ============================================================
// KODE UJI RELAY NO + KIPAS 12V (dengan tacho)
// ESP32 WROOM 38 pin
//
// Serial Monitor: 115200 baud, Newline
// Input angka CO2:
//   CO2 >= 500 = kipas ON
//   CO2 < 500  = kipas OFF
//   a = mode otomatis
//   m = mode manual
// ============================================================

// --- Pin ---
#define RELAY_PIN 18
#define TACHO_PIN 19

// Modul relay aktif LOW:
// LOW  = relay aktif, kontak NO terhubung ke COM
// HIGH = relay tidak aktif, kontak NO terputus
#define RELAY_ACTIVE_LOW false

// Kebanyakan kipas 12V 3-pin/4-pin menghasilkan 2 pulsa per putaran
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

  if (now - lastPulseMicros > 500) {
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

// --- Menu ---
void printMenu() {
  Serial.println("\n=== UJI RELAY NO & KIPAS ===");
  Serial.println("Masukkan kadar CO2 (integer ppm):");
  Serial.println("CO2 >= 500 = kipas ON");
  Serial.println("CO2 < 500  = kipas OFF");
  Serial.println("a = mode otomatis | m = mode manual");
  Serial.println("============================\n");
}

// --- Setup ---
void setup() {
  Serial.begin(115200);

  // Atur kondisi relay OFF
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  pinMode(RELAY_PIN, OUTPUT);
  setFan(false);

  // GPIO19 mendukung interrupt
  pinMode(TACHO_PIN, INPUT);
  attachInterrupt(
    digitalPinToInterrupt(TACHO_PIN),
    tachoISR,
    FALLING
  );

  printMenu();
  lastRpmCalc = millis();
}

// --- Loop ---
void loop() {
  // 1. Membaca input Serial Monitor
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input == "a") {
      autoMode = true;
      lastAutoToggle = millis();
      Serial.println(">> Mode OTOMATIS");
    }
    else if (input == "m") {
      autoMode = false;
      Serial.println(">> Mode MANUAL");
    }
    else {
      bool validInteger = input.length() > 0;

      for (unsigned int i = 0; i < input.length(); i++) {
        if (!isDigit(input[i])) {
          validInteger = false;
          break;
        }
      }

      if (validInteger) {
        int co2Input = input.toInt();

        if (co2Input >= 500) {
          autoMode = false;
          setFan(true);
          Serial.printf("CO2: %d ppm -> KIPAS ON\n", co2Input);
        } else {
          autoMode = false;
          setFan(false);
          Serial.printf("CO2: %d ppm -> KIPAS OFF\n", co2Input);
        }
      } else {
        Serial.println(
          "Input tidak valid. Masukkan integer CO2, a, atau m."
        );
      }
    }
  }

  // 2. Mode otomatis: ON 10 detik, OFF 5 detik
  if (autoMode) {
    unsigned long interval = fanOn ? AUTO_ON_MS : AUTO_OFF_MS;

    if (millis() - lastAutoToggle >= interval) {
      setFan(!fanOn);
      lastAutoToggle = millis();
    }
  }

  // 3. Hitung RPM setiap 1 detik
  if (millis() - lastRpmCalc >= 1000) {
    unsigned long count;

    portENTER_CRITICAL(&tachoMux);
    count = pulseCount;
    pulseCount = 0;
    portEXIT_CRITICAL(&tachoMux);

    float elapsed = (millis() - lastRpmCalc) / 1000.0;
    float rpm =
      (count / (float)PULSES_PER_REV) / elapsed * 60.0;

    lastRpmCalc = millis();

    Serial.printf(
      "Relay: %s | Pulsa: %lu | RPM: %.0f\n",
      fanOn ? "ON " : "OFF",
      count,
      rpm
    );

    if (fanOn && count == 0) {
      Serial.println(
        "   ! Kipas ON tapi tidak ada sinyal tacho. "
        "Periksa wiring dan pull-up."
      );
    }
  }
}