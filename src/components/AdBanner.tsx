import React, { useState, useEffect } from 'react';
import { VolumeX, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AdBannerProps {
  isPro: boolean;
  onGoProClick: () => void;
}

const TRADING_ADS = [
  {
    title: "⚠️ TIRED OF LIQUIDATED SHORTS?",
    tagline: "95% of retail traders lose money in their first year. Don't be a statistic.",
    cta: "Unlock Institutional secrets with SZTrade Learn 'Go Pro'.",
    buttonText: "Go Pro - Lifetime for ₹799"
  },
  {
    title: "📈 ZERO FEES. INFINITE PAPER TRADING.",
    tagline: "Free members pay ₹9/day for Paper Trading. Pro members trade 100% free forever.",
    cta: "Add unlimited demo cash and test strategies risk-free.",
    buttonText: "Upgrade Now"
  },
  {
    title: "🔓 UNLOCK ALL LESSONS INSTANTLY",
    tagline: "Drip content limits you to 2 topics per day. Lifetime members get instant, permanent access.",
    cta: "Bypass the timer and study at your own pace today.",
    buttonText: "Get Lifetime Access"
  },
  {
    title: "💰 SMART MONEY CONCEPTS",
    tagline: "Learn where central banks and major hedge funds place their orders and sweep liquidity.",
    cta: "Upgrade to Intermediate & Advanced levels now.",
    buttonText: "Go Pro Today"
  }
];

export default function AdBanner({ isPro, onGoProClick }: AdBannerProps) {
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    if (isPro) return;
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % TRADING_ADS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [isPro]);

  if (isPro) {
    return (
      <div className="bg-[#111318] border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span><strong className="text-emerald-400">Go Pro Active</strong>: You are enjoying an ad-free experience, unlimited paper trading, and fully unlocked intermediate & advanced levels.</span>
        </div>
      </div>
    );
  }

  const activeAd = TRADING_ADS[adIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={adIndex}
      className="relative bg-[#111318] border border-emerald-500/30 rounded-xl p-5 overflow-hidden shadow-[0_0_20px_rgba(5,213,158,0.1)] text-slate-100"
    >
      <span className="absolute top-2 right-2 text-[9px] font-mono bg-emerald-500 text-black font-bold px-2 py-0.5 rounded uppercase">
        SPONSORED AD
      </span>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
        <div className="space-y-1 pr-12">
          <div className="text-emerald-400 font-mono text-xs font-bold tracking-wider flex items-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5" />
            {activeAd.title}
          </div>
          <h4 className="text-base font-serif italic font-bold text-white tracking-tight">
            {activeAd.tagline}
          </h4>
          <p className="text-xs text-slate-400">
            {activeAd.cta}
          </p>
        </div>

        <button
          onClick={onGoProClick}
          className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold px-4 py-2.5 rounded-lg transition-colors duration-150 flex items-center gap-1.5 shadow-[0_0_15px_rgba(5,213,158,0.3)]"
        >
          <span>{activeAd.buttonText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
