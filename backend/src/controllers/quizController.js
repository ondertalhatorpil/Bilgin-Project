const { RoomManager, UserManager, Utils } = require('../utils/helpers');

const quizController = {
  // Quiz'i başlat
  startQuiz: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { adminName } = req.body;
      
      console.log(`🚀 Quiz başlatma isteği: ${roomId} by ${adminName}`);
      
      // Oda kontrolü
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Admin kontrolü
      if (room.adminName !== adminName) {
        return res.status(403).json(Utils.errorResponse('Sadece admin quiz başlatabilir!'));
      }

      // Zaten başlamış mı?
      if (room.isStarted) {
        return res.status(400).json(Utils.errorResponse('Quiz zaten başlamış!'));
      }

      // Hiç soru var mı?
      if (room.questions.length === 0) {
        return res.status(400).json(Utils.errorResponse(
          'Quiz başlatmak için en az 1 soru ekleyin!'
        ));
      }

      // Katılımcı var mı?
      if (room.participants.length === 0) {
        return res.status(400).json(Utils.errorResponse(
          'Quiz başlatmak için en az 1 katılımcı gerekli!'
        ));
      }

      // Quiz'i başlat
      const firstQuestion = room.startQuiz();
      
      res.json(Utils.successResponse(
        `Quiz başladı! ${room.participants.length} katılımcı, ${room.questions.length} soru`,
        {
          room: room.getStatus(),
          firstQuestion: room.getCurrentQuestion(),
          participants: room.participants.map(p => ({
            username: p.username,
            score: p.score
          }))
        }
      ));

    } catch (error) {
      console.error('❌ Quiz başlatma hatası:', error);
      res.status(500).json(Utils.errorResponse(
        error.message || 'Quiz başlatılamadı!'
      ));
    }
  },

  // Sonraki soruya geç
  nextQuestion: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { adminName } = req.body;
      
      console.log(`⏭️ Sonraki soru isteği: ${roomId}`);
      
      // Oda kontrolü
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Admin kontrolü
      if (room.adminName !== adminName) {
        return res.status(403).json(Utils.errorResponse('Sadece admin soru geçişi yapabilir!'));
      }

      // Quiz aktif mi?
      if (!room.isActive) {
        return res.status(400).json(Utils.errorResponse('Quiz aktif değil!'));
      }

      // Sonraki soruya geç
      const nextQuestion = room.nextQuestion();
      
      if (nextQuestion) {
        // Yeni soru var
        res.json(Utils.successResponse(
          `Soru ${room.currentQuestion + 1}/${room.questions.length}`,
          {
            question: room.getCurrentQuestion(),
            questionNumber: room.currentQuestion + 1,
            totalQuestions: room.questions.length,
            participants: room.participants.map(p => ({
              username: p.username,
              score: p.score
            })).sort((a, b) => b.score - a.score) // Puana göre sırala
          }
        ));
      } else {
        // Quiz bitti
        const results = room.finishQuiz();
        
        res.json(Utils.successResponse(
          'Quiz tamamlandı! 🎉',
          {
            finished: true,
            results: results,
            room: room.getStatus()
          }
        ));
      }

    } catch (error) {
      console.error('❌ Sonraki soru hatası:', error);
      res.status(500).json(Utils.errorResponse('Soru geçişi yapılamadı!'));
    }
  },

  // Quiz'i bitir
  finishQuiz: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { adminName } = req.body;
      
      console.log(`🏁 Quiz bitirme isteği: ${roomId}`);
      
      // Oda kontrolü
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Admin kontrolü  
      if (room.adminName !== adminName) {
        return res.status(403).json(Utils.errorResponse('Sadece admin quiz bitirebilir!'));
      }

      // Quiz aktif mi?
      if (!room.isActive) {
        return res.status(400).json(Utils.errorResponse('Quiz zaten bitmiş!'));
      }

      // Quiz'i bitir
      const results = room.finishQuiz();
      
      res.json(Utils.successResponse(
        'Quiz sonlandırıldı!',
        {
          results: results,
          room: room.getStatus(),
          totalParticipants: room.participants.length,
          totalQuestions: room.questions.length
        }
      ));

    } catch (error) {
      console.error('❌ Quiz bitirme hatası:', error);
      res.status(500).json(Utils.errorResponse('Quiz bitirilemedi!'));
    }
  },

  // Mevcut soru bilgisini getir
  getCurrentQuestion: async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      if (!room.isActive) {
        return res.status(400).json(Utils.errorResponse('Quiz aktif değil!'));
      }

      const currentQuestion = room.getCurrentQuestion();
      if (!currentQuestion) {
        return res.status(400).json(Utils.errorResponse('Aktif soru bulunamadı!'));
      }

      res.json(Utils.successResponse('Mevcut soru!', {
        question: currentQuestion,
        room: room.getStatus()
      }));

    } catch (error) {
      console.error('❌ Mevcut soru hatası:', error);
      res.status(500).json(Utils.errorResponse('Soru bilgisi alınamadı!'));
    }
  },

  // Quiz sonuçlarını getir
  getResults: async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Quiz bitmemiş ise mevcut durumu gönder
      if (room.isActive) {
        const currentResults = room.participants
          .map(p => ({
            username: p.username,
            score: p.score,
            correctAnswers: p.answers.filter(a => a.isCorrect).length,
            totalAnswers: p.answers.length
          }))
          .sort((a, b) => b.score - a.score)
          .map((result, index) => ({
            ...result,
            rank: index + 1
          }));

        return res.json(Utils.successResponse('Ara sonuçlar!', {
          results: currentResults,
          isActive: true,
          currentQuestion: room.currentQuestion + 1,
          totalQuestions: room.questions.length
        }));
      }

      // Quiz bitmiş ise final sonuçları
      res.json(Utils.successResponse('Final sonuçları!', {
        results: room.results,
        isActive: false,
        room: room.getStatus(),
        completedAt: room.results.length > 0 ? new Date().toISOString() : null
      }));

    } catch (error) {
      console.error('❌ Sonuç getirme hatası:', error);
      res.status(500).json(Utils.errorResponse('Sonuçlar alınamadı!'));
    }
  },

  // Detaylı quiz analizi
  getQuizAnalysis: async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Soru bazlı analiz
      const questionAnalysis = room.questions.map((question, index) => {
        const questionAnswers = room.participants.flatMap(p => 
          p.answers.filter(a => a.questionIndex === index)
        );

        const optionCounts = [0, 0, 0, 0]; // A, B, C, D
        let correctCount = 0;
        let totalAnswered = questionAnswers.length;

        questionAnswers.forEach(answer => {
          if (answer.selectedAnswer >= 0 && answer.selectedAnswer <= 3) {
            optionCounts[answer.selectedAnswer]++;
          }
          if (answer.isCorrect) {
            correctCount++;
          }
        });

        return {
          questionNumber: index + 1,
          questionText: question.text.substring(0, 50) + '...',
          correctAnswer: question.correctAnswer,
          correctCount: correctCount,
          totalAnswered: totalAnswered,
          successRate: totalAnswered > 0 ? (correctCount / totalAnswered * 100).toFixed(1) : 0,
          optionDistribution: {
            A: optionCounts[0],
            B: optionCounts[1], 
            C: optionCounts[2],
            D: optionCounts[3]
          }
        };
      });

      // Genel istatistikler
      const totalParticipants = room.participants.length;
      const averageScore = totalParticipants > 0 
        ? (room.participants.reduce((sum, p) => sum + p.score, 0) / totalParticipants).toFixed(1)
        : 0;

      res.json(Utils.successResponse('Quiz analizi!', {
        room: room.getStatus(),
        generalStats: {
          totalParticipants: totalParticipants,
          totalQuestions: room.questions.length,
          averageScore: averageScore,
          quizDuration: room.isStarted ? 'Devam ediyor' : 'Tamamlandı'
        },
        questionAnalysis: questionAnalysis,
        topScorers: room.participants
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((p, index) => ({
            rank: index + 1,
            username: p.username,
            score: p.score,
            correctAnswers: p.answers.filter(a => a.isCorrect).length
          }))
      }));

    } catch (error) {
      console.error('❌ Quiz analiz hatası:', error);
      res.status(500).json(Utils.errorResponse('Quiz analizi yapılamadı!'));
    }
  },

exportToExcel: async (req, res) => {
  try {
    const { roomId } = req.params;
    const { adminName } = req.query;
    
    console.log(`📊 Excel export isteği: ${roomId} by ${adminName}`);
    
    const room = RoomManager.findRoomById(roomId);
    if (!room) {
      return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
    }

    // Admin kontrolü
    if (room.adminName !== adminName) {
      return res.status(403).json(Utils.errorResponse('Sadece admin export yapabilir!'));
    }

    // ✅ SORUN 1 DÜZELTMESİ: Quiz aktifken de export yapılabilsin
    // if (room.isActive) {
    //   return res.status(400).json(Utils.errorResponse('Quiz henüz bitmedi! Önce quiz\'i bitirin.'));
    // }

    // ✅ SORUN 2 DÜZELTMESİ: Doğru sonuçları al
    let finalResults = [];
    
    if (room.results && room.results.length > 0) {
      // Quiz bitmiş - results kullan
      finalResults = room.results;
      console.log('✅ Room.results kullanıldı:', finalResults);
    } else if (room.participants && room.participants.length > 0) {
      // Quiz aktif/bitirilememiş - participants'tan sonuç oluştur
      finalResults = room.participants
        .sort((a, b) => b.score - a.score)
        .map((p, index) => ({
          rank: index + 1,
          username: p.username,
          score: p.score,
          correctAnswers: p.answers ? p.answers.filter(a => a.isCorrect).length : 0,
          totalAnswers: p.answers ? p.answers.length : 0,
          wrongAnswers: p.answers ? p.answers.filter(a => !a.isCorrect).length : 0,
          successRate: p.answers && p.answers.length > 0 
            ? ((p.answers.filter(a => a.isCorrect).length / p.answers.length) * 100).toFixed(1)
            : 0
        }));
      console.log('✅ Participants\'tan sonuç oluşturuldu:', finalResults);
    }

    // Excel data hazırla
    const excelData = {
      quizInfo: {
        title: room.title,
        adminName: room.adminName,
        roomCode: room.roomCode,
        totalQuestions: room.questions.length,
        totalParticipants: finalResults.length, // ✅ DÜZELTİLDİ
        completedAt: new Date().toISOString(),
        averageScore: finalResults.length > 0  // ✅ DÜZELTİLDİ
          ? (finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length).toFixed(1)
          : 0
      },
      
      // ✅ SORUN 3 DÜZELTMESİ: results array'ini doğru gönder
      results: finalResults,
      
      // ✅ SORUN 4 DÜZELTMESİ: detailedResults'u doğru oluştur
      detailedResults: room.participants ? room.participants.map(p => ({
        username: p.username,
        score: p.score,
        correctAnswers: p.answers ? p.answers.filter(a => a.isCorrect).length : 0,
        wrongAnswers: p.answers ? p.answers.filter(a => !a.isCorrect).length : 0,
        totalAnswers: p.answers ? p.answers.length : 0,
        successRate: p.answers && p.answers.length > 0 
          ? ((p.answers.filter(a => a.isCorrect).length / p.answers.length) * 100).toFixed(1)
          : 0,
        answers: p.answers ? p.answers.map(a => ({
          questionNumber: a.questionIndex + 1,
          selectedAnswer: String.fromCharCode(65 + a.selectedAnswer),
          isCorrect: a.isCorrect,
          points: a.points || 0,
          timeSpent: a.timeSpent || 0
        })) : []
      })) : [],
      
      questionAnalysis: room.questions && room.questions.length > 0 && room.participants ? 
        room.questions.map((question, index) => {
          console.log(`🔍 Soru ${index + 1} analizi yapılıyor...`);
          
          // Bu soruya verilen tüm cevapları topla
          const questionAnswers = room.participants.flatMap(p => 
            (p.answers || []).filter(a => a.questionIndex === index)
          );
          
          console.log(`📝 Soru ${index + 1} - Toplam cevap sayısı: ${questionAnswers.length}`);
          
          const optionCounts = [0, 0, 0, 0]; // A, B, C, D
          let correctCount = 0;
          
          questionAnswers.forEach(answer => {
            // Seçenek sayımı
            if (answer.selectedAnswer >= 0 && answer.selectedAnswer <= 3) {
              optionCounts[answer.selectedAnswer]++;
            }
            // Doğru cevap sayımı
            if (answer.isCorrect) {
              correctCount++;
            }
          });

          const analysis = {
            questionNumber: index + 1,
            questionText: question.text || `Soru ${index + 1}`,
            correctAnswer: String.fromCharCode(65 + (question.correctAnswer || 0)),
            correctCount: correctCount,
            totalAnswered: questionAnswers.length,
            successRate: questionAnswers.length > 0 
              ? (correctCount / questionAnswers.length * 100).toFixed(1) 
              : 0,
            optionA: optionCounts[0],
            optionB: optionCounts[1],
            optionC: optionCounts[2],
            optionD: optionCounts[3]
          };
          
          console.log(`📊 Soru ${index + 1} analizi:`, analysis);
          return analysis;
        }) : []
    };

    console.log('📤 Export edilecek veriler:', {
      quizInfo: excelData.quizInfo,
      resultsCount: excelData.results.length,
      detailedResultsCount: excelData.detailedResults.length,
      questionAnalysisCount: excelData.questionAnalysis.length
    });

    // Room'u downloaded olarak işaretle
    room.isDownloaded = true;
    room.downloadedAt = new Date();
    room.downloadedBy = adminName;

    res.json(Utils.successResponse('Excel verileri hazırlandı!', {
      excelData: excelData,
      filename: `Quiz_${room.roomCode}_${new Date().toISOString().split('T')[0]}.xlsx`,
      downloadInfo: {
        isDownloaded: true,
        downloadedAt: room.downloadedAt,
        downloadedBy: adminName
      }
    }));

  } catch (error) {
    console.error('❌ Excel export hatası:', error);
    res.status(500).json(Utils.errorResponse('Excel export yapılamadı!'));
  }
},

  // Quiz'i tekrar başlatma (bonus özellik)
  restartQuiz: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { adminName } = req.body;
      
      console.log(`🔄 Quiz yeniden başlatma isteği: ${roomId}`);
      
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Admin kontrolü
      if (room.adminName !== adminName) {
        return res.status(403).json(Utils.errorResponse('Sadece admin quiz yeniden başlatabilir!'));
      }

      // Quiz aktif ise hata
      if (room.isActive) {
        return res.status(400).json(Utils.errorResponse('Aktif quiz yeniden başlatılamaz!'));
      }

      // Quiz'i sıfırla
      room.currentQuestion = 0;
      room.isActive = false;
      room.isStarted = false;
      room.results = [];
      
      // Katılımcıların cevaplarını ve puanlarını sıfırla
      room.participants.forEach(p => {
        p.score = 0;
        p.answers = [];
      });

      res.json(Utils.successResponse('Quiz sıfırlandı! Tekrar başlatabilirsiniz.', {
        room: room.getStatus(),
        participants: room.participants.map(p => ({
          username: p.username,
          score: p.score
        }))
      }));

    } catch (error) {
      console.error('❌ Quiz restart hatası:', error);
      res.status(500).json(Utils.errorResponse('Quiz yeniden başlatılamadı!'));
    }
  },

  // Katılımcı kickleme (admin özelliği)
  kickParticipant: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { adminName, username } = req.body;
      
      console.log(`👋 Katılımcı kickleme isteği: ${username} from ${roomId}`);
      
      const room = RoomManager.findRoomById(roomId);
      if (!room) {
        return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
      }

      // Admin kontrolü
      if (room.adminName !== adminName) {
        return res.status(403).json(Utils.errorResponse('Sadece admin katılımcı çıkarabilir!'));
      }

      // Katılımcıyı bul ve çıkar
      const participantIndex = room.participants.findIndex(p => p.username === username);
      if (participantIndex === -1) {
        return res.status(404).json(Utils.errorResponse('Katılımcı bulunamadı!'));
      }

      const removedParticipant = room.participants.splice(participantIndex, 1)[0];

      res.json(Utils.successResponse(`${username} odadan çıkarıldı!`, {
        removedParticipant: {
          username: removedParticipant.username,
          score: removedParticipant.score
        },
        remainingParticipants: room.participants.map(p => ({
          username: p.username,
          score: p.score
        }))
      }));

    } catch (error) {
      console.error('❌ Katılımcı kick hatası:', error);
      res.status(500).json(Utils.errorResponse('Katılımcı çıkarılamadı!'));
    }
  },

getQuizStats: async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = RoomManager.findRoomById(roomId);
    if (!room) {
      return res.status(404).json(Utils.errorResponse('Oda bulunamadı!'));
    }

    // 🔧 DÜZELTİLMİŞ VERSİYON - Quiz bitmiş odalar için doğru hesaplama
    let totalParticipants, averageScore, topScorer;
    
    if (!room.isActive && room.results && room.results.length > 0) {
      // ✅ Quiz bitmiş - results'tan bilgileri al
      console.log('📊 Quiz bitmiş - results\'tan veri alınıyor:', room.results);
      
      totalParticipants = room.results.length;
      averageScore = (room.results.reduce((sum, r) => sum + r.score, 0) / totalParticipants).toFixed(1);
      topScorer = room.results[0]?.username || null; // İlk sırada olan
      
    } else if (room.participants && room.participants.length > 0) {
      // ✅ Quiz aktif veya participants mevcut - participants'tan al
      console.log('📊 Participants\'tan veri alınıyor:', room.participants);
      
      totalParticipants = room.participants.length;
      averageScore = (room.participants.reduce((sum, p) => sum + p.score, 0) / totalParticipants).toFixed(1);
      topScorer = room.participants.reduce((top, p) => p.score > top.score ? p : top)?.username || null;
      
    } else {
      // ❌ Hiç veri yok - sıfır değerler
      console.log('⚠️ Hiç katılımcı verisi yok!');
      totalParticipants = 0;
      averageScore = 0;
      topScorer = null;
    }

    console.log(`📊 Hesaplanan değerler: Katılımcı=${totalParticipants}, Ortalama=${averageScore}, TopScorer=${topScorer}`);

    const stats = {
      basic: {
        title: room.title,
        roomCode: room.roomCode,
        adminName: room.adminName,
        status: room.isActive ? 'Aktif' : room.isStarted ? 'Tamamlandı' : 'Bekliyor',
        totalQuestions: room.questions.length,
        totalParticipants: totalParticipants, // ✅ Düzeltildi
        currentQuestion: room.currentQuestion + 1,
        isDownloaded: room.isDownloaded || false
      },
      participants: {
        total: totalParticipants, // ✅ Düzeltildi
        answered: room.participants ? room.participants.filter(p => 
          p.answers && p.answers.some(a => a.questionIndex === room.currentQuestion)
        ).length : 0,
        topScorer: topScorer, // ✅ Düzeltildi
        averageScore: averageScore // ✅ Düzeltildi
      },
      questions: {
        total: room.questions.length,
        completed: room.currentQuestion,
        remaining: Math.max(0, room.questions.length - room.currentQuestion - 1),
        averageSuccessRate: room.questions.length > 0 ? (
          room.questions.map((_, index) => {
            // Quiz bitmiş ise results'tan hesapla
            if (!room.isActive && room.results && room.results.length > 0) {
              const totalCorrect = room.results.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
              const totalAnswers = room.results.length * room.questions.length;
              return totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;
            } else if (room.participants && room.participants.length > 0) {
              // Aktif quiz - participants'tan hesapla
              const answers = room.participants.flatMap(p => 
                (p.answers || []).filter(a => a.questionIndex === index)
              );
              const correct = answers.filter(a => a.isCorrect).length;
              return answers.length > 0 ? (correct / answers.length) * 100 : 0;
            }
            return 0;
          }).reduce((sum, rate) => sum + rate, 0) / room.questions.length
        ).toFixed(1) : 0
      }
    };

    console.log('📤 Gönderilen stats:', JSON.stringify(stats, null, 2));

    res.json(Utils.successResponse('Quiz istatistikleri!', stats));

  } catch (error) {
    console.error('❌ Quiz stats hatası:', error);
    res.status(500).json(Utils.errorResponse('İstatistikler alınamadı!'));
  }
}
}

module.exports = quizController;