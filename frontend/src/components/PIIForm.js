import React, { useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  User, Calendar, Heart, Home, Film, Phone, Shield, Zap, Lock, 
  Wifi, Database, Code, Activity, Map, Users, Globe, Crosshair, 
  MapPin, Search, Clock, Truck, Building, ChevronRight, 
  ChevronLeft, AlertCircle, CheckCircle, Info, Eye, EyeOff
} from 'lucide-react';

const fields = [
  // IDENTITY_CORE - Highest priority
  { key: 'full_name', label: 'Full Name', icon: <User className="w-4 h-4" />, placeholder: 'John Smith', category: 'identity', risk: 'HIGH', priority: 1, description: 'Primary target identification' },
  { key: 'birth_year', label: 'Birth Year', icon: <Calendar className="w-4 h-4" />, placeholder: '1985', category: 'identity', risk: 'HIGH', priority: 1, description: 'Common password component' },
  { key: 'phone_suffix', label: 'Phone Last 4', icon: <Phone className="w-4 h-4" />, placeholder: '1234', category: 'identity', risk: 'HIGH', priority: 1, description: 'Frequently used in passwords' },
  { key: 'gov_id', label: 'Gov Identity', icon: <Shield className="w-4 h-4" />, placeholder: 'National ID...', category: 'identity', risk: 'HIGH', priority: 1, description: 'Government identification' },
  { key: 'mother_maiden', label: 'Mother Maiden', icon: <User className="w-4 h-4" />, placeholder: "Mother's maiden name...", category: 'identity', risk: 'HIGH', priority: 1, description: 'Security question answer' },
  { key: 'passport_id', label: 'Passport ID', icon: <Code className="w-4 h-4" />, placeholder: 'Passport number...', category: 'identity', risk: 'HIGH', priority: 1, description: 'Travel document ID' },
  
  // PERSONAL_CONNECTIONS - High priority
  { key: 'pet_names', label: 'Pet Names', icon: <Heart className="w-4 h-4" />, placeholder: 'Buddy, Luna', category: 'personal', risk: 'HIGH', priority: 2, description: 'Very common password base (comma-separated)' },
  { key: 'spouse_name', label: 'Spouse/Partner', icon: <Heart className="w-4 h-4" />, placeholder: 'Sarah', category: 'personal', risk: 'HIGH', priority: 2, description: 'Loved ones often used in passwords' },
  { key: 'childhood_nickname', label: 'Childhood Nickname', icon: <User className="w-4 h-4" />, placeholder: 'Johnny', category: 'personal', risk: 'HIGH', priority: 2, description: 'Personal identifier in passwords' },
  { key: 'social_handles', label: 'Social Handle', icon: <Wifi className="w-4 h-4" />, placeholder: '@username...', category: 'personal', risk: 'HIGH', priority: 2, description: 'Online identity' },
  { key: 'relationship_status', label: 'Relationship Status', icon: <Heart className="w-4 h-4" />, placeholder: 'Single, Married...', category: 'personal', risk: 'LOW', priority: 4, description: 'Personal status' },
  { key: 'close_contacts', label: 'Close Contacts', icon: <Users className="w-4 h-4" />, placeholder: 'Frequent callers...', category: 'personal', risk: 'MED', priority: 3, description: 'Important relationships' },
  { key: 'group_affiliations', label: 'Group Affiliation', icon: <Globe className="w-4 h-4" />, placeholder: 'Clubs, communities...', category: 'personal', risk: 'LOW', priority: 4, description: 'Social groups' },

  // LOCATION_DATA - Medium priority
  { key: 'hometown', label: 'Hometown', icon: <Home className="w-4 h-4" />, placeholder: 'Chicago', category: 'location', risk: 'MED', priority: 3, description: 'Geographic password component' },
  { key: 'school_name', label: 'School Name', icon: <Building className="w-4 h-4" />, placeholder: 'Lincoln High', category: 'location', risk: 'MED', priority: 3, description: 'Educational institution reference' },
  { key: 'last_location', label: 'Last Location', icon: <Map className="w-4 h-4" />, placeholder: 'Last seen at...', category: 'location', risk: 'HIGH', priority: 2, description: 'Recent whereabouts' },
  { key: 'travel_history', label: 'Travel History', icon: <Zap className="w-4 h-4" />, placeholder: 'Destinations...', category: 'location', risk: 'MED', priority: 3, description: 'Travel patterns' },
  { key: 'live_coordinates', label: 'Live Coordinates', icon: <Crosshair className="w-4 h-4" />, placeholder: 'Real-time location...', category: 'location', risk: 'HIGH', priority: 1, description: 'Current location data' },
  { key: 'frequent_places', label: 'Frequent Places', icon: <MapPin className="w-4 h-4" />, placeholder: 'Work, cafe, gym...', category: 'location', risk: 'MED', priority: 3, description: 'Regular locations' },

  // INTERESTS - Lower priority but useful
  { key: 'favourite_movies', label: 'Favorite Movies', icon: <Film className="w-4 h-4" />, placeholder: 'Inception, Matrix', category: 'interests', risk: 'LOW', priority: 4, description: 'Entertainment preferences (comma-separated)' },
  { key: 'sports_team', label: 'Favorite Team', icon: <Activity className="w-4 h-4" />, placeholder: 'Lakers', category: 'interests', risk: 'LOW', priority: 4, description: 'Sports team loyalty' },
  { key: 'first_car_model', label: 'First Car', icon: <Truck className="w-4 h-4" />, placeholder: 'Honda Civic', category: 'interests', risk: 'LOW', priority: 4, description: 'Memorable possession' },
  { key: 'shopping_sites', label: 'Shopping Sites', icon: <Database className="w-4 h-4" />, placeholder: 'Amazon, Flipkart...', category: 'interests', risk: 'MED', priority: 3, description: 'Online shopping preferences' },
  { key: 'habit_patterns', label: 'Habits', icon: <Activity className="w-4 h-4" />, placeholder: 'Sleep, eat, gym...', category: 'interests', risk: 'MED', priority: 3, description: 'Daily routines' },
  { key: 'search_keywords', label: 'Search Keywords', icon: <Search className="w-4 h-4" />, placeholder: 'Recent searches...', category: 'interests', risk: 'MED', priority: 3, description: 'Search patterns' },
  { key: 'content_timing', label: 'Content Timing', icon: <Clock className="w-4 h-4" />, placeholder: 'Late night usage...', category: 'interests', risk: 'LOW', priority: 4, description: 'Usage patterns' },
  { key: 'favourite_food', label: 'Favourite Food', icon: <Heart className="w-4 h-4" />, placeholder: 'Pizza, Sushi...', category: 'interests', risk: 'LOW', priority: 4, description: 'Food preferences' },

  // PROFESSIONAL - Medium priority
  { key: 'employer_name', label: 'Employer', icon: <Building className="w-4 h-4" />, placeholder: 'TechCorp Inc', category: 'professional', risk: 'MED', priority: 3, description: 'Workplace identifier' },
  { key: 'social_media_handle', label: 'Social Handle', icon: <Wifi className="w-4 h-4" />, placeholder: '@johnsmith', category: 'professional', risk: 'MED', priority: 3, description: 'Online identity marker' },

  // ASSET_REGISTRY - High risk
  { key: 'bank_suffix', label: 'Bank Last 4', icon: <Database className="w-4 h-4" />, placeholder: 'Last 4 of bank...', category: 'assets', risk: 'HIGH', priority: 1, description: 'Financial identifier' },
  { key: 'crypto_wallet', label: 'Crypto Wallet', icon: <Lock className="w-4 h-4" />, placeholder: 'Wallet address...', category: 'assets', risk: 'HIGH', priority: 1, description: 'Digital asset address' },
  { key: 'vehicle_reg', label: 'Vehicle Registration', icon: <Truck className="w-4 h-4" />, placeholder: 'License plate...', category: 'assets', risk: 'HIGH', priority: 2, description: 'Vehicle identifier' },
  { key: 'property_id', label: 'Property ID', icon: <Building className="w-4 h-4" />, placeholder: 'Registry ID...', category: 'assets', risk: 'HIGH', priority: 2, description: 'Real estate identifier' },
  { key: 'plate_number_partial', label: 'Plate Number Partial', icon: <Truck className="w-4 h-4" />, placeholder: 'ABC-123...', category: 'assets', risk: 'HIGH', priority: 2, description: 'Vehicle plate reference' }
];

const categories = [
  { id: 'identity', name: 'Core Identity', description: 'Basic identifying information', color: 'red' },
  { id: 'personal', name: 'Personal Connections', description: 'Family, pets, relationships', color: 'pink' },
  { id: 'location', name: 'Places & Locations', description: 'Geographic and institutional ties', color: 'blue' },
  { id: 'interests', name: 'Interests & Hobbies', description: 'Entertainment and personal preferences', color: 'green' },
  { id: 'professional', name: 'Professional Life', description: 'Work and online presence', color: 'purple' },
  { id: 'assets', name: 'Assets & Registry', description: 'Financial and property information', color: 'yellow' }
];

const EnhancedPIIForm = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formMode, setFormMode] = useState('guided'); // 'guided' or 'advanced'
  const [validationErrors, setValidationErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validateField = (key, value) => {
    const field = fields.find(f => f.key === key);
    if (!field) return null;

    if (key === 'birth_year' && value) {
      const year = parseInt(value);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        return 'Please enter a valid birth year';
      }
    }
    
    if (key === 'phone_suffix' && value) {
      if (!/^\d{3,4}$/.test(value)) {
        return 'Please enter 3-4 digits';
      }
    }

    return null;
  };

  const validateCurrentStep = () => {
    const currentCategory = categories[currentStep];
    const categoryFields = fields.filter(f => f.category === currentCategory.id);
    const errors = {};
    
    categoryFields.forEach(field => {
      const value = formData[field.key];
      const error = validateField(field.key, value);
      if (error) errors[field.key] = error;
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const payload = { ...formData };
    // Convert comma-separated lists
    ['pet_names', 'favourite_movies'].forEach(key => {
      if (payload[key]) {
        payload[key] = payload[key].split(',').map(s => s.trim()).filter(Boolean);
      }
    });
    return payload;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    if (!isAuthenticated) {
      setError('You must be logged in to submit PII.');
      navigate('/login');
      return;
    }

    const payload = buildPayload();
    const nonEmptyFields = Object.values(payload).filter(v => 
      Array.isArray(v) ? v.length > 0 : !!v
    );

    if (nonEmptyFields.length === 0) {
      setError('Please fill at least one field.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('submit-pii/', payload);
      if (res.status === 201) {
        sessionStorage.setItem('generatedWordlist', JSON.stringify(res.data.wordlist));
        setSuccess('PII processed successfully! Redirecting to results...');
        setTimeout(() => navigate('/result'), 2000);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setError(err.response?.data?.error || 'Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (formMode === 'guided' && currentStep < categories.length - 1) {
      if (validateCurrentStep()) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (formMode === 'guided' && currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getFilledFieldsCount = () => {
    return Object.values(formData).filter(v => 
      Array.isArray(v) ? v.length > 0 : !!v
    ).length;
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'HIGH': return 'text-red-400 bg-red-500/20';
      case 'MED': return 'text-yellow-400 bg-yellow-500/20';
      case 'LOW': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-red-500 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header */}
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-5xl font-bold text-red-500 mb-4 tracking-wide">PIIcasso</h1>
        <p className="text-gray-400 text-lg">Password Intelligence Engine</p>
        
        {/* Progress indicator */}
        <div className="mt-6 flex justify-center items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">{getFilledFieldsCount()} fields completed</span>
          </div>
          {formMode === 'guided' && (
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {categories.length}
            </div>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-800 rounded-lg p-1 flex">
          <button
            onClick={() => setFormMode('guided')}
            className={`px-4 py-2 rounded text-sm transition-all ${
              formMode === 'guided' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Guided Mode
          </button>
          <button
            onClick={() => setFormMode('advanced')}
            className={`px-4 py-2 rounded text-sm transition-all ${
              formMode === 'advanced' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Advanced Mode
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-4xl mx-auto mb-6 px-6">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-4xl mx-auto mb-6 px-6">
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {formMode === 'guided' ? (
          // Guided Mode - Step by Step
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-white mb-2">
                {categories[currentStep].name}
              </h2>
              <p className="text-gray-400">{categories[currentStep].description}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fields
                .filter(f => f.category === categories[currentStep].id)
                .map(field => (
                  <div
                    key={field.key}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-red-500/20 p-2 rounded-lg">{field.icon}</div>
                      <div>
                        <h3 className="text-lg font-medium">{field.label}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(field.risk)}`}>
                          {field.risk} PRIORITY
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4">{field.description}</p>
                    
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full bg-black/50 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500 text-white transition-all ${
                        validationErrors[field.key] ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    
                    {validationErrors[field.key] && (
                      <p className="text-red-400 text-sm mt-2">{validationErrors[field.key]}</p>
                    )}
                  </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentStep === categories.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isAuthenticated}
                  className="flex items-center space-x-2 px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-all"
                >
                  {loading ? 'Processing...' : 'Generate Wordlist'}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          // Advanced Mode - All fields visible
          <div className="space-y-8">
            {categories.map(category => (
              <div key={category.id} className="space-y-4">
                <h2 className="text-2xl font-semibold text-white border-l-4 border-red-500 pl-4">
                  {category.name}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fields
                    .filter(f => f.category === category.id)
                    .map(field => (
                      <div
                        key={field.key}
                        className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 hover:border-red-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-red-500/20 p-1.5 rounded">{field.icon}</div>
                          <span className="text-sm font-medium">{field.label}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getRiskColor(field.risk)}`}>
                            {field.risk}
                          </span>
                        </div>
                        
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-gray-500 text-white text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {/* Submit Button */}
            <div className="text-center pt-8">
              <button
                onClick={handleSubmit}
                disabled={loading || !isAuthenticated}
                className="px-12 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-lg font-semibold transition-all"
              >
                {loading ? 'Processing PII Data...' : 'Generate Password Wordlist'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPIIForm;