import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { CheckCircle, XCircle, RefreshCw, Mail, AlertCircle } from 'lucide-react';

const EmailTroubleshooting = ({ email }) => (
  <div className="mt-6 bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
    <h3 className="text-yellow-400 font-semibold mb-3">📧 Email Not Received?</h3>
    <div className="text-yellow-200 text-sm space-y-2">
      <p><strong>1. Check Spam/Junk Folder</strong> - Gmail, Yahoo often filter verification emails</p>
      <p><strong>2. Wait 2-3 minutes</strong> - Email servers can be slow</p>
      <p><strong>3. Check email address:</strong> <code className="bg-yellow-800 px-1 rounded">{email}</code></p>
      <p><strong>4. Add to Safe Senders:</strong> noreply@piicasso.com</p>
      <p><strong>5. Try different email:</strong> Gmail, Yahoo, Outlook work best</p>
    </div>
  </div>
);
const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    const verifyEmail = async (verificationToken) => {
      try {
        const response = await axiosInstance.post('/verify-email/', {
          token: verificationToken
        });

        if (response.status === 200) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully!');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { message: 'Email verified! You can now log in.' }
            });
          }, 3000);
        }
      } catch (error) {
        console.error('Email verification failed:', error);
        
        if (error.response?.data?.details?.token) {
          const tokenError = error.response.data.details.token[0];
          if (tokenError.includes('expired')) {
            setStatus('expired');
            setMessage('This verification link has expired. Please request a new one.');
          } else if (tokenError.includes('already been used')) {
            setStatus('error');
            setMessage('This verification link has already been used.');
          } else {
            setStatus('error');
            setMessage(tokenError);
          }
        } else {
          setStatus('error');
          setMessage(error.response?.data?.error || 'Email verification failed. Please try again.');
        }
      }
    };

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
    }
  }, [token, navigate]); // Add navigate to dependencies

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const response = await axiosInstance.post('/resend-verification/', {
        email: resendEmail
      });

      if (response.status === 200) {
        alert('Verification email sent! Please check your inbox.');
        setResendEmail('');
      }
    } catch (error) {
      console.error('Resend verification failed:', error);
      alert(error.response?.data?.error || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Your Email</h2>
            <p className="text-zinc-400">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Email Verified!</h2>
            <p className="text-zinc-300 mb-4">{message}</p>
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
        );

      case 'expired':
        return (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Link Expired</h2>
            <p className="text-zinc-300 mb-6">{message}</p>
            
            <div className="bg-zinc-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Request New Verification Email</h3>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                  {isResending ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Mail className="w-4 h-4 mr-1" />
                  )}
                  {isResending ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </div>
            <EmailTroubleshooting email={resendEmail} />
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h2>
            <p className="text-zinc-300 mb-6">{message}</p>
            
            <div className="space-y-4">
              <Link
                to="/register"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg inline-block transition-colors"
              >
                Create New Account
              </Link>
              
              <div className="bg-zinc-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Or Request New Verification Email</h3>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                  >
                    {isResending ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Mail className="w-4 h-4 mr-1" />
                    )}
                    {isResending ? 'Sending...' : 'Resend'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-black bg-opacity-60 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">PIIcasso</h1>
          <p className="text-zinc-400">Email Verification</p>
        </div>

        {renderContent()}

        <div className="mt-8 pt-6 border-t border-zinc-700 text-center">
          <p className="text-zinc-500 text-sm">
            Need help? Contact support or{' '}
            <Link to="/login" className="text-red-400 hover:text-red-300">
              return to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;