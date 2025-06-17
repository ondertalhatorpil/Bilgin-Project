// Results component - Kahoot Style UI with Red Theme - Mobile Responsive
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const Results = ({ user, room, onPlayAgain }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStats, setQuizStats] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Component yüklendiğinde sonuçları al
  useEffect(() => {
    console.log('🔍 Results component - Room debug:', {
      room: room,
      roomId: room?.id,
      roomCode: room?.roomCode,
      allRoomKeys: room ? Object.keys(room) : 'room is null'
    });

    if (room?.id) {
      fetchResults();
    } else if (room?.roomCode) {
      console.log('⚠️ Room ID yok, roomCode ile deneniyor:', room.roomCode);
      fetchResultsByCode();
    } else {
      setError('Oda bilgisi bulunamadı! Ana sayfaya dönün.');
      setLoading(false);
    }
  }, [room]);

  // Animasyon efektleri
  useEffect(() => {
    if (myRank === 1 && showAnimation) {
      setTimeout(() => setShowConfetti(true), 1000);
    }
  }, [myRank, showAnimation]);

  // Room Code ile sonuçları al (fallback)
  const fetchResultsByCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const roomResponse = await apiService.rooms.getRoomByCode(room.roomCode);
      
      if (roomResponse.success && roomResponse.data.room.id) {
        const roomId = roomResponse.data.room.id;
        console.log('✅ Room ID bulundu:', roomId);
        
        const [resultsResponse, statsResponse] = await Promise.all([
          apiService.quiz.getResults(roomId),
          apiService.quiz.getQuizStats(roomId)
        ]);

        if (resultsResponse.success) {
          const finalResults = resultsResponse.data.results || [];
          setResults(finalResults);
          
          const userResult = finalResults.find(r => r.username === user.username);
          if (userResult) {
            setMyRank(userResult.rank);
          }

          setTimeout(() => setShowAnimation(true), 500);
        }

        if (statsResponse.success) {
          setQuizStats(statsResponse.data);
        }
        
      } else {
        setError('Oda bilgileri alınamadı!');
      }

    } catch (error) {
      console.error('Room Code ile sonuç alma hatası:', error);
      setError('Sonuçlar yüklenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Sonuçları API'den al
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 API çağrısı yapılıyor, Room ID:', room.id);

      const [resultsResponse, statsResponse] = await Promise.all([
        apiService.quiz.getResults(room.id),
        apiService.quiz.getQuizStats(room.id)
      ]);

      if (resultsResponse.success) {
        const finalResults = resultsResponse.data.results || [];
        setResults(finalResults);
        
        const userResult = finalResults.find(r => r.username === user.username);
        if (userResult) {
          setMyRank(userResult.rank);
        }

        setTimeout(() => setShowAnimation(true), 500);
      }

      if (statsResponse.success) {
        setQuizStats(statsResponse.data);
      }

    } catch (error) {
      console.error('❌ API Hatası:', error);
      console.log('🔄 Mock data ile devam ediliyor...');
      showMockResults();
    } finally {
      setLoading(false);
    }
  };

  // Mock sonuçlar (test için)
  const showMockResults = () => {
    const mockResults = [
      { rank: 1, username: 'Ali', score: 450, correctAnswers: 9, totalAnswers: 10 },
      { rank: 2, username: user.username, score: 380, correctAnswers: 7, totalAnswers: 10 },
      { rank: 3, username: 'Ayşe', score: 320, correctAnswers: 6, totalAnswers: 10 },
      { rank: 4, username: 'Mehmet', score: 250, correctAnswers: 5, totalAnswers: 10 },
      { rank: 5, username: 'Fatma', score: 180, correctAnswers: 4, totalAnswers: 10 }
    ];

    const mockStats = {
      basic: {
        title: room?.title || 'Test Quiz',
        totalQuestions: 10,
        totalParticipants: 5
      },
      participants: {
        averageScore: '316'
      }
    };

    setResults(mockResults);
    setQuizStats(mockStats);
    
    const userResult = mockResults.find(r => r.username === user.username);
    if (userResult) {
      setMyRank(userResult.rank);
    }

    setTimeout(() => setShowAnimation(true), 500);
  };

  // Madalya emoji'si getir
  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  // Rank colors for Kahoot style
  const getRankColors = (rank) => {
    switch (rank) {
      case 1: return { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600', border: 'border-yellow-500', text: 'text-yellow-900' };
      case 2: return { bg: 'bg-gradient-to-r from-gray-300 to-gray-500', border: 'border-gray-400', text: 'text-gray-800' };
      case 3: return { bg: 'bg-gradient-to-r from-orange-400 to-orange-600', border: 'border-orange-500', text: 'text-orange-900' };
      default: return { bg: 'bg-gradient-to-r from-blue-400 to-blue-600', border: 'border-blue-500', text: 'text-blue-900' };
    }
  };

  // Loading ekranı - Kırmızı tema - Mobile Responsive
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
        {/* Background Patterns - Mobile Responsive */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-8 sm:top-40 sm:right-20 w-12 h-12 sm:w-20 sm:h-20 bg-yellow-300 rounded-full animate-bounce"></div>
          <div className="absolute bottom-12 left-8 sm:bottom-20 sm:left-1/4 w-10 h-10 sm:w-16 sm:h-16 bg-blue-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 right-12 sm:bottom-40 sm:right-1/3 w-14 h-14 sm:w-24 sm:h-24 bg-green-400 rounded-full animate-pulse"></div>
        </div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 text-center max-w-sm sm:max-w-md w-full border-2 border-white/50">
            <div className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-bounce">🏆</div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-4 sm:mb-6">Sonuçlar Hesaplanıyor...</h1>
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-3 sm:border-b-4 border-red-600"></div>
            </div>
            <p className="text-gray-600 font-semibold text-sm sm:text-base">Sıralama tablosu hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Hata ekranı - Kırmızı tema - Mobile Responsive
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
        {/* Background Patterns - Mobile Responsive */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-12 sm:bottom-40 sm:right-1/3 w-14 h-14 sm:w-24 sm:h-24 bg-green-400 rounded-full"></div>
        </div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 text-center max-w-sm sm:max-w-md w-full border-2 border-white/50">
            <div className="text-5xl sm:text-8xl mb-4 sm:mb-6">❌</div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-4 sm:mb-6">Hata</h1>
            <p className="text-gray-600 mb-6 sm:mb-8 font-semibold text-sm sm:text-base break-words">{error}</p>
            <button 
              onClick={fetchResults} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base"
            >
              🔄 Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
      {/* Kahoot-style Background Patterns - Mobile Responsive */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-8 sm:top-40 sm:right-20 w-12 h-12 sm:w-20 sm:h-20 bg-yellow-300 rounded-full animate-bounce"></div>
        <div className="absolute bottom-12 left-8 sm:bottom-20 sm:left-1/4 w-10 h-10 sm:w-16 sm:h-16 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-12 sm:bottom-40 sm:right-1/3 w-14 h-14 sm:w-24 sm:h-24 bg-green-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-purple-400 transform -translate-x-1/2 -translate-y-1/2 rounded-full animate-bounce"></div>
        <div className="absolute top-12 right-12 sm:top-20 sm:right-1/4 w-6 h-6 sm:w-8 sm:h-8 bg-pink-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-8 h-8 sm:w-14 sm:h-14 bg-orange-400 rounded-full animate-pulse"></div>
      </div>

      {/* Confetti effect for winner - Mobile Responsive */}
      {showConfetti && myRank === 1 && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-yellow-400 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8 max-w-5xl relative z-20 pt-8 sm:pt-16">
        {/* Header Section - Mobile Responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl lg:text-8xl mb-4 sm:mb-6 animate-bounce">🏆</div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight px-2">
            En Bilginler
          </h1>
          
          {/* User Rank Card - Mobile Responsive */}
          {myRank && (
            <div className={`inline-block transform transition-all duration-1000 px-2 ${showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <div className={`${getRankColors(myRank).bg} rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border-2 sm:border-4 ${getRankColors(myRank).border} backdrop-blur-sm max-w-sm mx-auto`}>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                  <div className="text-3xl sm:text-5xl animate-pulse">{getMedalEmoji(myRank)}</div>
                  <div className="text-center">
                    <h3 className={`text-lg sm:text-2xl font-black ${getRankColors(myRank).text}`}>Senin Sıralaman</h3>
                    <p className={`text-2xl sm:text-4xl font-black ${getRankColors(myRank).text}`}>{myRank}. Sıra</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quiz Summary - Mobile Responsive */}
        {quizStats && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 mb-6 sm:mb-8 border-2 border-white/50">
            <h3 className="text-xl sm:text-2xl font-black text-center text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
              <span className="mr-2 sm:mr-3 text-2xl sm:text-3xl">📊</span>
              Quiz Özeti
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-red-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border-2 border-red-200 hover:shadow-lg transition-all duration-300">
                <div className="text-red-600 font-bold text-xs sm:text-sm uppercase tracking-wide mb-1 sm:mb-2">Yarışma Başlığı</div>
                <div className="text-sm sm:text-lg font-bold text-red-800 break-words">{quizStats.basic?.title}</div>
              </div>
              <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border-2 border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="text-blue-600 font-bold text-xs sm:text-sm uppercase tracking-wide mb-1 sm:mb-2">Toplam Soru</div>
                <div className="text-xl sm:text-2xl font-black text-blue-800">{quizStats.basic?.totalQuestions}</div>
              </div>
              <div className="bg-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border-2 border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="text-green-600 font-bold text-xs sm:text-sm uppercase tracking-wide mb-1 sm:mb-2">Katılımcı Sayısı</div>
                <div className="text-xl sm:text-2xl font-black text-green-800">{quizStats.basic?.totalParticipants}</div>
              </div>
              <div className="bg-yellow-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center border-2 border-yellow-200 hover:shadow-lg transition-all duration-300">
                <div className="text-yellow-600 font-bold text-xs sm:text-sm uppercase tracking-wide mb-1 sm:mb-2">Ortalama Puan</div>
                <div className="text-xl sm:text-2xl font-black text-yellow-800">{quizStats.participants?.averageScore}</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard - Mobile Responsive */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 mb-8 sm:mb-18 border-2 border-white/50">
          <h3 className="text-xl sm:text-2xl font-black text-center text-gray-800 mb-4 sm:mb-6 flex items-center justify-center">
            <span className="mr-2 sm:mr-3 text-2xl sm:text-3xl">🏅</span>
            Sıralama Tablosu
          </h3>
          
          {results.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
              <p className="text-base sm:text-lg font-semibold">Henüz sonuç yok</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {results.map((result, index) => {
                const colors = getRankColors(result.rank);
                const isMe = result.username === user.username;
                
                return (
                  <div 
                    key={result.username} 
                    className={`
                      ${colors.bg} rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border-2 sm:border-4 ${colors.border}
                      transform transition-all duration-700 hover:scale-105
                      ${showAnimation ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                      ${isMe ? 'ring-2 sm:ring-4 ring-white ring-opacity-70 scale-105' : ''}
                    `}
                    style={{ 
                      transitionDelay: `${index * 0.2}s` 
                    }}
                  >
                    {/* Mobile Layout (< sm) */}
                    <div className="sm:hidden">
                      {/* Top Row - Rank and Name */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white/40 backdrop-blur-sm rounded-xl px-3 py-1 shadow-lg">
                            <span className={`text-xl font-black ${colors.text}`}>#{result.rank}</span>
                          </div>
                        </div>
                        <div className={`text-3xl font-black ${colors.text}`}>
                          {result.score}
                        </div>
                      </div>
                      
                      {/* Bottom Row - Name and Stats */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-lg font-black ${colors.text} flex items-center`}>
                            {result.username}
                            {isMe && (
                              <span className="ml-2 bg-white/50 backdrop-blur-sm text-xs px-2 py-1 rounded-full font-bold border border-white/30">
                                Sen
                              </span>
                            )}
                          </div>
                          <div className={`text-sm ${colors.text} opacity-80 font-semibold`}>
                            {result.correctAnswers}/{result.totalAnswers} doğru • {((result.correctAnswers / result.totalAnswers) * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className={`text-sm ${colors.text} opacity-80 font-bold uppercase tracking-wide`}>
                          puan
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout (>= sm) */}
                    <div className="hidden sm:flex items-center justify-between">
                      {/* Rank Section */}
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="text-3xl sm:text-5xl animate-pulse">{getMedalEmoji(result.rank)}</div>
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1 sm:py-2 shadow-lg">
                          <span className={`text-2xl sm:text-3xl font-black ${colors.text}`}>#{result.rank}</span>
                        </div>
                      </div>
                      
                      {/* Participant Info */}
                      <div className="flex-1 mx-3 sm:mx-6">
                        <div className={`text-lg sm:text-2xl font-black ${colors.text} flex items-center`}>
                          <span className="truncate max-w-32 sm:max-w-none">{result.username}</span>
                          {isMe && (
                            <span className="ml-2 sm:ml-3 bg-white/50 backdrop-blur-sm text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold border border-white/30 sm:border-2 sm:border-white/30 whitespace-nowrap">
                              Sen
                            </span>
                          )}
                        </div>
                        <div className={`text-sm sm:text-base ${colors.text} opacity-80 font-semibold`}>
                          {result.correctAnswers}/{result.totalAnswers} doğru
                          <span className="mx-1 sm:mx-3">•</span>
                          {((result.correctAnswers / result.totalAnswers) * 100).toFixed(0)}% başarı
                        </div>
                      </div>
                      
                      {/* Score Section */}
                      <div className="text-right">
                        <div className={`text-2xl sm:text-4xl font-black ${colors.text}`}>
                          {result.score}
                        </div>
                        <div className={`text-xs sm:text-base ${colors.text} opacity-80 font-bold uppercase tracking-wide`}>
                          puan
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional spacing for mobile */}
        <div className="h-8 sm:h-16"></div>
      </div>

      {/* Custom Styles for Mobile */}
      <style jsx>{`
        /* Mobile scroll improvements */
        @media (max-width: 640px) {
          /* Better touch targets */
          button {
            min-height: 44px;
          }
          
          /* Prevent horizontal overflow */
          body {
            overflow-x: hidden;
          }
          
          /* Better text wrapping */
          .truncate {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
        
        /* Animation improvements */
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Enhanced shadows for mobile */
        @media (max-width: 640px) {
          .shadow-2xl {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        }
      `}</style>
    </div>
  );
};

export default Results;