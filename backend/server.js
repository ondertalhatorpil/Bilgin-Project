// Ana sunucu dosyası
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = require('./src/app');

// HTTP sunucusu oluştur
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://localhost:3001",
      "https://bilgin.onder.org.tr"  // Production domain ekle
    ], 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO olaylarını yönet
require('./src/socket/quizSocket.js')(io);

// Farklı port kullan - 5001
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log('🚀 Kahoot Quiz Backend çalışıyor!');
  console.log(`📡 Sunucu: http://localhost:${PORT}`);
  console.log('🎮 Socket.IO hazır!');
  console.log('⚡ Quiz oyunu başlayabilir!');
});