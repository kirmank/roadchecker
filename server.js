require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Pin = require('./models/Pin'); 

const app = express();
const PORT = process.env.PORT || 3000;
const ESP_KEY = process.env.ESP_API_KEY || 'degistirbeni';

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- MongoDB Bağlantısı ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Bağlantısı Başarılı'))
.catch(err => console.error('❌ Bağlantı Hatası:', err));

// --- API ROTALARI ---

// 1. GET: Tüm Pinleri Getir (Son 1000 kayıt)
app.get('/api/pins', async (req, res) => {
  try {
    const pins = await Pin.find().sort({ date: -1 }).limit(1000);
    res.json(pins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST: ESP32 İçin Güvenli Rota 📡
app.post('/api/esp/pins', async (req, res) => {
  // Güvenlik Kontrolü
  const gelenKey = req.headers['x-api-key'];
  
  if (!gelenKey || gelenKey !== ESP_KEY) {
    console.log(`⚠️ [ESP32] Yetkisiz Erişim! IP: ${req.ip}`);
    return res.status(401).json({ message: 'Yetkisiz: Yanlış API Key' });
  }

  // Veriyi Kaydet
  const { lat, lng, color } = req.body;

  // Validasyonlar
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ message: 'Hata: Enlem/Boylam sayı olmalı.' });
  }
  if (lat === 0 && lng === 0) {
    return res.status(400).json({ message: 'Hata: GPS verisi yok (0,0)' });
  }

  const newPin = new Pin({ lat, lng, color: color || 'green' });

  try {
    const savedPin = await newPin.save();
    console.log(`📡 [ESP32] Veri Geldi -> Konum: ${lat.toFixed(5)}, ${lng.toFixed(5)} | Renk: ${color}`);
    return res.status(201).json(savedPin);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Sunucuyu Başlat
app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});