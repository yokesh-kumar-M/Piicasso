import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../api/axios'; // Use configured axios instance
import { AuthContext } from '../context/AuthContext';
import { ChevronDown, ChevronUp, BarChart2, TrendingUp, Users, Terminal, Trash2 } from 'lucide-react'; // Import Trash2 icon

// Utility function to format PII data for display
const formatPiiForDisplay = (piiData) => {
  if (!piiData || typeof piiData !== 'object') return 'N/A';
  const entries = Object.entries(piiData);
  if (entries.length === 0) return 'No PII captured';
    const displayCount = Math.min(entries.length, 5);
  const parts = entries.slice(0, displayCount).map(([key, value]) => 
    `${key}: "${String(value).slice(0, 20)}${String(value).length > 20 ? '...' : ''}"`
  );
  return `{ ${parts.join(', ')} }${entries.length > 3 ? '...' : ''}`;
};

// Function to format the wordlist count
const formatWordListCount = (wordlist) => {
    if (!wordlist) return 'N/A';
    return wordlist.length;
}

const DashboardPage = () => {
  const { token, logout, loading: authLoading } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
 const [wordlist, setWordlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/api/history/');
        setHistory(response.data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        if (err.response && err.response.status === 401) {
          alert('Session expired. Please log in again.');
          logout();
        } else {
          setError(err.message || 'An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && !authLoading) {
      fetchHistory();
    } else if (!token && !authLoading) {
      setLoading(false);
      setError('Authentication required. Please log in.');
    }
  }, [token, logout, authLoading]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this history entry?")) {
            try {
                await axiosInstance.delete(`/api/history/${id}/`); // Corrected URL
                setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id)); // Optimistically update the UI
            } catch (error) {
                console.error('Failed to delete history entry: ', error);
                alert('Failed to delete history entry.'); // Inform the user
            }
        }
};

    const overallLoading = loading || authLoading;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="text-4xl text-red-600 font-extrabold mb-10 text-center drop-shadow-lg tracking-wide">
                Dashboard <span className="text-zinc-500 text-3xl">| System Overview</span>
            </div>

            {/* Analytics & Admin Features Section */}
            <section className="mb-16">
                <h2 className="text-3xl text-red-500 font-bold mb-8 border-b-2 border-red-700 pb-2 inline-block">
                    <BarChart2 className="inline-block mr-3 w-7 h-7" /> Analytics & Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-zinc-900 border border-red-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-900/20 to-transparent"></div>
                        <BarChart2 className="text-red-500 w-14 h-14 mb-4 z-10" />
                        <h3 className="text-xl font-semibold text-gray-100 mb-2 z-10">Risk Analysis Graphs</h3>
                        <p className="text-zinc-400 text-center text-sm z-10">Visualizations of PII risk levels and trends based on aggregated data.</p>
                        <div className="h-32 w-full bg-zinc-800 rounded mt-4 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
                            [Upcoming: Interactive Risk Chart]
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-red-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-900/20 to-transparent"></div>
                        <TrendingUp className="text-red-500 w-14 h-14 mb-4 z-10" />
                        <h3 className="text-xl font-semibold text-gray-100 mb-2 z-10">Behavioral Pattern Predictions</h3>
                        <p className="text-zinc-400 text-center text-sm z-10">AI-driven insights into PII usage patterns and predictive analytics.</p>
                        <div className="h-32 w-full bg-zinc-800 rounded mt-4 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
                            [Upcoming: Prediction Interface]
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-red-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-red-900/20 to-transparent"></div>
                        <Users className="text-red-500 w-14 h-14 mb-4 z-10" />
                        <h3 className="text-xl font-semibold text-gray-100 mb-2 z-10">Admin User Activity Trends</h3>
                        <p className="text-zinc-400 text-center text-sm z-10">Aggregate data on user activity, trends, and system health for administrators.</p>
                        <div className="h-32 w-full bg-zinc-800 rounded mt-4 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
                            [Upcoming: Admin User View]
                        </div>
                    </div>
                </div>
            </section>

            {/* Generation History Section */}
            <section>
                <h2 className="text-3xl text-red-500 font-bold mb-8 border-b-2 border-red-700 pb-2 inline-block">
                    <Terminal className="inline-block mr-3 w-7 h-7" /> PII Generation History
                </h2>
                {overallLoading && <p className="text-zinc-400 text-center py-8">Loading PII generation history...</p>}
                {error && <p className="text-red-500 text-center py-8">Error: {error}</p>}
                {!overallLoading && !error && history.length === 0 && (
                    <p className="text-zinc-400 text-center py-8">No PII generation history found. Begin by submitting data on the main page!</p>
                )}
                {!overallLoading && history.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-zinc-800 border-b border-red-900 text-red-300">
                                        <th className="p-4 text-left font-medium">Timestamp</th>
                                        <th className="p-4 text-left font-medium">IP Address</th>
                                        <th className="p-4 text-left font-medium">PII Summary</th>
                                        <th className="p-4 text-left font-medium">Wordlist Count</th>
                                        <th className="p-4 text-center font-medium">Actions</th> {/* Changed from Details to Actions */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((entry) => (
                                        <React.Fragment key={entry.id}>
                                            <tr
                                                className="border-t border-zinc-850 hover:bg-zinc-800 transition-colors duration-200 cursor-pointer"
                                            >
                                                <td className="p-4 text-zinc-300">{new Date(entry.timestamp).toLocaleString()}</td>
                                                <td className="p-4 text-zinc-500">{entry.ip_address}</td>
                                                <td className="p-4 text-zinc-400 font-mono">{formatPiiForDisplay(entry.pii_data)}</td>
                                                <td className="p-4 text-zinc-500 text-xs">
                                            {formatWordListCount(entry.wordlist)}
                                             </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row expansion when clicking delete
                                                            handleDelete(entry.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                                    >
                                                        <Trash2 className="w-5 h-5 inline-block" />
                                                    </button>
                                                    <button onClick={() => toggleExpand(entry.id)} className="ml-2">
                                                        {expandedEntryId === entry.id ? (
                                                            <ChevronUp className="text-red-500 w-5 h-5 inline-block" />
                                                        ) : (
                                                            <ChevronDown className="text-red-500 w-5 h-5 inline-block" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedEntryId === entry.id && (
                                                <tr className="bg-zinc-900">
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
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
export default DashboardPage;