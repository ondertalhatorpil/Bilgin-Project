// Doğrulama middleware'leri
const { Utils } = require('../utils/helpers');

const validation = {
  // Request body kontrolü
  validateBody: (requiredFields) => {
    return (req, res, next) => {
      const missingFields = [];
      
      requiredFields.forEach(field => {
        if (!req.body[field] || req.body[field].toString().trim() === '') {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        return res.status(400).json(Utils.errorResponse(
          `Eksik alanlar: ${missingFields.join(', ')}`
        ));
      }

      next();
    };
  },

  // Kullanıcı adı doğrulama middleware
  validateUsername: (req, res, next) => {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json(Utils.errorResponse('Kullanıcı adı gerekli!'));
    }

    const validation = Utils.validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json(Utils.errorResponse(validation.message));
    }

    // Temizlenmiş username'i req.body'ye geri koy
    req.body.username = validation.username;
    next();
  },

  // Oda başlığı doğrulama middleware
  validateRoomTitle: (req, res, next) => {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json(Utils.errorResponse('Oda başlığı gerekli!'));
    }

    const validation = Utils.validateRoomTitle(title);
    if (!validation.valid) {
      return res.status(400).json(Utils.errorResponse(validation.message));
    }

    // Temizlenmiş title'ı req.body'ye geri koy
    req.body.title = validation.title;
    next();
  },

  // Soru doğrulama middleware
  validateQuestion: (req, res, next) => {
    const { text, options, correctAnswer } = req.body;
    
    // Soru metni kontrolü
    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return res.status(400).json(Utils.errorResponse(
        'Soru metni en az 5 karakter olmalı!'
      ));
    }

    // Seçenekler kontrolü
    if (!options || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json(Utils.errorResponse(
        '4 adet seçenek gerekli!'
      ));
    }

    // Her seçeneği kontrol et
    for (let i = 0; i < options.length; i++) {
      if (!options[i] || typeof options[i] !== 'string' || options[i].trim().length < 1) {
        return res.status(400).json(Utils.errorResponse(
          `${i + 1}. seçenek boş olamaz!`
        ));
      }
    }

    // Doğru cevap kontrolü
    if (correctAnswer === undefined || correctAnswer === null) {
      return res.status(400).json(Utils.errorResponse('Doğru cevap seçilmeli!'));
    }

    const correctIndex = parseInt(correctAnswer);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      return res.status(400).json(Utils.errorResponse(
        'Doğru cevap 0-3 arasında olmalı!'
      ));
    }

    // Temizlenmiş verileri geri koy
    req.body.text = text.trim().substring(0, 500);
    req.body.options = options.map(opt => opt.trim().substring(0, 200));
    req.body.correctAnswer = correctIndex;
    
    next();
  },

  // Room ID doğrulama middleware
  validateRoomId: (req, res, next) => {
    const { roomId } = req.params;
    
    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json(Utils.errorResponse('Geçersiz oda ID!'));
    }

    // UUID formatı kontrolü (basit)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      return res.status(400).json(Utils.errorResponse('Geçersiz oda ID formatı!'));
    }

    next();
  },

  // Room Code doğrulama middleware
  validateRoomCode: (req, res, next) => {
    let { roomCode } = req.params;
    
    if (!roomCode || typeof roomCode !== 'string') {
      return res.status(400).json(Utils.errorResponse('Oda kodu gerekli!'));
    }

    roomCode = roomCode.toUpperCase().trim();
    
    // 6 haneli alfanumerik kontrol
    if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
      return res.status(400).json(Utils.errorResponse(
        'Oda kodu 6 haneli olmalı! (Örnek: ABC123)'
      ));
    }

    req.params.roomCode = roomCode;
    next();
  },

  // Rate limiting basit implementasyonu
  rateLimit: (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
      const clientId = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Eski kayıtları temizle
      if (requests.has(clientId)) {
        const clientRequests = requests.get(clientId);
        const validRequests = clientRequests.filter(time => now - time < windowMs);
        requests.set(clientId, validRequests);
      }

      // Mevcut istekleri al
      const clientRequests = requests.get(clientId) || [];
      
      // Limit kontrolü
      if (clientRequests.length >= maxRequests) {
        return res.status(429).json(Utils.errorResponse(
          'Çok fazla istek! Lütfen bekleyin.',
          { retryAfter: Math.ceil(windowMs / 1000) }
        ));
      }

      // Yeni isteği kaydet
      clientRequests.push(now);
      requests.set(clientId, clientRequests);
      
      next();
    };
  },

  // CORS headers middleware
  corsHeaders: (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  }
};

module.exports = validation;