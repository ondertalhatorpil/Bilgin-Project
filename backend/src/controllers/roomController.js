// Oda yönetimi controller'ı
const { RoomManager, UserManager, Utils } = require('../utils/helpers');

const roomController = {
  // Yeni oda oluştur
  createRoom: async (req, res) => {
    try {
      const { title, adminName, questions = [] } = req.body;
      
      console.log(`🏠 Oda oluşturma isteği: ${title} by ${adminName}`);
      
      // Başlık doğrulama
      const titleValidation = Utils.validateRoomTitle(title);
      if (!titleValidation.valid) {
        return res.status(400).json(Utils.errorResponse(titleValidation.message));
      }

      // Admin adı doğrulama
      const adminValidation = Utils.validateUsername(adminName);
      if (!adminValidation.valid) {
        return res.status(400).json(Utils.errorResponse(
          'Admin adı: ' + adminValidation.message
        ));
      }

      // Oda oluştur
      const room = RoomManager.createRoom(titleValidation.title, adminValidation.username);
      
      // Soruları ekle (varsa)
      if (questions && questions.length > 0) {
        questions.forEach(q => {
          if (q.text && q.options && q.options.length === 4 && q.correctAnswer !== undefined) {
            room.addQuestion(q);
          }
        });
      }

      res.status(201).json(Utils.successResponse(
        `Oda oluşturuldu! Kod: ${room.roomCode}`,
        {
          room: room.getStatus(),
          roomCode: room.roomCode,
          adminPanel: `/admin/${room.id}`,
          joinUrl: `/join/${room.roomCode}`
        }
      ));

    } catch (error) {
      console.error('❌ Oda oluşturma hatası:', error);
      res.status(500).json(Utils.errorResponse('Oda oluşturulamadı!', error.message));
    }
  },

  // Odaya katıl
  joinRoom: async (req, res) => {
    try {
      const { roomCode, username } = req.body;
      
      console.log(`👤 Odaya katılma isteği: ${username} -> ${roomCode}`);
      
      // Kullanıcı adı doğrulama
      const userValidation = Utils.validateUsername(username);
      if (!userValidation.valid) {
        return res.status(400).json(Utils.errorResponse(userValidation.message));
      }

      // Oda var mı kontrol et
      const room = RoomManager.findRoomByCode(roomCode.toUpperCase());
      if (!room) {
        return res.status(404).json(Utils.errorResponse(
          'Oda bulunamadı! Kod: ' + roomCode.toUpperCase()
        ));
      }

      // Quiz başlamış mı kontrol et
      if (room.isStarted) {
        return res.status(400).json(Utils.errorResponse(
          'Quiz zaten başlamış! Katılamazsınız.'
        ));
      }

      // Aynı isimde katılımcı var mı?
      const existingParticipant = room.participants.find(p => 
        p.username.toLowerCase() === userValidation.username.toLowerCase()
      );
      if (existingParticipant) {
        return res.status(400).json(Utils.errorResponse(
          'Bu isim zaten kullanılıyor! Başka bir isim deneyin.'
        ));
      }

      res.json(Utils.successResponse(
        `${room.title} odasına katılabilirsiniz!`,
        {
          room: {
            id: room.id,
            roomCode: room.roomCode,
            title: room.title,
            participantCount: room.participants.length,
            questionCount: room.questions.length,
            isStarted: room.isStarted
          },
          user: {
            username: userValidation.username
          },
          message: 'Socket bağlantısı bekleniyor...'
        }
      ));

    } catch (error) {
      console.error('❌ Odaya katılma hatası:', error);
      res.status(500).json(Utils.errorResponse('Odaya katılamadı!', error.message));
    }
  },

  // Oda detaylarını getir
  getRoomDetails: async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      res.json(Utils.successResponse('Oda detayları!', {
        room: room.toJSON()
      }));

    } catch (error) {
      console.error('❌ Oda detay hatası:', error);
      res.status(500).json(Utils.errorResponse('Oda detayları alınamadı!'));
    }
  },

  // Oda koduna göre oda bilgisi
  getRoomByCode: async (req, res) => {
    try {
      const { roomCode } = req.params;
      
      const room = RoomManager.findRoomByCode(roomCode.toUpperCase());
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      res.json(Utils.successResponse('Oda bulundu!', {
        room: room.getStatus()
      }));

    } catch (error) {
      console.error('❌ Oda kod hatası:', error);
      res.status(500).json(Utils.errorResponse('Oda kontrolü yapılamadı!'));
    }
  },

  // Odaya soru ekle
  addQuestion: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { text, options, correctAnswer, points = 100 } = req.body;
      
      console.log(`❓ Soru ekleme: ${roomId}`);
      
      // Oda kontrolü
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Quiz başlamış mı?
      if (room.isStarted) {
        return res.status(400).json(Utils.errorResponse(
          'Quiz başladıktan sonra soru eklenemez!'
        ));
      }

      // Soru doğrulama
      if (!text || typeof text !== 'string' || text.trim().length < 5) {
        return res.status(400).json(Utils.errorResponse(
          'Soru metni en az 5 karakter olmalı!'
        ));
      }

      if (!options || !Array.isArray(options) || options.length !== 4) {
        return res.status(400).json(Utils.errorResponse(
          '4 adet seçenek gerekli!'
        ));
      }

      if (correctAnswer === undefined || correctAnswer < 0 || correctAnswer > 3) {
        return res.status(400).json(Utils.errorResponse(
          'Doğru cevap 0-3 arasında olmalı!'
        ));
      }

      // Seçenekleri doğrula
      const cleanOptions = options.map(opt => {
        if (typeof opt !== 'string' || opt.trim().length < 1) {
          throw new Error('Tüm seçenekler doldurulmalı!');
        }
        return opt.trim().substring(0, 200);
      });

      // Soruyu ekle
      const question = room.addQuestion({
        text: text.trim().substring(0, 500),
        options: cleanOptions,
        correctAnswer: parseInt(correctAnswer),
        points: Math.max(10, Math.min(1000, parseInt(points) || 100))
      });

      res.status(201).json(Utils.successResponse('Soru eklendi!', {
        question: {
          id: question.id,
          text: question.text,
          options: question.options,
          points: question.points
        },
        totalQuestions: room.questions.length
      }));

    } catch (error) {
      console.error('❌ Soru ekleme hatası:', error);
      res.status(500).json(Utils.errorResponse(
        error.message || 'Soru eklenemedi!'
      ));
    }
  },

  // Odayı sil
  deleteRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Aktif quiz varsa silinmez
      if (room.isActive) {
        return res.status(400).json(Utils.errorResponse(
          'Aktif quiz silinemez! Önce quiz\'i bitirin.'
        ));
      }

      RoomManager.deleteRoom(roomId);
      
      res.json(Utils.successResponse(
        `${room.title} odası silindi!`
      ));

    } catch (error) {
      console.error('❌ Oda silme hatası:', error);
      res.status(500).json(Utils.errorResponse('Oda silinemedi!'));
    }
  },

  // Tüm odaları listele
  listRooms: async (req, res) => {
    try {
      const rooms = RoomManager.getAllRooms();
      
      res.json(Utils.successResponse(
        `${rooms.length} oda bulundu!`,
        {
          rooms: rooms,
          total: rooms.length
        }
      ));

    } catch (error) {
      console.error('❌ Oda listeleme hatası:', error);
      res.status(500).json(Utils.errorResponse('Odalar listelenemedi!'));
    }
  },

  // Aktif odaları listele
  listActiveRooms: async (req, res) => {
    try {
      const rooms = RoomManager.getActiveRooms();
      
      res.json(Utils.successResponse(
        `${rooms.length} aktif oda!`,
        {
          rooms: rooms,
          total: rooms.length
        }
      ));

    } catch (error) {
      console.error('❌ Aktif oda listeleme hatası:', error);
      res.status(500).json(Utils.errorResponse('Aktif odalar listelenemedi!'));
    }
  }
};

module.exports = roomController;