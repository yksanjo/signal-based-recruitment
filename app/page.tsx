'use client';

import { useState } from 'react';
import { SignalDashboard } from '@/components/dashboard';
import { ActionBuckets } from '@/components/action-buckets';
import { SignalIngestionPanel } from '@/components/signal-ingestion';
import { ICPConfigPanel } from '@/components/icp-config';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'buckets' | 'ingestion' | 'config'>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Signal-Based Recruitment Sourcing
          </h1>
          <p className="text-slate-600 mt-1">
            High-velocity event stream for recruitment intelligence
          </p>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'buckets', label: 'Action Buckets' },
              { id: 'ingestion', label: 'Signal Ingestion' },
              { id: 'config', label: 'ICP Config' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <SignalDashboard />}
        {activeTab === 'buckets' && <ActionBuckets />}
        {activeTab === 'ingestion' && <SignalIngestionPanel />}
        {activeTab === 'config' && <ICPConfigPanel />}
      </main>
    </div>
  );
}

