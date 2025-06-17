// Ana uygulama komponenti
import { useState, useEffect } from 'react';

// Servisler
import apiService from './services/api';
import socketService from './services/socket';

// Componentler
import Header from './components/Common/Header';
import Home from './components/Common/home';
import ErrorBanner from './components/Common/ErrorBanner';
import LoadingOverlay from './components/Common/LoadingOverlay';
import CreateRoom from './components/Admin/CreateRoom';
import AdminPanel from './components/Admin/AdminPanel';
import JoinRoom from './components/Player/JoinRoom';
import QuizGame from './components/Player/QuizGame';
import Results from './components/Player/Results';

function App() {
  // Ana state'ler
  const [currentPage, setCurrentPage] = useState('home'); // home, create, admin, join, game, results
  const [user, setUser] = useState(null); // Kullanıcı bilgileri
  const [room, setRoom] = useState(null); // Oda bilgileri
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [error, setError] = useState(null); // Hata mesajları
  const [loading, setLoading] = useState(false); // Yükleme durumu

  // Backend bağlantısını test et
  useEffect(() => {
    testBackendConnection();
  }, []);

  // Backend bağlantı testi
  const testBackendConnection = async () => {
    try {
      setLoading(true);
      const result = await apiService.testConnection();
      if (result.success !== false) {
        console.log('✅ Backend bağlantısı OK:', result.message);
        setConnectionStatus('connected');
      } else {
        setError('Backend bağlantısı yok!');
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('❌ Backend bağlantı hatası:', error);
      setError('Backend sunucusuna bağlanılamıyor! (Port 5001)');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Admin girişi - Oda oluştur
  const handleAdminLogin = async (adminName) => {
    try {
      setLoading(true);
      setError(null);

      // API ile admin girişi
      const result = await apiService.auth.login(adminName, true);
      
      if (result.success) {
        setUser({
          username: adminName,
          isAdmin: true,
          sessionId: result.data.sessionId
        });
        setCurrentPage('create');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message || 'Admin girişi başarısız!');
    } finally {
      setLoading(false);
    }
  };

  // Oyuncu girişi - Odaya katıl
  const handlePlayerLogin = async (username) => {
    try {
      setLoading(true);
      setError(null);

      // API ile oyuncu girişi
      const result = await apiService.auth.login(username, false);
      
      if (result.success) {
        setUser({
          username: username,
          isAdmin: false,
          sessionId: result.data.sessionId
        });
        setCurrentPage('join');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message || 'Giriş başarısız!');
    } finally {
      setLoading(false);
    }
  };

  // Oda oluşturma başarısı
  const handleRoomCreated = (roomData) => {
    console.log('🏠 Room created data:', roomData);
    
    // Room data yapısını kontrol et ve düzelt
    const normalizedRoom = {
      id: roomData.room?.id || roomData.id,
      roomCode: roomData.roomCode || roomData.room?.roomCode,
      title: roomData.room?.title || roomData.title,
      adminName: roomData.room?.adminName || roomData.adminName,
      questionCount: roomData.room?.questionCount || roomData.questionCount || 0,
      participantCount: roomData.room?.participantCount || 0
    };
    
    console.log('✅ Normalized room data:', normalizedRoom);
    setRoom(normalizedRoom);
    setCurrentPage('admin');
  };

  // Quiz oyununa katılma başarısı
  const handleJoinedQuiz = (roomData) => {
    console.log('🎮 Quiz join data:', roomData);
    
    // Room data yapısını normalize et
    const normalizedRoom = {
      id: roomData.id || roomData.room?.id,
      roomCode: roomData.roomCode || roomData.room?.roomCode,
      title: roomData.title || roomData.room?.title,
      adminName: roomData.adminName || roomData.room?.adminName,
      questionCount: roomData.questionCount || roomData.room?.questionCount || 0,
      participantCount: roomData.participantCount || roomData.room?.participantCount || 0
    };
    
    console.log('✅ Normalized quiz join room:', normalizedRoom);
    setRoom(normalizedRoom);
    setCurrentPage('game');
  };

  // Quiz sonuçları
  const handleQuizFinished = (resultsData) => {
    console.log('🏁 Quiz finished data:', resultsData);
    
    // Mevcut room data'sını koru ve sonuçları ekle
    const updatedRoom = {
      ...room,
      results: resultsData.results || resultsData,
      isFinished: true
    };
    
    console.log('✅ Final room with results:', updatedRoom);
    setRoom(updatedRoom);
    setCurrentPage('results');
  };

  // Çıkış yap
  const handleLogout = async () => {
    try {
      if (user?.sessionId) {
        await apiService.auth.logout(user.sessionId);
      }
      
      // Socket bağlantısını kes
      socketService.disconnect();
      
      // State'leri temizle
      setUser(null);
      setRoom(null);
      setCurrentPage('home');
      setError(null);
      
      console.log('👋 Çıkış yapıldı');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  // Ana render
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onHome={() => setCurrentPage('home')}
      />
      
      <ErrorBanner error={error} onClose={() => setError(null)} />
      
      <main className="flex-1">
        {currentPage === 'home' && (
          <Home
            onAdminLogin={handleAdminLogin}
            onPlayerLogin={handlePlayerLogin}
            loading={loading}
            connectionStatus={connectionStatus}
            onTestConnection={testBackendConnection}
          />
        )}
        
        {currentPage === 'create' && (
          <CreateRoom 
            user={user}
            onRoomCreated={handleRoomCreated}
            onError={setError}
          />
        )}
        
        {currentPage === 'admin' && (
          <AdminPanel 
            user={user}
            room={room}
            onError={setError}
            onQuizFinished={handleQuizFinished} 
          />
        )}
        
        {currentPage === 'join' && (
          <JoinRoom 
            user={user}
            onJoinedQuiz={handleJoinedQuiz}
            onError={setError}
          />
        )}
        
        {currentPage === 'game' && (
          <QuizGame 
            user={user}
            room={room}
            onQuizFinished={handleQuizFinished}
            onError={setError}
          />
        )}
        
        {currentPage === 'results' && (
          <Results 
            user={user}
            room={room}
            onPlayAgain={() => setCurrentPage('home')}
          />
        )}
      </main>
      
      <LoadingOverlay loading={loading} />
    </div>
  );
}

export default App;