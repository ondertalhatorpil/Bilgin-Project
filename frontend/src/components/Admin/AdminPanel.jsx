import React, { useState, useEffect, useCallback } from 'react';
import socketService from '../../services/socket';
import apiService from '../../services/api';

const AdminPanel = ({ user, room, onError, onQuizFinished }) => {
  // ===== STATE YÖNETİMİ =====
  const [participants, setParticipants] = useState([]);
  const [quizState, setQuizState] = useState('ready'); // ready, active, finished
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(room?.questionCount || 0);
  const [isConnected, setIsConnected] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [answerStats, setAnswerStats] = useState({ 
    answeredCount: 0, 
    totalParticipants: 0,
    percentage: 0 
  });
  const [loading, setLoading] = useState(false);
  const [roomStats, setRoomStats] = useState(null);
  const [showKickModal, setShowKickModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // ===== LIFECYCLE EFFECTS =====
  useEffect(() => {
    if (room && user && user.isAdmin) {
      console.log('🏁 AdminPanel başlatılıyor:', { room, user });
      initializeAdminPanel();
    } else {
      onError('Admin yetkisi gerekli!');
    }

    return () => {
      cleanup();
    };
  }, [room, user]);

  // ===== ADMIN PANEL İNİTİALİZATİON =====
  const initializeAdminPanel = async () => {
    try {
      setLoading(true);
      await fetchRoomStats();
      await connectAsAdmin();
      setTotalQuestions(room.questionCount || 0);
    } catch (error) {
      console.error('❌ Admin panel başlatma hatası:', error);
      onError('Admin panel başlatılamadı!');
    } finally {
      setLoading(false);
    }
  };

  // ===== ROOM STATS =====
  const fetchRoomStats = async () => {
    try {
      const statsResponse = await apiService.quiz.getQuizStats(room.id);
      if (statsResponse.success) {
        setRoomStats(statsResponse.data);
        setParticipants(statsResponse.data.participants?.list || []);
      }
    } catch (error) {
      console.error('⚠️ Room stats alınamadı:', error);
    }
  };

  // ===== SOCKET CONNECTION & LISTENERS =====
  const connectAsAdmin = useCallback(async () => {
    try {
      const socket = socketService.connect();
      setupAdminSocketListeners();
      socketService.joinRoom(room.roomCode, user.username, true);
      console.log('🔌 Admin socket bağlantısı kuruldu');
    } catch (error) {
      console.error('❌ Admin socket bağlantı hatası:', error);
      throw error;
    }
  }, [room, user]);

  const setupAdminSocketListeners = useCallback(() => {
    // Admin bağlandı
    socketService.on('admin-connected', (data) => {
      console.log('👑 Admin bağlandı:', data);
      setIsConnected(true);
      
      if (data.data?.participants) {
        setParticipants(data.data.participants);
      }
      
      if (data.data?.room) {
        const roomData = data.data.room;
        setQuizState(roomData.isActive ? 'active' : roomData.isStarted ? 'finished' : 'ready');
        setCurrentQuestion(roomData.currentQuestion || 0);
      }
    });

    // Katılımcı katıldı
    socketService.on('participant-joined', (data) => {
      console.log('👤 Yeni katılımcı:', data);
      setParticipants(prev => {
        const existingIndex = prev.findIndex(p => p.username === data.username);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], isConnected: true };
          return updated;
        }
        return [...prev, { username: data.username, score: 0, isConnected: true }];
      });
    });

    // Katılımcı ayrıldı
    socketService.on('participant-left', (data) => {
      console.log('👋 Katılımcı ayrıldı:', data);
      setParticipants(prev => prev.filter(p => p.username !== data.username));
    });

    // Katılımcı listesi güncellendi
    socketService.on('participants-updated', (data) => {
      console.log('👥 Katılımcılar güncellendi:', data);
      setParticipants(data.participants || []);
      setAnswerStats(prev => ({
        ...prev,
        totalParticipants: data.participants?.length || 0
      }));
    });

    // Cevap istatistikleri
    socketService.on('answer-stats', (data) => {
      console.log('📊 Cevap stats:', data);
      const percentage = data.totalParticipants > 0 
        ? Math.round((data.answeredCount / data.totalParticipants) * 100)
        : 0;
        
      setAnswerStats({
        answeredCount: data.answeredCount,
        totalParticipants: data.totalParticipants,
        percentage: percentage
      });
    });

    // Quiz başladı
    socketService.on('quiz-started', (data) => {
      console.log('🚀 Quiz başladı (admin):', data);
      setQuizState('active');
      setCurrentQuestion(1);
      setAnswerStats({ answeredCount: 0, totalParticipants: participants.length, percentage: 0 });
    });

    // Yeni soru
    socketService.on('new-question', (data) => {
      console.log('❓ Yeni soru (admin):', data);
      setCurrentQuestion(data.questionNumber || data.question?.questionNumber || currentQuestion + 1);
      setAnswerStats({ answeredCount: 0, totalParticipants: participants.length, percentage: 0 });
    });

    // Quiz bitti
    socketService.on('quiz-finished', (data) => {
      console.log('🏁 Quiz bitti (admin):', data);
      setQuizState('finished');
      console.log('🎉 Quiz tamamlandı! Admin panelde kalındı.');
    });

    // Hata
    socketService.on('error', (error) => {
      console.error('❌ Admin socket hatası:', error);
      onError(error.message || 'Admin socket hatası!');
      setIsConnected(false);
    });

    // Bağlantı durumu
    socketService.on('connect', () => {
      setIsConnected(true);
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
    });
  }, [room, user, participants.length, currentQuestion, onQuizFinished, onError]);

  // Cleanup
  const cleanup = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  // ===== QUIZ FUNCTIONS =====
  const startQuiz = async () => {
    if (participants.length === 0) {
      onError('Quiz başlatmak için en az 1 katılımcı gerekli!');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Quiz başlatılıyor...');
      socketService.startQuiz(room.id);
    } catch (error) {
      console.error('❌ Quiz başlatma hatası:', error);
      onError(error.message || 'Quiz başlatılamadı!');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = async () => {
    try {
      setLoading(true);
      console.log('⏭️ Sonraki soruya geçiliyor...');
      socketService.nextQuestion(room.id);
      console.log('✅ Socket event gönderildi');
    } catch (error) {
      console.error('❌ Sonraki soru hatası:', error);
      onError(error.message || 'Sonraki soru geçilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const finishQuiz = async () => {
    try {
      setLoading(true);
      console.log('🏁 Quiz bitiriliyor...');
      socketService.finishQuiz(room.id);
    } catch (error) {
      console.error('❌ Quiz bitirme hatası:', error);
      onError(error.message || 'Quiz bitirilemedi!');
    } finally {
      setLoading(false);
    }
  };

  const restartQuiz = async () => {
    try {
      setLoading(true);
      const result = await apiService.quiz.restartQuiz(room.id, user.username);
      
      if (result.success) {
        setQuizState('ready');
        setCurrentQuestion(0);
        setAnswerStats({ answeredCount: 0, totalParticipants: participants.length, percentage: 0 });
        setParticipants(prev => prev.map(p => ({ ...p, score: 0 })));
        console.log('🔄 Quiz yeniden başlatıldı');
      } else {
        onError(result.message || 'Quiz yeniden başlatılamadı!');
      }
    } catch (error) {
      console.error('❌ Quiz restart hatası:', error);
      onError(error.message || 'Quiz yeniden başlatılamadı!');
    } finally {
      setLoading(false);
    }
  };

  // ===== PARTICIPANT MANAGEMENT =====
  const kickParticipant = async (username) => {
    try {
      setLoading(true);
      const result = await apiService.quiz.kickParticipant(room.id, user.username, username);
      
      if (result.success) {
        console.log(`👋 ${username} odadan çıkarıldı`);
        setParticipants(prev => prev.filter(p => p.username !== username));
        setShowKickModal(false);
        setSelectedParticipant(null);
      } else {
        onError(result.message || 'Katılımcı çıkarılamadı!');
      }
    } catch (error) {
      console.error('❌ Katılımcı çıkarma hatası:', error);
      onError(error.message || 'Katılımcı çıkarılamadı!');
    } finally {
      setLoading(false);
    }
  };

  // ===== EXCEL DOWNLOAD =====
  const downloadExcel = async () => {
    try {
      setExcelLoading(true);
      console.log('📊 Excel indirme başlatılıyor...');
      
      const result = await apiService.quiz.getExcelData(room.id, user.username);
      
      if (result.success) {
        createExcelFile(result.data.excelData, result.data.filename);
        console.log('✅ Excel dosyası indirildi');
      } else {
        onError(result.message || 'Excel verileri alınamadı!');
      }
    } catch (error) {
      console.error('❌ Excel indirme hatası:', error);
      onError(error.message || 'Excel indirme başarısız!');
    } finally {
      setExcelLoading(false);
    }
  };

  const createExcelFile = (data, filename) => {
    console.log('📊 Excel data debug:', JSON.stringify(data, null, 2));
    
    let csvContent = '';
    
    // ✅ Doğru veri yapısını kullan
    const quizInfo = data.quizInfo || {};
    
    // QUIZ BİLGİLERİ SEKSİYONU
    csvContent += 'QUIZ BİLGİLERİ\n';
    csvContent += `Başlık,${quizInfo.title || 'N/A'}\n`;
    csvContent += `Admin,${quizInfo.adminName || 'N/A'}\n`;
    csvContent += `Oda Kodu,${quizInfo.roomCode || 'N/A'}\n`;
    csvContent += `Toplam Soru,${quizInfo.totalQuestions || 0}\n`;
    csvContent += `Toplam Katılımcı,${quizInfo.totalParticipants || 0}\n`;
    csvContent += `Tamamlanma Tarihi,${quizInfo.completedAt ? new Date(quizInfo.completedAt).toLocaleString('tr-TR') : 'N/A'}\n\n`;
    
    // SONUÇLAR TABLOSU (Sadeleştirildi)
    csvContent += 'SONUÇLAR\n';
    csvContent += 'Sıra,Kullanıcı Adı,Puan\n';
    
    let resultsToProcess = [];
    
    // ✅ Önce results'u kontrol et
    if (data.results && data.results.length > 0) {
      resultsToProcess = data.results.map(result => ({
        rank: result.rank || 'N/A',
        username: result.username || 'N/A',
        score: result.score || 0
      }));
      console.log('✅ Results kullanıldı, veri sayısı:', resultsToProcess.length);
      
    } else if (data.detailedResults && data.detailedResults.length > 0) {
      // detailedResults'tan sonuç oluştur
      resultsToProcess = data.detailedResults
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((result, index) => ({
          rank: index + 1,
          username: result.username || 'N/A',
          score: result.score || 0
        }));
      console.log('✅ DetailedResults kullanıldı, veri sayısı:', resultsToProcess.length);
    } else {
      console.log('❌ Hiç sonuç verisi bulunamadı!');
    }
    
    // Sonuçları CSV'ye ekle (Sadeleştirildi)
    resultsToProcess.forEach(result => {
      csvContent += `${result.rank},${result.username},${result.score}\n`;
    });
    
    csvContent += '\n';
    
    // DETAYLI CEVAPLAR (Sadeleştirildi)
    if (data.detailedResults && data.detailedResults.length > 0) {
      csvContent += 'DETAYLI CEVAPLAR\n';
      
      resultsToProcess.forEach(participant => {
        const participantDetails = data.detailedResults.find(d => d.username === participant.username);
        
        if (participantDetails && participantDetails.answers && participantDetails.answers.length > 0) {
          csvContent += `\n${participant.username} (#${participant.rank} - ${participant.score} puan) - Detaylı Cevaplar\n`;
          csvContent += 'Soru No,Verilen Cevap,Alınan Puan,Süre (sn)\n';
          
          participantDetails.answers.forEach(answer => {
            csvContent += `${answer.questionNumber || 'N/A'},${answer.selectedAnswer || 'N/A'},${answer.points || 0},${answer.timeSpent || 0}\n`;
          });
        }
      });
    }
    
    // CSV dosyasını indir
    const blob = new Blob(['\ufeff' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.csv'));
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('✅ CSV dosyası başarıyla oluşturuldu');
    console.log('📊 İşlenen veri özeti:', {
      resultsCount: resultsToProcess.length,
      detailedResultsCount: data.detailedResults?.length || 0
    });
  };

  const showResults = () => {
    const resultsData = {
      results: participants.sort((a, b) => (b.score || 0) - (a.score || 0)),
      room: {
        ...room,
        id: room.id,
        roomCode: room.roomCode,
        title: room.title,
        isFinished: true
      }
    };
    
    if (onQuizFinished) {
      onQuizFinished(resultsData);
    }
  };

  // ===== UTILITY FUNCTIONS =====
  const getQuizStateColors = () => {
    switch (quizState) {
      case 'ready': return { bg: 'from-blue-500 to-blue-600', text: 'text-white', icon: '📋' };
      case 'active': return { bg: 'from-green-500 to-green-600', text: 'text-white', icon: '🎮' };
      case 'finished': return { bg: 'from-purple-500 to-purple-600', text: 'text-white', icon: '🏁' };
      default: return { bg: 'from-gray-500 to-gray-600', text: 'text-white', icon: '❓' };
    }
  };

  const getQuizStateText = () => {
    switch (quizState) {
      case 'ready': return 'Hazır';
      case 'active': return 'Aktif';
      case 'finished': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  };

  const stateColors = getQuizStateColors();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
      {/* Kahoot-style Background Patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-yellow-300 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-400 rounded-full"></div>
        <div className="absolute bottom-40 right-1/3 w-24 h-24 bg-green-400 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-purple-400 transform -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Room Code Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-600 uppercase tracking-wider">Oda Kodu</p>
                <p className="text-3xl font-black text-red-700">{room?.roomCode || 'N/A'}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg">
                🏷️
              </div>
            </div>
          </div>

          {/* Participants Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Oyuncular</p>
                <p className="text-3xl font-black text-blue-700">{participants.length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
                👥
              </div>
            </div>
          </div>

          {/* Questions Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-600 uppercase tracking-wider">Sorular</p>
                <p className="text-3xl font-black text-purple-700">{currentQuestion}/{totalQuestions}</p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg">
                📋
              </div>
            </div>
          </div>

          {/* Quiz Status Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-600 uppercase tracking-wider">Durum</p>
                <p className="text-3xl font-black text-green-700">{getQuizStateText()}</p>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl bg-gradient-to-br ${stateColors.bg} shadow-lg`}>
                {stateColors.icon}
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Progress Card */}
        {quizState === 'active' && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 hover:shadow-2xl transition-all duration-300 border-2 border-yellow-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                📊
              </div>
              <h3 className="text-2xl font-bold text-gray-800">🎯 Canlı İstatistikler</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Question Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Soru İlerlemesi</span>
                  <span className="text-lg font-black text-red-600">{currentQuestion} / {totalQuestions}</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className="h-4 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-red-500 to-red-600 shadow-lg"
                    style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 font-medium">🚀 Quiz'in %{Math.round((currentQuestion / totalQuestions) * 100)}'i tamamlandı!</p>
              </div>

              {/* Answer Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Cevap Durumu</span>
                  <span className="text-lg font-black text-green-600">{answerStats.answeredCount} / {answerStats.totalParticipants} (%{answerStats.percentage})</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${answerStats.percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 font-medium">⚡ Anlık cevap oranı: %{answerStats.percentage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Participants Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-green-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    👥
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Oyuncular ({participants.length})</h3>
                </div>
              </div>
              
              {participants.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-6xl animate-bounce shadow-xl">
                    ⏳
                  </div>
                  <h4 className="text-2xl font-bold text-gray-700 mb-4">🎮 Oyuncular Bekleniyor...</h4>
                  <p className="text-gray-600 text-lg">
                    Oyuncular <strong className="font-black text-red-600 text-2xl">{room?.roomCode || 'N/A'}</strong> kodunu girerek katılabilir!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.map((participant, index) => (
                    <div 
                      key={index} 
                      className="group bg-gradient-to-r from-gray-50 to-white hover:from-red-50 hover:to-red-100 rounded-xl p-5 border-2 border-gray-200 hover:border-red-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                            participant.isConnected ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                          }`}>
                            {participant.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-lg">{participant.username}</div>
                            <div className={`text-sm font-bold ${participant.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                              {participant.isConnected ? '🟢 Online' : '🔴 Offline'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-2xl font-black text-red-600">
                              {participant.score}
                            </div>
                            <div className="text-xs text-gray-500 uppercase font-bold">Puan</div>
                          </div>
                          
                          {quizState === 'ready' && (
                            <button 
                              onClick={() => {
                                setSelectedParticipant(participant.username);
                                setShowKickModal(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 shadow-lg transform hover:scale-105"
                            >
                              🚫 Çıkar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Quiz Controls */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-blue-200">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-red-500 to-red-700 shadow-lg">
                  🎮
                </div>
                <h3 className="text-xl font-bold text-gray-800">Quiz Kontrolü</h3>
              </div>
              
              <div className="space-y-4">
                {/* Ready State */}
                {quizState === 'ready' && (
                  <button 
                    onClick={startQuiz}
                    disabled={loading || participants.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Başlatılıyor...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🚀</span>
                        <span>QUIZ BAŞLAT!</span>
                      </>
                    )}
                  </button>
                )}

                {/* Active State */}
                {quizState === 'active' && (
                  <>
                    <button 
                      onClick={nextQuestion}
                      disabled={loading || currentQuestion >= totalQuestions}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Geçiliyor...</span>
                        </>
                      ) : currentQuestion >= totalQuestions ? (
                        <>
                          <span className="text-2xl">🏁</span>
                          <span>SON SORU</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">⏭️</span>
                          <span>SONRAKİ SORU</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={finishQuiz}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Bitiriliyor...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">🏁</span>
                          <span>QUIZ BİTİR</span>
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Finished State */}
                {quizState === 'finished' && (
                  <>
                    <button 
                      onClick={restartQuiz}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Yeniden Başlatılıyor...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">🔄</span>
                          <span>YENİDEN BAŞLAT</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={downloadExcel}
                      disabled={excelLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
                    >
                      {excelLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>İndiriliyor...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">📊</span>
                          <span>VERİLERİ İNDİR</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={showResults}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
                    >
                      <span className="text-2xl">🏆</span>
                      <span>SONUÇLARI GÖSTER</span>
                    </button>
                  </>
                )}
              </div>

              {/* Status Messages */}
              {quizState === 'finished' && (
                <div className="mt-6 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl p-6 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <p className="font-bold text-lg">Quiz Tamamlandı!</p>
                      <p className="text-green-100 text-sm">Sonuçları görüntüleyebilir veya verileri indirebilirsiniz.</p>
                    </div>
                  </div>
                </div>
              )}

              {participants.length === 0 && quizState === 'ready' && (
                <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-6 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">⚠️</span>
                    <div>
                      <p className="font-bold text-lg">Oyuncu Gerekli!</p>
                      <p className="text-yellow-100 text-sm">Quiz başlatmak için en az 1 oyuncu gerekli.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kick Participant Modal */}
        {showKickModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md w-full shadow-2xl border-2 border-red-200 transform scale-100 animate-pulse">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white text-3xl">🚫</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Oyuncuyu Çıkar</h3>
              <p className="text-gray-600 mb-8 text-lg">
                <strong className="text-red-600 font-black text-xl">{selectedParticipant}</strong> kullanıcısını odadan çıkarmak istediğinizden emin misiniz?
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => {
                    setShowKickModal(false);
                    setSelectedParticipant(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  İptal
                </button>
                <button 
                  onClick={() => kickParticipant(selectedParticipant)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Çıkarılıyor...</span>
                    </>
                  ) : (
                    <span>🚫 Çıkar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;