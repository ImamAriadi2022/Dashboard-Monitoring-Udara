#include <Arduino.h>
//test active high board

#define RELAY_PIN 27

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);

}

void loop() {
  digitalWrite(RELAY_PIN, HIGH);
  delay(2000);

  Serial.print("GPIO 27 = ");
  Serial.println(digitalRead(RELAY_PIN) ? "HIGH" : "LOW");

  digitalWrite(RELAY_PIN, LOW);
  delay(2000);

  Serial.print("GPIO 27 = ");
  Serial.println(digitalRead(RELAY_PIN) ? "HIGH" : "LOW");
}