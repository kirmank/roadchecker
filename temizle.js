require('dotenv').config();
const mongoose = require('mongoose');
const Pin = require('./models/Pin'); // Model dosyanın yeri

console.log("🧹 Temizlik işlemi başlatılıyor...");

// Veritabanına Bağlan
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log("✅ Veritabanına bağlanıldı.");

    try {
        // --- SİHİRLİ KOMUT ---
        // deleteMany({}) içini boş bırakırsan "Her şeyi sil" demektir.
        await Pin.deleteMany({});
        
        console.log("🗑️  TÜM PİNLER SİLİNDİ! Veritabanı tertemiz.");
    } catch (error) {
        console.error("Hata oluştu:", error);
    } finally {
        // İşi bitince bağlantıyı kapat ve çık
        mongoose.connection.close();
        process.exit();
    }
})
.catch(err => {
    console.error("Bağlantı Hatası:", err);
});