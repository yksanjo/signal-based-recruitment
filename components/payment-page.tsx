'use client';

import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export function PaymentPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSubscription();
    fetchPayments();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscription');
      if (!res.ok) {
        throw new Error(`Failed to fetch subscription: ${res.status}`);
      }
      const data = await res.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      if (!res.ok) {
        throw new Error(`Failed to fetch payments: ${res.status}`);
      }
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    }
  };

  const handleSubscribe = async (plan: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || `Failed to create payment: ${res.status}`);
        return;
      }
      
      const data = await res.json();
      if (data.paymentIntent) {
        // In production, redirect to Stripe Checkout or handle payment
        alert(`Payment intent created: ${data.paymentIntent.id}\n\nIn production, this would redirect to Stripe Checkout.`);
        await fetchSubscription();
        await fetchPayments();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['100 signals/month', 'Basic enrichment', 'Email support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      features: ['10,000 signals/month', 'Full enrichment', 'Priority support', 'API access'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 499,
      features: ['Unlimited signals', 'Custom enrichment', 'Dedicated support', 'Custom integrations'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {subscription && (
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-6"
             style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Current Subscription</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-white">{subscription.plan.toUpperCase()} Plan</p>
              <p className="text-sm text-slate-400">Status: {subscription.status}</p>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-slate-500">
                  Renews: {(() => {
                    try {
                      const date = new Date(subscription.currentPeriodEnd);
                      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                    } catch {
                      return 'N/A';
                    }
                  })()}
                </p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full text-xs font-bold ${
              subscription.status === 'ACTIVE' 
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {subscription.status}
            </span>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-6"
           style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                selectedPlan === plan.id
                  ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                  : 'border-slate-800 hover:border-cyan-500/30 bg-slate-900/30'
              }`}
            >
              <h3 className="text-lg font-bold text-white mb-3">{plan.name}</h3>
              <div className="mb-5">
                <span className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">${plan.price}</span>
                {plan.price > 0 && <span className="text-slate-400">/month</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-cyan-400 mr-2 font-bold">✓</span>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan(plan.id);
                  handleSubscribe(plan.id);
                }}
                disabled={loading || subscription?.plan === plan.id}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : subscription?.plan === plan.id ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-3xl p-6"
           style={{ boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 20px 40px -20px rgba(0, 0, 0, 0.5)' }}>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map(payment => (
              <div
                key={payment.id}
                className="border border-slate-800 rounded-xl p-5 flex justify-between items-center hover:bg-cyan-500/5 transition-all duration-300"
              >
                <div>
                  <p className="font-bold text-white text-lg">
                    ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {(() => {
                      try {
                        const date = new Date(payment.createdAt);
                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                      } catch {
                        return 'N/A';
                      }
                    })()}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                  payment.status === 'SUCCEEDED'
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                    : payment.status === 'PENDING'
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




