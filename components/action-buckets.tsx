'use client';

import { useState, useEffect } from 'react';
import { ActionBucket, CandidateProfile } from '@/lib/types';

export function ActionBuckets() {
  const [buckets, setBuckets] = useState<ActionBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBuckets();
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      fetchCandidates(selectedBucket);
    }
  }, [selectedBucket]);

  const fetchBuckets = async () => {
    try {
      const res = await fetch('/api/buckets');
      if (!res.ok) {
        throw new Error(`Failed to fetch buckets: ${res.status}`);
      }
      const data = await res.json();
      setBuckets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching buckets:', error);
      setBuckets([]);
    }
  };

  const fetchCandidates = async (bucketId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/buckets/${bucketId}/candidates`);
      if (!res.ok) {
        throw new Error(`Failed to fetch candidates: ${res.status}`);
      }
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const triggerWorkflow = async (bucketId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/buckets/${bucketId}/trigger`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchCandidates(bucketId);
        await fetchBuckets();
      }
    } catch (error) {
      console.error('Error triggering workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-6"
           style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Action Buckets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 font-medium">No buckets yet. Process signals to create action buckets.</p>
            </div>
          ) : (
            buckets.map(bucket => (
              <div
                key={bucket.id}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  selectedBucket === bucket.id
                    ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-800 hover:border-cyan-500/30 bg-slate-900/30'
                }`}
                onClick={() => setSelectedBucket(bucket.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white text-lg">{bucket.name}</h3>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
                    {bucket.signals.length} signals
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">{bucket.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">
                    Priority: {bucket.priority}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerWorkflow(bucket.id);
                    }}
                    disabled={loading}
                    className="text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 transition-all duration-300"
                  >
                    Trigger Workflow
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedBucket && (
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-6"
             style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Candidates</h2>
          {loading ? (
            <p className="text-slate-400 text-center py-8">Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No candidates yet. Click &quot;Trigger Workflow&quot; to generate candidate profiles.
            </p>
          ) : (
            <div className="space-y-3">
              {candidates.map(candidate => (
                <div
                  key={candidate.id}
                  className="border border-slate-800 rounded-xl p-5 hover:bg-cyan-500/5 transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{candidate.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {candidate.title || 'N/A'} {candidate.company ? `at ${candidate.company}` : ''}
                      </p>
                      {candidate.location && (
                        <p className="text-xs text-slate-500 mt-2">📍 {candidate.location}</p>
                      )}
                      {candidate.tenure && (
                        <p className="text-xs text-slate-500 mt-1">
                          Tenure: {Math.floor(candidate.tenure / 12)} years {candidate.tenure % 12} months
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {candidate.likelihoodToMove && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
                            {Math.round(candidate.likelihoodToMove * 100)}% likely to move
                          </span>
                        </div>
                      )}
                      {candidate.email && (
                        <a
                          href={`mailto:${candidate.email}`}
                          className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          {candidate.email}
                        </a>
                      )}
                    </div>
                  </div>
                  {candidate.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {candidate.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-300 border border-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

