// Socket.IO servis dosyası - Gerçek zamanlı iletişim
import { io } from 'socket.io-client';

// Backend Socket URL - Port 5001
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bilgin.onder.org.tr' 
  : 'http://localhost:5001';

  
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Socket bağlantısı kur
  connect() {
    if (this.socket) {
      return this.socket;
    }

    console.log('🔌 Socket bağlantısı kuruluyor...', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    // Bağlantı olayları dinle
    this.setupEventListeners();

    return this.socket;
  }

  // Event listener'ları kur
  setupEventListeners() {
    if (!this.socket) return;

    // Bağlantı kuruldu
    this.socket.on('connect', () => {
      console.log('✅ Socket bağlandı! ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Bağlantı kesildi
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket bağlantısı kesildi:', reason);
      this.isConnected = false;
    });

    // Bağlantı hatası
    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket bağlantı hatası:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Socket yeniden bağlantı denemeleri tükendi!');
      }
    });

    // Yeniden bağlantı denemesi
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket yeniden bağlantı denemesi: ${attemptNumber}`);
    });

    // Yeniden bağlandı
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket yeniden bağlandı! Deneme: ${attemptNumber}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Genel hata yakalayıcı
    this.socket.on('error', (error) => {
      console.error('⚠️ Socket hatası:', error);
    });

    // Ping-pong connection health check
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong alındı:', data.timestamp);
    });
  }

  // Odaya katıl
  joinRoom(roomCode, username, isAdmin = false) {
    if (!this.socket) {
      throw new Error('Socket bağlantısı yok!');
    }

    console.log(`🏠 Odaya katılım isteği: ${username} -> ${roomCode}`);
    
    this.socket.emit('join-room', {
      roomCode: roomCode.toUpperCase(),
      username,
      isAdmin
    });
  }

  // Quiz başlat (admin)
  startQuiz(roomId) {
    if (!this.socket) {
      throw new Error('Socket bağlantısı yok!');
    }

    console.log(`🚀 Quiz başlatma isteği: ${roomId}`);
    this.socket.emit('start-quiz', { roomId });
  }

  // Cevap gönder
  submitAnswer(roomId, answerIndex, timeSpent = 0) {
    if (!this.socket) {
      throw new Error('Socket bağlantısı yok!');
    }

    console.log(`📤 Cevap gönderiliyor: ${answerIndex}`);
    this.socket.emit('submit-answer', {
      roomId,
      answerIndex,
      timeSpent
    });
  }

  // Sonraki soru (admin)
  nextQuestion(roomId) {
    if (!this.socket) {
      throw new Error('Socket bağlantısı yok!');
    }

    console.log(`⏭️ Sonraki soru isteği: ${roomId}`);
    this.socket.emit('next-question', { roomId });
  }

  // Quiz bitir (admin)
  finishQuiz(roomId) {
    if (!this.socket) {
      throw new Error('Socket bağlantısı yok!');
    }

    console.log(`🏁 Quiz bitirme isteği: ${roomId}`);
    this.socket.emit('finish-quiz', { roomId });
  }

  // Event listener ekle
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket bağlantısı yok, event dinlenemiyor:', event);
      return;
    }
    this.socket.on(event, callback);
  }

  // Event listener kaldır
  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  // Ping gönder (connection test)
  ping() {
    if (!this.socket) return;
    this.socket.emit('ping');
  }

  // Bağlantıyı kes
  disconnect() {
    if (this.socket) {
      console.log('🔌 Socket bağlantısı kesiliyor...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Bağlantı durumu
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance oluştur
const socketService = new SocketService();

export default socketService;