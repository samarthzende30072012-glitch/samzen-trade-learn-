import React, { useState } from 'react';
import { 
  Building2, Globe, ShieldCheck, Sparkles, Award, 
  TrendingUp, Compass, Cpu, Layers, CheckCircle2, ArrowRight,
  Users, Crown, HeartHandshake, AlertTriangle, FileText,
  Lock, Scale, BookOpen, Clock, Mail
} from 'lucide-react';
import { POLICIES, PolicyType } from './LegalPolicies';

interface AboutAndLegalSectionProps {
  onLaunchTerminal: () => void;
  theme?: 'dark' | 'light';
}

export default function AboutAndLegalSection({ onLaunchTerminal, theme = 'dark' }: AboutAndLegalSectionProps) {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'about' | 'legal'>('about');
  const [selectedPolicyId, setSelectedPolicyId] = useState<PolicyType>('risk');

  return (
    <div className={`space-y-8 animate-in fade-in duration-200 transition-colors ${
      isLight ? 'text-slate-800' : 'text-white'
    }`}>
      {/* Top Section Header & Sub-Tabs Switcher */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden shadow-2xl transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-emerald-300'
          : 'bg-gradient-to-r from-[#0A0E17] via-[#0E1726] to-[#0A0E17] border-[#00FF87]/30 shadow-[0_0_30px_rgba(0,255,135,0.08)]'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-[#00FF87]/10" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Samzen Conglomerate Charter</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Official Institutional Infrastructure
              </span>
            </div>

            <h1 className={`text-2xl sm:text-4xl font-serif font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              About Samzen & Complete Legal Policies
            </h1>

            <p className={`text-xs sm:text-sm font-mono leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Discover the founders' vision, institutional pedigree, SEBI regulatory compliance disclaimers, and our strict 48-hour automated refund guarantee.
            </p>
          </div>

          {/* Sub-tab switcher */}
          <div className={`flex items-center p-1 rounded-2xl border font-mono text-xs ${
            isLight ? 'bg-white border-slate-300 shadow-sm' : 'bg-[#0E1726] border-white/10'
          }`}>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-xl font-bold uppercase transition cursor-pointer ${
                activeTab === 'about'
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#00FF87] text-[#0A0E17] font-black'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              🏛️ About Samzen
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`px-4 py-2 rounded-xl font-bold uppercase transition cursor-pointer ${
                activeTab === 'legal'
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#00FF87] text-[#0A0E17] font-black'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              ⚖️ Complete Legal Policies
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ABOUT SAMZEN CONGLOMERATE */}
      {activeTab === 'about' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Founders & Leadership Card */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00FF87]">
                  Founders & Executive Leadership
                </span>
                <h2 className={`text-xl sm:text-2xl font-serif font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  The Visionary Zende Family Pedigree
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30">
                Charter Est. 2026
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Founder 1 */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FF87] to-[#00F0FF] p-0.5 shadow-md">
                    <div className="w-full h-full bg-[#0A0E17] rounded-[10px] flex items-center justify-center font-serif font-black text-white text-lg">
                      SZ
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Mr. Samarth Zende</h3>
                    <span className="text-xs font-mono text-[#00FF87] font-bold">Founder & Chief Executive Officer</span>
                  </div>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  Visionary fintech architect leading product strategy, algorithmic paper execution systems, and institutional smart money research. Dedicated to equipping retail traders with wall-street-grade discipline.
                </p>
              </div>

              {/* Founder 2 */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700] to-amber-500 p-0.5 shadow-md">
                    <div className="w-full h-full bg-[#0A0E17] rounded-[10px] flex items-center justify-center font-serif font-black text-white text-lg">
                      VZ
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Mr. Vinayak Zende</h3>
                    <span className="text-xs font-mono text-[#FFD700] font-bold">Co-Founder & Executive Director</span>
                  </div>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  Senior corporate advisor guiding conglomerate governance, capital structure, ethical operations, and nationwide educational outreach across Indian financial ecosystems.
                </p>
              </div>
            </div>

            {/* Conglomerate Mission Statement */}
            <div className={`p-5 rounded-2xl border text-xs font-mono leading-relaxed space-y-2 ${
              isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-[#00FF87]/5 border-[#00FF87]/20 text-slate-200'
            }`}>
              <strong className="block text-sm font-bold text-white uppercase tracking-wider">
                The Non-Negotiable Samzen Mission:
              </strong>
              <p>
                Over 95% of retail traders surrender capital within their first 90 days due to emotional revenge trading and zero institutional risk mathematics. Samzen TradeLearn exists to eliminate this tragedy by offering zero-risk simulation sandboxes, authentic market synchronization, and strict 1% risk discipline before any trader touches real exchange capital.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETE LEGAL POLICIES & COMPLIANCE DISCLOSURES */}
      {activeTab === 'legal' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left 4 Cols: Policy Menu */}
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block px-1">
                Legal Policies Index (8 Policies)
              </span>

              {POLICIES.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPolicyId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPolicyId(p.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'bg-[#00FF87] text-[#0A0E17] font-black shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-[#0E1726] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold">{p.title}</span>
                      <span className={`text-[10px] block opacity-80 ${isSelected ? '' : 'text-slate-400'}`}>
                        {p.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right 8 Cols: Full Detailed Policy Reader */}
            <div className="md:col-span-8">
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
              }`}>
                {/* Specific Policy Viewers */}
                {selectedPolicyId === 'risk' && (
                  <div className="space-y-4 font-mono text-xs leading-relaxed">
                    <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-sm">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Capital Risk & Market Volatility Disclosure</span>
                    </div>
                    <p className="text-slate-300">
                      Trading stocks, options, futures, forex, and cryptocurrency involves extreme volatility and substantial risk of monetary loss. Past performance, backtesting, or simulation records generated in Samzen TradeLearn do NOT predict or guarantee future real-world market outcomes.
                    </p>
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                      <strong>Mandatory Regulatory Notice:</strong>
                      <p>
                        Samzen TradeLearn is 100% an educational software application and paper trading sandbox. It is strictly NOT a registered SEBI investment advisor, research analyst, broker, portfolio management service (PMS), or asset custodian under any jurisdiction.
                      </p>
                    </div>
                  </div>
                )}

                {selectedPolicyId === 'educational' && (
                  <div className="space-y-4 font-mono text-xs leading-relaxed">
                    <div className="flex items-center gap-2 text-[#00FF87] font-bold uppercase tracking-wider text-sm">
                      <BookOpen className="w-5 h-5" />
                      <span>Educational Framework & Simulation Scope</span>
                    </div>
                    <p className="text-slate-300">
                      All virtual account balances (e.g. ₹1,00,000 demo capital), virtual profits, virtual losses, and chart order fills within this application are strictly synthetic and zero-risk. No real currency is deposited into any exchange, and no real securities are purchased.
                    </p>
                    <ul className="space-y-2 text-slate-400">
                      <li>• Simulated trades do not account for liquidity black swans or real broker margin calls.</li>
                      <li>• All course materials represent institutional educational theory only.</li>
                      <li>• Users are solely responsible for their own independent financial decisions.</li>
                    </ul>
                  </div>
                )}

                {selectedPolicyId === 'terms' && (
                  <div className="space-y-4 font-mono text-xs leading-relaxed">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm">
                      <Scale className="w-5 h-5" />
                      <span>Terms of Service & Strict 48-Hour Refund Policy</span>
                    </div>
                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-1">
                      <strong className="block text-sm uppercase">Non-Negotiable 48-Hour Refund Policy:</strong>
                      <p>
                        Users who purchase a Pro subscription pass are entitled to request a refund strictly within <strong>48 hours</strong> of their initial UPI/card transaction timestamp. The digital QR invoice received upon checkout is mandatory to verify timestamp authenticity. Requests submitted after 48.0 hours are automatically rejected by system policy.
                      </p>
                    </div>
                    <p className="text-slate-300">
                      Accounts are limited to 1 concurrent device session. Sharing access codes or scraping institutional course blueprints is strictly prohibited and results in immediate automated deactivation.
                    </p>
                  </div>
                )}

                {selectedPolicyId !== 'risk' && selectedPolicyId !== 'educational' && selectedPolicyId !== 'terms' && (
                  <div className="space-y-4 font-mono text-xs leading-relaxed">
                    <div className="flex items-center gap-2 text-[#00FF87] font-bold uppercase tracking-wider text-sm">
                      <FileText className="w-5 h-5" />
                      <span>Official Policy Framework</span>
                    </div>
                    <p className="text-slate-300">
                      Samzen Conglomerate maintains rigorous cryptographic protection of student records, access codes, and digital tax invoices. User data is never sold or transferred to third-party telemarketers.
                    </p>
                    <div className="p-4 rounded-xl bg-[#0A0E17] border border-white/10 space-y-2">
                      <span className="font-bold text-white block">Official Grievance Officer & Legal Counsel:</span>
                      <p className="text-slate-400">
                        Email: legal@samzen.com • Founder Office: Mr. Samarth Zende & Mr. Vinayak Zende
                      </p>
                      <p className="text-slate-400">
                        Institutional Headquarters: Samzen Conglomerate Tower, Financial District, Maharashtra, India.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Bottom CTA to launch Terminal */}
      <div className={`p-6 rounded-3xl border text-center space-y-3 ${
        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0E1726] border-white/10'
      }`}>
        <h3 className="text-base font-serif font-black text-white">
          Ready to Train in the Institutional Simulator?
        </h3>
        <p className="text-xs font-mono text-slate-400">
          Experience real-time charts with zero financial risk across Indian Equities, Crypto, and Forex.
        </p>
        <button
          onClick={onLaunchTerminal}
          className="px-6 py-2.5 rounded-xl font-mono font-bold text-xs uppercase bg-[#00FF87] text-[#0A0E17] hover:scale-105 transition cursor-pointer"
        >
          Launch Trading Simulator
        </button>
      </div>
    </div>
  );
}
