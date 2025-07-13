import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios'; // Use configured axios instance

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '', // Added confirm password field
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

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Don't send confirmPassword to backend
      const { confirmPassword, ...submitData } = formData;
      await axiosInstance.post('/api/register/', submitData);
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in.' } 
      });
    } catch (err) {
      console.error('Registration failed:', err);
      const errorMessage = 
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Please try a different username or email.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-black bg-opacity-40 backdrop-blur-md p-8 rounded-xl shadow-lg border border-red-600">
        <h2 className="text-3xl text-red-600 font-bold text-center mb-6 font-heading">Register</h2>

        {error && (
          <div className="mb-4 p-3 text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm text-gray-300">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm text-gray-300">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full mt-1 px-3 py-2 bg-[#1e1e1e] border border-gray-600 rounded outline-none focus:ring-2 focus:ring-red-600 font-body"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 font-semibold rounded transition text-white font-body ${
              loading ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <div className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-red-500 hover:underline">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;