import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await login(form.username, form.password);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error || 'Login failed');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-black bg-opacity-40 p-6 rounded">
        <h2 className="text-2xl text-red-500 mb-4 text-center">Sign In</h2>
        {error && <div className="mb-3 text-red-400 text-center">{error}</div>}
        <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="w-full mb-2 p-2 bg-[#111]" required />
        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full mb-4 p-2 bg-[#111]" required />
        <button type="submit" disabled={loading} className="w-full bg-red-600 py-2 rounded">{loading ? 'Signing in...' : 'Login'}</button>
        <p className="mt-3 text-sm text-center">Don’t have an account? <Link to="/register" className="text-red-400">Register</Link></p>
      </form>
    </div>
  );
};

export default LoginPage;
