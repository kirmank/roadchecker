// Haritayı Başlat (İstanbul odaklı)
const map = L.map('map').setView([41.0370, 28.9850], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Renkli İkon Oluşturucu
function getIcon(color) {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

// Haritadaki tüm markerları tutacak grup (Temizleyip tekrar çizmek için)
let markersLayer = L.layerGroup().addTo(map);

// --- VERİ ÇEKME FONKSİYONU ---
async function loadPins() {
    try {
        const response = await fetch('/api/pins');
        const pins = await response.json();

        // Eski pinleri temizle (Yoksa üst üste binlerce pin olur)
        markersLayer.clearLayers();

        // Yeni gelen listeyi haritaya bas
        pins.forEach(pin => {
            L.marker([pin.lat, pin.lng], { icon: getIcon(pin.color) })
             .bindPopup(`<b>Durum:</b> ${pin.color}<br><b>Saat:</b> ${new Date(pin.date).toLocaleTimeString()}`)
             .addTo(markersLayer);
        });
        
        console.log("🔄 Veriler güncellendi: " + pins.length + " adet pin.");

    } catch (error) {
        console.error("Veri çekilemedi:", error);
    }
}

// 1. Sayfa açılınca yükle
loadPins();

// 2. Her 3 saniyede bir otomatik yenile (Canlı Takip Hissi)
setInterval(loadPins, 3000);