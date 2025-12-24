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
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-8"
         style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Signal Ingestion</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
            placeholder="Head of Engineering, VP of Sales"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
            placeholder="Brazil"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Days Back
          </label>
          <input
            type="number"
            value={daysBack}
            onChange={(e) => setDaysBack(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
            min="1"
            max="90"
          />
        </div>
        <button
          onClick={handleIngest}
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all duration-300 hover:scale-[1.02]"
        >
          {loading ? 'Ingesting...' : 'Ingest Signals'}
        </button>
        <p className="text-sm text-slate-500 font-medium">
          This will scrape job postings from LinkedIn, Indeed, and Glassdoor based on your criteria.
        </p>
      </div>
    </div>
  );
}




