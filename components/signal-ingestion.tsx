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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Signal Ingestion</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Head of Engineering, VP of Sales"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brazil"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Days Back
          </label>
          <input
            type="number"
            value={daysBack}
            onChange={(e) => setDaysBack(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="90"
          />
        </div>
        <button
          onClick={handleIngest}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Ingesting...' : 'Ingest Signals'}
        </button>
        <p className="text-sm text-slate-500">
          This will scrape job postings from LinkedIn, Indeed, and Glassdoor based on your criteria.
        </p>
      </div>
    </div>
  );
}




