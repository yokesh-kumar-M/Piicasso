// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await login(credentials.username, credentials.password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-black bg-opacity-40 backdrop-blur-md p-8 rounded-xl shadow-lg border border-red-600">
        <h2 className="text-3xl text-red-600 font-bold text-center mb-6 font-heading">Sign In</h2>

        {error && <div className="mb-4 text-red-400 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm text-gray-300">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              onChange={handleChange}
              value={credentials.username}
              required
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={handleChange}
              value={credentials.password}
              required
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 font-semibold rounded transition text-white font-body ${loading ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>

          <div className="mt-4 text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link to="/register" className="text-red-500 hover:underline">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
