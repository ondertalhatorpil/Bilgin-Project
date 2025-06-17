// Socket.IO gerçek zamanlı quiz işlemleri
const { RoomManager, UserManager, Utils } = require('../utils/helpers');

module.exports = (io) => {
  console.log('📡 Socket.IO Quiz Handler başlatıldı');

  io.on('connection', (socket) => {
    console.log(`🔌 Yeni bağlantı: ${socket.id}`);

    // Kullanıcı odaya katıldığında
    socket.on('join-room', async (data) => {
      try {
        const { roomCode, username, isAdmin = false } = data;

        console.log(`👤 Oda katılım isteği: ${username} -> ${roomCode}`);

        // Veri doğrulama
        if (!roomCode || !username) {
          socket.emit('error', Utils.errorResponse('Oda kodu ve kullanıcı adı gerekli!'));
          return;
        }

        // Kullanıcı adını doğrula
        const userValidation = Utils.validateUsername(username);
        if (!userValidation.valid) {
          socket.emit('error', Utils.errorResponse(userValidation.message));
          return;
        }

        // Oda bul
        const room = RoomManager.findRoomByCode(roomCode.toUpperCase());
        if (!room) {
          socket.emit('error', Utils.errorResponse('Oda bulunamadı!'));
          return;
        }

        // Quiz başlamış mı kontrol et
        if (room.isStarted && !isAdmin) {
          socket.emit('error', Utils.errorResponse('Quiz zaten başlamış!'));
          return;
        }

        // Admin kontrolü
        if (isAdmin && room.adminName !== userValidation.username) {
          socket.emit('error', Utils.errorResponse('Admin yetkisi doğrulanamadı!'));
          return;
        }

        // Kullanıcıyı oluştur/güncelle
        const user = UserManager.createOrUpdateUser(socket.id, userValidation.username, isAdmin);
        user.joinRoom(roomCode);

        if (!isAdmin) {
          // Normal katılımcı olarak ekle
          try {
            const participant = room.addParticipant(userValidation.username, socket.id);

            // Socket'i oda grubuna ekle
            socket.join(room.id);

            // Katılımcıya hoşgeldin mesajı
            socket.emit('room-joined', Utils.successResponse(
              `${room.title} odasına hoşgeldin!`,
              {
                room: room.getStatus(),
                participant: {
                  username: participant.username,
                  score: participant.score
                },
                isAdmin: false
              }
            ));

            // Diğer katılımcılara bildir
            socket.to(room.id).emit('participant-joined', {
              username: participant.username,
              participantCount: room.participants.length
            });

            // Admin'e katılımcı listesini gönder
            io.to(room.id).emit('participants-updated', {
              participants: room.participants.map(p => ({
                username: p.username,
                score: p.score,
                isConnected: p.isConnected
              }))
            });

          } catch (error) {
            socket.emit('error', Utils.errorResponse(error.message));
            return;
          }
        } else {
          // Admin olarak bağlan
          socket.join(room.id);

          socket.emit('admin-connected', Utils.successResponse(
            'Admin paneline hoşgeldin!',
            {
              room: room.toJSON(),
              participants: room.participants.map(p => ({
                username: p.username,
                score: p.score,
                isConnected: p.isConnected
              }))
            }
          ));
        }

      } catch (error) {
        console.error('❌ Oda katılım hatası:', error);
        socket.emit('error', Utils.errorResponse('Odaya katılım başarısız!'));
      }
    });

    // Quiz başlatma (sadece admin)
    socket.on('start-quiz', async (data) => {
      try {
        const { roomId } = data;

        const user = UserManager.findUserBySocketId(socket.id);
        if (!user || !user.isAdmin) {
          socket.emit('error', Utils.errorResponse('Sadece admin quiz başlatabilir!'));
          return;
        }

        const room = RoomManager.findRoomById(roomId);
        if (!room) {
          socket.emit('error', Utils.errorResponse('Oda bulunamadı!'));
          return;
        }

        if (room.adminName !== user.username) {
          socket.emit('error', Utils.errorResponse('Bu odanın admin\'i değilsiniz!'));
          return;
        }

        // Quiz'i başlat
        const firstQuestion = room.startQuiz();

        console.log(`🚀 Quiz başlatıldı: ${room.roomCode} by ${user.username}`);

        // Tüm katılımcılara quiz başladığını bildir
        io.to(room.id).emit('quiz-started', Utils.successResponse(
          'Quiz başladı! 🎉',
          {
            room: room.getStatus(),
            firstQuestion: room.getCurrentQuestion(),
            totalQuestions: room.questions.length
          }
        ));

        // 3 saniye sonra ilk soruyu gönder
        setTimeout(() => {
          io.to(room.id).emit('new-question', {
            question: room.getCurrentQuestion(),
            questionNumber: room.currentQuestion + 1,
            totalQuestions: room.questions.length,
            timeLimit: room.questions[room.currentQuestion].timeLimit
          });
        }, 3000);

      } catch (error) {
        console.error('❌ Quiz başlatma hatası:', error);
        socket.emit('error', Utils.errorResponse(error.message));
      }
    });

    // Cevap gönderme
    socket.on('submit-answer', async (data) => {
      try {
        const { roomId, answerIndex, timeSpent = 0 } = data;

        const user = UserManager.findUserBySocketId(socket.id);
        if (!user) {
          socket.emit('error', Utils.errorResponse('Kullanıcı bulunamadı!'));
          return;
        }

        const room = RoomManager.findRoomById(roomId);
        if (!room || !room.isActive) {
          socket.emit('error', Utils.errorResponse('Aktif quiz bulunamadı!'));
          return;
        }

        // Cevap doğrulama
        if (answerIndex < 0 || answerIndex > 3) {
          socket.emit('error', Utils.errorResponse('Geçersiz cevap!'));
          return;
        }

        // Cevabı kaydet
        const result = room.submitAnswer(socket.id, answerIndex, timeSpent);

        console.log(`✅ Cevap: ${user.username} -> ${answerIndex} (${result.points} puan)`);

        // Kullanıcıya cevap onayı gönder
        socket.emit('answer-submitted', Utils.successResponse(
          result.points > 0 ? `Doğru! +${result.points} puan` : 'Yanlış cevap!',
          {
            isCorrect: result.answer.isCorrect,
            points: result.points,
            totalScore: result.participant.score,
            selectedAnswer: answerIndex
          }
        ));

        // Admin'e anlık istatistik gönder
        const answeredCount = room.participants.filter(p =>
          p.answers.some(a => a.questionIndex === room.currentQuestion)
        ).length;

        socket.to(room.id).emit('answer-stats', {
          answeredCount: answeredCount,
          totalParticipants: room.participants.length,
          participant: user.username
        });

      } catch (error) {
        console.error('❌ Cevap gönderme hatası:', error);
        socket.emit('error', Utils.errorResponse(error.message));
      }
    });

socket.on('next-question', async (data) => {
  try {
    const { roomId } = data;

    const user = UserManager.findUserBySocketId(socket.id);
    if (!user || !user.isAdmin) {
      socket.emit('error', Utils.errorResponse('Sadece admin soru geçişi yapabilir!'));
      return;
    }

    const room = RoomManager.findRoomById(roomId);
    if (!room || !room.isActive) {
      socket.emit('error', Utils.errorResponse('Aktif quiz bulunamadı!'));
      return;
    }

    console.log(`🔍 [SOCKET] next-question başlangıç - currentQuestion: ${room.currentQuestion}`);

    // Şu anki sorunun doğru cevabını göster
    const currentQuestion = room.questions[room.currentQuestion];
    if (currentQuestion) {
      io.to(room.id).emit('show-correct-answer', {
        correctAnswer: currentQuestion.correctAnswer,
        correctOption: currentQuestion.options[currentQuestion.correctAnswer],
      });
    }

    // 3 saniye bekle, sonra sonraki soruya geç
    setTimeout(() => {
      console.log(`🔍 [SOCKET] setTimeout çalıştı - şu anki index: ${room.currentQuestion}`);
      
      // SADECE BU SATIRDA nextQuestion() çağrılıyor
      const nextQuestionData = room.nextQuestion();
      
      console.log(`🔍 [SOCKET] nextQuestion() sonrası - index: ${room.currentQuestion}`);

      if (nextQuestionData) {
        io.to(room.id).emit('new-question', {
          question: nextQuestionData,
          questionNumber: room.currentQuestion + 1,
          totalQuestions: room.questions.length,
          timeLimit: nextQuestionData.timeLimit
        });

        console.log(`✅ [SOCKET] Soru ${room.currentQuestion + 1}/${room.questions.length} gönderildi`);
      } else {
        // Quiz bitti
        const results = room.finishQuiz();
        io.to(room.id).emit('quiz-finished', Utils.successResponse(
          'Quiz tamamlandı! 🎉',
          { results: results, room: room.getStatus() }
        ));
        console.log(`🏁 [SOCKET] Quiz bitti`);
      }
    }, 3000);

  } catch (error) {
    console.error('❌ Sonraki soru hatası:', error);
    socket.emit('error', Utils.errorResponse(error.message));
  }
});

    // Quiz bitirme (sadece admin)
    socket.on('finish-quiz', async (data) => {
      try {
        const { roomId } = data;

        const user = UserManager.findUserBySocketId(socket.id);
        if (!user || !user.isAdmin) {
          socket.emit('error', Utils.errorResponse('Sadece admin quiz bitirebilir!'));
          return;
        }

        const room = RoomManager.findRoomById(roomId);
        if (!room) {
          socket.emit('error', Utils.errorResponse('Oda bulunamadı!'));
          return;
        }

        const results = room.finishQuiz();

        io.to(room.id).emit('quiz-finished', Utils.successResponse(
          'Quiz sonlandırıldı!',
          {
            results: results,
            room: room.getStatus()
          }
        ));

        console.log(`🛑 Quiz sonlandırıldı: ${room.roomCode} by ${user.username}`);

      } catch (error) {
        console.error('❌ Quiz bitirme hatası:', error);
        socket.emit('error', Utils.errorResponse(error.message));
      }
    });

    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
      try {
        const user = UserManager.findUserBySocketId(socket.id);
        if (user) {
          console.log(`👋 Bağlantı kesildi: ${user.username} (${socket.id})`);

          // Eğer bir odadaysa odadan çıkar
          if (user.currentRoom) {
            const room = RoomManager.findRoomByCode(user.currentRoom);
            if (room) {
              const removedParticipant = room.removeParticipant(socket.id);
              if (removedParticipant) {
                // Diğer katılımcılara bildir
                socket.to(room.id).emit('participant-left', {
                  username: removedParticipant.username,
                  participantCount: room.participants.length
                });

                // Güncel katılımcı listesini gönder
                io.to(room.id).emit('participants-updated', {
                  participants: room.participants.map(p => ({
                    username: p.username,
                    score: p.score,
                    isConnected: p.isConnected
                  }))
                });
              }
            }
          }

          // Kullanıcıyı sil
          UserManager.removeUser(socket.id);
        }
      } catch (error) {
        console.error('❌ Bağlantı kesme hatası:', error);
      }
    });

    // Ping-pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  setInterval(() => {
  const stats = Utils.getStats();
  console.log(`📊 İstatistikler: ${stats.totalRooms} oda, ${stats.totalUsers} kullanıcı, ${stats.activeRooms} aktif quiz`);
}, 30000);
};