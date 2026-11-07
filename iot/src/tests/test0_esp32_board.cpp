#include <Arduino.h>
// ============================================================
// TEST ESP32 (BOARD SANITY CHECK)
// Tujuan: memastikan board ESP32 berfungsi normal sebelum
// menyambungkan sensor apapun — cek chip info, memori, WiFi,
// dan LED bawaan (blink test)
// ============================================================
#include <WiFi.h>

// Kebanyakan board ESP32 DevKit pakai GPIO2 untuk LED onboard.
// Kalau LED tidak menyala, cek datasheet board kamu (bisa beda-beda).
#define LED_PIN 2

const char* ssid = "kandangrudi";
const char* password = "persib1933";

unsigned long lastBlink = 0;
bool ledState = false;

void printChipInfo() {
  Serial.println("=== INFORMASI CHIP ===");
  Serial.printf("Chip model     : %s\n", ESP.getChipModel());
  Serial.printf("Chip revision  : %d\n", ESP.getChipRevision());
  Serial.printf("Jumlah core    : %d\n", ESP.getChipCores());
  Serial.printf("CPU freq       : %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("Flash size     : %d bytes\n", ESP.getFlashChipSize());
  Serial.printf("Free heap      : %d bytes\n", ESP.getFreeHeap());
  Serial.println("=======================\n");
}

void scanWifiNetworks() {
  Serial.println("Scanning jaringan WiFi di sekitar...");
  int n = WiFi.scanNetworks();
  if (n == 0) {
    Serial.println("Tidak ada jaringan WiFi ditemukan. Cek antena/modul WiFi.");
  } else {
    Serial.printf("Ditemukan %d jaringan:\n", n);
    for (int i = 0; i < n; i++) {
      Serial.printf("  %d: %s (RSSI: %d dBm)\n", i + 1, WiFi.SSID(i).c_str(), WiFi.RSSI(i));
    }
  }
  Serial.println();
}

void connectWifi() {
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  unsigned long startAttempt = millis();

  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt) < 15000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(">> WiFi BERHASIL terhubung!");
    Serial.print("IP Address : "); Serial.println(WiFi.localIP());
    Serial.print("MAC Address: "); Serial.println(WiFi.macAddress());
    Serial.printf("Signal (RSSI): %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println(">> WiFi GAGAL terhubung. Cek SSID/password, atau jarak ke router.");
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== TEST ESP32 (BOARD SANITY CHECK) ===\n");

  pinMode(LED_PIN, OUTPUT);

  printChipInfo();
  scanWifiNetworks();
  connectWifi();

  Serial.println("Board siap. LED akan mulai berkedip tiap 1 detik untuk uji GPIO...");
}

void loop() {
  // Blink test — kalau LED tidak berkedip, kemungkinan pin LED beda
  // atau ada masalah power supply pada board
  if (millis() - lastBlink >= 1000) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
    Serial.printf("LED: %s | Free heap: %d bytes | Uptime: %lu s\n",
                  ledState ? "ON" : "OFF", ESP.getFreeHeap(), millis() / 1000);
  }
}
