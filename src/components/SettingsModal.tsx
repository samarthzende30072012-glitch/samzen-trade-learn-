import React from 'react';
import { 
  X, Sun, Moon, Volume2, VolumeX, Wallet, RotateCcw, 
  Check, Sliders, Shield, Sparkles, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  currency: 'INR' | 'USD' | 'EUR';
  onCurrencyChange: (cur: 'INR' | 'USD' | 'EUR') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetCapital?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  currency,
  onCurrencyChange,
  isMuted,
  onToggleMute,
  onResetCapital,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden font-sans transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0E1726] border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#00FF87]/20 text-[#00FF87]'
            }`}>
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">Platform & Terminal Settings</h3>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Samzen System Customization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* 1. Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider block">
                  Color Psychology & Theme
                </label>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Switch between high-contrast Dark Mode and AI-optimized Fresh Light Mode
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#0A0E17] border-[#00FF87] ring-1 ring-[#00FF87] text-white shadow-lg'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-[#121A28] hover:bg-[#1A2538] border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-[#00FF87]" />
                    <span className="font-bold text-xs">Elite Dark</span>
                  </div>
                  {theme === 'dark' && (
                    <CheckCircle2 className="w-4 h-4 text-[#00FF87]" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  Deep Midnight Obsidian (`#0A0E17`). Premium dark aesthetic for night-owl market execution.
                </div>
              </button>

              {/* Fresh Light Theme Card */}
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/30 text-slate-900 shadow-md'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-[#121A28] hover:bg-[#1A2538] border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs">Fresh Light</span>
                  </div>
                  {theme === 'light' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
                  AI-Optimized Focus Theme (`#F8FAFC`). Airy, clean, reducing cognitive fatigue during deep learning.
                </div>
              </button>
            </div>
          </div>

          {/* 2. Currency Selector */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider block">
              Default Display Currency
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {[
                { id: 'INR', label: 'INR (₹)', sub: 'Indian Rupee' },
                { id: 'USD', label: 'USD ($)', sub: 'US Dollar' },
                { id: 'EUR', label: 'EUR (€)', sub: 'Euro' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCurrencyChange(c.id as any)}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    currency === c.id
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                        : 'bg-[#00FF87]/20 border-[#00FF87] text-[#00FF87] font-bold'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-[#121A28] hover:bg-[#1E293B] border-white/5 text-slate-300'
                  }`}
                >
                  <span className="block font-black">{c.label}</span>
                  <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{c.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Audio / Sound Effects */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/5'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-white'
              }`}>
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <div>
                <span className="text-xs font-mono font-bold block">Execution Sound Effects</span>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Synthesized zero-lag order fill chimes & clicks
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : isLight
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#00FF87] text-[#0A0E17]'
              }`}
            >
              {isMuted ? 'Muted' : 'Enabled'}
            </button>
          </div>

          {/* 4. Reset Demo Capital */}
          {onResetCapital && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/5'
            }`}>
              <div>
                <span className="text-xs font-mono font-bold block">Reset Simulation Capital</span>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Restore demo balance to default ₹1,00,000
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onResetCapital();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] shadow-[0_0_15px_rgba(0,255,135,0.4)]'
            }`}
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
