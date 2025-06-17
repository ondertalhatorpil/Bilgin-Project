// Oda yönetimi rotaları
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// POST /api/rooms - Yeni oda oluştur
router.post('/', roomController.createRoom);

// POST /api/rooms/join - Odaya katıl
router.post('/join', roomController.joinRoom);

// GET /api/rooms - Tüm odaları listele
router.get('/', roomController.listRooms);

// GET /api/rooms/active - Aktif odaları listele
router.get('/active', roomController.listActiveRooms);

// GET /api/rooms/:roomId - Oda detaylarını getir
router.get('/:roomId', roomController.getRoomDetails);

// GET /api/rooms/code/:roomCode - Oda koduna göre oda bul
router.get('/code/:roomCode', roomController.getRoomByCode);

// POST /api/rooms/:roomId/questions - Odaya soru ekle
router.post('/:roomId/questions', roomController.addQuestion);

// DELETE /api/rooms/:roomId - Odayı sil
router.delete('/:roomId', roomController.deleteRoom);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: '🏠 Room API çalışıyor!',
    endpoints: {
      'POST /': 'Oda oluştur',
      'POST /join': 'Odaya katıl',
      'GET /': 'Odaları listele',
      'GET /active': 'Aktif odalar',
      'GET /:roomId': 'Oda detayı',
      'GET /code/:roomCode': 'Kod ile oda bul',
      'POST /:roomId/questions': 'Soru ekle',
      'DELETE /:roomId': 'Oda sil'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;