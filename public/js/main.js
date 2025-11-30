// Haritayı Başlat
const map = L.map('map').setView([41.0150, 28.9750], 13); // İstanbul

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Markerları tutan katman
let markersLayer = L.layerGroup().addTo(map);

// --- RENKLİ ARABA İKONU OLUŞTURUCU ---
function getCarIcon(gelenRenk) {
    // 1. Veritabanından gelen renk ismini (red, yellow) Hex koduna çevir
    // Böylece "Gold" gibi özel renkler kullanabiliriz.
    let renkKodu = 'red'; // Varsayılan

    if (gelenRenk === 'yellow') renkKodu = '#FFD700';      // Altın Sarısı
    else if (gelenRenk === 'orange') renkKodu = '#FF8C00'; // Koyu Turuncu
    else if (gelenRenk === 'green') renkKodu = '#32CD32';  // Fıstık Yeşili
    else renkKodu = 'red';                                 // Kırmızı

    // 2. HTML ile Araba İkonunu Oluştur (FontAwesome)
    return L.divIcon({
        className: 'car-icon-marker', // CSS'teki sınıf
        html: `<i class="fa-solid fa-car-side" style="color: ${renkKodu};"></i>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -10]
    });
}

// --- VERİLERİ ÇEK VE HARİTAYI GÜNCELLE ---
async function loadPins() {
    try {
        const response = await fetch('/api/pins');
        const pins = await response.json();

        // Eski arabaları haritadan sil
        markersLayer.clearLayers();

        pins.forEach(pin => {
            // Rengi fonksiyona gönderip doğru ikonu alıyoruz
            const arabaIkonu = getCarIcon(pin.color);

            L.marker([pin.lat, pin.lng], { icon: arabaIkonu })
             .bindPopup(`
                <div style="text-align:center">
                    <i class="fa-solid fa-car" style="color:${pin.color}; font-size:20px"></i><br>
                    <b>Durum:</b> ${pin.color.toUpperCase()}<br>
                </div>
             `)
             .addTo(markersLayer);
        });

    } catch (error) {
        console.error("Hata:", error);
    }
}

// Başlat
loadPins();

// Her 2 saniyede bir güncelle
setInterval(loadPins, 2000);