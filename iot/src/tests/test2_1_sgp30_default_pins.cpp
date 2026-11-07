#include <Arduino.h>
// ============================================================
// TEST SGP30 — PIN DEFAULT I2C (21/22) + CLOCK SPEED RENDAH
// Untuk isolasi: apakah masalah di pin 22/23 spesifik, atau
// memang di controller I2C / rail power board ini
// ============================================================
#include <Wire.h>
#include "Adafruit_SGP30.h"

// Pin default I2C ESP32 (SDA=21, SCL=22) - beda dari sebelumnya (22/23)
#define SDA_PIN 21
#define SCL_PIN 22

Adafruit_SGP30 sgp;

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("=== TEST SGP30 - PIN DEFAULT 21/22 + CLOCK RENDAH ===");

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(50000); // turunkan ke 50kHz (standar biasanya 100-400kHz)
  Wire.setTimeOut(1000);

  delay(500); // beri waktu sensor stabil setelah power-on

  if (sgp.begin()) {
    Serial.println(">> BERHASIL! SGP30 terdeteksi di pin 21/22 dengan clock rendah.");
  } else {
    Serial.println(">> GAGAL juga di pin 21/22. Kemungkinan besar bukan soal pin spesifik.");
  }
}

void loop() {
  delay(3000);
  Serial.print("3V3 rail check: ukur tegangan sekarang pakai multimeter -> ");
  Serial.println("catat hasilnya");
}
