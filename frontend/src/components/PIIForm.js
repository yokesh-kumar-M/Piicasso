import React, { useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const initial = {
  full_name: '',
  birth_year: '',
  pet_names: '',
  spouse_name: '',
  sports_team: '',
  childhood_nickname: '',
  first_car_model: '',
  hometown: '',
  favourite_movies: '',
  school_name: '',
  employer_name: '',
  phone_suffix: '',
  favourite_food: '',
};


const PIIForm = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const buildPayload = () => ({
    full_name: form.full_name,
    birth_year: form.birth_year,
    pet_names: form.pet_names ? form.pet_names.split(',').map(s => s.trim()).filter(Boolean) : [],
    spouse_name: form.spouse_name,
    sports_team: form.sports_team,
    childhood_nickname: form.childhood_nickname,
    first_car_model: form.first_car_model,
    hometown: form.hometown,
    favourite_movies: form.favourite_movies ? form.favourite_movies.split(',').map(s => s.trim()).filter(Boolean) : [],
    school_name: form.school_name,
    employer_name: form.employer_name,
    phone_suffix: form.phone_suffix,
    favourite_food: form.favourite_food,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isAuthenticated) {
      setError('You must be logged in to submit PII.');
      navigate('/login');
      return;
    }
    const payload = buildPayload();
    if (!Object.values(payload).some(v => (Array.isArray(v) ? v.length : !!v))) {
      setError('Please fill at least one field.');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post('submit-pii/', payload);
      if (res.status === 201) {
        sessionStorage.setItem('generatedWordlist', JSON.stringify(res.data.wordlist));
        navigate('/result');
      } else {
        setError(res.data?.error || 'Generation failed');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || err.message || 'Submission failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-6 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl p-6 bg-black bg-opacity-30 rounded">
        <h1 className="text-2xl text-red-500 text-center mb-4">PIIcasso Generator</h1>
        {error && <div className="text-red-400 mb-3 text-center">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full Name" className="p-2 bg-[#111]" />
          <input name="birth_year" value={form.birth_year} onChange={handleChange} placeholder="Birth Year" className="p-2 bg-[#111]" />
          <input name="pet_names" value={form.pet_names} onChange={handleChange} placeholder="Pet Names (comma-separated)" className="p-2 bg-[#111]" />
          <input name="spouse_name" value={form.spouse_name} onChange={handleChange} placeholder="Spouse Name" className="p-2 bg-[#111]" />
          <input name="sports_team" value={form.sports_team} onChange={handleChange} placeholder="Sports Team" className="p-2 bg-[#111]" />
          <input name="childhood_nickname" value={form.childhood_nickname} onChange={handleChange} placeholder="Childhood Nickname" className="p-2 bg-[#111]" />
          <input name="first_car_model" value={form.first_car_model} onChange={handleChange} placeholder="First Car Model" className="p-2 bg-[#111]" />
          <input name="hometown" value={form.hometown} onChange={handleChange} placeholder="Hometown" className="p-2 bg-[#111]" />
          <input name="favourite_movies" value={form.favourite_movies} onChange={handleChange} placeholder="Favourite Movies (comma-separated)" className="p-2 bg-[#111]" />
          <input name="school_name" value={form.school_name} onChange={handleChange} placeholder="School Name" className="p-2 bg-[#111]" />
          <input name="employer_name" value={form.employer_name} onChange={handleChange} placeholder="Employer Name" className="p-2 bg-[#111]" />
          <input name="phone_suffix" value={form.phone_suffix} onChange={handleChange} placeholder="Phone Suffix" className="p-2 bg-[#111]" />
          <input name="favourite_food" value={form.favourite_food} onChange={handleChange} placeholder="Favourite Food" className="p-2 bg-[#111]" />
        </div>

        <button type="submit" disabled={loading} className="mt-4 w-full bg-red-600 py-2 rounded">
          {loading ? 'Generating...' : 'Generate Password List'}
        </button>
      </form>
    </div>
  );
};

export default PIIForm;
