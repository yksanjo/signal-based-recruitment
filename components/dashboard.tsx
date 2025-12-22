'use client';

import { useState, useEffect } from 'react';
import { Signal } from '@/lib/types';

export function SignalDashboard() {
  const [stats, setStats] = useState({
    totalSignals: 0,
    processedSignals: 0,
    activeBuckets: 0,
    totalCandidates: 0,
  });
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentSignals();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentSignals = async () => {
    try {
      const res = await fetch('/api/signals?limit=10');
      const data = await res.json();
      setRecentSignals(data);
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Signals"
          value={stats.totalSignals}
          subtitle={`${stats.processedSignals} processed`}
        />
        <StatCard
          title="Active Buckets"
          value={stats.activeBuckets}
          subtitle="Ready for action"
        />
        <StatCard
          title="Candidates"
          value={stats.totalCandidates}
          subtitle="High-intent prospects"
        />
        <StatCard
          title="Processing Rate"
          value={`${stats.totalSignals > 0 ? Math.round((stats.processedSignals / stats.totalSignals) * 100) : 0}%`}
          subtitle="Signals processed"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Signals</h2>
        <div className="space-y-3">
          {recentSignals.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No signals yet. Start ingesting signals to see them here.</p>
          ) : (
            recentSignals.map(signal => (
              <div
                key={signal.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-900">{signal.title || signal.type}</h3>
                    <p className="text-sm text-slate-600 mt-1">{signal.companyName}</p>
                    {signal.location && (
                      <p className="text-xs text-slate-500 mt-1">📍 {signal.location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {signal.source}
                    </span>
                    {signal.postedDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(signal.postedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

