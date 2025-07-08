// src/pages/ResultPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WordlistViewer from '../components/WordlistViewer';

const ResultPage = () => {
  const [wordlist, setWordlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get wordlist from sessionStorage
    const storedWordlist = sessionStorage.getItem('generatedWordlist');
    
    if (storedWordlist) {
      try {
        const parsedWordlist = JSON.parse(storedWordlist);
        setWordlist(parsedWordlist);
      } catch (error) {
        console.error('Error parsing stored wordlist:', error);
        setWordlist([]);
      }
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading results...</div>
      </div>
    );
  }

  if (!wordlist || wordlist.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col items-center justify-center">
        <div className="text-red-400 font-mono text-xl mb-4">No wordlist found</div>
        <button
          onClick={() => navigate('/')}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded text-white font-semibold"
        >
          Generate New Wordlist
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white font-semibold mr-4"
          >
            ← Back to Generator
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
          >
            View Dashboard
          </button>
        </div>
        <WordlistViewer wordlist={wordlist} />
      </div>
    </div>
  );
};

export default ResultPage;