// Kimlik doğrulama controller'ı
const { UserManager, Utils } = require('../utils/helpers');

const authController = {
  // Kullanıcı girişi (admin veya player)
  login: async (req, res) => {
    try {
      const { username, isAdmin = false } = req.body;
      
      console.log(`🔐 Giriş isteği: ${username} (Admin: ${isAdmin})`);
      
      // Kullanıcı adını doğrula
      const validation = Utils.validateUsername(username);
      if (!validation.valid) {
        return res.status(400).json(Utils.errorResponse(validation.message));
      }

      // Geçici socket ID oluştur (gerçek socket ID sonra gelecek)
      const tempSocketId = 'web_' + Date.now();
      
      // Kullanıcı oluştur
      const user = UserManager.createOrUpdateUser(tempSocketId, validation.username, isAdmin);
      
      // Başarılı giriş
      res.json(Utils.successResponse(
        `Hoşgeldin ${user.username}! ${isAdmin ? '👑 Admin' : '👤 Oyuncu'}`,
        {
          user: user.toJSON(),
          sessionId: tempSocketId,
          userType: isAdmin ? 'admin' : 'player'
        }
      ));

    } catch (error) {
      console.error('❌ Giriş hatası:', error);
      res.status(500).json(Utils.errorResponse('Giriş yapılamadı!', error.message));
    }
  },

  // Kullanıcı çıkışı
  logout: async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (sessionId) {
        const user = UserManager.removeUser(sessionId);
        if (user) {
          console.log(`👋 Çıkış: ${user.username}`);
          return res.json(Utils.successResponse(`Görüşürüz ${user.username}!`));
        }
      }
      
      res.json(Utils.successResponse('Çıkış yapıldı!'));

    } catch (error) {
      console.error('❌ Çıkış hatası:', error);
      res.status(500).json(Utils.errorResponse('Çıkış yapılamadı!', error.message));
    }
  },

  // Oturum durumunu kontrol et
  checkSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const user = UserManager.findUserBySocketId(sessionId);
      if (!user) {
        return res.status(404).json(Utils.errorResponse('Oturum bulunamadı!'));
      }

      // Kullanıcı aktif mi kontrol et
      if (!user.isActive()) {
        UserManager.removeUser(sessionId);
        return res.status(401).json(Utils.errorResponse('Oturum süresi dolmuş!'));
      }

      res.json(Utils.successResponse('Oturum aktif!', {
        user: user.toJSON(),
        isActive: true
      }));

    } catch (error) {
      console.error('❌ Oturum kontrol hatası:', error);
      res.status(500).json(Utils.errorResponse('Oturum kontrolü yapılamadı!'));
    }
  },

  // Mevcut kullanıcı istatistikleri
  getStats: async (req, res) => {
    try {
      const stats = Utils.getStats();
      
      res.json(Utils.successResponse('İstatistikler getirildi!', {
        ...stats,
        serverTime: new Date().toISOString(),
        uptime: process.uptime()
      }));

    } catch (error) {
      console.error('❌ İstatistik hatası:', error);
      res.status(500).json(Utils.errorResponse('İstatistikler alınamadı!'));
    }
  }
};

module.exports = authController;