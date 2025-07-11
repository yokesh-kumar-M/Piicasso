import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext'; // Assuming AuthContext is here
import { ChevronDown, ChevronUp, BarChart2, TrendingUp, Users, Terminal } from 'lucide-react'; // Added Terminal icon for PII data preview

// Utility function to format PII data for display
const formatPiiForDisplay = (piiData) => {
  if (!piiData || typeof piiData !== 'object') return 'N/A';
  const entries = Object.entries(piiData);
  if (entries.length === 0) return 'No PII captured';

  // Display top 3 key-value pairs, or all if less than 3
  const displayCount = Math.min(entries.length, 3);
  const parts = entries.slice(0, displayCount).map(([key, value]) => `${key}: "${String(value).slice(0, 20)}${String(value).length > 20 ? '...' : ''}"`);
  return `{ ${parts.join(', ')} }${entries.length > 3 ? '...' : ''}`;
};

const DashboardPage = () => {
  // ✅ Changed authTokens to token, and logoutUser to logout
  const { token, logout, loading: authLoading } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true); // Local loading state for data fetch
  const [error, setError] = useState(null);
  const [expandedEntryId, setExpandedEntryId] = useState(null); // State for expanded row

  // Function to toggle expansion of a history entry
  const toggleExpand = (id) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true); // Start local loading
      setError(null);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/history/', {
          headers: {
            'Authorization': `Bearer ${token}`, // ✅ Use 'token' directly
            'Content-Type': 'application/json',
          },
        });
        setHistory(response.data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        if (err.response && err.response.status === 401) {
          // Token expired or invalid, attempt to logout
          alert('Session expired. Please log in again.');
          logout(); // ✅ Use 'logout' from context
        } else {
          setError(err.message || 'An unknown error occurred.');
        }
      } finally {
        setLoading(false); // End local loading
      }
    };

    // Only fetch if token is available and authentication is not globally loading
    if (token && !authLoading) {
      fetchHistory();
    } else if (!token && !authLoading) { // If no token after auth loading, show message
      setLoading(false);
      setError('Authentication required. Please log in.');
    }
  // ✅ Depend on 'token' and 'logout' from context
  }, [token, logout, authLoading]);

  // Framer Motion variants for section and item animations
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Combine local loading with authLoading for a comprehensive loading state
  const overallLoading = loading || authLoading;

  return (
    <div className="min-h-screen bg-black text-white p-8"> {/* Changed to bg-black for deeper dark */}
      <motion.h1
        className="text-4xl text-red-600 font-extrabold mb-10 text-center drop-shadow-lg tracking-wide"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        Dashboard <span className="text-zinc-500 text-3xl">| System Overview</span>
      </motion.h1>

      {/* Analytics & Admin Features Section */}
      <motion.section
        className="mb-16" // Increased margin bottom for separation
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-3xl text-red-500 font-bold mb-8 border-b-2 border-red-700 pb-2 inline-block">
          <BarChart2 className="inline-block mr-3 w-7 h-7" /> Analytics & Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Increased gap */}
          <motion.div
            className="bg-zinc-900 border border-red-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center transform hover:scale-103 transition-transform duration-300 relative overflow-hidden"
            variants={cardVariants}
          >
             {/* Subtle gradient overlay at the top, inspired by cyberpunk elements */}
            <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-900/20 to-transparent"></div>
            <BarChart2 className="text-red-500 w-14 h-14 mb-4 z-10" /> {/* Larger icon */}
            <h3 className="text-xl font-semibold text-gray-100 mb-2 z-10">Risk Analysis Graphs</h3>
            <p className="text-zinc-400 text-center text-sm z-10">Visualizations of PII risk levels and trends based on aggregated data.</p>
            <div className="h-32 w-full bg-zinc-800 rounded mt-4 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
              [Upcoming: Interactive Risk Chart]
            </div>
          </motion.div>

          <motion.div
            className="bg-zinc-900 border border-red-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center transform hover:scale-103 transition-transform duration-300 relative overflow-hidden"
            variants={cardVariants}
          >
             <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-900/20 to-transparent"></div>
            <TrendingUp className="text-red-500 w-14 h-14 mb-4 z-10" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2 z-10">Behavioral Pattern Predictions</h3>
            <p className="text-zinc-400 text-center text-sm z-10">AI-driven insights into PII usage patterns and predictive analytics.</p>
            <div className="h-32 w-full bg-zinc-800 rounded mt-4 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
              [Upcoming: Prediction Interface]
            </div>
          </motion.div>

          <motion.div
            className="bg-zinc-900 border border-red-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center transform hover:scale-103 transition-transform duration-300 relative overflow-hidden"
            variants={cardVariants}
          >
             <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-900/20 to-transparent"></div>
            <Users className="text-red-500 w-14 h-14 mb-4 z-10" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2 z-10">Admin User Activity Trends</h3>
            <p className="text-zinc-400 text-center text-sm z-10">Aggregate data on user activity, trends, and system health for administrators.</p>
            <div className="h-32 w-full bg-zinc-800 rounded mt-4 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
              [Upcoming: Admin User View]
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Generation History Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-3xl text-red-500 font-bold mb-8 border-b-2 border-red-700 pb-2 inline-block">
          <Terminal className="inline-block mr-3 w-7 h-7" /> PII Generation History
        </h2>

        {overallLoading && <p className="text-zinc-400 text-center py-8">Loading PII generation history...</p>}
        {error && <p className="text-red-500 text-center py-8">Error: {error}</p>}

        {!overallLoading && !error && history.length === 0 && (
          <p className="text-zinc-400 text-center py-8">No PII generation history found. Begin by submitting data on the main page!</p>
        )}

        {!overallLoading && history.length > 0 && (
          <motion.div
            className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden"
            variants={sectionVariants} // Apply section animation to the table container
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800 border-b border-red-900 text-red-300"> {/* Darker red border */}
                    <th className="p-4 text-left font-medium">Timestamp</th>
                    <th className="p-4 text-left font-medium">IP Address</th>
                    <th className="p-4 text-left font-medium">PII Summary</th>
                    <th className="p-4 text-left font-medium">Wordlist Preview</th>
                    <th className="p-4 text-center font-medium">Details</th> {/* Changed to Details */}
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <motion.tr
                        className="border-t border-zinc-850 hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
                        onClick={() => toggleExpand(entry.id)}
                        variants={tableRowVariants}
                      >
                        <td className="p-4 text-zinc-300">{new Date(entry.timestamp).toLocaleString()}</td>
                        <td className="p-4 text-zinc-500">{entry.ip_address}</td>
                        <td className="p-4 text-zinc-400 font-mono">{formatPiiForDisplay(entry.pii_data)}</td> {/* Monospace for data */}
                        <td className="p-4 text-zinc-500 text-xs">
                          {entry.wordlist?.slice(0, 5).join(', ') + (entry.wordlist?.length > 5 ? '...' : '') || 'N/A'}
                        </td>
                        <td className="p-4 text-center">
                          {expandedEntryId === entry.id ? (
                            <ChevronUp className="text-red-500 w-5 h-5 inline-block" />
                          ) : (
                            <ChevronDown className="text-red-500 w-5 h-5 inline-block" />
                          )}
                        </td>
                      </motion.tr>
                      {expandedEntryId === entry.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-zinc-900" // Darker background for expanded row
                        >
                          <td colSpan="5" className="p-6 border-t border-red-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-zinc-300">
                              <div>
                                <h4 className="font-bold text-red-400 mb-3 text-lg">Full PII Data:</h4>
                                <pre className="bg-zinc-950 p-4 rounded text-xs overflow-auto max-h-60 border border-zinc-700 shadow-inner leading-relaxed">
                                  {JSON.stringify(entry.pii_data, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <h4 className="font-bold text-red-400 mb-3 text-lg">Generated Wordlist:</h4>
                                <ul className="list-disc list-inside bg-zinc-950 p-4 rounded text-xs overflow-auto max-h-60 border border-zinc-700 shadow-inner leading-relaxed">
                                  {entry.wordlist && entry.wordlist.length > 0 ? (
                                    entry.wordlist.map((word, index) => <li key={index} className="mb-1">{word}</li>)
                                  ) : (
                                    <li className="text-zinc-500">No wordlist generated for this entry.</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.section>
    </div>
  );
};

export default DashboardPage;