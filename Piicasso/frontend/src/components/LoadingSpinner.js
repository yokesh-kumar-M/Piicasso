// src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ message }) => (
  <div className="flex justify-center items-center mt-10 text-green-400 font-mono animate-pulse">
    <span className="text-center">{message || 'Loading...'}</span>
  </div>
);

export default LoadingSpinner;
