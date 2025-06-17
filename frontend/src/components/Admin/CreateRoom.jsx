import React, { useState } from 'react';
import apiService from '../../services/api';

const CreateRoom = ({ user, onRoomCreated, onError }) => {
  const [roomTitle, setRoomTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Modern color scheme with #BD1E1F as primary
  const colors = {
    primary: '#BD1E1F',
    primaryLight: '#E53E3E',
    primaryDark: '#9B1C1C',
    secondary: '#4A5568',
    success: '#38A169',
    warning: '#D69E2E',
    gray: '#718096'
  };

  // Kahoot style colors for options
  const optionColors = [
    { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-800', bgLight: 'bg-red-50', symbol: '▲', hover: 'hover:bg-red-600' },
    { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-800', bgLight: 'bg-blue-50', symbol: '♦', hover: 'hover:bg-blue-600' },
    { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-800', bgLight: 'bg-yellow-50', symbol: '●', hover: 'hover:bg-yellow-600' },
    { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-800', bgLight: 'bg-green-50', symbol: '■', hover: 'hover:bg-green-600' }
  ];

  // Soru ekle
  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      onError('Soru metni boş olamaz!');
      return;
    }

    const emptyOptions = currentQuestion.options.filter(opt => !opt.trim());
    if (emptyOptions.length > 0) {
      onError('Tüm seçenekler doldurulmalı!');
      return;
    }

    const newQuestion = {
      text: currentQuestion.text.trim(),
      options: currentQuestion.options.map(opt => opt.trim()),
      correctAnswer: currentQuestion.correctAnswer
    };

    setQuestions([...questions, newQuestion]);
    
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  // Soru sil
  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Seçeneği güncelle
  const updateOption = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // Oda oluştur
  const createRoom = async () => {
    if (!roomTitle.trim()) {
      onError('Etkinlik başlığı gerekli!');
      return;
    }

    if (questions.length === 0) {
      onError('En az 1 soru eklemelisiniz!');
      return;
    }

    try {
      setLoading(true);
      onError && onError(null);

      console.log('🚀 Oda oluşturuluyor:', {
        title: roomTitle.trim(),
        adminName: user.username,
        questionCount: questions.length,
        questions: questions
      });

      const result = await apiService.rooms.createRoom(
        roomTitle.trim(),
        user.username,
        questions
      );

      console.log('✅ Oda oluşturma sonucu:', result);

      if (result.success) {
        const roomData = {
          ...result.data,
          questionCount: questions.length,
          questions: questions
        };
        
        console.log('📤 Normalized room data gönderiliyor:', roomData);
        onRoomCreated(roomData);
      } else {
        onError(result.message);
      }
    } catch (error) {
      console.error('❌ Oda oluşturma hatası:', error);
      onError(error.message || 'Etkinlik oluşturulamadı!');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Etkinlik Başlığı', icon: '📝', completed: roomTitle.trim() },
    { id: 2, title: 'Soru Ekle', icon: '❓', completed: questions.length > 0 },
    { id: 3, title: 'Tamamla', icon: '🚀', completed: roomTitle.trim() && questions.length > 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
      {/* Kahoot-style Background Patterns - Mobile Responsive */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white rounded-full"></div>
        <div className="absolute top-20 right-8 sm:top-40 sm:right-20 w-12 h-12 sm:w-20 sm:h-20 bg-yellow-300 rounded-full"></div>
        <div className="absolute bottom-12 left-8 sm:bottom-20 sm:left-1/4 w-10 h-10 sm:w-16 sm:h-16 bg-blue-400 rounded-full"></div>
        <div className="absolute bottom-20 right-12 sm:bottom-40 sm:right-1/3 w-14 h-14 sm:w-24 sm:h-24 bg-green-400 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-purple-400 transform -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
        <div className="absolute top-12 right-12 sm:top-20 sm:right-1/4 w-6 h-6 sm:w-8 sm:h-8 bg-pink-400 rounded-full"></div>
        <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-8 h-8 sm:w-14 sm:h-14 bg-orange-400 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 max-w-6xl relative z-10">

        {/* Progress Steps - Mobile Responsive */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 w-full sm:w-auto ${
                    activeStep === step.id 
                      ? 'bg-white text-red-600 shadow-2xl scale-105 border-2 border-white' 
                      : step.completed 
                        ? 'bg-white/90 text-green-700 hover:bg-white shadow-xl backdrop-blur-sm' 
                        : 'bg-white/70 text-gray-600 hover:bg-white/80 shadow-lg backdrop-blur-sm'
                  }`}
                  onClick={() => setActiveStep(step.id)}
                >
                  <span className="text-xl sm:text-2xl">{step.icon}</span>
                  <span className="font-bold text-sm sm:text-base">{step.title}</span>
                  {step.completed && activeStep !== step.id && (
                    <span className="text-green-500 text-lg sm:text-xl ml-auto">✓</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-2 h-6 sm:w-8 sm:h-2 bg-white/30 rounded-full backdrop-blur-sm sm:block hidden">
                    <div 
                      className={`w-full sm:h-full rounded-full transition-all duration-500 ${
                        step.completed ? 'h-full sm:w-full bg-white shadow-lg' : 'h-0 sm:w-0'
                      }`}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Room Title - Mobile Responsive */}
        {activeStep === 1 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 mb-6 sm:mb-8 border-2 border-white/50">
            <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8">
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-0 sm:mr-6 text-white shadow-xl"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-2xl sm:text-3xl">📝</span>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-800">Etkinlik Başlığı</h2>
                <p className="text-sm sm:text-base text-gray-600">Etkinliğiniz için çekici bir başlık belirleyin</p>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-base sm:text-lg font-bold text-gray-700 mb-2 sm:mb-3">
                  Başlık
                </label>
                <input
                  type="text"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 border-3 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none text-lg sm:text-xl font-semibold transition-all duration-300 bg-gray-50 focus:bg-white focus:shadow-xl focus:border-red-500"
                  placeholder="Örn: İslam Tarihi Quiz Yarışması"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  maxLength={60}
                />
                <div className="flex justify-between items-center mt-2 sm:mt-3">
                  <span className="text-xs sm:text-sm text-gray-500">{roomTitle.length}/60 karakter</span>
                  {roomTitle.trim() && (
                    <span className="text-green-600 font-semibold text-xs sm:text-sm">✓ Başlık belirlendi</span>
                  )}
                </div>
              </div>

              {roomTitle.trim() && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-6 sm:px-8 py-3 sm:py-4 text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-sm sm:text-base"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Devam Et - Soru Ekle →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Add Questions - Mobile Responsive */}
        {activeStep === 2 && (
          <div className="space-y-6 sm:space-y-8">
            {/* Question Form */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 border-2 border-white/50">
              <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8">
                <div 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-0 sm:mr-6 text-white shadow-xl"
                  style={{ backgroundColor: colors.success }}
                >
                  <span className="text-2xl sm:text-3xl">❓</span>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-800">Yeni Soru Ekle</h3>
                  <p className="text-sm sm:text-base text-gray-600">Katılımcılar için eğlenceli sorular oluşturun</p>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">
                  <span className="mr-2">💭</span>
                  Soru Metni
                </label>
                <textarea
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 border-3 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none text-base sm:text-lg font-medium transition-all duration-300 resize-none bg-gray-50 focus:bg-white focus:shadow-xl focus:border-green-500"
                  placeholder="Sorunuzu buraya yazın... Net ve anlaşılır olmasına dikkat edin."
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                  maxLength={500}
                  rows="3"
                />
                <div className="mt-2 text-xs sm:text-sm text-gray-500">
                  {currentQuestion.text.length}/500 karakter
                </div>
              </div>

              {/* Answer Options - Mobile Grid */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">
                  <span className="mr-2">🎯</span>
                  Cevap Seçenekleri
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {currentQuestion.options.map((option, index) => {
                    const colors_opt = optionColors[index];
                    const isSelected = currentQuestion.correctAnswer === index;
                    
                    return (
                      <div key={index} className="relative">
                        <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-3 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                          isSelected 
                            ? `${colors_opt.bg} border-transparent text-white shadow-2xl scale-105` 
                            : `${colors_opt.bgLight} ${colors_opt.border} ${colors_opt.text} hover:shadow-xl`
                        }`}
                        onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                        >
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center">
                              <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">{colors_opt.symbol}</span>
                              <span className="font-black text-sm sm:text-lg">Seçenek {String.fromCharCode(65 + index)}</span>
                            </div>
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'bg-white border-white' : 'border-gray-400'
                            }`}>
                              {isSelected && <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-current"></div>}
                            </div>
                          </div>
                          <input
                            type="text"
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-lg border-2 transition-all duration-300 ${
                              isSelected 
                                ? 'border-white bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70' 
                                : 'border-gray-300 bg-white focus:border-gray-500'
                            }`}
                            placeholder={`${index + 1}. seçeneği yazın...`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            maxLength={200}
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-xl animate-pulse text-xs sm:text-sm">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                  💡 <strong>İpucu:</strong> Doğru cevabı seçmek için seçeneklere tıklayın
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={addQuestion}
                  disabled={!currentQuestion.text.trim() || currentQuestion.options.some(opt => !opt.trim())}
                  className="px-6 sm:px-8 py-3 sm:py-4 text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl text-sm sm:text-base"
                  style={{ backgroundColor: colors.success }}
                >
                  <span className="mr-2">➕</span>
                  Soruyu Ekle
                </button>
              </div>
            </div>
            {/* Added Questions - Mobile Responsive */}
            {questions.length > 0 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 border-2 border-white/50">
                <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between mb-4 sm:mb-6">
                  <h4 className="text-xl sm:text-2xl font-black text-gray-800 mb-3 sm:mb-0">
                    <span className="mr-2">📋</span>
                    Eklenen Sorular ({questions.length})
                  </h4>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 sm:px-6 py-2 sm:py-3 text-white font-bold rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Tamamla →
                  </button>
                </div>
                
                <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {questions.map((q, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 text-white font-bold shadow-lg text-sm sm:text-base"
                            style={{ backgroundColor: colors.secondary }}
                          >
                            {index + 1}
                          </div>
                          <h5 className="text-base sm:text-lg font-bold text-gray-800">Soru {index + 1}</h5>
                        </div>
                        <button 
                          onClick={() => removeQuestion(index)}
                          className="text-red-500 hover:text-red-700 font-bold px-2 sm:px-3 py-1 rounded-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-110 text-sm sm:text-base"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      <p className="text-gray-700 font-medium mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                        {q.text}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((option, optIndex) => {
                          const colors_opt = optionColors[optIndex];
                          const isCorrect = optIndex === q.correctAnswer;
                          
                          return (
                            <div 
                              key={optIndex} 
                              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center transition-all duration-300 ${
                                isCorrect 
                                  ? `${colors_opt.bg} text-white shadow-lg` 
                                  : `${colors_opt.bgLight} ${colors_opt.text}`
                              }`}
                            >
                              <span className="mr-2">{colors_opt.symbol}</span>
                              <span className="truncate flex-1">{option}</span>
                              {isCorrect && <span className="ml-auto">✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Complete - Mobile Responsive */}
        {activeStep === 3 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 border-2 border-white/50">
            <div className="text-center">
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white shadow-2xl"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-3xl sm:text-4xl">🚀</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-3 sm:mb-4">Etkinlik Hazır!</h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                Harika! Etkinliğiniz oluşturulmaya hazır. Aşağıdaki bilgileri kontrol edin.
              </p>

              {/* Summary - Mobile Responsive */}
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 text-left max-w-2xl mx-auto shadow-inner">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center sm:text-left">📊 Etkinlik Özeti</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-600 text-sm sm:text-base">📝 Başlık:</span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base mt-1 sm:mt-0">{roomTitle}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-600 text-sm sm:text-base">❓ Soru Sayısı:</span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base mt-1 sm:mt-0">{questions.length} soru</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-600 text-sm sm:text-base">👤 Yönetici:</span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base mt-1 sm:mt-0">{user?.username || 'Admin'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3">
                    <span className="font-semibold text-gray-600 text-sm sm:text-base">⏱️ Tahmini Süre:</span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base mt-1 sm:mt-0">{questions.length * 2} dakika</span>
                  </div>
                </div>
              </div>

              {/* Create Button - Mobile Responsive */}
              <button 
                onClick={createRoom}
                disabled={loading || questions.length === 0 || !roomTitle.trim()}
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-6 text-white font-black rounded-2xl sm:rounded-3xl text-lg sm:text-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl hover:shadow-3xl mb-4 sm:mb-6"
                style={{ backgroundColor: colors.primary }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-3 border-white mr-3 sm:mr-4"></div>
                    🔄 Oluşturuluyor...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 sm:mr-3">🎯</span>
                    Etkinliği Oluştur
                  </span>
                )}
              </button>

              {/* Back Button - Mobile Responsive */}
              <button
                onClick={() => setActiveStep(2)}
                className="text-gray-600 hover:text-gray-800 font-semibold transition-colors duration-300 hover:underline text-sm sm:text-base"
              >
                ← Geri Dön
              </button>
            </div>
          </div>
        )}

        {/* Status Messages - Mobile Responsive */}
        <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
          {questions.length === 0 && activeStep === 3 && (
            <div className="bg-red-50/90 backdrop-blur-sm border-2 border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
              <p className="text-red-700 font-bold flex items-center justify-center text-sm sm:text-base">
                <span className="mr-2">⚠️</span>
                En az 1 soru eklemelisiniz!
              </p>
            </div>
          )}
          
          {!roomTitle.trim() && activeStep === 3 && (
            <div className="bg-yellow-50/90 backdrop-blur-sm border-2 border-yellow-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
              <p className="text-yellow-700 font-bold flex items-center justify-center text-sm sm:text-base">
                <span className="mr-2">⚠️</span>
                Etkinlik başlığı gerekli!
              </p>
            </div>
          )}

          {questions.length > 0 && roomTitle.trim() && activeStep === 3 && (
            <div className="bg-green-50/90 backdrop-blur-sm border-2 border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
              <p className="text-green-700 font-bold flex items-center justify-center text-sm sm:text-base">
                <span className="mr-2">✅</span>
                Mükemmel! Etkinliğiniz oluşturulmaya hazır ({questions.length} soru)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .border-3 {
          border-width: 3px;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* Mobile scroll improvements */
        @media (max-width: 640px) {
          .max-h-80 {
            max-height: 20rem;
          }
          
          /* Better touch targets */
          button {
            min-height: 44px;
          }
          
          input, textarea {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
};

export default CreateRoom;