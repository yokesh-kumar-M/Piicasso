
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setSuccess(false);
    try {
      const res = await axiosInstance.post('register/', form);
      if (res.status === 201) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(res.data?.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-black bg-opacity-40 p-6 rounded">
        <h2 className="text-2xl text-red-500 mb-4 text-center">Register</h2>
        {error && <div className="mb-3 text-red-400 text-center">{error}</div>}
        {success && <div className="mb-3 text-green-400 text-center">Registration successful! Redirecting to login...</div>}
        <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="w-full mb-2 p-2 bg-[#111]" required />
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full mb-2 p-2 bg-[#111]" required />
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full mb-4 p-2 bg-[#111]" required />
        <button type="submit" disabled={loading} className="w-full bg-red-600 py-2 rounded">{loading ? 'Registering...' : 'Register'}</button>
        <p className="mt-3 text-sm text-center">Already have an account? <Link to="/login" className="text-red-400">Login</Link></p>
      </form>
    </div>
  );
};

export default RegisterPage;
