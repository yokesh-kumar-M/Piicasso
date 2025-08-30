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
  AlertCircle, ArrowRight, Settings, Play
} from 'lucide-react';

const fields = [
  // IDENTITY_CORE
  { key: 'full_name', label: 'Target Name', icon: <User className="w-5 h-5" />, placeholder: 'Enter full name...', category: 'Identity Core', risk: 'HIGH' },
  { key: 'birth_year', label: 'Birth Year', icon: <Calendar className="w-5 h-5" />, placeholder: 'YYYY format...', category: 'Identity Core', risk: 'HIGH' },
  { key: 'gov_id', label: 'Gov Identity', icon: <Shield className="w-5 h-5" />, placeholder: 'National ID...', category: 'Identity Core', risk: 'HIGH' },
  { key: 'mother_maiden', label: 'Mother Maiden', icon: <User className="w-5 h-5" />, placeholder: "Mother's maiden name...", category: 'Identity Core', risk: 'HIGH' },
  { key: 'passport_id', label: 'Passport ID', icon: <Code className="w-5 h-5" />, placeholder: 'Passport number...', category: 'Identity Core', risk: 'HIGH' },

  // SOCIAL_GRAPH
  { key: 'spouse_name', label: 'Spouse Name', icon: <Heart className="w-5 h-5" />, placeholder: 'Associated partner...', category: 'Social Graph', risk: 'HIGH' },
  { key: 'social_handles', label: 'Social Handle', icon: <Wifi className="w-5 h-5" />, placeholder: '@username...', category: 'Social Graph', risk: 'HIGH' },
  { key: 'relationship_status', label: 'Relationship Status', icon: <Heart className="w-5 h-5" />, placeholder: 'Single, Married...', category: 'Social Graph', risk: 'LOW' },
  { key: 'close_contacts', label: 'Close Contacts', icon: <Users className="w-5 h-5" />, placeholder: 'Frequent callers...', category: 'Social Graph', risk: 'MED' },
  { key: 'group_affiliations', label: 'Group Affiliation', icon: <Globe className="w-5 h-5" />, placeholder: 'Clubs, communities...', category: 'Social Graph', risk: 'LOW' },

  // GEO_INTEL
  { key: 'hometown', label: 'HomeTown', icon: <Home className="w-5 h-5" />, placeholder: 'Birth coordinates...', category: 'Geographic Intelligence', risk: 'HIGH' },
  { key: 'last_location', label: 'Last Location', icon: <Map className="w-5 h-5" />, placeholder: 'Last seen at...', category: 'Geographic Intelligence', risk: 'HIGH' },
  { key: 'travel_history', label: 'Travel History', icon: <Zap className="w-5 h-5" />, placeholder: 'Destinations...', category: 'Geographic Intelligence', risk: 'MED' },
  { key: 'live_coordinates', label: 'Live Coordinates', icon: <Crosshair className="w-5 h-5" />, placeholder: 'Real-time location...', category: 'Geographic Intelligence', risk: 'HIGH' },
  { key: 'frequent_places', label: 'Frequent Places', icon: <MapPin className="w-5 h-5" />, placeholder: 'Work, cafe, gym...', category: 'Geographic Intelligence', risk: 'MED' },

  // BEHAVIOR_PATTERN
  { key: 'favourite_movies', label: 'Favourite Movie', icon: <Film className="w-5 h-5" />, placeholder: 'Content preferences...', category: 'Behavioral Patterns', risk: 'LOW' },
  { key: 'shopping_sites', label: 'Shopping site', icon: <Database className="w-5 h-5" />, placeholder: 'Amazon, Flipkart...', category: 'Behavioral Patterns', risk: 'MED' },
  { key: 'habit_patterns', label: 'Habits', icon: <Activity className="w-5 h-5" />, placeholder: 'Sleep, eat, gym...', category: 'Behavioral Patterns', risk: 'MED' },
  { key: 'search_keywords', label: 'Search Keywords', icon: <Search className="w-5 h-5" />, placeholder: 'Recent searches...', category: 'Behavioral Patterns', risk: 'MED' },
  { key: 'content_timing', label: 'Content Timing', icon: <Clock className="w-5 h-5" />, placeholder: 'Late night usage...', category: 'Behavioral Patterns', risk: 'LOW' },

  // ASSET_REGISTRY
  { key: 'phone_suffix', label: 'Phone Suffix', icon: <Phone className="w-5 h-5" />, placeholder: 'Last 4 digits...', category: 'Asset Registry', risk: 'HIGH' },
  { key: 'bank_suffix', label: 'Bank Suffix', icon: <Database className="w-5 h-5" />, placeholder: 'Last 4 of bank...', category: 'Asset Registry', risk: 'HIGH' },
  { key: 'crypto_wallet', label: 'Crypto Wallet', icon: <Lock className="w-5 h-5" />, placeholder: 'Wallet address...', category: 'Asset Registry', risk: 'HIGH' },
  { key: 'vehicle_reg', label: 'Vehicle Reg.', icon: <Truck className="w-5 h-5" />, placeholder: 'License plate...', category: 'Asset Registry', risk: 'HIGH' },
  { key: 'property_id', label: 'Property ID', icon: <Building className="w-5 h-5" />, placeholder: 'Registry ID...', category: 'Asset Registry', risk: 'HIGH' },
];

const categories = [...new Set(fields.map(f => f.category))];

const PIIForm = () => {
  const { isAuthenticated, isEmailVerified, needsEmailVerification, loading: authLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl font-medium">Loading PIIcasso...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black"></div>
        <div className="relative px-8 py-16 text-center">
          <h1 className="text-7xl font-black text-white mb-4 tracking-tight">
            PII<span className="text-red-600">casso</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Advanced intelligence gathering platform for security professionals
          </p>
        </div>
      </div>

      <div className="px-8 pb-16">
        {/* Email Verification Banner */}
        {needsEmailVerification && (
          <div className="max-w-7xl mx-auto mb-8">
            <EmailVerificationBanner showDismiss={false} />
          </div>
        )}

        {/* Access Restriction for Non-Verified Users */}
        {isAuthenticated && !isEmailVerified && (
          <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-400 mr-4" />
              <h2 className="text-2xl font-bold text-red-400">Access Restricted</h2>
            </div>
            <p className="text-red-200 text-lg mb-6">
              Email verification required to access intelligence features.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Settings className="w-5 h-5" />
                <span>Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="max-w-7xl mx-auto mb-8 bg-red-900/20 border border-red-500 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="max-w-7xl mx-auto mb-8 bg-green-900/20 border border-green-500 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-green-300">Intelligence scan initiated successfully! Redirecting...</span>
            </div>
          </div>
        )}

        {/* Netflix-style Form Categories */}
        <div className={`max-w-7xl mx-auto transition-opacity duration-500 ${!isEmailVerified ? 'opacity-40 pointer-events-none' : ''}`}>
          {categories.map((category, categoryIndex) => (
            <div key={category} className="mb-12">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-white mr-4">{category}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-600 to-transparent"></div>
              </div>
              
              {/* Netflix-style Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {fields.filter(f => f.category === category).map((field, index) => (
                  <div
                    key={field.key}
                    className="group relative bg-zinc-900/60 hover:bg-zinc-800/80 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm border border-zinc-800 hover:border-zinc-700"
                    onMouseEnter={() => setHoveredCard(field.key)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Risk Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        field.risk === 'HIGH' ? 'bg-red-600/20 text-red-400' :
                        field.risk === 'MED' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-green-600/20 text-green-400'
                      }`}>
                        {field.risk}
                      </div>
                    </div>

                    {/* Icon and Label */}
                    <div className="flex items-center mb-4">
                      <div className="bg-red-600/10 p-3 rounded-lg mr-3 group-hover:bg-red-600/20 transition-colors">
                        {field.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                          {field.label}
                        </h3>
                      </div>
                    </div>

                    {/* Input Field */}
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      disabled={!isEmailVerified}
                      className="w-full bg-black/50 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {/* Hover Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Netflix-style Submit Button */}
        <div className="max-w-7xl mx-auto text-center mt-16">
          <button
            onClick={handleSubmit}
            disabled={loading || !isAuthenticated || !isEmailVerified}
            className="group relative bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-bold py-6 px-12 rounded-xl text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-600/25 disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="flex items-center justify-center space-x-3">
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Intelligence...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Initiate Intelligence Scan</span>
                </>
              )}
            </div>
            
            {/* Button Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-red-700 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
          
          {!isAuthenticated && (
            <p className="text-zinc-500 mt-6 text-lg">Please log in to access intelligence features.</p>
          )}
          
          {isAuthenticated && !isEmailVerified && (
            <p className="text-red-400 mt-6 text-lg">Email verification required to proceed.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PIIForm;