// Kimlik doğrulama rotaları
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login - Kullanıcı girişi
router.post('/login', authController.login);

// POST /api/auth/logout - Kullanıcı çıkışı  
router.post('/logout', authController.logout);

// GET /api/auth/session/:sessionId - Oturum kontrolü
router.get('/session/:sessionId', authController.checkSession);

// GET /api/auth/stats - Genel istatistikler
router.get('/stats', authController.getStats);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: '🔐 Auth API çalışıyor!',
    endpoints: {
      'POST /login': 'Giriş yap',
      'POST /logout': 'Çıkış yap', 
      'GET /session/:id': 'Oturum kontrol',
      'GET /stats': 'İstatistikler'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;