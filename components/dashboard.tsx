'use client';

import { useState, useEffect } from 'react';
import { Activity, Target, Filter, TrendingUp, TrendingDown, Search, ArrowUpRight, Briefcase, Globe } from 'lucide-react';
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

  const bentoCards = [
    { 
      size: 'large', 
      title: 'Live Signal Feed',
      value: stats.totalSignals.toLocaleString(),
      change: `+${stats.processedSignals} processed`,
      icon: Activity,
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      description: 'Real-time candidate activity',
      live: true
    },
    { 
      size: 'medium', 
      title: 'High Intent',
      value: stats.totalCandidates.toString(),
      change: `${stats.activeBuckets} active buckets`,
      icon: Target,
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      description: 'Ready to engage'
    },
    { 
      size: 'medium', 
      title: 'Active Buckets',
      value: stats.activeBuckets.toString(),
      change: 'Segmented pipelines',
      icon: Filter,
      gradient: 'from-purple-500 via-pink-500 to-purple-600',
      description: 'Organized opportunities'
    },
    { 
      size: 'small', 
      title: 'Processing',
      value: `${stats.totalSignals > 0 ? Math.round((stats.processedSignals / stats.totalSignals) * 100) : 0}%`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600'
    },
    { 
      size: 'small', 
      title: 'Response Rate',
      value: '67%',
      icon: TrendingDown,
      gradient: 'from-yellow-500 to-orange-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {bentoCards.map((card, idx) => {
          const colSpan = card.size === 'large' ? 'col-span-6' : card.size === 'medium' ? 'col-span-3' : 'col-span-3';
          const rowSpan = card.size === 'large' ? 'row-span-2' : 'row-span-1';
          
          return (
            <div
              key={idx}
              className={`${colSpan} ${rowSpan} group relative bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 overflow-hidden transition-all duration-500 hover:scale-[1.02] cursor-pointer`}
              style={{
                boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Glow Effect on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              {/* Neon Border Pulse for Live Cards */}
              {card.live && (
                <div className="absolute inset-0 rounded-3xl border-2 border-cyan-500/50 animate-pulse"></div>
              )}
              
              <div className="relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-auto">
                  <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}
                       style={{ boxShadow: `0 10px 30px -10px ${card.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.5)' : 'rgba(168, 85, 247, 0.5)'}` }}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  {card.live && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 rounded-full">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-cyan-400">LIVE</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <div className="text-sm font-medium text-slate-400 mb-2">{card.title}</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                    {card.value}
                  </div>
                  {card.change && (
                    <div className="text-sm font-semibold text-cyan-400 mb-1">{card.change}</div>
                  )}
                  {card.description && (
                    <div className="text-xs text-slate-500">{card.description}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Signal Stream */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden"
           style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
        <div className="px-8 py-6 border-b border-slate-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-3">
              Live Signal Stream
              <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-xs font-bold text-cyan-400">
                {recentSignals.length} ACTIVE
              </span>
            </h2>
            <p className="text-sm text-slate-500">Real-time candidate intelligence</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search signals..."
                className="pl-11 pr-4 py-3 w-64 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <button className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105">
              Add Filter
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {recentSignals.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-slate-500 font-medium">No signals yet. Start ingesting signals to see them here.</p>
            </div>
          ) : (
            recentSignals.map((signal, idx) => (
              <div
                key={signal?.id || idx}
                className="px-8 py-5 hover:bg-cyan-500/5 transition-all duration-300 group cursor-pointer relative"
              >
                {idx === 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-500"></div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5 flex-1">
                    {idx === 0 && (
                      <div className="relative">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping"></div>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-bold text-lg">{signal?.title || signal?.type || 'Unknown'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-sm text-slate-400">{signal?.companyName || 'Unknown Company'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {signal?.source && (
                          <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                            <Briefcase className="w-3 h-3 inline mr-1" />
                            {signal.source}
                          </span>
                        )}
                        {signal?.location && (
                          <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                            <Globe className="w-3 h-3 inline mr-1" />
                            {signal.location}
                          </span>
                        )}
                        {signal?.postedDate && (
                          <span className="text-xs text-slate-600">
                            {(() => {
                              try {
                                const date = new Date(signal.postedDate);
                                return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                              } catch {
                                return '';
                              }
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-500 mb-1">INTENT SCORE</div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {85 + (idx % 10)}
                      </div>
                    </div>
                    <ArrowUpRight className="w-6 h-6 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
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





