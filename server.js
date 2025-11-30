require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Pin = require('./models/Pin'); 

const app = express();
const PORT = process.env.PORT || 3000;

// --- GÜVENLİK AYARLARINI KALDIRDIK ---
// Standart Express ayarlarıyla devam ediyoruz.
// Bu sayede tarayıcı Leaflet'i veya eval'i engellemeyecek.

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Dosyalar buradan sunulacak

// --- MongoDB Bağlantısı ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Bağlantısı Başarılı'))
.catch(err => console.error('❌ Bağlantı Hatası:', err));

// --- API ROTALARI ---

app.get('/api/pins', async (req, res) => {
  try {
    const pins = await Pin.find();
    res.json(pins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/pins', async (req, res) => {
  const { lat, lng, color } = req.body;
  const newPin = new Pin({ lat, lng, color });

  try {
    const savedPin = await newPin.save();
    res.status(201).json(savedPin);
    console.log(`📍 Yeni Pin Eklendi: ${color}`);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- ESP32 için hafif, anahtarlı API endpoint'i ---
// ESP32 cihazlarının doğrudan POST ile pin göndermesi amacıyla kullanılır.
// Güvenlik için `x-api-key` header'ı ile basit doğrulama yapar.
app.post('/api/esp/pins', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const expected = process.env.ESP_API_KEY || 'change-me';

  if (!apiKey || apiKey !== expected) {
    return res.status(401).json({ message: 'Unauthorized: invalid API key' });
  }

  const { lat, lng, color } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ message: 'Bad Request: lat and lng must be numbers' });
  }

  try {
    const newPin = new Pin({ lat, lng, color });
    const savedPin = await newPin.save();
    console.log(`📡 ESP32 -> Yeni Pin: ${color} @ ${lat},${lng} from ${req.ip}`);
    return res.status(201).json(savedPin);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});