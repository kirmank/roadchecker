const axios = require('axios');

// --- AYARLAR ---
const BASLANGIC = "28.9770,41.0025"; // Yenikapı
const BITIS = "29.0110,41.0175";     // Sarayburnu

// --- HIZ AYARLARI (6 KAT YAVAŞLATILDI) ---
// Adım mesafesini küçülttükçe araç daha çok "mikro adım" atar ve yavaşlar.
const ADIM_MESAFESI = 0.000015; // (Eskisi 0.0001 idi) -> Çok daha hassas adımlar
const SURUS_HIZI_MS = 100;      // 100ms'de bir hareket et (Akıcılık bozulmasın diye bunu ellemedik)
const VERI_GONDERME_SIKLIGI = 100; // Araç yavaşladığı için artık her 100 adımda bir pin at (Veri kirliliği olmasın)

console.log("🚗 Ağır Çekim Sürüş Modu Başlatılıyor...");
console.log("🐢 Araç hızı 6 kat düşürüldü.");

// --- YARDIMCI: İki nokta arasını doldur ---
function araNoktalariOlustur(baslangic, bitis, adimSayisi) {
    const noktalar = [];
    const latFarki = (bitis[0] - baslangic[0]) / adimSayisi;
    const lngFarki = (bitis[1] - baslangic[1]) / adimSayisi;

    for (let i = 0; i < adimSayisi; i++) {
        noktalar.push({
            lat: baslangic[0] + (latFarki * i),
            lng: baslangic[1] + (lngFarki * i)
        });
    }
    return noktalar;
}

// --- SARSINTI ANALİZİ ---
function sarsintiAnalizi() {
    const sarsinti = Math.floor(Math.random() * 100);
    if (sarsinti < 80) return 'green';
    if (sarsinti < 95) return 'yellow';
    return 'red';
}

// --- ANA FONKSİYON ---
async function rotayiBaslat() {
    try {
        // 1. OSRM'den Ana Rotayı Çek
        const url = `http://router.project-osrm.org/route/v1/driving/${BASLANGIC};${BITIS}?overview=full&geometries=geojson`;
        const response = await axios.get(url);
        const kabaRota = response.data.routes[0].geometry.coordinates;

        console.log(`🌍 Rota indirildi. Hassas işleme başlıyor...`);

        // 2. Rotayı "Mikro Adımlara" Böl
        let detayliRota = [];
        
        for (let i = 0; i < kabaRota.length - 1; i++) {
            const p1 = [kabaRota[i][1], kabaRota[i][0]];
            const p2 = [kabaRota[i+1][1], kabaRota[i+1][0]];

            // Mesafeye göre çok daha fazla nokta üretiyoruz
            const mesafe = Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2));
            const adimSayisi = Math.floor(mesafe / ADIM_MESAFESI) + 1;

            const parcalar = araNoktalariOlustur(p1, p2, adimSayisi);
            detayliRota = detayliRota.concat(parcalar);
        }

        console.log(`✅ Rota hazır! Toplam ${detayliRota.length} mikro adım.`);

        // 3. Sürüşü Başlat
        let anlikAdim = 0;
        let kayitSayaci = 0;

        const surusInterval = setInterval(async () => {
            if (anlikAdim >= detayliRota.length) {
                console.log("🏁 Hedefe varıldı.");
                clearInterval(surusInterval);
                return;
            }

            const nokta = detayliRota[anlikAdim];
            
            // Sayaç mantığı: Veritabanını şişirmemek için belli aralıklarla kaydet
            kayitSayaci++;
            
            if (kayitSayaci >= VERI_GONDERME_SIKLIGI) {
                const renk = sarsintiAnalizi();
                
                try {
                    await axios.post('http://localhost:3000/api/pins', {
                        lat: nokta.lat,
                        lng: nokta.lng,
                        color: renk
                    });
                    
                    const yuzde = Math.floor((anlikAdim / detayliRota.length) * 100);
                    console.log(`📍 [%${yuzde}] Konum: ${nokta.lat.toFixed(5)}, ${nokta.lng.toFixed(5)} | Renk: ${renk.toUpperCase()}`);
                } catch (err) {
                    // Hata olursa sessizce geç
                }
                
                kayitSayaci = 0;
            }

            anlikAdim++; // Aracı her 100ms'de bir milim ilerlet

        }, SURUS_HIZI_MS);

    } catch (error) {
        console.error("❌ Hata:", error.message);
    }
}

rotayiBaslat();