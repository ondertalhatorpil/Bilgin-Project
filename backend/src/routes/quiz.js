// Quiz işlem rotaları
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// POST /api/quiz/:roomId/start - Quiz'i başlat
router.post('/:roomId/start', quizController.startQuiz);

// POST /api/quiz/:roomId/next - Sonraki soruya geç
router.post('/:roomId/next', quizController.nextQuestion);

// POST /api/quiz/:roomId/finish - Quiz'i bitir
router.post('/:roomId/finish', quizController.finishQuiz);

// POST /api/quiz/:roomId/restart - Quiz'i yeniden başlat
router.post('/:roomId/restart', quizController.restartQuiz);

// GET /api/quiz/:roomId/question - Mevcut soruyu getir
router.get('/:roomId/question', quizController.getCurrentQuestion);

// GET /api/quiz/:roomId/results - Quiz sonuçlarını getir
router.get('/:roomId/results', quizController.getResults);

// GET /api/quiz/:roomId/analysis - Detaylı quiz analizi
router.get('/:roomId/analysis', quizController.getQuizAnalysis);

// GET /api/quiz/:roomId/stats - Hızlı istatistikler
router.get('/:roomId/stats', quizController.getQuizStats);

// GET /api/quiz/:roomId/export/excel - Excel export
router.get('/:roomId/export/excel', quizController.exportToExcel);

// POST /api/quiz/:roomId/kick - Katılımcı çıkar
router.post('/:roomId/kick', quizController.kickParticipant);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: '🎮 Quiz API çalışıyor!',
    endpoints: {
      'POST /:roomId/start': 'Quiz başlat',
      'POST /:roomId/next': 'Sonraki soru',
      'POST /:roomId/finish': 'Quiz bitir',
      'POST /:roomId/restart': 'Quiz yeniden başlat',
      'GET /:roomId/question': 'Mevcut soru',
      'GET /:roomId/results': 'Sonuçlar',
      'GET /:roomId/analysis': 'Detaylı analiz',
      'GET /:roomId/stats': 'Hızlı istatistikler',
      'GET /:roomId/export/excel': 'Excel export',
      'POST /:roomId/kick': 'Katılımcı çıkar'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;