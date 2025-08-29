import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/password-reset/', {
        email: email.trim()
      });

      if (response.status === 200) {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Password reset request failed:', err);
      setError(err.response?.data?.error || 'Failed to send password reset email. Please try again.');
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
            <h2 className="text-2xl font-bold text-green-400 mb-2">Check Your Email</h2>
            <p className="text-zinc-300 mb-6">
              If an account with this email exists and is verified, we've sent you a password reset link.
            </p>
            <p className="text-zinc-400 text-sm mb-6">
              The reset link will expire in 1 hour for security reasons.
            </p>
            <Link
              to="/login"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
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
          <h2 className="text-xl font-semibold text-white mb-2">Reset Your Password</h2>
          <p className="text-zinc-400">Enter your email address and we'll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Reset Link
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

export default ForgotPasswordPage;