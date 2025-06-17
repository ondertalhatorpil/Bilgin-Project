// Header component - Fixed Visibility
import React from 'react';

const Header = ({ user, onLogout, onHome }) => {
  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-red-900 bg-opacity-90 backdrop-blur-md border border-red-400 rounded-full px-6 py-3 shadow-2xl">
          <div className="flex items-center space-x-6">
            {/* Logo/Home Button */}
            <button
              onClick={onHome}
              className="group flex items-center space-x-2 hover:scale-110 transition-transform duration-300"
              title="Ana sayfaya dön"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-5 h-5 text-white" 
                  fill="currentColor"
                >
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </div>
              <span className="hidden md:block text-white font-bold text-lg">
                BİLGİN
              </span>
            </button>

            {/* Separator */}
            {user && (
              <div className="w-px h-6 bg-gray-500"></div>
            )}

            {/* User Section */}
            {user && (
              <>
                {/* User Avatar */}
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                    user.isAdmin 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                      : 'bg-gradient-to-r from-blue-400 to-purple-500'
                  }`}>
                    {user.isAdmin ? '👑' : '👤'}
                  </div>
                  
                  <div className="hidden md:block">
                    <div className="text-white font-semibold text-sm">
                      {user.username}
                    </div>
                    {user.isAdmin && (
                      <div className="text-orange-300 text-xs font-medium">
                        Admin
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                  title="Çıkış Yap"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;