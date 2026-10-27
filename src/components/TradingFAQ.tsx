import React, { useState } from 'react';
import { TRADING_FAQS, FAQItem } from '../data/faqData';
import { HelpCircle, Search, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TradingFAQ() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(TRADING_FAQS[0]?.id || null);

  const categories = ['All', 'Indian Equities & F&O', 'Forex', 'Crypto', 'Options', 'Simulator & Risk'];

  const filteredFaqs = TRADING_FAQS.filter((faq) => {
    const matchCat = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A0E17] via-[#111827] to-[#0A0E17] border border-white/10 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-bold tracking-wider uppercase">
            <HelpCircle className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Interactive Knowledge Base & FAQ</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">
            Frequently Asked <span className="text-[#00F0FF]">Questions</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Clear, authoritative answers covering Indian Market hours, Options Greeks, Forex pips, Crypto mechanics, and risk management guidelines.
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#00F0FF] text-[#0A0E17] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'bg-[#151D2A] text-slate-300 hover:text-white hover:bg-[#1E293B] border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by topic or keyword..."
            className="w-full bg-[#151D2A] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
          />
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-[#0E1522] border border-white/10 rounded-xl text-slate-400 font-mono text-xs">
            No matching questions found for "{searchQuery}". Try searching for 'hours', 'theta', or 'forex'.
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-[#0E1522] border border-white/10 rounded-xl overflow-hidden transition-colors hover:border-white/20"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full p-4 md:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00F0FF] block">
                      {faq.category}
                    </span>
                    <h3 className="text-sm md:text-base font-serif font-bold text-white hover:text-[#00FF87] transition-colors">
                      {faq.question}
                    </h3>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[#151D2A] text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#00FF87]" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/5 bg-[#121A28] px-4 md:px-5 py-4 text-xs md:text-sm text-slate-300 leading-relaxed space-y-3"
                    >
                      <p>{faq.answer}</p>
                      <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-black/30 border border-white/5 rounded px-2 py-0.5 text-[10px] font-mono text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
