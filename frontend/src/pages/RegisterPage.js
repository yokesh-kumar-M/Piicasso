import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirm_password: '' 
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    if (form.password !== form.confirm_password) {
      setFieldErrors({ confirm_password: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/register/', form);
      
      if (response.status === 201) {
        setSuccess(true);
        setRegisteredEmail(response.data.email);
        
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Registration successful! Please check your email and verify your account before logging in.' }
          });
        }, 5000);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        const newFieldErrors = {};
        
        Object.keys(details).forEach(field => {
          if (Array.isArray(details[field])) {
            newFieldErrors[field] = details[field][0];
          } else {
            newFieldErrors[field] = details[field];
          }
        });
        
        setFieldErrors(newFieldErrors);
        
        if (Object.keys(newFieldErrors).length === 0) {
          setError(err.response.data.error || 'Registration failed');
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-black bg-opacity-60 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700 shadow-2xl">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Registration Successful!</h2>
            <p className="text-zinc-300 mb-4">
              We've sent a verification email to:
            </p>
            <p className="text-white font-mono text-sm bg-zinc-800 p-2 rounded mb-4">
              {registeredEmail}
            </p>
            <p className="text-zinc-400 text-sm mb-6">
              Please check your inbox and click the verification link to activate your account.
            </p>
            <p className="text-zinc-500 text-xs">
              Redirecting to login page in 5 seconds...
            </p>
            <div className="mt-6">
              <Link 
                to="/login"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center transition-colors"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-black bg-opacity-60 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">PIIcasso</h1>
          <h2 className="text-xl font-semibold text-white mb-2">Create Account</h2>
          <p className="text-zinc-400">Join the intelligence platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                className={`w-full bg-zinc-800 border ${fieldErrors.username ? 'border-red-500' : 'border-zinc-600'} rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder="Choose a username"
                required
                disabled={loading}
                minLength="3"
              />
            </div>
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full bg-zinc-800 border ${fieldErrors.email ? 'border-red-500' : 'border-zinc-600'} rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full bg-zinc-800 border ${fieldErrors.password ? 'border-red-500' : 'border-zinc-600'} rounded-lg pl-10 pr-12 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder="Create a password"
                required
                disabled={loading}
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                className={`w-full bg-zinc-800 border ${fieldErrors.confirm_password ? 'border-red-500' : 'border-zinc-600'} rounded-lg pl-10 pr-12 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder="Confirm your password"
                required
                disabled={loading}
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.confirm_password && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.confirm_password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-700 text-center">
          <p className="text-zinc-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-red-400 hover:text-red-300 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;