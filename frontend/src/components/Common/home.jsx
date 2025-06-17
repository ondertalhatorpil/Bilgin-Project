import React, { useState } from 'react';
import ConnectionStatus from './ConnectionStatus';

const Home = ({ onAdminLogin, onPlayerLogin, loading, connectionStatus, onTestConnection }) => {
  const [adminName, setAdminName] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminName.trim()) {
      onAdminLogin(adminName.trim());
    }
  };

  const handlePlayerSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onPlayerLogin(playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-red-800 relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(135deg, #D12A2C 0%, #B91C1C 50%, #991B1B 100%)' }}>
      {/* Floating Background Elements - Mobile Responsive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white bg-opacity-10 rounded-full animate-float"></div>
        <div className="absolute top-12 right-8 sm:top-1/4 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 bg-white bg-opacity-10 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-16 left-8 sm:bottom-1/4 sm:left-1/4 w-20 h-20 sm:w-40 sm:h-40 bg-white bg-opacity-5 rounded-full animate-float"></div>
        <div className="absolute bottom-8 right-12 sm:bottom-20 sm:right-32 w-10 h-10 sm:w-20 sm:h-20 bg-white bg-opacity-10 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 left-2 sm:left-8 w-8 h-8 sm:w-16 sm:h-16 bg-white bg-opacity-10 rounded-full animate-float"></div>
      </div>

      {/* Mobile-First Container */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
        {/* Mobile Header */}
        <div className="text-center pt-8 sm:pt-16 pb-6 sm:pb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-4 tracking-tight">
            Bilgin
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium max-w-md mx-auto px-4">
            Etkinlik oluşturun veya mevcut bir yarışmaya katılın
          </p>
        </div>
        {/* Main Action Cards - Mobile Stack Layout */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-16">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Admin Card - Red Theme - Mobile Responsive */}
            <div className="group transition-all duration-500">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl p-4 sm:p-6 lg:p-10 transform group-hover:scale-[1.02] lg:group-hover:scale-[1.03] group-hover:-translate-y-1 transition-all duration-500 border border-transparent hover:border-red-300 hover:bg-white/90">
                <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-tr from-red-600 to-red-700 transform group-hover:rotate-6 transition-transform duration-300">
                    <div className="text-2xl sm:text-3xl lg:text-4xl">👑</div>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-gray-800 mb-1 sm:mb-2">
                    Etkinlik Oluştur
                  </h2>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Admin adınızı girin"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      maxLength={20}
                      className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 lg:py-4 border-2 sm:border-3 border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none text-sm sm:text-base lg:text-lg font-medium transition-colors duration-300 bg-gray-50 focus:bg-white"
                      style={{ 
                        borderColor: adminName ? '#D12A2C' : '', 
                        focusBorderColor: '#D12A2C',
                        fontSize: '16px' // Prevents zoom on iOS
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#D12A2C'}
                      onBlur={(e) => e.target.style.borderColor = adminName ? '#D12A2C' : '#d1d5db'}
                      disabled={loading}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !adminName.trim()}
                    className="w-full text-white font-black py-3 sm:py-3.5 lg:py-4 px-4 sm:px-5 lg:px-6 rounded-xl sm:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base lg:text-xl transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-h-[44px]"
                    style={{
                      background: loading || !adminName.trim() ? '#9ca3af' : 'linear-gradient(135deg, #D12A2C 0%, #B91C1C 100%)',
                      boxShadow: loading || !adminName.trim() ? '' : '0 10px 25px rgba(209, 42, 44, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && adminName.trim()) {
                        e.target.style.background = 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && adminName.trim()) {
                        e.target.style.background = 'linear-gradient(135deg, #D12A2C 0%, #B91C1C 100%)';
                      }
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 sm:border-b-3 border-white mr-2 sm:mr-3"></div>
                        <span className="text-xs sm:text-sm lg:text-base">Oluşturuluyor...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <span className="mr-1 sm:mr-2 text-sm sm:text-base lg:text-lg">🚀</span>
                        <span className="text-xs sm:text-sm lg:text-base">Etkinlik Oluştur</span>
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {/* Player Card - Complementary Color - Mobile Responsive */}
            <div className="group transition-all duration-500">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl p-4 sm:p-6 lg:p-10 transform group-hover:scale-[1.02] lg:group-hover:scale-[1.03] group-hover:-translate-y-1 transition-all duration-500 border border-transparent hover:border-gray-400 hover:bg-white/90">
                <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-tr from-gray-700 to-gray-800 rounded-xl sm:rounded-2xl shadow-md mb-3 sm:mb-4 lg:mb-6 transform group-hover:rotate-6 transition-transform duration-300">
                    <div className="text-2xl sm:text-3xl lg:text-4xl">🎯</div>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-gray-800 mb-1 sm:mb-2">
                    Etkinliğe Katıl
                  </h2>
                </div>

                <form onSubmit={handlePlayerSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Adınızı girin"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={20}
                      className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-3.5 lg:py-4 border-2 sm:border-3 border-gray-300 rounded-xl sm:rounded-2xl focus:border-gray-600 focus:outline-none text-sm sm:text-base lg:text-lg font-medium transition-colors duration-300 bg-gray-50 focus:bg-white"
                      style={{ fontSize: '16px' }} // Prevents zoom on iOS
                      disabled={loading}
                    />
                   
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !playerName.trim()}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-black py-3 sm:py-3.5 lg:py-4 px-4 sm:px-5 lg:px-6 rounded-xl sm:rounded-2xl hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base lg:text-xl transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-h-[44px]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 sm:border-b-3 border-white mr-2 sm:mr-3"></div>
                        <span className="text-xs sm:text-sm lg:text-base">Bağlanıyor...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <span className="mr-1 sm:mr-2 text-sm sm:text-base lg:text-lg">🎮</span>
                        <span className="text-xs sm:text-sm lg:text-base">Hemen Katıl</span>
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status - Mobile Hidden (can be shown in settings)
        <div className="max-w-md mx-auto hidden lg:block">
          <ConnectionStatus 
            connectionStatus={connectionStatus}
            onTestConnection={onTestConnection}
            loading={loading}
          />
        </div>
        */}

       
      </div>

      {/* Custom Animations - Enhanced for Mobile */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(8deg);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(-8deg);
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
        }
        
        .border-3 {
          border-width: 3px;
        }
        
        .bg-clip-text {
          background-clip: text;
          -webkit-background-clip: text;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          /* Ensure proper touch targets */
          button {
            min-height: 44px;
            touch-action: manipulation;
          }
          
          /* Optimize input behavior on mobile */
          input {
            font-size: 16px !important; /* Prevents zoom on iOS */
            -webkit-appearance: none;
            border-radius: 12px;
          }
          
          /* Reduce animation intensity on mobile for performance */
          .animate-float,
          .animate-float-delayed {
            animation-duration: 6s;
          }
          
          /* Better shadow performance on mobile */
          .shadow-xl {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          
          /* Optimize backdrop blur for mobile */
          .backdrop-blur-md {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }

        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1023px) {
          .group:hover .transform {
            transform: scale(1.02) translateY(-2px);
          }
        }

        /* Focus states for accessibility */
        input:focus,
        button:focus {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-white\/80 {
            background-color: white;
          }
          
          .text-white\/90 {
            color: white;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-float-delayed,
          .transform,
          .transition-all {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;