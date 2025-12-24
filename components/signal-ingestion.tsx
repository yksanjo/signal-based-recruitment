'use client';

import { useState } from 'react';

export function SignalIngestionPanel() {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState('Head of Engineering, VP of Sales, Director');
  const [location, setLocation] = useState('Brazil');
  const [daysBack, setDaysBack] = useState(30);

  const handleIngest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.split(',').map(k => k.trim()),
          location,
          daysBack,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully ingested ${data.count} signals!`);
      } else {
        alert('Error ingesting signals');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error ingesting signals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Signal Ingestion</h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
            placeholder="Head of Engineering, VP of Sales"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
            placeholder="Brazil"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Days Back
          </label>
          <input
            type="number"
            value={daysBack}
            onChange={(e) => setDaysBack(parseInt(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium"
            min="1"
            max="90"
          />
        </div>
        <button
          onClick={handleIngest}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? 'Ingesting...' : 'Ingest Signals'}
        </button>
        <p className="text-sm text-gray-600 font-medium">
          This will scrape job postings from LinkedIn, Indeed, and Glassdoor based on your criteria.
        </p>
      </div>
    </div>
  );
}




