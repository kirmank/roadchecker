// Haritayı Başlat (Başlangıçta İstanbul, veri gelince değişecek)
const map = L.map('map').setView([41.0150, 28.9750], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Markerları tutan katman (Temizleyip yeniden çizmek için)
let markersLayer = L.layerGroup().addTo(map);

// --- FONKSİYON: Renge Göre Araba İkonu Oluştur ---
function getCarIcon(gelenRenk) {
    // Gelen renk ismini (string) Hex koduna çevir
    let renkKodu = 'red'; // Varsayılan

    if (gelenRenk === 'yellow') renkKodu = '#FFD700';      // Altın Sarısı
    else if (gelenRenk === 'orange') renkKodu = '#FF8C00'; // Turuncu
    else if (gelenRenk === 'green') renkKodu = '#32CD32';  // Fıstık Yeşili
    else renkKodu = '#FF0000';                             // Kırmızı

    // HTML ile Araba İkonu (FontAwesome)
    return L.divIcon({
        className: 'car-icon-marker', // style.css'teki sınıf
        html: `<i class="fa-solid fa-car-side" style="color: ${renkKodu};"></i>`,
        iconSize: [30, 30],   // Boyut
        iconAnchor: [15, 15], // Merkez noktası
        popupAnchor: [0, -10] // Baloncuk konumu
    });
}

// --- ANA FONKSİYON: Verileri Çek ve Haritayı Güncelle ---
async function loadPins() {
    try {
        const response = await fetch('/api/pins');
        const pins = await response.json();

        // Eğer veri yoksa dur
        if (pins.length === 0) return;

        // Eski arabaları haritadan sil
        markersLayer.clearLayers();

        // --- 1. OTOMATİK ODAKLAMA (Auto-Focus) ---
        // En son gelen veri listenin başındadır (Backend'de sort etmiştik)
        const sonKonum = pins[0];
        
        // Kamerayı yumuşak bir şekilde oraya kaydır
        map.panTo([sonKonum.lat, sonKonum.lng]); 

        // --- 2. PİNLERİ ÇİZ ---
        pins.forEach(pin => {
            // Rengi al -> Araba ikonuna çevir
            const arabaIkonu = getCarIcon(pin.color);

            L.marker([pin.lat, pin.lng], { icon: arabaIkonu })
             .bindPopup(`
                <div style="text-align:center; min-width: 100px;">
                    <i class="fa-solid fa-car" style="color:${pin.color}; font-size:24px; margin-bottom:5px;"></i><br>
                    <b>Durum:</b> ${pin.color.toUpperCase()}<br>
                    <small style="color:#666;">${new Date(pin.date).toLocaleTimeString()}</small>
                </div>
             `)
             .addTo(markersLayer);
        });

    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}

// İlk yükleme
loadPins();

// Her 2 saniyede bir güncelle (Canlı Takip)
setInterval(loadPins, 2000);