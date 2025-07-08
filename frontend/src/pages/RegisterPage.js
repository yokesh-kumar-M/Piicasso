// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', formData);
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-black bg-opacity-40 backdrop-blur-md p-8 rounded-xl shadow-lg border border-red-600">
        <h2 className="text-3xl text-red-600 font-bold text-center mb-6 font-heading">Register</h2>

        {error && <div className="mb-4 text-red-400 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 font-semibold rounded transition text-white font-body ${loading ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;