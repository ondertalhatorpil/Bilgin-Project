// Express uygulaması ana dosyası
const express = require('express');
const cors = require('cors');

// Route dosyalarını içe aktar
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const quizRoutes = require('./routes/quiz');

// Express uygulaması oluştur
const app = express();

// Middleware'ler
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001", 
    "https://bilgin.onder.org.tr"  
  ],
  credentials: true
}));

app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL parsing

// Ana sayfa - API durumu
app.get('/', (req, res) => {
  res.json({
    message: '🎮 Kahoot Quiz API Çalışıyor!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      rooms: '/api/rooms', 
      quiz: '/api/quiz'
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// API rotalarını kullan
app.use('/api/auth', authRoutes);   // Kimlik doğrulama rotaları
app.use('/api/rooms', roomRoutes);  // Oda yönetimi rotaları  
app.use('/api/quiz', quizRoutes);   // Quiz işlem rotaları

// 404 hatası - Sayfa bulunamadı
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Sayfa bulunamadı! 🔍',
    message: 'Bu endpoint mevcut değil',
    availableEndpoints: ['/api/auth', '/api/rooms', '/api/quiz']
  });
});

// Genel hata yakalayıcı
app.use((error, req, res, next) => {
  console.error('❌ Sunucu hatası:', error);
  res.status(500).json({
    error: 'Sunucu hatası! 💥',
    message: 'Bir şeyler ters gitti',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = app;