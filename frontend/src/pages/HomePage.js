// === File: src/pages/HomePage.js ===

import React, { useState, useContext } from 'react'; // Added useContext
import axios from 'axios'; // Import axios
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

import {
  User, Calendar, Heart, Home, Film, Phone,
  Shield, Zap, Lock, Wifi, Database, Code,
  Activity, Map
} from 'lucide-react';
import { motion } from 'framer-motion';

const fields = [
  // IDENTITY_CORE
  { key: 'full_name', label: 'TARGET_NAME', icon: <User className="w-4 h-4" />, placeholder: 'Enter full name...', category: 'identity', risk: 'HIGH' },
  { key: 'birth_year', label: 'BIRTH_YEAR', icon: <Calendar className="w-4 h-4" />, placeholder: 'YYYY format...', category: 'identity', risk: 'HIGH' },
  { key: 'gov_id', label: 'GOV_IDENTITY_TAG', icon: <Shield className="w-4 h-4" />, placeholder: 'National ID...', category: 'identity', risk: 'HIGH' },
  { key: 'mother_maiden', label: 'MAIDEN_SOURCE_KEY', icon: <User className="w-4 h-4" />, placeholder: "Mother's maiden name...", category: 'identity', risk: 'HIGH' },
  { key: 'passport_id', label: 'PASSPORT_HASH', icon: <Code className="w-4 h-4" />, placeholder: 'Passport number...', category: 'identity', risk: 'HIGH' },

  // SOCIAL_GRAPH
  { key: 'spouse_name', label: 'PARTNER_ID', icon: <Heart className="w-4 h-4" />, placeholder: 'Associated partner...', category: 'social', risk: 'HIGH' },
  { key: 'social_handles', label: 'SOCIAL_PORTS', icon: <Wifi className="w-4 h-4" />, placeholder: '@username...', category: 'social', risk: 'HIGH' },
  { key: 'relationship_status', label: 'BOND_STATUS', icon: <Heart className="w-4 h-4" />, placeholder: 'Single, Married...', category: 'social', risk: 'LOW' },

  // GEO_INTEL
  { key: 'hometown', label: 'ORIGIN_LOCATION', icon: <Home className="w-4 h-4" />, placeholder: 'Birth coordinates...', category: 'geo', risk: 'HIGH' },
  { key: 'last_location', label: 'EXIT_VECTOR', icon: <Map className="w-4 h-4" />, placeholder: 'Last seen at...', category: 'geo', risk: 'HIGH' },
  { key: 'travel_history', label: 'FLIGHT_MANIFEST', icon: <Zap className="w-4 h-4" />, placeholder: 'Destinations...', category: 'geo', risk: 'MED' },

  // BEHAVIOR_PATTERN
  { key: 'favourite_movies', label: 'MEDIA_PROFILE', icon: <Film className="w-4 h-4" />, placeholder: 'Content preferences...', category: 'behavioral', risk: 'LOW' },
  { key: 'shopping_sites', label: 'ECOM_BEHAVIOR', icon: <Database className="w-4 h-4" />, placeholder: 'Amazon, Flipkart...', category: 'behavioral', risk: 'MED' },
  { key: 'habit_patterns', label: 'ROUTINE_VECTOR', icon: <Activity className="w-4 h-4" />, placeholder: 'Sleep, eat, gym...', category: 'behavioral', risk: 'MED' },

  // ASSET_REGISTRY
  { key: 'phone_suffix', label: 'COMM_ENDPOINT', icon: <Phone className="w-4 h-4" />, placeholder: 'Last 4 digits...', category: 'assets', risk: 'HIGH' },
  { key: 'bank_suffix', label: 'BANK_LINK_TAIL', icon: <Database className="w-4 h-4" />, placeholder: 'Last 4 of bank...', category: 'assets', risk: 'HIGH' },
  { key: 'crypto_wallet', label: 'WALLET_HASH', icon: <Lock className="w-4 h-4" />, placeholder: 'Wallet address...', category: 'assets', risk: 'HIGH' },
];

const HomePage = () => {
  const { token } = useContext(AuthContext); // Get token from AuthContext
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false); // New state for success message
  const navigate = useNavigate(); // Initialize useNavigate
  const categories = [...new Set(fields.map(f => f.category))];

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false); // Reset success message
    try {
      if (!token) {
        // This check is primary. If no token, don't even try to send.
        throw new Error('Authentication token not found. Please log in.');
      }

      // Filter out empty values from formData before sending
      const filteredFormData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value !== '')
      );

      // ✅ Replace with your actual backend PII submission endpoint
      const response = await axios.post('http://127.0.0.1:8000/api/pii-submit/', filteredFormData, {
        headers: {
          'Authorization': `Bearer ${token}`, // Use token from AuthContext
          'Content-Type': 'application/json',
        },
      });
      console.log('PII submitted successfully:', response.data);
      setSubmitSuccess(true); // Set success message
      setFormData({}); // Clear form after successful submission (optional, depending on UX)
      // ✅ Navigate to dashboard page on success after a short delay for user to see success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500); // Navigate after 1.5 seconds
    } catch (error) {
      console.error('PII submission failed:', error.response?.data || error.message);
      // More specific error message handling
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Failed to submit PII. Please check your input and try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      {/* Added drop-shadow-lg and tracking-wide for the main title */}
      <h1 className="text-5xl font-bold text-red-600 mb-12 text-center drop-shadow-lg tracking-wide">PIIcasso</h1>

      {categories.map(cat => (
        <div key={cat} className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-red-400">{cat}</h2>

          {/* Added scrollbar-track-zinc-900 for a consistent scrollbar */}
          <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-red-800 scrollbar-track-zinc-900">
            {fields.filter(f => f.category === cat).map(field => (
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                key={field.key}
                // Changed from-gray-800 to-gray-900 to from-zinc-800 to-zinc-900 for consistency, added border
                className="min-w-[280px] bg-gradient-to-br from-zinc-800 to-zinc-900 p-5 rounded-2xl shadow-lg hover:shadow-red-700/40 transition-all duration-300 border border-zinc-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-red-600/20 p-2 rounded-full">{field.icon}</div>
                  <div className="text-lg font-medium">{field.label}</div>
                </div>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  // Refined input styles for consistency, added focus:border-red-500, placeholder-zinc-500
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500 text-white"
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Submit Button Section */}
      <div className="mt-12 text-center">
        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          // Disable button if submitting, or if no token is available
          disabled={isSubmitting || !token}
          className="bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 px-10 rounded-xl text-xl shadow-lg hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Transmitting Data...' : 'Initiate PII Scan'}
        </motion.button>
        {submitError && (
          <p className="text-red-400 mt-4 text-sm font-medium">{submitError}</p>
        )}
        {submitSuccess && (
          <p className="text-green-400 mt-4 text-sm font-medium">PII submitted successfully! Redirecting...</p>
        )}
        {!token && ( // Message if not authenticated, ensuring users know why they can't submit
          <p className="text-zinc-500 mt-4 text-sm">Please log in to submit PII data.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;