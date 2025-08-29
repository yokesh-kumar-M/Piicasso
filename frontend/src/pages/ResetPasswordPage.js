import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid reset link. No token provided.');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (formData.new_password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/password-reset-confirm/', {
        token: token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Password reset successful! Please log in with your new password.' }
          });
        }, 3000);
      }
    } catch (err) {
      console.error('Password reset failed:', err);
      
      if (err.response?.data?.details?.token) {
        const tokenError = err.response.data.details.token[0];
        if (tokenError.includes('expired')) {
          setTokenValid(false);
          setError('This password reset link has expired. Please request a new one.');
        } else if (tokenError.includes('already been used')) {
          setTokenValid(false);
          setError('This password reset link has already been used.');
        } else {
          setError(tokenError);
        }
      } else if (err.response?.data?.details) {
        const details = err.response.data.details;
        if (details.new_password) {
          setError(details.new_password[0]);
        } else if (details.confirm_password) {
          setError(details.confirm_password[0]);
        } else {
          setError(err.response.data.error || 'Password reset failed. Please try again.');
        }
      } else {
        setError(err.response?.data?.error || 'Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-black bg-opacity-60 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700 shadow-2xl">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Invalid Reset Link</h2>
            <p className="text-zinc-300 mb-6">{error}</p>
            <Link
              to="/forgot-password"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg inline-block transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-black bg-opacity-60 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700 shadow-2xl">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Password Reset Successful!</h2>
            <p className="text-zinc-300 mb-4">Your password has been updated successfully.</p>
            <p className="text-zinc-400 text-sm">Redirecting to login page...</p>
            <div className="mt-6">
              <Link 
                to="/login"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center transition-colors"
              >
                Continue to Login
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
          <h2 className="text-xl font-semibold text-white mb-2">Set New Password</h2>
          <p className="text-zinc-400">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-zinc-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="new_password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter new password"
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
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Confirm new password"
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
          </div>

          <button
            type="submit"
            disabled={loading || !formData.new_password || !formData.confirm_password}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-700 text-center">
          <p className="text-zinc-400 text-sm">
            Remember your password?{' '}
            <Link to="/login" className="text-red-400 hover:text-red-300 font-medium">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;