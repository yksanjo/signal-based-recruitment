'use client';

import { useState, useEffect } from 'react';
import { ICPConfig } from '@/lib/types';

export function ICPConfigPanel() {
  const [config, setConfig] = useState<ICPConfig>({
    targetCountry: 'Brazil',
    excludedHQCountries: ['Brazil'],
    minJobTitleLevel: ['VP', 'Head of', 'Director'],
    requiredLanguages: ['English', 'Spanish'],
    maxEmployeesInTargetCountry: 100,
    industries: ['Technology', 'SaaS', 'Oil & Energy'],
    minFundingAmount: 1000000,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/icp-config');
      if (res.ok) {
        const data = await res.json();
        if (data) setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/icp-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        alert('ICP configuration saved!');
      } else {
        alert('Error saving configuration');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-8"
         style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Ideal Customer Profile (ICP) Configuration</h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Target Country
          </label>
          <input
            type="text"
            value={config.targetCountry}
            onChange={(e) => setConfig({ ...config, targetCountry: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Excluded HQ Countries (comma-separated)
          </label>
          <input
            type="text"
            value={config.excludedHQCountries?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              excludedHQCountries: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Minimum Job Title Level (comma-separated)
          </label>
          <input
            type="text"
            value={config.minJobTitleLevel?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              minJobTitleLevel: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Required Languages (comma-separated)
          </label>
          <input
            type="text"
            value={config.requiredLanguages?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              requiredLanguages: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Max Employees in Target Country
          </label>
          <input
            type="number"
            value={config.maxEmployeesInTargetCountry}
            onChange={(e) => setConfig({
              ...config,
              maxEmployeesInTargetCountry: parseInt(e.target.value),
            })}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Industries (comma-separated)
          </label>
          <input
            type="text"
            value={config.industries?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              industries: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wide">
            Minimum Funding Amount
          </label>
          <input
            type="number"
            value={config.minFundingAmount}
            onChange={(e) => setConfig({
              ...config,
              minFundingAmount: parseInt(e.target.value),
            })}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white placeholder-slate-500 font-medium transition-all"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all duration-300 hover:scale-[1.02]"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}




