import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { User, Lock, Eye, EyeOff, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const LoginPage = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(null);
    setLoading(true);

    try {
      const response = await axiosInstance.post('/login/', form);
      
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        const loginResult = await login(form.username, form.password);
        
        if (loginResult.success) {
          navigate('/dashboard');
        } else {
          setError(loginResult.error || 'Login failed');
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
      
      if (err.response?.data?.details?.email_not_verified) {
        setEmailNotVerified(err.response.data.details.email);
        setError(err.response.data.details.message || 'Please verify your email address before logging in.');
      } else if (err.response?.data?.details) {
        const details = err.response.data.details;
        const errorMessages = [];
        
        Object.keys(details).forEach(field => {
          if (Array.isArray(details[field])) {
            errorMessages.push(...details[field]);
          } else {
            errorMessages.push(details[field]);
          }
        });
        
        setError(errorMessages.join(' '));
      } else {
        setError(err.response?.data?.error || err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!emailNotVerified) return;
    
    setResendingVerification(true);
    try {
      const response = await axiosInstance.post('/resend-verification/', {
        email: emailNotVerified
      });
      
      if (response.status === 200) {
        setSuccessMessage('Verification email sent! Please check your inbox.');
        setEmailNotVerified(null);
        setError('');
      }
    } catch (err) {
      console.error('Resend verification failed:', err);
      setError(err.response?.data?.error || 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-black bg-opacity-60 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">PIIcasso</h1>
          <h2 className="text-xl font-semibold text-white mb-2">Sign In</h2>
          <p className="text-zinc-400">Access your intelligence dashboard</p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500 rounded-lg p-3 flex items-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <div className="flex items-center text-red-400 mb-2">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium">Login Failed</span>
              </div>
              <p className="text-red-300 text-sm">{error}</p>
              
              {emailNotVerified && (
                <div className="mt-3 pt-3 border-t border-red-800">
                  <p className="text-red-300 text-sm mb-2">
                    Verification email sent to: <span className="font-mono">{emailNotVerified}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-1 px-3 rounded flex items-center"
                  >
                    {resendingVerification ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-3 h-3 mr-1" />
                        Resend Verification
                      </>
                    )}
                  </button>
                </div>
              )}
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
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>
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
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg pl-10 pr-12 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-red-400 hover:text-red-300 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-700 text-center">
          <p className="text-zinc-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 font-medium">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;