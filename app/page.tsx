'use client';

import { useState } from 'react';
import { SignalDashboard } from '@/components/dashboard';
import { ActionBuckets } from '@/components/action-buckets';
import { SignalIngestionPanel } from '@/components/signal-ingestion';
import { ICPConfigPanel } from '@/components/icp-config';
import { PaymentPage } from '@/components/payment-page';
import { HelpGuide } from '@/components/help-guide';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'buckets' | 'ingestion' | 'config' | 'payment' | 'help'>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-white drop-shadow-md">
            Signal-Based Recruitment Sourcing
          </h1>
          <p className="text-indigo-100 mt-2 text-lg">
            High-velocity event stream for recruitment intelligence
          </p>
        </div>
      </header>

      <nav className="bg-white border-b-2 border-indigo-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'buckets', label: 'Action Buckets' },
              { id: 'ingestion', label: 'Signal Ingestion' },
              { id: 'config', label: 'ICP Config' },
              { id: 'payment', label: 'Payment' },
              { id: 'help', label: 'Help & Guide' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-4 border-b-2 font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50'
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
        {activeTab === 'payment' && <PaymentPage />}
        {activeTab === 'help' && <HelpGuide />}
      </main>
    </div>
  );
}

