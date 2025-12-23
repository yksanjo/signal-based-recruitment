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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Action Buckets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map(bucket => (
            <div
              key={bucket.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                selectedBucket === bucket.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedBucket(bucket.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-900">{bucket.name}</h3>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  {bucket.signals.length} signals
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{bucket.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Priority: {bucket.priority}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerWorkflow(bucket.id);
                  }}
                  disabled={loading}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Trigger Workflow
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBucket && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Candidates</h2>
          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No candidates yet. Click &quot;Trigger Workflow&quot; to generate candidate profiles.
            </p>
          ) : (
            <div className="space-y-3">
              {candidates.map(candidate => (
                <div
                  key={candidate.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-slate-900">{candidate.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {candidate.title} at {candidate.company}
                      </p>
                      {candidate.location && (
                        <p className="text-xs text-slate-500 mt-1">📍 {candidate.location}</p>
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {Math.round(candidate.likelihoodToMove * 100)}% likely to move
                          </span>
                        </div>
                      )}
                      {candidate.email && (
                        <a
                          href={`mailto:${candidate.email}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {candidate.email}
                        </a>
                      )}
                    </div>
                  </div>
                  {candidate.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {candidate.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700"
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

