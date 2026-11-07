#include <Arduino.h>
const int TEST_PIN = 27; // GPIO27

void setup() {
  Serial.begin(115200);
  pinMode(TEST_PIN, OUTPUT);
  Serial.println("--- UJI PIN GPIO ESP32 ---");
}

void loop() {
  Serial.println("GPIO HIGH (3.3V) -> LED NYALA");
  digitalWrite(TEST_PIN, HIGH);
  delay(2000);

  Serial.println("GPIO LOW (0V) -> LED MATI");
  digitalWrite(TEST_PIN, LOW);
  delay(2000);
}