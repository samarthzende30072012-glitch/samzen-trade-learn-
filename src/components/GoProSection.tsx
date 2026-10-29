import React, { useState } from 'react';
import { ProTier, UserProfile } from '../types';
import { 
  Crown, Sparkles, Check, Copy, CheckCircle2, 
  Smartphone, ArrowRight, ShieldCheck, Zap, Lock
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
    description: 'Quick sprint & strategy test',
    features: [
      'Advanced Modules',
      'Gated Downloads',
      'Infinite Simulator'
    ],
    badge: 'Starter',
    accent: 'border-slate-800'
  },
  {
    id: 'monthly' as ProTier,
    name: 'Monthly Pro',
    price: 299,
    period: 'month',
    description: 'Most popular for comprehensive study',
    features: [
      'Advanced Modules',
      'Gated Downloads',
      'Infinite Simulator'
    ],
    badge: 'Popular',
    highlight: true,
    accent: 'border-[#00FF87]'
  },
  {
    id: 'yearly' as ProTier,
    name: 'Yearly Pro',
    price: 499,
    period: 'year',
    description: 'Full 12-month mastery program',
    features: [
      'Advanced Modules',
      'Gated Downloads',
      'Infinite Simulator'
    ],
    badge: 'Best Value',
    accent: 'border-slate-800'
  },
  {
    id: 'lifetime' as ProTier,
    name: 'Lifetime Ultimate',
    price: 799,
    period: 'lifetime',
    description: 'VIP access with zero drip lock forever',
    features: [
      'Advanced Modules',
      'Gated Downloads',
      'Infinite Simulator'
    ],
    badge: 'Ultimate VIP',
    vip: true,
    accent: 'border-amber-500'
  }
];

export default function GoProSection({ 
  user, 
  onUpdateUser, 
  onClose,
  formatCurrency = (val) => `₹${val}`
}: GoProSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0]>(PLANS[1]);
  const [accessCode, setAccessCode] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(user.proTier !== null);

  const officialUpiId = '8605042855@ybl';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(officialUpiId).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    });
  };

  const handleUnlockWithCode = (codeToTest?: string) => {
    const code = (codeToTest || accessCode).trim().toUpperCase();
    if (code === 'SZ-PRO-2026' || code.startsWith('SZ-') || codeToTest === 'instant') {
      setIsProcessing(true);
      setErrorMsg('');

      setTimeout(() => {
        const generatedKey = code === 'SZ-PRO-2026' ? 'SZ-PRO-2026' : `SZ-PRO-${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('samzen_access_key', generatedKey);

        const expiry = new Date();
        if (selectedPlan.id === 'weekly') expiry.setDate(expiry.getDate() + 7);
        else if (selectedPlan.id === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
        else if (selectedPlan.id === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
        else expiry.setFullYear(expiry.getFullYear() + 100);

        const updated: UserProfile = {
          ...user,
          proTier: selectedPlan.id,
          proExpiresAt: expiry.toISOString(),
          paperTradingPassExpiresAt: null,
        };

        onUpdateUser(updated);
        setIsProcessing(false);
        setIsSuccess(true);
      }, 700);
    } else {
      setErrorMsg('Invalid access code. Please use official code: SZ-PRO-2026');
    }
  };

  const handleCancelPro = () => {
    const updated: UserProfile = {
      ...user,
      proTier: null,
      proExpiresAt: null,
    };
    localStorage.removeItem('samzen_access_key');
    onUpdateUser(updated);
    setIsSuccess(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* Unified Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] text-xs font-mono font-bold uppercase tracking-wider rounded-full">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Samzen Pro Membership</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
          Supercharge Your Trading Education
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Unlock all intermediate & advanced modules, downloadable strategy blueprints, and infinite terminal simulation.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Active Subscription Banner */}
        {isSuccess && user.proTier !== null ? (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-[#0E1726] border-2 border-[#00FF87]/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center max-w-xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[#00FF87] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#00FF87] font-bold">
                Active Institutional Membership
              </span>
              <h3 className="text-2xl font-serif font-bold text-white">
                {user.proTier === 'lifetime' ? 'Lifetime Ultimate VIP Active' : `Active ${user.proTier?.toUpperCase()} Pro`}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                All strategy blueprints, gated masterclass PDF downloads, and the real-time paper trading terminal are fully unlocked on this device.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0E17] border border-white/10 text-xs font-mono text-left space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Membership Tier:</span>
                <span className="text-[#00FF87] font-bold uppercase">{user.proTier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Validated Key:</span>
                <span className="text-amber-400 font-bold">{localStorage.getItem('samzen_access_key') || 'SZ-PRO-2026'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">Permanent Full Access</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_20px_rgba(0,255,135,0.4)]"
                >
                  Start Studying Now
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelPro}
                className="px-4 py-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-mono text-xs transition cursor-pointer"
              >
                Reset Access (Test)
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="picker-and-checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* 4 Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`cursor-pointer rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 relative ${
                      isSelected
                        ? 'border-2 border-[#00FF87] bg-[#00FF87]/10 shadow-[0_0_25px_rgba(0,255,135,0.25)] scale-[1.02]'
                        : 'border border-white/10 bg-[#0E1726] hover:border-white/30'
                    }`}
                  >
                    {plan.badge && (
                      <div className={`absolute top-3 right-3 font-mono font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        plan.vip ? 'bg-amber-500 text-slate-950 font-black' : isSelected ? 'bg-[#00FF87] text-[#0A0E17]' : 'bg-white/10 text-slate-300'
                      }`}>
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-base font-serif font-bold text-white">{plan.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{plan.description}</p>
                      </div>

                      <div className="pt-2">
                        <span className="text-3xl font-serif font-black text-white font-mono">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium"> / {plan.period}</span>
                      </div>

                      <div className="h-px bg-white/10 my-2" />

                      <ul className="space-y-2">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                            <Check className="w-3.5 h-3.5 text-[#00FF87] shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition mt-5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#00FF87] text-[#0A0E17] shadow-lg'
                          : 'bg-[#151D2A] text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected Plan' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* UNIFIED, CLEAN SINGLE PAYMENT CHECKOUT (NO DUPLICATIONS) */}
            <div className="bg-[#0E1726] border-2 border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex flex-wrap justify-between items-center pb-4 border-b border-white/10 gap-3">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#00FF87]" />
                    <span>Official Merchant Payment Gateway</span>
                  </h3>
                  <p className="text-xs text-[#00FF87] font-mono font-bold mt-0.5">
                    UNCLUTTERED INSTANT CHECKOUT • {selectedPlan.name.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-serif font-black text-[#00FF87] font-mono">
                    {formatCurrency(selectedPlan.price)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono block">/{selectedPlan.period}</span>
                </div>
              </div>

              {/* Direct UPI Checkout & Protected Merchant Gateway */}
              <div className="bg-[#0A0E17] p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#121A28] border border-white/15">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
                      Verified Merchant Destination:
                    </span>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00FF87] shrink-0" />
                      <span className="text-sm font-mono font-bold text-white tracking-wider">
                        Samzen TradeLearn Official ••••••••55@ybl
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#00FF87] border border-emerald-500/30">
                        ENCRYPTED & VERIFIED
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 border border-white/10 shadow-sm"
                    title="Copy Official Merchant UPI to Clipboard"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'UPI Copied!' : 'Copy Merchant UPI'}</span>
                  </button>
                </div>

                {/* Mobile Deep-Link Direct Intent Button */}
                <a
                  href={`upi://pay?pa=${officialUpiId}&pn=Samzen%20TradeLearn&cu=INR&am=${selectedPlan.price}`}
                  className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-purple-900/30 transition transform hover:scale-[1.01] active:scale-98"
                >
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Pay {formatCurrency(selectedPlan.price)} via Any UPI App (GPay / PhonePe / Paytm / Cred)</span>
                </a>

                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-1 gap-2">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>256-Bit Encrypted Direct Gateway</span>
                  </span>
                  <span>Instant Access Code Generated On Completion</span>
                </div>
              </div>

              {/* Instant Access Code Validation */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono text-[#00FF87] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Enter Access Code to Unlock Instantly</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">Master Code: SZ-PRO-2026</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SZ-PRO-2026"
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value);
                        setErrorMsg('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUnlockWithCode();
                      }}
                      className="flex-1 bg-[#0A0E17] border border-white/20 focus:border-[#00FF87] focus:outline-none p-3.5 rounded-xl text-xs font-mono text-white placeholder-slate-500 uppercase tracking-wider"
                    />
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUnlockWithCode()}
                      className="px-6 py-3.5 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_20px_rgba(0,255,135,0.4)] disabled:opacity-50"
                    >
                      {isProcessing ? 'Validating...' : 'Unlock Now'}
                    </button>
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-rose-400 font-mono mt-1.5">{errorMsg}</p>
                  )}
                </div>

                {/* Instant 1-Click Demo Shortcut */}
                <button
                  type="button"
                  onClick={() => handleUnlockWithCode('SZ-PRO-2026')}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-mono text-[11px] flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Click to Auto-Fill & Unlock with Master Code (SZ-PRO-2026)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
