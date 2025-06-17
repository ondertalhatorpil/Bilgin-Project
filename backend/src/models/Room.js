// Oda (Room) veri modeli
const { v4: uuidv4 } = require('uuid');

class Room {
  constructor(title, adminName) {
    this.id = uuidv4(); // Benzersiz ID
    this.roomCode = this.generateRoomCode(); // 6 haneli kod
    this.title = title;
    this.adminName = adminName;
    this.questions = []; // Sorular listesi
    this.participants = []; // Katılımcılar
    this.currentQuestion = 0; // Şu anki soru indexi
    this.isActive = false; // Quiz aktif mi?
    this.isStarted = false; // Quiz başladı mı?
    this.results = []; // Sonuçlar
    this.createdAt = new Date();
    
    // Yeni özellikler
    this.isDownloaded = false; // Sonuçlar indirildi mi?
    this.downloadedAt = null; // Ne zaman indirildi?
    this.downloadedBy = null; // Kim indirdi?
    this.allowRestart = true; // Yeniden başlatılabilir mi?
    this.maxParticipants = 50; // Maksimum katılımcı sayısı
    
    this.settings = {
      questionTime: 20, // Her soru için süre (saniye)
      showCorrectAnswer: true, // Doğru cevabı göster
      showLeaderboard: true, // Sıralama tablosunu göster
      allowLateJoin: false, // Quiz başladıktan sonra katılıma izin ver
      shuffleQuestions: false, // Soruları karıştır
      shuffleOptions: false // Seçenekleri karıştır
    };
  }

  // 6 haneli oda kodu oluştur (ABC123 formatında)
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Soru ekle
  addQuestion(questionData) {
    const question = {
      id: uuidv4(),
      text: questionData.text,
      options: questionData.options, // [A, B, C, D]
      correctAnswer: questionData.correctAnswer, // 0, 1, 2, 3
      points: questionData.points || 100,
      timeLimit: questionData.timeLimit || this.settings.questionTime
    };
    this.questions.push(question);
    return question;
  }

  // Katılımcı ekle
  addParticipant(username, socketId) {
    // Aynı isimde birisi var mı kontrol et
    const existing = this.participants.find(p => p.username === username);
    if (existing) {
      throw new Error('Bu isim zaten kullanılıyor!');
    }

    const participant = {
      id: uuidv4(),
      username: username,
      socketId: socketId,
      score: 0,
      answers: [], // Verdiği cevaplar
      isConnected: true,
      joinedAt: new Date()
    };

    this.participants.push(participant);
    return participant;
  }

  // Katılımcı çıkar
  removeParticipant(socketId) {
    const index = this.participants.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      const participant = this.participants[index];
      this.participants.splice(index, 1);
      return participant;
    }
    return null;
  }

  // Katılımcı cevabını kaydet
  submitAnswer(socketId, answerIndex, timeSpent) {
    const participant = this.participants.find(p => p.socketId === socketId);
    if (!participant) {
      throw new Error('Katılımcı bulunamadı!');
    }

    const currentQ = this.questions[this.currentQuestion];
    if (!currentQ) {
      throw new Error('Aktif soru bulunamadı!');
    }

    // Cevabı kontrol et
    const isCorrect = answerIndex === currentQ.correctAnswer;
    
    // Puan hesapla (hızlı cevap = daha çok puan)
    let points = 0;
    if (isCorrect) {
      const timeBonus = Math.max(0, currentQ.timeLimit - timeSpent);
      points = Math.round(currentQ.points + (timeBonus * 5)); // Hız bonusu
    }

    // Cevabı kaydet
    const answer = {
      questionId: currentQ.id,
      questionIndex: this.currentQuestion,
      selectedAnswer: answerIndex,
      isCorrect: isCorrect,
      points: points,
      timeSpent: timeSpent,
      answeredAt: new Date()
    };

    participant.answers.push(answer);
    participant.score += points;

    return { participant, answer, points };
  }

nextQuestion() {
  console.log(`🔍 [nextQuestion] Giriş - currentQuestion: ${this.currentQuestion}/${this.questions.length - 1}`);
  
  // Quiz bitmiş mi kontrol et
  if (this.currentQuestion >= this.questions.length - 1) {
    console.log(`🔍 [nextQuestion] Quiz zaten bitti!`);
    return null;
  }
  
  // Index'i artır
  this.currentQuestion++;
  console.log(`🔍 [nextQuestion] Index artırıldı: ${this.currentQuestion}`);
  
  // Yeni soruyu döndür
  const nextQuestion = this.getCurrentQuestion();
  console.log(`🔍 [nextQuestion] Çıkış - Soru ${this.currentQuestion + 1} hazır`);
  
  return nextQuestion;
}

  // Quiz'i başlat
  startQuiz() {
    if (this.questions.length === 0) {
      throw new Error('Hiç soru eklenmemiş!');
    }
    this.isStarted = true;
    this.isActive = true;
    this.currentQuestion = 0;
    return this.questions[0];
  }

  // Quiz'i bitir
  finishQuiz() {
    this.isActive = false;
    
    // Sıralama tablosu oluştur
    this.results = this.participants
      .map(p => ({
        username: p.username,
        score: p.score,
        correctAnswers: p.answers.filter(a => a.isCorrect).length,
        totalAnswers: p.answers.length
      }))
      .sort((a, b) => b.score - a.score) // Puana göre sırala
      .map((result, index) => ({
        ...result,
        rank: index + 1
      }));

    return this.results;
  }

getCurrentQuestion() {
  console.log(`🔍 [getCurrentQuestion] Index: ${this.currentQuestion}, Total: ${this.questions.length}`);
  
  if (this.currentQuestion >= 0 && this.currentQuestion < this.questions.length) {
    const question = this.questions[this.currentQuestion];
    const result = {
      id: question.id,
      text: question.text,
      options: question.options,
      timeLimit: question.timeLimit,
      questionNumber: this.currentQuestion + 1,
      totalQuestions: this.questions.length
    };
    
    console.log(`🔍 [getCurrentQuestion] Döndürülen: Soru ${result.questionNumber}/${result.totalQuestions}`);
    return result;
  }
  
  console.log(`❌ [getCurrentQuestion] Geçersiz index: ${this.currentQuestion}`);
  return null;
}

  // Oda durumunu al
  getStatus() {
    return {
      id: this.id,
      roomCode: this.roomCode,
      title: this.title,
      adminName: this.adminName,
      participantCount: this.participants.length,
      questionCount: this.questions.length,
      currentQuestion: this.currentQuestion + 1,
      isActive: this.isActive,
      isStarted: this.isStarted,
      createdAt: this.createdAt
    };
  }

  // Basit JSON serialize
  toJSON() {
    return {
      id: this.id,
      roomCode: this.roomCode,
      title: this.title,
      adminName: this.adminName,
      questions: this.questions,
      participants: this.participants.map(p => ({
        username: p.username,
        score: p.score,
        isConnected: p.isConnected
      })),
      currentQuestion: this.currentQuestion,
      isActive: this.isActive,
      isStarted: this.isStarted,
      results: this.results,
      createdAt: this.createdAt,
      settings: this.settings
    };
  }
}

module.exports = Room;