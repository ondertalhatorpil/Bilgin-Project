// QuizGame component - Kahoot Style UI with Red Theme
import React, { useState, useEffect } from 'react';
import socketService from '../../services/socket';

const QuizGame = ({ user, room, onQuizFinished, onError }) => {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Kahoot colors for answer options
  const kahootColors = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'text-white', symbol: '▲' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-white', symbol: '♦' },
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', text: 'text-white', symbol: '●' },
    { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-white', symbol: '■' }
  ];

  // Component yüklendiğinde socket bağlantısı kur
  useEffect(() => {
    if (room && user) {
      connectToRoom();
    }

    return () => {
      socketService.disconnect();
    };
  }, [room, user]);

  // Timer effect for countdown
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && currentQuestion && !currentQuestion.isAnswered && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, currentQuestion, timeLeft]);

  // Socket bağlantısı kur ve odaya katıl
  const connectToRoom = () => {
    try {
      const socket = socketService.connect();
      setupSocketListeners();
      socketService.joinRoom(room.roomCode, user.username, false);
    } catch (error) {
      console.error('Socket bağlantı hatası:', error);
      onError('Gerçek zamanlı bağlantı kurulamadı!');
    }
  };

  // Socket event listener'larını kur
  const setupSocketListeners = () => {
    socketService.on('room-joined', (data) => {
      console.log('✅ Odaya katıldı:', data);
      setIsConnected(true);
    });

    socketService.on('participants-updated', (data) => {
      console.log('👥 Katılımcılar güncellendi:', data);
      setParticipants(data.participants || []);
    });

    socketService.on('quiz-started', (data) => {
      console.log('🚀 Quiz başladı:', data);
      setGameState('playing');
    });

    socketService.on('new-question', (data) => {
      console.log('❓ Yeni soru:', data);
      setCurrentQuestion(data.question);
      setTimeLeft(30); // Reset timer for new question
    });

    socketService.on('answer-submitted', (data) => {
      console.log('✅ Cevap gönderildi:', data);
    });

    socketService.on('quiz-finished', (data) => {
      console.log('🏁 Quiz bitti:', data);
      setGameState('finished');
      
      const resultsWithRoom = {
        ...data.data,
        roomId: room.id,
        roomCode: room.roomCode
      };
      
      onQuizFinished(resultsWithRoom);
    });

    socketService.on('error', (error) => {
      console.error('❌ Socket hatası:', error);
      onError(error.message || 'Bir hata oluştu!');
    });
  };

  // Cevap gönder
  const submitAnswer = (answerIndex) => {
    if (!currentQuestion || gameState !== 'playing' || currentQuestion.isAnswered) return;
    
    try {
      socketService.submitAnswer(room.id, answerIndex, 0);
      console.log(`📤 Cevap gönderildi: ${answerIndex}`);
      
      setCurrentQuestion(prev => ({
        ...prev,
        selectedAnswer: answerIndex,
        isAnswered: true
      }));
    } catch (error) {
      console.error('Cevap gönderilemedi:', error);
      onError('Cevap gönderilemedi!');
    }
  };

  // Bekleme ekranı - Kırmızı Kahoot style
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden pb-12">
        {/* Kahoot-style Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-yellow-300 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-40 right-1/3 w-24 h-24 bg-green-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-purple-400 transform -translate-x-1/2 -translate-y-1/2 rounded-full animate-bounce"></div>
          <div className="absolute top-20 right-1/4 w-8 h-8 bg-pink-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-10 right-10 w-14 h-14 bg-orange-400 rounded-full animate-pulse"></div>
        </div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white mx-auto"></div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                Bekleme Odası
              </h1>
              <div className="text-xl md:text-2xl text-white/90 font-bold">
                🎮 Yöneticinin etkinliği başlatmasını bekliyoruz...
              </div>
            </div>

            {/* Room Info Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border-2 border-white/50">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center justify-center">
                  <span className="mr-3 text-4xl">🏠</span>
                  {room?.title || 'Quiz Odası'}
                </h2>
                <div className="grid md:grid-cols-3 gap-4 text-lg">
                  <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 hover:shadow-lg transition-all duration-300">
                    <div className="text-red-600 font-bold text-sm uppercase tracking-wide mb-2">Oda Kodu</div>
                    <div className="text-3xl font-black text-red-800">{room?.roomCode}</div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 hover:shadow-lg transition-all duration-300">
                    <div className="text-green-600 font-bold text-sm uppercase tracking-wide mb-2">Oyuncu</div>
                    <div className="text-xl font-bold text-green-800">{user.username}</div>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200 hover:shadow-lg transition-all duration-300">
                    <div className="text-blue-600 font-bold text-sm uppercase tracking-wide mb-2">Bağlantı</div>
                    <div className="text-xl font-bold">
                      {isConnected ? (
                        <span className="text-green-600 flex items-center justify-center">
                          <span className="mr-2">✅</span>
                          Bağlı
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
                          Bağlanıyor...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border-2 border-white/50">
                <h3 className="text-2xl font-black text-center text-gray-800 mb-6 flex items-center justify-center">
                  <span className="mr-3 text-3xl">👥</span>
                  Katılımcılar ({participants.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {participants.map((p, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-2xl text-center font-bold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        p.username === user.username 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-300 animate-pulse' 
                          : 'bg-gray-100 text-gray-800 border-2 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-lg">{p.username}</div>
                      {p.username === user.username && (
                        <div className="text-sm text-red-200 font-normal">(Sen)</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    );
  }

  // Quiz oyun ekranı - Kırmızı Kahoot style
  if (gameState === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden flex flex-col">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-yellow-300 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-40 right-1/3 w-18 h-18 bg-green-400 rounded-full animate-pulse"></div>
        </div>

        {/* Header with Question */}
        <div className="flex-1 flex flex-col p-4 relative z-10">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-bold text-lg shadow-xl">
              Soru {currentQuestion.questionNumber} / {currentQuestion.totalQuestions}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-bold text-lg shadow-xl">
              👥 {participants.length}
            </div>
          </div>

          {/* Timer Circle */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-black text-white shadow-2xl ${
              timeLeft > 15 ? 'bg-green-500 border-4 border-green-300' : 
              timeLeft > 8 ? 'bg-yellow-500 border-4 border-yellow-300' : 
              'bg-red-500 border-4 border-red-300'
            } ${timeLeft <= 5 ? 'animate-pulse scale-110' : ''} transition-all duration-300`}>
              {timeLeft}
            </div>
            <div className="text-white/80 text-lg font-bold mt-2">saniye kaldı</div>
          </div>

          {/* Question Text */}
          <div className="text-center mb-8 flex-1 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-4xl">
                {currentQuestion.text}
              </h1>
            </div>
          </div>

          {/* Answer Status */}
          {currentQuestion.isAnswered && (
            <div className="text-center mb-6">
              <div className="inline-block bg-green-500 text-white px-8 py-4 rounded-full font-bold text-xl animate-pulse shadow-2xl border-4 border-green-300">
                ✅ Cevabın kaydedildi! Sonraki soruyu bekle...
              </div>
            </div>
          )}
        </div>

        {/* Answer Buttons */}
        <div className="p-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {currentQuestion.options.map((option, index) => {
              const colors = kahootColors[index];
              const isSelected = currentQuestion.selectedAnswer === index;
              const isDisabled = currentQuestion.isAnswered;
              
              return (
                <button
                  key={index}
                  className={`
                    ${colors.bg} ${!isDisabled ? colors.hover : ''} ${colors.text}
                    p-6 md:p-8 rounded-3xl font-bold text-lg md:text-xl
                    transition-all duration-300 transform
                    ${!isDisabled ? 'hover:scale-105 active:scale-95' : ''}
                    ${isSelected ? 'ring-4 ring-white ring-opacity-70 scale-105 border-4 border-white' : ''}
                    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    shadow-2xl hover:shadow-3xl
                    flex items-center justify-center min-h-32 md:min-h-40
                    border-2 border-white/20
                  `}
                  onClick={() => !isDisabled && submitAnswer(index)}
                  disabled={isDisabled}
                >
                  <div className="text-center">
                    <div className="text-3xl md:text-5xl mb-3">{colors.symbol}</div>
                    <div className="leading-tight font-black">{option}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Help Text */}
          <div className="text-center mt-8">
            {!currentQuestion.isAnswered ? (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 inline-block shadow-xl">
                <p className="text-white text-lg font-bold">
                  👆 Bir seçeneğe tıklayın
                </p>
              </div>
            ) : (
              <div className="bg-green-500/80 backdrop-blur-sm rounded-full px-6 py-3 inline-block shadow-xl">
                <p className="text-white text-lg font-bold">
                  ⏳ Diğer oyuncuları bekliyoruz...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Varsayılan ekran - Kırmızı tema
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-yellow-300 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-400 rounded-full"></div>
        <div className="absolute bottom-40 right-1/3 w-24 h-24 bg-green-400 rounded-full"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center max-w-md w-full border-2 border-white/50">
          <div className="text-6xl mb-6 animate-bounce">🎮</div>
          <h1 className="text-3xl font-black text-gray-800 mb-6">Quiz Oyunu</h1>
          
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <span className="font-bold text-gray-700">Oda:</span>
              <span className="ml-2 text-gray-800">{room?.title || 'Bilinmiyor'}</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <span className="font-bold text-gray-700">Oyuncu:</span>
              <span className="ml-2 text-gray-800">{user.username}</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <span className="font-bold text-gray-700">Durum:</span>
              <span className={`ml-2 font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? '✅ Bağlı' : '❌ Bağlantı Yok'}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Quiz durumu yükleniyor...</p>
          </div>

          <button 
            onClick={() => onQuizFinished({ results: [] })}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            🏠 Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizGame;