ESP32 + MPU6050 + NEO-6M

Bu dizin ESP32 cihazınızın MPU6050 (I2C) ivmeölçer/gyro ve U-blox NEO-6M GPS ile çalışacak örnek sketch'i içerir.

Bağlantılar (örnek, ESP32 Dev Module):
- MPU6050 (I2C)
  - VCC -> 3.3V
  - GND -> GND
  - SDA -> GPIO21
  - SCL -> GPIO22
- NEO-6M GPS (UART)
  - VCC -> 3.3V (veya modülünüz 5V ise dikkat)
  - GND -> GND
  - TX -> GPIO16 (ESP32 RX2)
  - RX -> GPIO17 (ESP32 TX2)

Ayarlar ve derleme

1) `platformio.ini` içerisinde `lib_deps = TinyGPSPlus` eklendi. PlatformIO kullanıyorsanız bu kütüphane otomatik yüklenecektir.

2) `esp32/esp32_post_example.ino` içindeki şu değerleri kendi ortamınıza göre güncelleyin:
   - `ssid` ve `password` (WiFi ağ bilgileri)
   - `serverUrl` (sunucunuzun IP veya domaini, örn. `http://192.168.1.100:3000/api/esp/pins`)
   - `apiKey` (server'da `ESP_API_KEY` ile aynı olmalı)

3) Derleme ve yükleme (PlatformIO):
```bash
# PlatformIO CLI ile
pio run -e esp32dev -t upload
# Seri monitör
pio device monitor -e esp32dev
```

Notlar ve hata ayıklama
- Eğer GPS konumu boş geliyorsa: GPS anteni açık alana yönlendirilmeli ve birkaç dakika beklenmelidir.
- MPU6050 için I2C adresi farklıysa (0x68 veya 0x69), kodu güncelleyin.
- Kütüphaneler eksikse PlatformIO otomatik kurmalı; değilse `pio lib install "TinyGPSPlus"` çalıştırın.

Geliştirme fikirleri
- GPS sabitlik kontrolü (HDOP, fix tipi) eklensin.
- Ani sarsıntı algılandığında sunucuya farklı endpoint ile uyarı gönderme.
- HTTPS kullanımı için `WiFiClientSecure` ve sunucu tarafında TLS yapılandırması.
