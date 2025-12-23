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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Ideal Customer Profile (ICP) Configuration</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Target Country
          </label>
          <input
            type="text"
            value={config.targetCountry}
            onChange={(e) => setConfig({ ...config, targetCountry: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Excluded HQ Countries (comma-separated)
          </label>
          <input
            type="text"
            value={config.excludedHQCountries?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              excludedHQCountries: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Minimum Job Title Level (comma-separated)
          </label>
          <input
            type="text"
            value={config.minJobTitleLevel?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              minJobTitleLevel: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Required Languages (comma-separated)
          </label>
          <input
            type="text"
            value={config.requiredLanguages?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              requiredLanguages: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Max Employees in Target Country
          </label>
          <input
            type="number"
            value={config.maxEmployeesInTargetCountry}
            onChange={(e) => setConfig({
              ...config,
              maxEmployeesInTargetCountry: parseInt(e.target.value),
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Industries (comma-separated)
          </label>
          <input
            type="text"
            value={config.industries?.join(', ')}
            onChange={(e) => setConfig({
              ...config,
              industries: e.target.value.split(',').map(s => s.trim()),
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Minimum Funding Amount
          </label>
          <input
            type="number"
            value={config.minFundingAmount}
            onChange={(e) => setConfig({
              ...config,
              minFundingAmount: parseInt(e.target.value),
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}




