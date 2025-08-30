import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4 flex items-start space-x-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-300">{error}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-300">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;