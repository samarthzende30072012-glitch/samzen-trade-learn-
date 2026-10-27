import React, { useState } from 'react';
import { STRATEGY_PAMPHLETS, StrategyPamphlet } from '../data/pamphletsData';
import { 
  BookOpen, Sparkles, Printer, CheckCircle2, ChevronRight, X, ArrowUpRight, 
  ShieldCheck, Target, Zap, Clock, Bookmark, Layers, Search, Lock, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StrategyPamphletsProps {
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export default function StrategyPamphlets({
  isPro = false,
  onUpgradeClick = () => {}
}: StrategyPamphletsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePamphlet, setActivePamphlet] = useState<StrategyPamphlet | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Technical Analysis', 'Smart Money (SMC)', 'Risk Management', 'Options & F&O', 'Psychology'];

  const filteredPamphlets = STRATEGY_PAMPHLETS.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchQuery =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Addictive Rhyme Hook */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A0E17] via-[#111827] to-[#0A0E17] border border-white/10 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FF87]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Samzen Institutional Knowledge Vault</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
              Strategy Pamphlets & <span className="text-[#00FF87]">Tactical Cheat Sheets</span>
            </h1>
            <p className="text-sm font-sans text-slate-300 leading-relaxed italic">
              "Master the Chart, Before Markets Tear You Apart. Trade with Precision, Fuel Your Vision."
            </p>
            <p className="text-xs text-slate-400">
              High-resolution institutional blueprints, risk matrices, and order-block checklists designed for zero lag instant study.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#151D2A] border border-white/10 rounded-xl p-3 text-center min-w-[110px]">
              <span className="text-2xl font-mono font-black text-[#00FF87] block">{STRATEGY_PAMPHLETS.length}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Blueprints</span>
            </div>
            <div className="bg-[#151D2A] border border-white/10 rounded-xl p-3 text-center min-w-[110px]">
              <span className="text-2xl font-mono font-black text-[#FFD700] block">100%</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Institutional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#00FF87] text-[#0A0E17] shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                  : 'bg-[#151D2A] text-slate-300 hover:text-white hover:bg-[#1E293B] border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search strategies, SMC, RSI..."
            className="w-full bg-[#151D2A] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
          />
        </div>
      </div>

      {/* Pamphlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPamphlets.map((pamphlet) => (
          <div
            key={pamphlet.id}
            onClick={() => setActivePamphlet(pamphlet)}
            className="group bg-[#0E1522] hover:bg-[#131D2E] border border-white/10 hover:border-[#00FF87]/50 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-[0_4px_24px_rgba(0,255,135,0.12)] hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20">
                  {pamphlet.badge}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {pamphlet.readTime}
                </span>
              </div>

              <div>
                <h3 className="text-base font-serif font-bold text-white group-hover:text-[#00FF87] transition-colors">
                  {pamphlet.title}
                </h3>
                <p className="text-xs text-[#00F0FF]/80 font-mono mt-1 line-clamp-1">{pamphlet.subtitle}</p>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{pamphlet.summary}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[11px]">{pamphlet.sections.length} Core Modules</span>
              <span className="text-[#00FF87] font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Blueprint <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail / Full View Modal */}
      <AnimatePresence>
        {activePamphlet && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0A0E17] border border-white/20 text-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative my-auto p-6 md:p-8 space-y-6"
            >
              {/* Top Controls */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30">
                    {activePamphlet.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">• {activePamphlet.readTime}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isPro ? (
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-white bg-[#00FF87]/20 border border-[#00FF87]/40 hover:bg-[#00FF87]/30 rounded-lg transition"
                      title="Download / Print Blueprint (Pro Unlocked)"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00FF87]" />
                      <span>Download PDF</span>
                    </button>
                  ) : (
                    <button
                      onClick={onUpgradeClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg transition"
                      title="Download locked for free users. Click to upgrade."
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Download (Pro Only)</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActivePamphlet(null)}
                    className="p-2 text-slate-400 hover:text-white bg-[#151D2A] hover:bg-rose-900/40 rounded-lg border border-white/10 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Hook */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-serif font-black text-white">{activePamphlet.title}</h2>
                <p className="text-sm font-mono text-[#00F0FF]">{activePamphlet.subtitle}</p>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] p-3.5 rounded-xl border border-white/5">
                  {activePamphlet.summary}
                </p>
              </div>

              {/* Formula Callout if any */}
              {activePamphlet.formula && (
                <div className="bg-[#151D2A] border-l-4 border-[#00FF87] p-4 rounded-r-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#00FF87] font-bold tracking-wider">
                    Institutional Math Formula
                  </span>
                  <p className="font-mono text-xs md:text-sm text-white font-bold">{activePamphlet.formula}</p>
                </div>
              )}

              {/* Content Sections */}
              <div className="space-y-6">
                {activePamphlet.sections.map((section, idx) => (
                  <div key={idx} className="bg-[#0E1522] border border-white/10 rounded-xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#00FF87]" />
                      {section.heading}
                    </h4>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {section.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="text-[#00FF87] mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {section.highlight && (
                      <div className="bg-[#151D2A] border border-[#FFD700]/30 text-[#FFD700] rounded-lg p-3 text-xs font-mono font-medium">
                        💡 {section.highlight}
                      </div>
                    )}

                    {section.rules && (
                      <div className="bg-black/40 rounded-lg p-3 border border-white/5 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                          Execution Rules:
                        </span>
                        {section.rules.map((rule, rIdx) => (
                          <p key={rIdx} className="text-xs text-[#00FF87] font-mono flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{rule}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Key Takeaways */}
              <div className="bg-gradient-to-r from-[#00FF87]/10 via-[#00F0FF]/10 to-[#00FF87]/10 border border-[#00FF87]/30 rounded-xl p-5 space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-[#00FF87] flex items-center gap-1.5 tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Key Takeaway Discipline:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {activePamphlet.keyTakeaways.map((takeaway, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2">
                      <span className="text-[#00FF87] font-bold">✓</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Close Button */}
              <div className="pt-2 text-right">
                <button
                  onClick={() => setActivePamphlet(null)}
                  className="px-6 py-2.5 bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono font-black text-xs rounded-lg uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,255,135,0.4)]"
                >
                  Close & Apply to Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
