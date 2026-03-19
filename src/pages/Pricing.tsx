import { useState } from 'react';
import { useAuth } from '../App';
import { db, doc, updateDoc, increment, OperationType, handleFirestoreError } from '../firebase';
import { ArrowLeft, Coins, Check, Zap, Shield, Star } from 'lucide-react';

interface PricingPageProps {
  onBack: () => void;
}

export default function PricingPage({ onBack }: PricingPageProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'basic',
      name: 'Starter',
      credits: 100,
      price: '₹499',
      description: 'Perfect for small indie apps',
      features: ['100 Credits', 'Basic Support', 'Standard Listing'],
      color: 'slate'
    },
    {
      id: 'pro',
      name: 'Professional',
      credits: 500,
      price: '₹1,999',
      description: 'Best for growing studios',
      features: ['500 Credits', 'Priority Support', 'Featured Listing', 'Analytics'],
      color: 'indigo',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 2000,
      price: '₹6,999',
      description: 'For large scale testing',
      features: ['2000 Credits', 'Dedicated Manager', 'Custom Testing Time', 'API Access'],
      color: 'emerald'
    }
  ];

  const handleBuy = async (planId: string, credits: number) => {
    if (!user) return;
    setLoading(planId);

    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add credits to user
      await updateDoc(doc(db, 'users', user.uid), {
        credits: increment(credits)
      });

      await refreshUser();
      alert(`Successfully added ${credits} credits to your account!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Buy Credits</h1>
      </div>

      <div className="bg-orange-50 p-6 rounded-3xl mb-8 flex items-center justify-between border border-orange-100">
        <div>
          <p className="text-orange-600 text-sm font-bold uppercase tracking-wider mb-1">Current Balance</p>
          <div className="flex items-center gap-2">
            <Coins size={24} className="text-orange-500" />
            <span className="text-3xl font-black text-slate-900">{user?.credits || 0}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
          <Zap size={24} className="text-orange-500" />
        </div>
      </div>

      <div className="space-y-6 pb-12">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative bg-white border-2 rounded-3xl p-6 transition-all ${
              plan.popular ? 'border-indigo-600 shadow-xl shadow-indigo-50' : 'border-slate-100'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-xs">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{plan.price}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">One-time</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    plan.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                    plan.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleBuy(plan.id, plan.credits)}
              disabled={loading !== null}
              className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                plan.color === 'indigo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' :
                plan.color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' :
                'bg-slate-900 text-white shadow-lg shadow-slate-100'
              }`}
            >
              {loading === plan.id ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                <>
                  <Star size={18} />
                  Get {plan.credits} Credits
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 text-slate-400 text-xs pb-8">
        <div className="flex items-center gap-1">
          <Shield size={14} />
          Secure Payment
        </div>
        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
        <p>GST Included</p>
      </div>
    </div>
  );
}
