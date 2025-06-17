// Yardımcı fonksiyonlar
const Room = require('../models/Room');
const User = require('../models/User');

// Memory'de veri saklama (basit çözüm)
const rooms = new Map(); // roomId -> Room
const users = new Map(); // socketId -> User
const roomCodes = new Map(); // roomCode -> roomId

// Oda yönetimi
const RoomManager = {
  // Yeni oda oluştur
  createRoom(title, adminName) {
    const room = new Room(title, adminName);
    rooms.set(room.id, room);
    roomCodes.set(room.roomCode, room.id);
    
    console.log(`🏠 Yeni oda oluşturuldu: ${room.roomCode} - ${title}`);
    return room;
  },

  // Oda koduna göre oda bul
  findRoomByCode(roomCode) {
    const roomId = roomCodes.get(roomCode);
    return roomId ? rooms.get(roomId) : null;
  },

  // ID'ye göre oda bul
  findRoomById(roomId) {
    return rooms.get(roomId);
  },

  // Odayı sil
  deleteRoom(roomId) {
    const room = rooms.get(roomId);
    if (room) {
      roomCodes.delete(room.roomCode);
      rooms.delete(roomId);
      console.log(`🗑️ Oda silindi: ${room.roomCode}`);
      return true;
    }
    return false;
  },

  // Tüm odaları listele
  getAllRooms() {
    return Array.from(rooms.values()).map(room => room.getStatus());
  },

  // Aktif odaları listele
  getActiveRooms() {
    return Array.from(rooms.values())
      .filter(room => room.isActive)
      .map(room => room.getStatus());
  }
};

// Kullanıcı yönetimi
const UserManager = {
  // Kullanıcı oluştur veya güncelle
  createOrUpdateUser(socketId, username, isAdmin = false) {
    let user = users.get(socketId);
    
    if (user) {
      // Mevcut kullanıcıyı güncelle
      user.username = username;
      user.isAdmin = isAdmin;
      user.setSocketId(socketId);
    } else {
      // Yeni kullanıcı oluştur
      user = new User(username, isAdmin);
      user.setSocketId(socketId);
      users.set(socketId, user);
    }
    
    console.log(`👤 Kullanıcı: ${username} (${socketId.substring(0, 8)}...)`);
    return user;
  },

  // Socket ID'ye göre kullanıcı bul
  findUserBySocketId(socketId) {
    return users.get(socketId);
  },

  // Kullanıcıyı sil
  removeUser(socketId) {
    const user = users.get(socketId);
    if (user) {
      // Eğer bir odadaysa odadan çıkar
      if (user.currentRoom) {
        const room = RoomManager.findRoomByCode(user.currentRoom);
        if (room) {
          room.removeParticipant(socketId);
        }
      }
      
      users.delete(socketId);
      console.log(`👋 Kullanıcı ayrıldı: ${user.username}`);
      return user;
    }
    return null;
  },

  // Tüm kullanıcıları say
  getUserCount() {
    return users.size;
  }
};

// Genel yardımcı fonksiyonlar
const Utils = {
  // Başarılı response
  successResponse(message, data = null) {
    return {
      success: true,
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    };
  },

  // Hata response
  errorResponse(message, error = null) {
    return {
      success: false,
      message: message,
      error: error,
      timestamp: new Date().toISOString()
    };
  },

  // String'i temizle
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, 100); // Max 100 karakter
  },

  // Kullanıcı adını doğrula
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, message: 'Kullanıcı adı gerekli!' };
    }
    
    const cleaned = this.sanitizeString(username);
    if (cleaned.length < 2) {
      return { valid: false, message: 'Kullanıcı adı en az 2 karakter olmalı!' };
    }
    
    if (cleaned.length > 20) {
      return { valid: false, message: 'Kullanıcı adı en fazla 20 karakter olabilir!' };
    }

    // Yasak kelimeler
    const forbidden = ['admin', 'system', 'bot', 'null', 'undefined'];
    if (forbidden.some(word => cleaned.toLowerCase().includes(word))) {
      return { valid: false, message: 'Bu kullanıcı adı kullanılamaz!' };
    }

    return { valid: true, username: cleaned };
  },

  // Oda başlığını doğrula
  validateRoomTitle(title) {
    if (!title || typeof title !== 'string') {
      return { valid: false, message: 'Oda başlığı gerekli!' };
    }
    
    const cleaned = this.sanitizeString(title);
    if (cleaned.length < 3) {
      return { valid: false, message: 'Oda başlığı en az 3 karakter olmalı!' };
    }

    return { valid: true, title: cleaned };
  },

  // İstatistikler
  getStats() {
    return {
      totalRooms: rooms.size,
      activeRooms: Array.from(rooms.values()).filter(r => r.isActive).length,
      totalUsers: users.size,
      totalParticipants: Array.from(rooms.values())
        .reduce((sum, room) => sum + room.participants.length, 0)
    };
  }
};

module.exports = {
  RoomManager,
  UserManager,
  Utils,
  // Memory'deki verilere direkt erişim (debug için)
  _rooms: rooms,
  _users: users,
  _roomCodes: roomCodes
};