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
      const data = await res.json().catch(() => ({}));
      
      // Always ensure we have valid stats object
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setStats({
          totalSignals: data.totalSignals ?? 0,
          processedSignals: data.processedSignals ?? 0,
          activeBuckets: data.activeBuckets ?? 0,
          totalCandidates: data.totalCandidates ?? 0,
        });
      } else {
        setStats({
          totalSignals: 0,
          processedSignals: 0,
          activeBuckets: 0,
          totalCandidates: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values on error
      setStats({
        totalSignals: 0,
        processedSignals: 0,
        activeBuckets: 0,
        totalCandidates: 0,
      });
    }
  };

  const fetchRecentSignals = async () => {
    try {
      const res = await fetch('/api/signals?limit=10', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      // Check response status - if not ok, use empty array
      if (!res.ok) {
        console.warn(`API returned ${res.status}, using empty array`);
        setRecentSignals([]);
        return;
      }
      
      // Parse JSON with fallback
      let data;
      try {
        const text = await res.text();
        if (!text || text.trim() === '') {
          data = [];
        } else {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        setRecentSignals([]);
        return;
      }
      
      // ALWAYS ensure we have an array before using .map()
      if (Array.isArray(data)) {
        setRecentSignals(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.signals)) {
        // Handle wrapped response format
        setRecentSignals(data.signals);
      } else {
        console.warn('API returned non-array data:', typeof data, data);
        // Force to empty array to prevent .map() errors
        setRecentSignals([]);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
      // Always set to empty array on any error
      setRecentSignals([]);
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

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Signals</h2>
        <div className="space-y-3">
          {recentSignals.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-dashed border-indigo-200">
              <p className="text-gray-600 font-medium">No signals yet. Start ingesting signals to see them here.</p>
            </div>
          ) : (
            recentSignals.map(signal => (
              <div
                key={signal?.id || Math.random()}
                className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{signal?.title || signal?.type || 'Unknown'}</h3>
                    <p className="text-sm text-gray-700 mt-1 font-medium">{signal?.companyName || 'Unknown Company'}</p>
                    {signal?.location && (
                      <p className="text-sm text-gray-600 mt-2 font-medium">📍 {signal.location}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {signal?.source && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-sm">
                        {signal.source}
                      </span>
                    )}
                    {signal?.postedDate && (
                      <p className="text-xs text-gray-600 mt-2 font-medium">
                        {(() => {
                          try {
                            const date = new Date(signal.postedDate);
                            return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                          } catch {
                            return '';
                          }
                        })()}
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
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
      <p className="text-4xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500 mt-2 font-medium">{subtitle}</p>
    </div>
  );
}




