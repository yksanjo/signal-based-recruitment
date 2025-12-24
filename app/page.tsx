'use client';

import { useState, useEffect } from 'react';
import { Zap, Bell } from 'lucide-react';
import { SignalDashboard } from '@/components/dashboard';
import { ActionBuckets } from '@/components/action-buckets';
import { SignalIngestionPanel } from '@/components/signal-ingestion';
import { ICPConfigPanel } from '@/components/icp-config';
import { PaymentPage } from '@/components/payment-page';
import { HelpGuide } from '@/components/help-guide';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'buckets' | 'ingestion' | 'config' | 'payment' | 'help'>('dashboard');
  const [pulseSignals, setPulseSignals] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseSignals(prev => [...prev, Date.now()]);
      setTimeout(() => {
        setPulseSignals(prev => prev.slice(1));
      }, 3000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent h-px animate-pulse" 
          style={{ animation: 'scanline 8s linear infinite' }}
        ></div>
      </div>
      
      {/* Radial Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative">
        {/* Command Center Header */}
        <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-cyan-500/5">
          <div className="max-w-[1600px] mx-auto px-8 py-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Zap className="w-7 h-7 text-white" />
                  <div className="absolute inset-0 bg-cyan-400/30 rounded-xl blur animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Signal Intelligence
                  </h1>
                  <p className="text-xs text-slate-500 font-medium tracking-wide">RECRUITMENT COMMAND CENTER</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="relative p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group">
                  <Bell className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  {pulseSignals.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></span>
                  )}
                </button>
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
                  24 Active Signals
                </div>
              </div>
            </div>

            <nav className="flex items-center gap-2 bg-slate-900/50 rounded-2xl p-1.5 border border-slate-800">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'buckets', label: 'Action Buckets' },
                { id: 'ingestion', label: 'Signal Ingestion' },
                { id: 'config', label: 'ICP Config' },
                { id: 'payment', label: 'Payment' },
                { id: 'help', label: 'Help & Guide' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-8 py-8">
          {activeTab === 'dashboard' && <SignalDashboard />}
          {activeTab === 'buckets' && <ActionBuckets />}
          {activeTab === 'ingestion' && <SignalIngestionPanel />}
          {activeTab === 'config' && <ICPConfigPanel />}
          {activeTab === 'payment' && <PaymentPage />}
          {activeTab === 'help' && <HelpGuide />}
        </main>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}

