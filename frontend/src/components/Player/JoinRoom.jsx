// JoinRoom component - Odaya katılma
import React, { useState } from 'react';
import apiService from '../../services/api';

const JoinRoom = ({ user, onJoinedQuiz, onError }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  // Odaya katıl
  const joinRoom = async () => {
    if (!roomCode.trim()) {
      onError('Oda kodu gerekli!');
      return;
    }

    try {
      setLoading(true);
      onError(null);

      // İlk önce oda var mı kontrol et
      const roomResult = await apiService.rooms.getRoomByCode(roomCode.trim());
      
      if (roomResult.success) {
        setRoomInfo(roomResult.data.room);
        
        // Sonra katılım isteği gönder
        const joinResult = await apiService.rooms.joinRoom(roomCode.trim(), user.username);
        
        if (joinResult.success) {
          // Oda bilgilerini birleştir
          const completeRoomData = {
            ...joinResult.data.room,
            title: roomResult.data.room.title,
            adminName: roomResult.data.room.adminName
          };
          
          console.log('✅ Odaya katılım başarılı:', completeRoomData);
          onJoinedQuiz(completeRoomData);
        } else {
          onError(joinResult.message);
        }
      } else {
        onError('Oda bulunamadı! Kod: ' + roomCode.toUpperCase());
      }
    } catch (error) {
      console.error('❌ Katılım hatası:', error);
      onError(error.message || 'Odaya katılım başarısız!');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && roomCode.trim()) {
      joinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-red-800 relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(135deg, #D12A2C 0%, #B91C1C 50%, #991B1B 100%)' }}>
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-float"></div>
        <div className="absolute top-1/4 right-20 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-white bg-opacity-5 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-32 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 left-8 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-float"></div>
      </div>

      <div className="container mx-auto px-4 py-28 relative z-10">    

        {/* Main Card */}
        <div className="max-w-lg mx-auto">
          <div className="group transition-all duration-500">
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl hover:shadow-2xl p-10 transform group-hover:scale-[1.02] group-hover:-translate-y-1 transition-all duration-500 border border-transparent hover:border-red-300 hover:bg-white/90">
              
              {/* Icon Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-md mb-6 bg-gradient-to-tr from-red-600 to-red-700 transform group-hover:rotate-6 transition-transform duration-300">
                  <div className="text-4xl">🔐</div>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Oda Kodunu Gir</h2>
              </div>

              {/* Room Code Input */}
              <div className="mb-8">
                <input
                  type="text"
                  className="w-full px-6 py-4 border-3 border-gray-300 rounded-2xl focus:outline-none text-center text-2xl font-bold tracking-widest uppercase transition-colors duration-300 bg-gray-50 focus:bg-white"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  maxLength={6}
                  style={{ borderColor: roomCode ? '#D12A2C' : '', focusBorderColor: '#D12A2C' }}
                  onFocus={(e) => e.target.style.borderColor = '#D12A2C'}
                  onBlur={(e) => e.target.style.borderColor = roomCode ? '#D12A2C' : '#d1d5db'}
                />
              </div>

              {/* Room Info Preview */}
              {roomInfo && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 animate-fadeIn">
                  <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                    <span className="mr-2">🏠</span>
                    Oda Bilgileri
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">Başlık:</span>
                      <span className="text-red-800 font-bold text-right">{roomInfo.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">Admin:</span>
                      <span className="text-red-800 font-bold">{roomInfo.adminName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">Soru Sayısı:</span>
                      <span className="text-red-800 font-bold">{roomInfo.questionCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">Katılımcı:</span>
                      <span className="text-red-800 font-bold">{roomInfo.participantCount} kişi</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Join Button */}
              <button 
                onClick={joinRoom}
                disabled={loading || !roomCode.trim()}
                className="w-full text-white font-black py-4 px-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-xl transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl mb-6"
                style={{
                  background: loading || !roomCode.trim() ? '#9ca3af' : 'linear-gradient(135deg, #D12A2C 0%, #B91C1C 100%)',
                  boxShadow: loading || !roomCode.trim() ? '' : '0 10px 25px rgba(209, 42, 44, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading && roomCode.trim()) {
                    e.target.style.background = 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && roomCode.trim()) {
                    e.target.style.background = 'linear-gradient(135deg, #D12A2C 0%, #B91C1C 100%)';
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3"></div>
                    Kontrol Ediliyor...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🚀</span>
                    Odaya Katıl
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(-10deg);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .border-3 {
          border-width: 3px;
        }
        
        .bg-clip-text {
          background-clip: text;
          -webkit-background-clip: text;
        }
      `}</style>
    </div>
  );
};

export default JoinRoom;