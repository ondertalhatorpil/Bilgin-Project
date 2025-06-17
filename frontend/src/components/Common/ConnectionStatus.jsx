import React from 'react';

const ConnectionStatus = ({ connectionStatus, onTestConnection, loading }) => {
  return (
    <div className="flex justify-center">
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className={`font-medium ${
            connectionStatus === 'connected' ? 'text-green-700' : 'text-red-700'
          }`}>
            {connectionStatus === 'connected' ? '✅ Online' : '❌Bağlantı Yok'}
          </span>
        </div>
        
        {connectionStatus === 'disconnected' && (
          <button 
            onClick={onTestConnection} 
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deneniyor...
              </span>
            ) : (
              '🔄 Tekrar Dene'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;