import React from 'react';

const ErrorBanner = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="bg-red-500 text-white px-4 py-3 relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl mr-2">⚠️</span>
          <span className="font-medium">{error}</span>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-red-200 font-bold text-xl leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;