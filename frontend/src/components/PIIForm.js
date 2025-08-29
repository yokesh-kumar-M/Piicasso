import React, { useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import EmailVerificationBanner from './EmailVerificationBanner';
import {
  User, Calendar, Heart, Home, Film, Phone,
  Shield, Zap, Lock, Wifi, Database, Code,
  Activity, Map, Users, Globe, Crosshair, 
  MapPin, Search, Clock, Truck, Building,
  AlertCircle, ArrowRight, Mail, Settings
} from 'lucide-react';

const fields = [
  // IDENTITY_CORE
  { key: 'full_name', label: 'Target Name', icon: <User className="w-4 h-4" />, placeholder: 'Enter full name...', category: 'identity', risk: 'HIGH' },
  { key: 'birth_year', label: 'Birth Year', icon: <Calendar className="w-4 h-4" />, placeholder: 'YYYY format...', category: 'identity', risk: 'HIGH' },
  { key: 'gov_id', label: 'Gov Identity', icon: <Shield className="w-4 h-4" />, placeholder: 'National ID...', category: 'identity', risk: 'HIGH' },
  { key: 'mother_maiden', label: 'Mother Maiden', icon: <User className="w-4 h-4" />, placeholder: "Mother's maiden name...", category: 'identity', risk: 'HIGH' },
  { key: 'passport_id', label: 'Passport ID', icon: <Code className="w-4 h-4" />, placeholder: 'Passport number...', category: 'identity', risk: 'HIGH' },

  // SOCIAL_GRAPH
  { key: 'spouse_name', label: 'Spouse Name', icon: <Heart className="w-4 h-4" />, placeholder: 'Associated partner...', category: 'social', risk: 'HIGH' },
  { key: 'social_handles', label: 'Social Handle', icon: <Wifi className="w-4 h-4" />, placeholder: '@username...', category: 'social', risk: 'HIGH' },
  { key: 'relationship_status', label: 'Relationship Status', icon: <Heart className="w-4 h-4" />, placeholder: 'Single, Married...', category: 'social', risk: 'LOW' },
  { key: 'close_contacts', label: 'Close Contacts', icon: <Users className="w-4 h-4" />, placeholder: 'Frequent callers...', category: 'social', risk: 'MED' },
  { key: 'group_affiliations', label: 'Group Affiliation', icon: <Globe className="w-4 h-4" />, placeholder: 'Clubs, communities...', category: 'social', risk: 'LOW' },

  // GEO_INTEL
  { key: 'hometown', label: 'HomeTown', icon: <Home className="w-4 h-4" />, placeholder: 'Birth coordinates...', category: 'geo', risk: 'HIGH' },
  { key: 'last_location', label: 'Last Location', icon: <Map className="w-4 h-4" />, placeholder: 'Last seen at...', category: 'geo', risk: 'HIGH' },
  { key: 'travel_history', label: 'Travel History', icon: <Zap className="w-4 h-4" />, placeholder: 'Destinations...', category: 'geo', risk: 'MED' },
  { key: 'live_coordinates', label: 'Live Coordinates', icon: <Crosshair className="w-4 h-4" />, placeholder: 'Real-time location...', category: 'geo', risk: 'HIGH' },
  { key: 'frequent_places', label: 'Frequent Places', icon: <MapPin className="w-4 h-4" />, placeholder: 'Work, cafe, gym...', category: 'geo', risk: 'MED' },

  // BEHAVIOR_PATTERN
  { key: 'favourite_movies', label: 'Favourite Movie', icon: <Film className="w-4 h-4" />, placeholder: 'Content preferences...', category: 'behavioral', risk: 'LOW' },
  { key: 'shopping_sites', label: 'Shopping site', icon: <Database className="w-4 h-4" />, placeholder: 'Amazon, Flipkart...', category: 'behavioral', risk: 'MED' },
  { key: 'habit_patterns', label: 'Habits', icon: <Activity className="w-4 h-4" />, placeholder: 'Sleep, eat, gym...', category: 'behavioral', risk: 'MED' },
  { key: 'search_keywords', label: 'Search Keywords', icon: <Search className="w-4 h-4" />, placeholder: 'Recent searches...', category: 'behavioral', risk: 'MED' },
  { key: 'content_timing', label: 'Content Timing', icon: <Clock className="w-4 h-4" />, placeholder: 'Late night usage...', category: 'behavioral', risk: 'LOW' },

  // ASSET_REGISTRY
  { key: 'phone_suffix', label: 'Phone Suffix', icon: <Phone className="w-4 h-4" />, placeholder: 'Last 4 digits...', category: 'assets', risk: 'HIGH' },
  { key: 'bank_suffix', label: 'Bank Suffix', icon: <Database className="w-4 h-4" />, placeholder: 'Last 4 of bank...', category: 'assets', risk: 'HIGH' },
  { key: 'crypto_wallet', label: 'Crypto Wallet', icon: <Lock className="w-4 h-4" />, placeholder: 'Wallet address...', category: 'assets', risk: 'HIGH' },
  { key: 'vehicle_reg', label: 'Vehicle Reg.', icon: <Truck className="w-4 h-4" />, placeholder: 'License plate...', category: 'assets', risk: 'HIGH' },
  { key: 'property_id', label: 'Property ID', icon: <Building className="w-4 h-4" />, placeholder: 'Registry ID...', category: 'assets', risk: 'HIGH' },
];

const categories = [...new Set(fields.map(f => f.category))];

const PIIForm = () => {
  const { isAuthenticated, isEmailVerified, needsEmailVerification, user, loading: authLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => {
    // Convert comma-separated lists for certain fields
    const payload = { ...formData };
    if (payload.pet_names) {
      payload.pet_names = payload.pet_names.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (payload.favourite_movies) {
      payload.favourite_movies = payload.favourite_movies.split(',').map(s => s.trim()).filter(Boolean);
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitSuccess(false);

    if (!isAuthenticated) {
      setError('You must be logged in to submit PII.');
      navigate('/login');
      return;
    }

    if (!isEmailVerified) {
      setError('Email verification required. Please verify your email address before using this feature.');
      return;
    }

    const payload = buildPayload();
    if (!Object.values(payload).some(v => (Array.isArray(v) ? v.length : !!v))) {
      setError('Please fill at least one field.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/submit-pii/', payload);
      if (res.status === 201) {
        sessionStorage.setItem('generatedWordlist', JSON.stringify(res.data.wordlist));
        setSubmitSuccess(true);
        setTimeout(() => navigate('/result'), 1200);
      } else {
        setError(res.data?.error || 'Generation failed');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else if (err.response?.status === 403 && err.response?.data?.email_not_verified) {
        setError('Email verification required. Please verify your email address before using this feature.');
      } else {
        setError(err.response?.data?.error || err.message || 'Submission failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-red-500 text-xl animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-5xl font-bold text-red-600 mb-6 text-center drop-shadow-lg tracking-wide">PIIcasso</h1>
      
      {/* Email Verification Banner */}
      {needsEmailVerification && (
        <div className="max-w-4xl mx-auto mb-8">
          <EmailVerificationBanner showDismiss={false} />
        </div>
      )}

      {/* Access Restriction Notice for Non-Verified Users */}
      {isAuthenticated && !isEmailVerified && (
        <div className="max-w-4xl mx-auto mb-8 bg-red-900/20 border border-red-500 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
            <h2 className="text-xl font-semibold text-red-400">Access Restricted</h2>
          </div>
          <p className="text-red-200 mb-4">
            Email verification is required to access PIIcasso's intelligence features. This security measure ensures:
          </p>
          <ul className="text-red-200 text-sm space-y-1 mb-6 ml-4">
            <li>• Secure account access</li>
            <li>• Data integrity and privacy</li>
            <li>• Protection against unauthorized usage</li>
            <li>• Compliance with security protocols</li>
          </ul>
          <p className="text-red-300 text-sm mb-6">
            Please verify your email address to continue using the platform.
          </p>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {user?.email && (
              <div className="flex items-center space-x-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Check: {user.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <div className="text-red-400 mb-6 text-center max-w-4xl mx-auto bg-red-900/20 border border-red-500 rounded-lg p-3">{error}</div>}
      {submitSuccess && <div className="text-green-400 mb-6 text-center max-w-4xl mx-auto bg-green-900/20 border border-green-500 rounded-lg p-3">PII submitted successfully! Redirecting...</div>}
      
      {/* Form Fields - Disabled if email not verified */}
      <div className={`transition-opacity duration-300 ${!isEmailVerified ? 'opacity-50 pointer-events-none' : ''}`}>
        {categories.map(cat => (
          <div key={cat} className="mb-10 max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-red-400 capitalize">{cat}</h2>
            <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-red-800 scrollbar-track-zinc-900">
              {fields.filter(f => f.category === cat).map(field => (
                <div
                  key={field.key}
                  className="min-w-[280px] bg-gradient-to-br from-zinc-800 to-zinc-900 p-5 rounded-2xl shadow-lg hover:shadow-red-700/40 transition-all duration-300 border border-zinc-700 hover:scale-105 transform"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-red-600/20 p-2 rounded-full">{field.icon}</div>
                    <div className="text-lg font-medium">{field.label}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      field.risk === 'HIGH' ? 'bg-red-600/20 text-red-400' :
                      field.risk === 'MED' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-green-600/20 text-green-400'
                    }`}>
                      {field.risk}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    disabled={!isEmailVerified}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-12 text-center">
        <button
          onClick={handleSubmit}
          disabled={loading || !isAuthenticated || !isEmailVerified}
          className="bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 px-10 rounded-xl text-xl shadow-lg hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102 transform"
        >
          {loading ? 'Generating...' : 'Initiate PII Scan'}
        </button>
        
        {!isAuthenticated && (
          <p className="text-zinc-500 mt-4 text-sm">Please log in to submit PII data.</p>
        )}
        
        {isAuthenticated && !isEmailVerified && (
          <p className="text-red-400 mt-4 text-sm">Email verification required to proceed.</p>
        )}
      </div>
    </div>
  );
};

export default PIIForm;