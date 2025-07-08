import React, { useEffect, useState } from 'react';

const DashboardPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://127.0.0.1:8000/api/history/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized or server error');
        return res.json();
      })
      .then((data) => setHistory(data))
      .catch((err) => {
        console.error('Failed to fetch:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 text-white max-w-5xl mx-auto">
      <h1 className="text-3xl text-red-500 font-bold mb-6">Generation History</h1>

      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && history.length === 0 && (
        <p className="text-gray-400">No history found.</p>
      )}

      {!loading && history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-zinc-900 border border-zinc-700">
            <thead>
              <tr className="bg-zinc-800">
                <th className="p-2">Timestamp</th>
                <th className="p-2">IP Address</th>
                <th className="p-2">PII (short)</th>
                <th className="p-2">Preview</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-t border-zinc-700">
                  <td className="p-2">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="p-2">{entry.ip_address}</td>
                  <td className="p-2 text-xs">{JSON.stringify(entry.pii_data).slice(0, 50)}...</td>
                  <td className="p-2 text-xs text-zinc-400">
                    {entry.wordlist.slice(0, 3).join(', ') + '...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
