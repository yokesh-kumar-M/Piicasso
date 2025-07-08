// src/pages/HomePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GeneratedPreview from '../components/GeneratedPreview';
import LoadingSpinner from '../components/LoadingSpinner';
import TerminalTitle from '../components/TerminalTitle';
import Logo from '../components/Logo';
import api from '../api/axios';

const fields = [
  { label: 'Full Name', key: 'full_name' },
  { label: 'Birth Year', key: 'birth_year' },
  { label: 'Pet Names (comma-separated)', key: 'pet_names' },
  { label: 'Spouse Name', key: 'spouse_name' },
  { label: 'Sports Team', key: 'sports_team' },
  { label: 'Childhood Nickname', key: 'nickname' },
  { label: 'First Car Model', key: 'first_car' },
  { label: 'Hometown', key: 'hometown' },
  { label: 'Favourite Movies (comma-separated)', key: 'favourite_movies' },
  { label: 'School Name', key: 'school' },
  { label: 'Employer Name', key: 'employer' },
  { label: 'Phone Suffix', key: 'phone_suffix' },
  { label: 'Favourite Food', key: 'favourite_food' }
];

const HomePage = () => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/submit-pii/', formData);
      const wordlist = response.data.wordlist || [];
      setGenerated(wordlist);
      
      // Store wordlist in sessionStorage for ResultPage
      sessionStorage.setItem('generatedWordlist', JSON.stringify(wordlist));
      
      // Navigate to results page after generation
      if (wordlist.length > 0) {
        navigate('/results');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.response?.data?.error || 'Failed to generate wordlist');
      setGenerated([]); 
    } finally {
      setLoading(false);
    }
  };

  const downloadWordlist = () => {
    if (generated.length === 0) return;
    
    const blob = new Blob([generated.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'piicasso_wordlist.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white font-mono p-4">
      <TerminalTitle />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl mx-auto mt-6 bg-black bg-opacity-30 backdrop-blur-md p-8 rounded-xl border border-red-700 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <div className="w-32 border-b-2 border-red-700 mt-2" />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded text-red-200 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {fields.map(({ label, key }) => (
            <div key={key} className="flex flex-col">
              <label className="text-sm text-red-400 mb-1">{label}</label>
              <input
                type="text"
                value={formData[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 transition font-mono text-sm"
                placeholder={`Enter ${label.toLowerCase()}`}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className={`mt-8 w-full py-2 rounded text-lg font-semibold transition ${
            loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Password List'}
        </button>
      </form>

      {loading && <LoadingSpinner message="Generating your custom wordlist..." />}

      {!loading && Array.isArray(generated) && generated.length > 0 && (
        <div className="mt-8">
          <GeneratedPreview list={generated.slice(0, 10)} />
          <div className="text-center mt-4">
            <button
              onClick={downloadWordlist}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white font-semibold mr-4"
            >
              Download Full Wordlist
            </button>
            <button
              onClick={() => navigate('/results')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold"
            >
              View Full Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;