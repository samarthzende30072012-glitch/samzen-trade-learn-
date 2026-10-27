import React from 'react';
import { 
  Building2, Globe, ShieldCheck, Sparkles, Award, 
  TrendingUp, Compass, Cpu, Layers, CheckCircle2, ArrowRight
} from 'lucide-react';

interface AboutSamzenProps {
  onLaunchTerminal: () => void;
  onOpenLegal: () => void;
}

export default function AboutSamzen({ onLaunchTerminal, onOpenLegal }: AboutSamzenProps) {
  const [showFounderModal, setShowFounderModal] = React.useState(true);

  return (
    <div className="space-y-8">
      {/* Prestigious Origin Hero Box */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A0E17] via-[#0E1726] to-[#0A0E17] border border-white/10 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FF87]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700] animate-pulse" />
              <span>Inaugural Flagship Institution</span>
            </div>
            <span className="text-xs font-mono text-slate-400">Founded under the Samzen Global Charter</span>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h2 className="text-2xl md:text-4xl font-serif font-black text-white tracking-tight">
              About the <span className="text-[#00FF87]">Samzen</span> Conglomerate
            </h2>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-sans">
              <strong>Samzen TradeLearn</strong> is the inaugural flagship educational project of <strong className="text-white">Samzen</strong>, a visionary multi-sector conglomerate dedicated to financial intelligence, algorithmic systems, educational technology, and scalable global infrastructure.
            </p>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Founded on the conviction that financial markets punish the unprepared, Samzen created TradeLearn to bridge the divide between retail ambition and institutional execution. Before risking a single rupee, dollar, or euro in real-world exchanges, traders train in an authentic institutional-grade simulation sandbox powered by live real-time feeds and institutional risk frameworks.
            </p>
          </div>

          {/* Core Conglomerate Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-[#121A28] border border-white/10 rounded-2xl p-5 space-y-2 hover:border-[#00FF87]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/30 flex items-center justify-center text-[#00FF87]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Zero-Risk Simulation First</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Experience real market volatility, bid-ask spreads, and emotional pressure in a safe paper trading terminal before risking personal capital.
              </p>
            </div>

            <div className="bg-[#121A28] border border-white/10 rounded-2xl p-5 space-y-2 hover:border-[#00F0FF]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Institutional SMC Frameworks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Learn Smart Money Concepts, Order Blocks, Liquidity Sweeps, and Options Greeks rather than outdated retail indicators.
              </p>
            </div>

            <div className="bg-[#121A28] border border-white/10 rounded-2xl p-5 space-y-2 hover:border-[#FFD700]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700]">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Mathematical Risk Discipline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Internalize the non-negotiable 1% Risk Rule, asymmetric 1:2 and 1:3 reward matrices, and circuit-breaker loss limits.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-serif font-black">
                S
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white uppercase block">Samzen Conglomerate</span>
                <span className="text-[10px] font-mono text-slate-400">Financial Technology & Intelligence Division</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onOpenLegal}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#151D2A] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-bold transition"
              >
                Terms & Disclaimers
              </button>
              <button
                type="button"
                onClick={onLaunchTerminal}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,255,135,0.4)] flex items-center justify-center gap-2"
              >
                <span>Launch Trading Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Founder & Visionary Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0E1726] via-[#121E31] to-[#0E1726] border border-white/10 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group cursor-pointer" onClick={() => setShowFounderModal(true)}>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00FF87] to-[#00F0FF] rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative w-64 h-80 rounded-2xl overflow-hidden border-2 border-white/20 bg-[#0A0E17] shadow-2xl">
                <img
                  src="/assets/aistudio/Trading_Course_Studio_Portrait_7fadb48f.png"
                  alt="Samarth Zende - Founder & Chief Architect"
                  className="w-full h-full object-cover object-top transform group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17]/90 via-transparent to-transparent flex items-end p-4">
                  <div className="text-center w-full">
                    <span className="text-xs font-mono text-[#00FF87] font-bold block uppercase tracking-wider">Click to Expand Photo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#00FF87]" />
              <span>Visionary Leadership</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
              Samarth Zende
            </h3>
            <span className="text-sm font-mono text-[#00F0FF] block font-semibold">
              Founder & CEO, Samzen Conglomerate & Samzen TradeLearn
            </span>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              "Markets are not random chaos; they are the ultimate crucible where human psychology, institutional liquidity, and mathematical probability intersect. I founded Samzen TradeLearn to provide ambitious traders with the rigorous education, institutional methodologies, and uncompromised risk frameworks required to conquer the markets rather than fall victim to them."
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-[#0A0E17]/80 border border-white/10 rounded-xl p-3">
                <span className="text-xs font-mono text-slate-400 block">Core Philosophy</span>
                <span className="text-sm font-bold text-white font-serif">Capital Preservation First</span>
              </div>
              <div className="bg-[#0A0E17]/80 border border-white/10 rounded-xl p-3">
                <span className="text-xs font-mono text-slate-400 block">Mission</span>
                <span className="text-sm font-bold text-white font-serif">Elite Retail Empowerment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Founder Lightbox Modal */}
      {showFounderModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowFounderModal(false)}>
          <div className="relative max-w-lg w-full bg-[#0E1726] border border-white/20 rounded-3xl p-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-2">
              <div>
                <h4 className="text-base font-serif font-bold text-white">Samarth Zende</h4>
                <p className="text-xs font-mono text-[#00FF87]">Founder & CEO, Samzen Conglomerate & TradeLearn</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFounderModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-mono font-bold transition"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0A0E17] max-h-[75vh] flex items-center justify-center">
              <img
                src="/assets/aistudio/Trading_Course_Studio_Portrait_7fadb48f.png"
                alt="Samarth Zende - Full Studio Portrait"
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs font-mono text-slate-400">Samzen Global Flagship Leadership • Studio Headquarters</p>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Terms of Service & Financial Policy Section */}
      <div className="bg-[#0E1726] border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-white">Terms of Service and Financial Policy</h3>
            <p className="text-xs font-mono text-slate-400">Educational Simulation Disclaimer & Liability Exclusion</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300 leading-relaxed">
          <div className="bg-[#0A0E17] border border-white/5 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase text-[#00FF87] block">1. 100% Educational Simulation Scope</span>
            <p className="text-slate-400">
              Samzen TradeLearn is strictly an interactive learning platform and simulated paper trading environment. All portfolio balances, order tickets, profits, and losses are virtual demo units possessing zero real monetary value. No real financial capital is deposited or executed on live brokerage exchanges through this application.
            </p>
          </div>

          <div className="bg-[#0A0E17] border border-white/5 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase text-[#FF3366] block">2. Extreme Risk of Capital Loss in Real Markets</span>
            <p className="text-slate-400">
              Trading equities, options, futures, forex, and cryptocurrency in live financial markets carries substantial risk of financial loss and is not suitable for all investors. An investor could potentially lose all or more than their initial investment. High simulation returns do not guarantee future live performance.
            </p>
          </div>

          <div className="bg-[#0A0E17] border border-white/5 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase text-[#00F0FF] block">3. Complete Absence of Financial Advice</span>
            <p className="text-slate-400">
              Nothing contained within the course modules, audio lectures, strategy pamphlets, or market feeds constitutes financial, legal, tax, or investment advice. Samzen and its instructors are educators, not SEBI-registered research analysts or certified investment advisors.
            </p>
          </div>

          <div className="bg-[#0A0E17] border border-white/5 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase text-[#FFD700] block">4. Total Limitation of Liability</span>
            <p className="text-slate-400">
              By accessing Samzen TradeLearn, you explicitly agree that Samzen, its parent conglomerate, founders, developers, and affiliates are held harmless and cleared of any liability for any personal trading decisions, losses, or damages arising directly or indirectly from the use of this software.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Official Charter Version 2026.1 • Legal Compliance Enforced</span>
          <button
            type="button"
            onClick={onOpenLegal}
            className="text-[#00FF87] hover:underline font-bold"
          >
            View Complete Legal Documentation ➔
          </button>
        </div>
      </div>
    </div>
  );
}
