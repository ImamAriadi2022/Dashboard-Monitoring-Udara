// ============================================================
// TEST 3: RANGKAIAN ANEMOMETER SAJA
// Tujuan: memastikan interrupt pulsa anemometer terhitung benar
// dan konversi ke kecepatan angin (m/s) sesuai rumus kalibrasi
// ============================================================
#define WIND_PIN 18

volatile int rpmcount = 0;
volatile unsigned long last_micros = 0;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

const int timemeasure = 5; // detik
unsigned long timeold = 0;
float wind_ms = 0;

void IRAM_ATTR rpm_anemometer() {
  unsigned long current_micros = micros();
  if (current_micros - last_micros > 10000) { // debounce 10ms
    rpmcount++;
    last_micros = current_micros;
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== TEST ANEMOMETER ===");

  pinMode(WIND_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_PIN), rpm_anemometer, RISING);

  timeold = millis();
}

void loop() {
  if ((millis() - timeold) >= (timemeasure * 1000)) {
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

    Serial.printf("Pulsa: %d | RPS: %.3f | Kecepatan angin: %.2f m/s\n", countCopy, rps, wind_ms);
    timeold = millis();
  }

  vTaskDelay(1);
}
