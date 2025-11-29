const axios = require('axios');

// Başlangıç Konumu: İstanbul / Taksim Meydanı civarı
let lat = 41.0370;
let lng = 28.9850;

const renkler = ['red', 'yellow', 'green'];

console.log("🚗 Araç Simülasyonu Başlatılıyor...");
console.log("📡 Her 3 saniyede bir veri gönderilecek. Durdurmak için Ctrl+C yap.");

// Rastgele hareket ve renk seçimi yapan fonksiyon
async function veriUretVeGonder() {
    // 1. Aracı biraz hareket ettir (0.001 ~ 100m)
    // Kuzey-Güney ve Doğu-Batı yönünde rastgele sapmalar
    lat += (Math.random() - 0.4) * 0.002; 
    lng += (Math.random() - 0.4) * 0.002;

    // 2. Rastgele renk seç
    const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];

    try {
        // 3. Backend'e POST isteği at
        await axios.post('http://localhost:3000/api/pins', {
            lat: lat,
            lng: lng,
            color: rastgeleRenk
        });
        
        console.log(`📍 Konum: ${lat.toFixed(4)}, ${lng.toFixed(4)} | Renk: ${rastgeleRenk} -> GÖNDERİLDİ`);
    } catch (error) {
        console.error("❌ Hata: Sunucuya bağlanılamadı. (node server.js çalışıyor mu?)");
    }
}

// Her 3000 milisaniyede (3 saniye) bir çalıştır
setInterval(veriUretVeGonder, 3000);