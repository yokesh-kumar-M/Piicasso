// src/components/TerminalTitle.js
import React, { useEffect, useState } from 'react';

const TerminalTitle = () => {
  const [text, setText] = useState('');
  const fullText = 'Welcome to AEGIS — Intelligence Engine Online...';
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i++));
      if (i > fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-green-400 text-center text-sm sm:text-md font-mono tracking-wide animate-pulse">
      {text}
    </div>
  );
};

export default TerminalTitle;
