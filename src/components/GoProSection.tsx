import React, { useState } from 'react';
import { ProTier, UserProfile } from '../types';
import { 
  Sparkles, Check, Crown, HelpCircle, ShieldCheck, 
  CreditCard, Smartphone, CheckCircle2, ChevronRight, VolumeX 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GoProSectionProps {
  user: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => void;
  onClose?: () => void;
  displayCurrency?: 'INR' | 'USD' | 'EUR';
  formatCurrency?: (valInINR: number, decimals?: number) => string;
}

const PLANS = [
  {
    id: 'weekly' as ProTier,
    name: 'Weekly Pass',
    price: 79,
    period: 'week',
    description: 'Perfect for a quick sprint to test out strategies and check out curriculum.',
    features: [
      'Intermediate & Advanced levels unlocked',
      '2 topics available per day (drip-feed)',
      '100% ad-free experience',
      'Infinite free paper trading'
    ],
    accent: 'border-slate-800'
  },
  {
    id: 'monthly' as ProTier,
    name: 'Monthly Pro',
    price: 299,
    period: 'month',
    description: 'Our most popular option for comprehensive study and paper trading.',
    features: [
      'Intermediate & Advanced levels unlocked',
      '2 topics available per day (drip-feed)',
      '100% ad-free experience',
      'Infinite free paper trading'
    ],
    accent: 'border-slate-800'
  },
  {
    id: 'yearly' as ProTier,
    name: 'Yearly Pro',
    price: 499,
    period: 'year',
    description: 'Full 12-month access to build, backtest, and master trading concepts.',
    features: [
      'Intermediate & Advanced levels unlocked',
      '2 topics available per day (drip-feed)',
      '100% ad-free experience',
      'Infinite free paper trading'
    ],
    accent: 'border-slate-800'
  },
  {
    id: 'lifetime' as ProTier,
    name: 'Lifetime Ultimate',
    price: 799,
    period: 'lifetime',
    description: 'The definitive VIP membership. Unlocks EVERYTHING instantly and forever.',
    features: [
      'Intermediate & Advanced levels unlocked',
      '⚡ INSTANTLY unlock all topics (No Drip Lock)',
      '100% ad-free experience forever',
      'Infinite free paper trading',
      'All future curriculum updates free'
    ],
    accent: 'border-amber-500/50 bg-amber-500/[0.04]',
    highlight: true
  }
];

export default function GoProSection({ user, onUpdateUser, onClose }: GoProSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[3]>(PLANS[3]);
  const [checkoutStep, setCheckoutStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNo, setCardNo] = useState('');

  const handleSubscribe = () => {
    // Generate dates
    const expiry = new Date();
    if (selectedPlan.id === 'weekly') {
      expiry.setDate(expiry.getDate() + 7);
    } else if (selectedPlan.id === 'monthly') {
      expiry.setMonth(expiry.getMonth() + 1);
    } else if (selectedPlan.id === 'yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    }

    const updatedUser: UserProfile = {
      ...user,
      proTier: selectedPlan.id,
      proExpiresAt: selectedPlan.id === 'lifetime' ? null : expiry.toISOString(),
      paperTradingPassExpiresAt: null // clear day pass as they have infinite trading now
    };

    onUpdateUser(updatedUser);
    setCheckoutStep('success');
  };

  const handleCancelPro = () => {
    const updatedUser: UserProfile = {
      ...user,
      proTier: null,
      proExpiresAt: null
    };
    onUpdateUser(updatedUser);
    setCheckoutStep('plan');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Visual Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#05D59E]/5 border border-[#05D59E]/20 text-[#05D59E] text-xs font-bold font-mono uppercase tracking-wider rounded">
          <Sparkles className="w-3.5 h-3.5" />
          <span>GO PRO MEMBERSHIP</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
          Supercharge Your Trading Education
        </h2>
        <p className="text-xs md:text-sm text-slate-300">
          Unlock all markets, intermediate/advanced levels, disable ads, and get free unlimited practice paper trading.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Active subscription details */}
        {user.proTier !== null && checkoutStep !== 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0E1726] border-2 border-white/10 rounded p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#05D59E]" />
                <h3 className="text-lg font-serif font-bold text-white">Active "Go Pro" Subscription</h3>
              </div>
              <p className="text-xs text-slate-200 max-w-md">
                You are currently subscribed to the <strong className="text-[#05D59E] uppercase font-mono font-bold">{user.proTier}</strong> membership tier. 
                {user.proTier === 'lifetime' ? (
                  <span> Your membership is permanent, meaning all curriculum and updates are unlocked forever!</span>
                ) : (
                  <span> Your billing cycles auto-renews. Next expiration date: <strong className="text-white font-mono font-bold">{new Date(user.proExpiresAt!).toLocaleDateString()}</strong>.</span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="bg-[#0E1726] hover:bg-[#151D2A] text-xs font-bold text-white border border-white/10 px-4 py-2.5 rounded transition"
                >
                  Continue Studying
                </button>
              )}
              <button
                onClick={handleCancelPro}
                className="bg-rose-50 hover:bg-rose-100 text-[#05D59E] hover:text-[#05D59E] border border-rose-200 text-xs font-bold px-4 py-2.5 rounded transition"
              >
                Cancel Subscription (Test Reset)
              </button>
            </div>
          </motion.div>
        )}

        {/* Plan Picker Step */}
        {checkoutStep === 'plan' && user.proTier === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Mandatory Risk Warning Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 font-mono text-center flex items-center justify-center gap-2">
              <span className="font-bold text-emerald-400">Risk Notice:</span> Trading involves financial risk. Educational content does not guarantee profits. You may lose your invested capital.
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`cursor-pointer rounded p-5 flex flex-col justify-between transition-all duration-150 relative ${selectedPlan.id === plan.id ? 'border-2 border-[#05D59E] bg-[#05D59E]/5 shadow-[4px_4px_0px_0px_#0F172A]' : 'border border-white/10/20 bg-[#0E1726] hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)]'}`}
                >
                  {plan.highlight && (
                    <div className="absolute top-2 right-2 bg-[#05D59E] text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                      BEST SUPERPOWER
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-white">{plan.name}</h4>
                      <p className="text-[10px] text-slate-300 mt-1 leading-snug">{plan.description}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-3xl font-serif font-bold text-white font-mono">₹{plan.price}</span>
                      <span className="text-xs text-slate-400 font-medium"> / {plan.period}</span>
                    </div>

                    <div className="h-px bg-[#0F172A]/10" />

                    <ul className="space-y-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[10px] text-white">
                          <Check className="w-3.5 h-3.5 text-[#05D59E] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setCheckoutStep('payment');
                    }}
                    className={`w-full py-2.5 rounded text-xs font-bold transition mt-6 ${selectedPlan.id === plan.id ? 'bg-[#05D59E] hover:bg-[#0F172A] text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,0.15)]' : 'bg-[#151D2A] text-slate-200 hover:bg-[#0F172A] hover:text-white'}`}
                  >
                    Select {plan.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Benefit Grid Comparison */}
            <div className="bg-[#0E1726] border-2 border-white/10 rounded p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.15)]">
              <h3 className="text-xs font-mono font-bold text-[#05D59E] uppercase tracking-wider mb-4 text-center">Go Pro Value Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 rounded bg-[#05D59E]/10 text-[#05D59E] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-serif font-bold text-white">Full Syllabus Open</h4>
                  <p className="text-[10px] text-slate-300">Master intermediate & advanced levels of stock, crypto, and forex strategies immediately.</p>
                </div>
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 rounded bg-[#05D59E]/10 text-[#05D59E] flex items-center justify-center">
                    <VolumeX className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-serif font-bold text-white">No Ads, Ever</h4>
                  <p className="text-[10px] text-slate-300">Complete curriculum without visual banner ads. Clean workspace for streamlined focus.</p>
                </div>
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 rounded bg-[#05D59E]/10 text-[#05D59E] flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-serif font-bold text-white">Free Paper Trading</h4>
                  <p className="text-[10px] text-slate-300">Bypass the ₹9 daily charge entirely. Practice orders dynamically on tick-by-tick charts.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Checkout Step */}
        {checkoutStep === 'payment' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto bg-[#0E1726] border-2 border-white/10 rounded p-6 md:p-8 space-y-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
          >
            {/* Heading */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10/10">
              <div>
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Secured Checkout</h3>
                <p className="text-[10px] text-slate-300 font-mono">SUBSCRIBE TO {selectedPlan.name.toUpperCase()}</p>
              </div>
              <span className="text-lg font-serif font-bold text-[#05D59E] font-mono">₹{selectedPlan.price}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 bg-[#151D2A] p-1 border border-white/10/10 rounded">
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition ${paymentMethod === 'upi' ? 'bg-[#0F172A] text-white' : 'text-white/60 hover:text-white'}`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI / PayTM</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`py-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition ${paymentMethod === 'card' ? 'bg-[#0F172A] text-white' : 'text-white/60 hover:text-white'}`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit/Debit Card</span>
              </button>
            </div>

            {/* Forms */}
            <div className="space-y-4">
              {paymentMethod === 'upi' ? (
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Enter your UPI ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. user@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-[#0E1726] border border-white/10/20 hover:border-black focus:border-[#05D59E] focus:outline-none p-3 rounded text-xs font-mono text-white"
                  />
                  <span className="text-[9px] text-slate-400 font-mono block mt-1.5">You will receive a payment request on your UPI app.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="e.g. 4111 2222 3333 4444"
                      value={cardNo}
                      onChange={(e) => setCardNo(e.target.value)}
                      className="w-full bg-[#0E1726] border border-white/10/20 hover:border-black focus:border-[#05D59E] focus:outline-none p-3 rounded text-xs font-mono text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full bg-[#0E1726] border border-white/10/20 focus:outline-none p-3 rounded text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="***"
                        maxLength={3}
                        className="w-full bg-[#0E1726] border border-white/10/20 focus:outline-none p-3 rounded text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment security info */}
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200 flex items-center gap-2.5 text-[10px] text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Simulated SSL Encrypted Sandbox. Payments are safe and no actual funds will be charged.</span>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCheckoutStep('plan')}
                className="px-4 py-2 border border-white/10/20 rounded text-xs font-bold text-slate-300 hover:bg-[#151D2A] transition-colors"
              >
                Back to Plans
              </button>
              <button
                type="button"
                onClick={handleSubscribe}
                className="bg-[#05D59E] hover:bg-[#0F172A] hover:text-[#05D59E] text-white px-5 py-2.5 rounded font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-colors"
              >
                <span>Complete Checkout (₹{selectedPlan.price})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Confirmation Step */}
        {checkoutStep === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-[#0E1726] border-2 border-white/10 rounded p-8 text-center space-y-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 animate-bounce text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-white">Upgrade Successful!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Congratulations, you are now a verified <strong className="text-[#05D59E] font-bold">Go Pro</strong> member of SZTrade Learn • A Project by SAMZEN. Enjoy ad-free courses, advanced curriculum, and unlimited paper trading!
              </p>
            </div>

            <div className="bg-[#151D2A] p-4 rounded border border-white/10/10 text-left font-mono space-y-1.5 text-xs text-white">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="text-white font-bold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Access Granted:</span>
                <span className="text-emerald-800 font-bold">LIFETIME & ADVANCED LEVELS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price Paid:</span>
                <span className="text-white">₹{selectedPlan.price} INR</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutStep('plan');
                if (onClose) onClose();
              }}
              className="w-full bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white py-3 rounded font-bold text-xs tracking-wider transition shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
            >
              START STUDYING NOW
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
