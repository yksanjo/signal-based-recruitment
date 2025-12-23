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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium">{subscription.plan.toUpperCase()} Plan</p>
              <p className="text-sm text-slate-600">Status: {subscription.status}</p>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-slate-500">
                  Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              subscription.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {subscription.status}
            </span>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`border-2 rounded-lg p-6 ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.price > 0 && <span className="text-slate-600">/month</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan(plan.id);
                  handleSubscribe(plan.id);
                }}
                disabled={loading || subscription?.plan === plan.id}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : subscription?.plan === plan.id ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map(payment => (
              <div
                key={payment.id}
                className="border border-slate-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  payment.status === 'SUCCEEDED'
                    ? 'bg-green-100 text-green-800'
                    : payment.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
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




