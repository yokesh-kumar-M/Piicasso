// frontend/src/components/EmailVerificationBanner.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { Mail, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

const EmailVerificationBanner = ({ showDismiss = false }) => {
  const { user, isEmailVerified, refreshUserProfile } = useContext(AuthContext);
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error'

  // Don't show banner if email is verified or user is not logged in
  if (!user || isEmailVerified || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    setMessage('');
    
    try {
      const response = await axiosInstance.post('/resend-verification/', {
        email: user.email
      });
      
      if (response.status === 200) {
        setMessage('Verification email sent! Please check your inbox.');
        setMessageType('success');
        
        // Clear message after 5 seconds
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 5000);
      }
    } catch (error) {
      console.error('Resend verification failed:', error);
      setMessage(error.response?.data?.error || 'Failed to send verification email. Please try again.');
      setMessageType('error');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerificationStatus = async () => {
    try {
      // Refresh user profile to check if verification status changed
      await refreshUserProfile();
      
      // If still not verified, show a message
      setTimeout(() => {
        if (!isEmailVerified) {
          setMessage('Email not yet verified. Please check your inbox and click the verification link.');
          setMessageType('error');
          
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 5000);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to check verification status:', error);
    }
  };

  return (
    <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-yellow-400">
              Email Verification Required
            </h3>
            {showDismiss && (
              <button
                onClick={() => setIsDismissed(true)}
                className="text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <p className="text-yellow-200 text-sm mt-1">
            Please verify your email address ({user.email}) to access all features.
          </p>
          
          {message && (
            <div className={`mt-2 p-2 rounded text-xs flex items-center ${
              messageType === 'success' 
                ? 'bg-green-900/30 text-green-300 border border-green-700' 
                : 'bg-red-900/30 text-red-300 border border-red-700'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              )}
              {message}
            </div>
          )}
          
          <div className="flex items-center space-x-4 mt-3">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 px-3 rounded transition-colors flex items-center"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3 mr-1" />
                  Resend Email
                </>
              )}
            </button>
            
            <button
              onClick={handleCheckVerificationStatus}
              className="text-yellow-400 hover:text-yellow-300 text-xs font-medium py-1.5 px-2 rounded transition-colors flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Check Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;