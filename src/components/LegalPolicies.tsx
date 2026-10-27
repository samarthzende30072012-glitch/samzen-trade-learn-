import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText, Lock, Scale, Award, X, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type PolicyType = 
  | 'risk' 
  | 'educational' 
  | 'no-profit' 
  | 'financial-loss' 
  | 'accuracy' 
  | 'terms' 
  | 'privacy' 
  | 'copyright';

interface LegalPoliciesProps {
  initialPolicy?: PolicyType;
  isOpen: boolean;
  onClose: () => void;
}

export const POLICIES: { id: PolicyType; title: string; subtitle: string; icon: any }[] = [
  { id: 'risk', title: 'Risk Disclaimer', subtitle: 'Capital exposure & market volatility awareness', icon: AlertTriangle },
  { id: 'educational', title: 'Educational Disclaimer', subtitle: 'Informational & simulation framework scope', icon: BookOpen },
  { id: 'no-profit', title: 'No Profit Guarantee', subtitle: 'Absence of guaranteed financial returns', icon: Scale },
  { id: 'financial-loss', title: 'Financial Loss Disclaimer', subtitle: 'Independent execution & liability limitations', icon: Shield },
  { id: 'accuracy', title: 'Accuracy Disclaimer', subtitle: 'Market data timeliness & informational scope', icon: FileText },
  { id: 'terms', title: 'Terms & Conditions', subtitle: 'Course access, subscriptions & user responsibilities', icon: Award },
  { id: 'privacy', title: 'Privacy Policy', subtitle: 'Data protection, encryption & privacy practices', icon: Lock },
  { id: 'copyright', title: 'Copyright Policy', subtitle: 'Intellectual property & proprietary rights', icon: FileText },
];

export default function LegalPolicies({ initialPolicy = 'risk', isOpen, onClose }: LegalPoliciesProps) {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(initialPolicy);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-5xl h-[85vh] bg-[#0A0A0C] border border-emerald-500/20 rounded-2xl shadow-[0_0_50px_rgba(5,213,158,0.1)] flex flex-col overflow-hidden text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#111318]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-serif font-bold text-lg shadow-[0_0_15px_rgba(5,213,158,0.2)]">
                SZ
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-white tracking-wide flex items-center gap-2">
                  SAMZEN Trade Learn <span className="text-xs px-2 py-0.5 rounded bg-[#00D68F]/10 text-[#00D68F] font-mono border border-[#00D68F]/20">A Project by SAMZEN</span>
                </h2>
                <p className="text-xs text-slate-400">Official Legal Framework & Operating Policies</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar policy list */}
            <div className="w-full md:w-72 border-r border-white/10 bg-[#0E1015] p-3 space-y-1 overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Legal & Policy Center
              </div>
              {POLICIES.map((p) => {
                const Icon = p.icon;
                const isActive = activePolicy === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePolicy(p.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-start gap-3 group ${
                      isActive 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-white shadow-[0_0_15px_rgba(5,213,158,0.1)]' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <div>
                      <div className="text-xs font-semibold leading-tight">{p.title}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Policy Content View */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0A0A0C] space-y-6">
              
              {/* Mandatory Risk Banner */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-200">
                <AlertTriangle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-400 font-semibold block mb-0.5">Mandatory Financial Notice</strong>
                  Trading involves financial risk. Educational content does not guarantee profits. You may lose your invested capital. SZTrade Learn provides education only and does not issue personalized financial advice.
                </div>
              </div>

              {activePolicy === 'risk' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-emerald-400" />
                    Risk Disclaimer
                  </h3>
                  <p>
                    Financial market trading—including stocks, foreign exchange (Forex), commodities, options, and cryptocurrencies—carries a high level of risk and may not be suitable for all investors. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
                  </p>
                  <p>
                    <strong>Capital Exposure:</strong> The possibility exists that you could sustain a loss of some or all of your initial investment; therefore, you should not invest money that you cannot afford to lose. You should be aware of all the risks associated with financial market trading and seek advice from an independent financial advisor if you have any doubts.
                  </p>
                  <p>
                    <strong>Volatility & Leverage:</strong> Leveraged instruments can work both against you and for you. High market volatility, liquidity shocks, and slippage can lead to significant account drawdown or complete loss of capital in live trading environments.
                  </p>
                  <p className="p-3 bg-white/5 rounded-lg border border-white/10 font-mono text-[11px] text-slate-400">
                    SZTrade Learn operates strictly as an educational learning environment and interactive paper trading simulator. No live brokerage execution occurs directly within the platform interface.
                  </p>
                </div>
              )}

              {activePolicy === 'educational' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    Educational Disclaimer
                  </h3>
                  <p>
                    SZTrade Learn is a dedicated educational project operated under the parent brand <strong>SAMZEN</strong>. All modules, courses, video transcripts, AI voice lectures, trade journals, and paper trading sandbox tools are provided exclusively for general educational, informational, and simulation purposes.
                  </p>
                  <p>
                    <strong>No Personalized Investment Advice:</strong> None of the materials, chart demonstrations, case studies, or simulated trade scenarios constitute personalized financial, investment, tax, or legal advice. Content is designed to illustrate structural market mechanics, technical analysis principles, and risk management frameworks.
                  </p>
                  <p>
                    <strong>No Accreditation Claims:</strong> SZTrade Learn and SAMZEN make no claims of SEBI (Securities and Exchange Board of India) registration, SEC accreditation, or official government financial license endorsement. Our platform is an independent private educational platform.
                  </p>
                </div>
              )}

              {activePolicy === 'no-profit' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    No Profit Guarantee
                  </h3>
                  <p>
                    <strong>No Profit or Return Guarantees:</strong> SZTrade Learn does not guarantee trading profits, minimum investment returns, or successful market outcomes under any circumstances. Historical backtest results, case studies, and paper trading performances presented in lessons are illustrative and do not predict future live market performance.
                  </p>
                  <p>
                    Individual trading results depend on personal discipline, market conditions, risk management, capital allocation, and external factors beyond the scope of educational instruction.
                  </p>
                  <p className="p-3 bg-white/5 rounded-lg border border-white/10 text-slate-400">
                    Users must acknowledge that simulated paper trading results differ inherently from real-world execution due to market slippage, order queue priority, liquidity constraints, and emotional pressures.
                  </p>
                </div>
              )}

              {activePolicy === 'financial-loss' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Financial Loss Disclaimer & Liability Limitations
                  </h3>
                  <p>
                    Users are solely responsible for their independent financial decisions, trade entries, risk management choices, and live brokerage activities. SZTrade Learn, SAMZEN, its founders, instructors, and affiliates disclaim all liability for any direct, indirect, consequential, or incidental losses or damages arising from reliance on information provided on this platform.
                  </p>
                  <p>
                    Liability limitations apply to the maximum extent permitted by applicable law in relevant jurisdictions.
                  </p>
                </div>
              )}

              {activePolicy === 'accuracy' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    Accuracy Disclaimer
                  </h3>
                  <p>
                    While SZTrade Learn strives to maintain high-quality, up-to-date educational materials and accurate simulated market data feeds, market conditions evolve rapidly. Information, chart examples, and regulatory contexts may become outdated over time or contain inadvertent typographical or technical errors.
                  </p>
                  <p>
                    SZTrade Learn reserves the right to update syllabus content, lesson notes, and simulated data feeds without prior notice.
                  </p>
                </div>
              )}

              {activePolicy === 'terms' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    Terms & Conditions
                  </h3>
                  <p>
                    <strong>Course Access & Subscriptions:</strong> Registration provides non-transferable individual access to SZTrade Learn courses, paper trading sandbox tools, and community integrations. Unlocked subscriptions (such as Go Pro Lifetime access at ₹799) grant lifetime access to the educational syllabus and ad-free sandbox tools.
                  </p>
                  <p>
                    <strong>Payments & Refunds:</strong> All payments processed through authorized gateways are subject to standard digital product terms. Standard refund requests can be requested within 7 days of initial purchase if less than 20% of premium content has been consumed. [Confirmation Placeholder: Contact support at support@samzentradingcourse.com for specific account queries].
                  </p>
                  <p>
                    <strong>User Conduct:</strong> Account sharing, automated scraping, content re-distribution, or commercial resale of SZTrade Learn materials is strictly prohibited.
                  </p>
                </div>
              )}

              {activePolicy === 'privacy' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-400" />
                    Privacy Policy
                  </h3>
                  <p>
                    <strong>Data Collection & Security:</strong> SZTrade Learn respects your digital privacy. We collect minimal personal information required for account authentication (email address, full name, phone number for secure login) and local learning progress tracking.
                  </p>
                  <p>
                    <strong>Data Protection:</strong> All user profiles and simulated portfolio records are secured using standard Firebase authentication protocols and encrypted local storage. We do not sell or monetize personal data to third-party ad brokers.
                  </p>
                  <p>
                    <strong>Google Workspace Integration:</strong> When connecting Google Docs for Trade Journal exporting, authorization tokens are processed client-side through official Google OAuth scopes and used solely to create and export your personal trade notes.
                  </p>
                </div>
              )}

              {activePolicy === 'copyright' && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    Copyright & Intellectual Property Policy
                  </h3>
                  <p>
                    All original course syllabi, lesson text, proprietary slide decks, robotic voice transcriptions, logo marks, and visual graphics are the exclusive intellectual property of <strong>SAMZEN</strong> and <strong>SZTrade Learn</strong>.
                  </p>
                  <p>
                    All rights reserved. No part of this website may be reproduced, distributed, or transmitted in any form or by any means without express written permission from SAMZEN.
                  </p>
                </div>
              )}

              {/* Confirmation Footer */}
              <div className="pt-6 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>SZTrade Learn • A Project by SAMZEN</span>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                >
                  I Understand & Accept
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
