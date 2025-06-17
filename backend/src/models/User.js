// Kullanıcı (User) veri modeli
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(username, isAdmin = false) {
    this.id = uuidv4();
    this.username = username;
    this.isAdmin = isAdmin;
    this.currentRoom = null; // Hangi odada
    this.socketId = null; // Socket bağlantı ID'si
    this.score = 0; // Toplam puan
    this.createdAt = new Date();
    this.lastActive = new Date();
  }

  // Odaya katıl
  joinRoom(roomCode) {
    this.currentRoom = roomCode;
    this.lastActive = new Date();
  }

  // Odadan ayrıl
  leaveRoom() {
    this.currentRoom = null;
    this.lastActive = new Date();
  }

  // Socket ID'sini güncelle
  setSocketId(socketId) {
    this.socketId = socketId;
    this.lastActive = new Date();
  }

  // Puanı güncelle
  updateScore(points) {
    this.score += points;
    this.lastActive = new Date();
  }

  // Kullanıcı aktif mi?
  isActive() {
    const now = new Date();
    const timeDiff = now - this.lastActive;
    return timeDiff < 300000; // 5 dakika
  }

  // JSON serialize
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      isAdmin: this.isAdmin,
      currentRoom: this.currentRoom,
      score: this.score,
      isActive: this.isActive(),
      createdAt: this.createdAt,
      lastActive: this.lastActive
    };
  }
}

module.exports = User;