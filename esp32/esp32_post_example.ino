/*
  ESP32 sketch: MPU6050 (I2C) + U-blox NEO-6M (Serial) ile gerçek veri alır,
  sarsıntı seviyesine göre renk atar ve sunucuya POST eder.

  Varsayılan pinler (ESP32):
   - I2C: SDA=21, SCL=22 (Wire.begin())
   - GPS Serial: RX=16, TX=17 (Serial2)

  platformio.ini içinde TinyGPSPlus eklendi.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <TinyGPSPlus.h>
#include <math.h>

// --- Ayarlar: kendi ağa ve sunucuya göre değiştirin ---
const char* ssid = "izvini";
const char* password = "ahmethasan";
const char* serverUrl = "http://192.168.1.100:3000/api/esp/pins";
const char* apiKey = "change-me"; // process.env.ESP_API_KEY ile eşleşmeli

// GPS (NEO-6M) - HardwareSerial (Serial2)
const int GPS_RX_PIN = 16; // connect TX of GPS to this (ESP32 RX2)
const int GPS_TX_PIN = 17; // connect RX of GPS to this (ESP32 TX2)
TinyGPSPlus gps;

// MPU6050 settings
const uint8_t MPU_ADDR = 0x68;
const float ACCEL_SCALE = 16384.0; // LSB/g for default ±2g

// timing
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 3000; // ms

void setup() {
  Serial.begin(115200);
  delay(100);

  // I2C
  Wire.begin(); // SDA, SCL default pins on many boards: 21,22
  // Wake up MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1
  Wire.write(0x00);
  Wire.endTransmission();
  Serial.println("MPU6050 initialized");

  // GPS serial
  Serial2.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("GPS (Serial2) started");

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("WiFi'ye bağlanılıyor");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Bağlandı, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi'ye bağlanılamadı (zaman aşımı)");
  }
}

// Read raw accel from MPU6050
void readAccel(float &axg, float &ayg, float &azg) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // ACCEL_XOUT_H
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  int16_t ax = (Wire.read() << 8) | Wire.read();
  int16_t ay = (Wire.read() << 8) | Wire.read();
  int16_t az = (Wire.read() << 8) | Wire.read();

  axg = (float)ax / ACCEL_SCALE;
  ayg = (float)ay / ACCEL_SCALE;
  azg = (float)az / ACCEL_SCALE;
}

String pickColorFromAccel(float axg, float ayg, float azg) {
  // toplam ivme büyüklüğü
  float mag = sqrt(axg*axg + ayg*ayg + azg*azg);
  // Earth gravity ~1.0g; ani sarsıntılarda değer yükselir
  if (mag > 2.0) return "red";
  if (mag > 1.2) return "orange";
  if (mag > 0.85) return "yellow";
  return "green";
}

void sendToServer(double lat, double lng, const String &color) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi bağlı değil, gönderilemiyor");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  String payload = "{";
  payload += "\"lat\":" + String(lat, 6) + ",";
  payload += "\"lng\":" + String(lng, 6) + ",";
  payload += "\"color\":\"" + color + "\"";
  payload += "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.print("HTTP code: "); Serial.println(httpCode);
    String resp = http.getString();
    Serial.print("Response: "); Serial.println(resp);
  } else {
    Serial.print("HTTP POST failed, error: "); Serial.println(httpCode);
  }
  http.end();
}

void loop() {
  // GPS parsing
  while (Serial2.available()) {
    char c = Serial2.read();
    gps.encode(c);
  }

  // Read accel
  float axg, ayg, azg;
  readAccel(axg, ayg, azg);

  String color = pickColorFromAccel(axg, ayg, azg);

  // get location
  double lat = 0.0, lng = 0.0;
  if (gps.location.isValid()) {
    lat = gps.location.lat();
    lng = gps.location.lng();
  } else {
    // GPS yoksa 0,0 göndermemek için önceki veya sabit koordinat kullanılabilir
    // Bu örnekte sabit bir şehir merkezini gönderiyoruz (isteğe göre değiştirin)
    lat = 41.037000;
    lng = 28.985000;
  }

  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    Serial.printf("Gönderiliyor: lat=%.6f lng=%.6f color=%s\n", lat, lng, color.c_str());
    sendToServer(lat, lng, color);
  }

  delay(50);
}
