// API servis dosyası - HTTP istekleri
import axios from 'axios';

// Backend URL - Port 5001'e bağlan
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bilgin.onder.org.tr' 
  : 'http://localhost:5001';

  
// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10 saniye timeout
});

// API fonksiyonları
const apiService = {
  // Auth API'leri
  auth: {
    // Giriş yap
    login: async (username, isAdmin = false) => {
      try {
        const response = await api.post('/api/auth/login', {
          username,
          isAdmin
        });
        return response.data;
      } catch (error) {
        console.error('Login hatası:', error);
        throw error.response?.data || { message: 'Giriş yapılamadı!' };
      }
    },

    // Çıkış yap
    logout: async (sessionId) => {
      try {
        const response = await api.post('/api/auth/logout', { sessionId });
        return response.data;
      } catch (error) {
        console.error('Logout hatası:', error);
        return { success: false, message: 'Çıkış yapılamadı!' };
      }
    },

    // İstatistikler
    getStats: async () => {
      try {
        const response = await api.get('/api/auth/stats');
        return response.data;
      } catch (error) {
        console.error('Stats hatası:', error);
        return { success: false, data: null };
      }
    }
  },

  // Room API'leri
  rooms: {
    // Oda oluştur
    createRoom: async (title, adminName, questions = []) => {
      try {
        const response = await api.post('/api/rooms', {
          title,
          adminName,
          questions
        });
        return response.data;
      } catch (error) {
        console.error('Oda oluşturma hatası:', error);
        throw error.response?.data || { message: 'Oda oluşturulamadı!' };
      }
    },

    // Odaya katıl (kontrol)
    joinRoom: async (roomCode, username) => {
      try {
        const response = await api.post('/api/rooms/join', {
          roomCode: roomCode.toUpperCase(),
          username
        });
        return response.data;
      } catch (error) {
        console.error('Oda katılım hatası:', error);
        throw error.response?.data || { message: 'Odaya katılamadı!' };
      }
    },

    // Oda detayları
    getRoomDetails: async (roomId) => {
      try {
        const response = await api.get(`/api/rooms/${roomId}`);
        return response.data;
      } catch (error) {
        console.error('Oda detay hatası:', error);
        throw error.response?.data || { message: 'Oda bilgileri alınamadı!' };
      }
    },

    // Oda koduna göre oda bul
    getRoomByCode: async (roomCode) => {
      try {
        const response = await api.get(`/api/rooms/code/${roomCode.toUpperCase()}`);
        return response.data;
      } catch (error) {
        console.error('Oda bulma hatası:', error);
        throw error.response?.data || { message: 'Oda bulunamadı!' };
      }
    },

    // Soru ekle
    addQuestion: async (roomId, questionData) => {
      try {
        const response = await api.post(`/api/rooms/${roomId}/questions`, questionData);
        return response.data;
      } catch (error) {
        console.error('Soru ekleme hatası:', error);
        throw error.response?.data || { message: 'Soru eklenemedi!' };
      }
    },

    // Odaları listele
    listRooms: async () => {
      try {
        const response = await api.get('/api/rooms');
        return response.data;
      } catch (error) {
        console.error('Oda listeleme hatası:', error);
        return { success: false, data: { rooms: [] } };
      }
    }
  },

  // Quiz API'leri
  quiz: {
    // Quiz başlat
    startQuiz: async (roomId, adminName) => {
      try {
        const response = await api.post(`/api/quiz/${roomId}/start`, { adminName });
        return response.data;
      } catch (error) {
        console.error('Quiz başlatma hatası:', error);
        throw error.response?.data || { message: 'Quiz başlatılamadı!' };
      }
    },

    // Sonraki soru
    nextQuestion: async (roomId, adminName) => {
      try {
        const response = await api.post(`/api/quiz/${roomId}/next`, { adminName });
        return response.data;
      } catch (error) {
        console.error('Sonraki soru hatası:', error);
        throw error.response?.data || { message: 'Sonraki soru getirilemedi!' };
      }
    },

    // Quiz bitir
    finishQuiz: async (roomId, adminName) => {
      try {
        const response = await api.post(`/api/quiz/${roomId}/finish`, { adminName });
        return response.data;
      } catch (error) {
        console.error('Quiz bitirme hatası:', error);
        throw error.response?.data || { message: 'Quiz bitirilemedi!' };
      }
    },

    // Sonuçları getir
    getResults: async (roomId) => {
      try {
        const response = await api.get(`/api/quiz/${roomId}/results`);
        return response.data;
      } catch (error) {
        console.error('Sonuç getirme hatası:', error);
        throw error.response?.data || { message: 'Sonuçlar alınamadı!' };
      }
    },

    // Quiz sonuçlarını getir
    getResults: async (roomId) => {
      try {
        const response = await api.get(`/api/quiz/${roomId}/results`);
        return response.data;
      } catch (error) {
        console.error('Sonuç getirme hatası:', error);
        throw error.response?.data || { message: 'Sonuçlar alınamadı!' };
      }
    },

    // Quiz istatistikleri
    getQuizStats: async (roomId) => {
      try {
        const response = await api.get(`/api/quiz/${roomId}/stats`);
        return response.data;
      } catch (error) {
        console.error('İstatistik hatası:', error);
        throw error.response?.data || { message: 'İstatistikler alınamadı!' };
      }
    },

    // Excel export verileri al
    getExcelData: async (roomId, adminName) => {
      try {
        const response = await api.get(`/api/quiz/${roomId}/export/excel`, {
          params: { adminName }
        });
        return response.data;
      } catch (error) {
        console.error('Excel export hatası:', error);
        throw error.response?.data || { message: 'Excel verileri alınamadı!' };
      }
    },

    // Quiz'i yeniden başlat
    restartQuiz: async (roomId, adminName) => {
      try {
        const response = await api.post(`/api/quiz/${roomId}/restart`, { adminName });
        return response.data;
      } catch (error) {
        console.error('Quiz restart hatası:', error);
        throw error.response?.data || { message: 'Quiz yeniden başlatılamadı!' };
      }
    },

    // Katılımcı kickle
    kickParticipant: async (roomId, adminName, username) => {
      try {
        const response = await api.post(`/api/quiz/${roomId}/kick`, { 
          adminName, 
          username 
        });
        return response.data;
      } catch (error) {
        console.error('Katılımcı kick hatası:', error);
        throw error.response?.data || { message: 'Katılımcı çıkarılamadı!' };
      }
    },

    // Quiz analizi
    getAnalysis: async (roomId) => {
      try {
        const response = await api.get(`/api/quiz/${roomId}/analysis`);
        return response.data;
      } catch (error) {
        console.error('Analiz hatası:', error);
        return { success: false, data: null };
      }
    }
  },

  // Test API bağlantısı
  testConnection: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error('Bağlantı test hatası:', error);
      return { success: false, message: 'Backend\'e bağlanılamıyor!' };
    }
  }
};

export default apiService;