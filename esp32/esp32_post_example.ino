#include <WiFi.h>
#include <HTTPClient.h>

// --- Ayarlar: kendi ağa ve sunucuya göre değiştirin ---
const char* ssid = "izvini";
const char* password = "ahmethasan";

// Sunucu adresi: örn. "http://192.168.1.100:3000/api/esp/pins"
// Sunucunuz internete açıksa domain/için https kullanın (ek yapı gerekir).
const char* serverUrl = "http://192.168.1.100:3000/api/esp/pins";
const char* apiKey = "change-me"; // process.env.ESP_API_KEY ile eşleşmeli

void setup() {
  Serial.begin(115200);
  delay(100);
  WiFi.begin(ssid, password);
  Serial.print("WiFi'ye bağlanılıyor");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  Serial.print("Bağlandı, IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);

    // Örnek veriler: gerçek cihazda GPS veya sensörden al
    float lat = 41.0370; // örnek enlem
    float lng = 28.9850; // örnek boylam
    const char* color = "green"; // red|orange|yellow|green

    String payload = "{";
    payload += "\"lat\":" + String(lat, 6) + ",";
    payload += "\"lng\":" + String(lng, 6) + ",";
    payload += "\"color\":\"" + String(color) + "\"";
    payload += "}";

    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      Serial.print("HTTP code: ");
      Serial.println(httpCode);
      String resp = http.getString();
      Serial.print("Response: ");
      Serial.println(resp);
    } else {
      Serial.print("Request failed, error: ");
      Serial.println(httpCode);
    }

    http.end();
  } else {
    Serial.println("WiFi bağlantısı yok");
  }

  delay(5000); // 5 saniyede bir gönderim
}
