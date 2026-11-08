/*
 * ============================================================
 * UJI OTOMATIS RELAY NO + KIPAS 12V DENGAN TACHOMETER
 * ESP32 WROOM 38 pin
 *
 * Urutan pengujian:
 * 100 ppm -> 10 detik
 * 200 ppm -> 10 detik
 * 300 ppm -> 10 detik
 * 400 ppm -> 10 detik
 * 500 ppm -> 10 detik
 * 600 ppm -> 10 detik
 *
 * Logika:
 * CO2 >= 500 ppm -> KIPAS ON
 * CO2 < 500 ppm  -> KIPAS OFF
 *
 * Serial Monitor: 115200 baud
 * Ketik 'a' untuk mulai otomatis
 * Ketik 'm' untuk mode manual
 * ============================================================
 */

// --- Pin ---
#define RELAY_PIN 18
#define TACHO_PIN 19

// false: relay aktif HIGH
// true : relay aktif LOW
#define RELAY_ACTIVE_LOW false

// Umumnya kipas menghasilkan 2 pulsa per putaran
const int PULSES_PER_REV = 2;

// Interval tiap nilai CO2
const unsigned long TEST_INTERVAL_MS = 10000;

// Ambang batas kipas
const int CO2_THRESHOLD = 500;

// Nilai CO2 untuk pengujian otomatis
const int CO2_TEST_VALUES[] = {
  100, 200, 300, 400, 500, 600
};

const int TOTAL_TESTS =
  sizeof(CO2_TEST_VALUES) / sizeof(CO2_TEST_VALUES[0]);

// --- Variabel tachometer ---
volatile unsigned long pulseCount = 0;
volatile unsigned long lastPulseMicros = 0;
portMUX_TYPE tachoMux = portMUX_INITIALIZER_UNLOCKED;

// --- Variabel pengujian ---
bool fanOn = false;
bool autoMode = false;
bool testFinished = false;

int testIndex = 0;
int currentCO2 = 0;

unsigned long lastTestChange = 0;
unsigned long lastRpmCalc = 0;

// --- Interrupt tachometer ---
void IRAM_ATTR tachoISR() {
  unsigned long now = micros();

  if (now - lastPulseMicros > 500) {
    portENTER_CRITICAL_ISR(&tachoMux);
    pulseCount++;
    portEXIT_CRITICAL_ISR(&tachoMux);

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

  Serial.printf(
    "Relay/Kipas: %s\n",
    on ? "ON" : "OFF"
  );
}

// --- Terapkan nilai CO2 simulasi ---
void applyCO2(int co2) {
  currentCO2 = co2;

  Serial.println("\n----------------------------");
  Serial.printf("CO2 simulasi: %d ppm\n", currentCO2);

  if (currentCO2 >= CO2_THRESHOLD) {
    setFan(true);
    Serial.println("Keputusan: CO2 >= 500 -> KIPAS ON");
  } else {
    setFan(false);
    Serial.println("Keputusan: CO2 < 500 -> KIPAS OFF");
  }

  Serial.println("Durasi tahap: 10 detik");
  Serial.println("----------------------------");
}

// --- Mulai pengujian otomatis ---
void startAutoTest() {
  autoMode = true;
  testFinished = false;
  testIndex = 0;

  // Terapkan nilai pertama langsung
  applyCO2(CO2_TEST_VALUES[testIndex]);

  lastTestChange = millis();
}

// --- Hentikan pengujian ---
void stopAutoTest() {
  autoMode = false;
  testFinished = true;
  setFan(false);

  Serial.println("\n=== PENGUJIAN SELESAI ===");
  Serial.println("Kipas dipastikan OFF.");
}

// --- Menu Serial ---
void printMenu() {
  Serial.println("\n=== UJI OTOMATIS KIPAS 12V ===");
  Serial.println("a = mulai pengujian otomatis");
  Serial.println("m = mode manual");
  Serial.println("Dalam mode manual, masukkan CO2 (ppm)");
  Serial.println("CO2 >= 500 -> kipas ON");
  Serial.println("CO2 < 500  -> kipas OFF");
  Serial.println("==============================");
}

// --- Setup ---
void setup() {
  Serial.begin(115200);

  // Inisialisasi relay
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(
    RELAY_PIN,
    RELAY_ACTIVE_LOW ? HIGH : LOW
  );
  setFan(false);

  // Inisialisasi tachometer
  pinMode(TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(
    digitalPinToInterrupt(TACHO_PIN),
    tachoISR,
    FALLING
  );

  lastRpmCalc = millis();

  printMenu();
}

// --- Loop utama ---
void loop() {
  unsigned long now = millis();

  // 1. Membaca input Serial Monitor
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input == "a" || input == "A") {
      startAutoTest();
    }
    else if (input == "m" || input == "M") {
      autoMode = false;
      testFinished = false;

      Serial.println("\n=== MODE MANUAL ===");
      Serial.println("Masukkan nilai CO2 dalam ppm.");
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

        autoMode = false;
        testFinished = false;
        applyCO2(co2Input);
      } else {
        Serial.println(
          "Input tidak valid. Gunakan a, m, atau angka CO2."
        );
      }
    }
  }

  // 2. Pengujian otomatis: ganti nilai setiap 10 detik
  if (autoMode && now - lastTestChange >= TEST_INTERVAL_MS) {
    testIndex++;

    if (testIndex >= TOTAL_TESTS) {
      stopAutoTest();
    } else {
      applyCO2(CO2_TEST_VALUES[testIndex]);
      lastTestChange = now;
    }
  }

  // 3. Hitung RPM setiap 1 detik
  if (now - lastRpmCalc >= 1000) {
    unsigned long count;

    portENTER_CRITICAL(&tachoMux);
    count = pulseCount;
    pulseCount = 0;
    portEXIT_CRITICAL(&tachoMux);

    float elapsed = (now - lastRpmCalc) / 1000.0f;

    float rpm =
      (count / (float)PULSES_PER_REV) / elapsed * 60.0f;

    lastRpmCalc = now;

    Serial.printf(
      "CO2: %d ppm | Relay: %s | Pulsa: %lu | RPM: %.0f\n",
      currentCO2,
      fanOn ? "ON" : "OFF",
      count,
      rpm
    );

    if (fanOn && count == 0) {
      Serial.println(
        "PERINGATAN: Kipas ON tetapi pulsa tachometer "
        "tidak terdeteksi. Periksa wiring dan sinyal tacho."
      );
    }
  }
}
