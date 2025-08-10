import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WordlistViewer from '../components/WordlistViewer';

const ResultPage = () => {
  const [wordlist, setWordlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem('generatedWordlist');
    if (raw) {
      try {
        setWordlist(JSON.parse(raw));
      } catch (e) {
        setWordlist([]);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-green-400">Loading results...</div>;

  if (!wordlist || wordlist.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <div className="text-red-400 mb-4">No wordlist found</div>
        <button onClick={() => navigate('/')} className="bg-red-600 px-4 py-2 rounded">Generate New Wordlist</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[#0b0b0b] text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button onClick={() => navigate('/')} className="mr-2 bg-gray-600 px-3 py-1 rounded">← Back</button>
          <button onClick={() => navigate('/dashboard')} className="bg-blue-600 px-3 py-1 rounded">Dashboard</button>
        </div>
        <WordlistViewer wordlist={wordlist} />
      </div>
    </div>
  );
};

export default ResultPage;
