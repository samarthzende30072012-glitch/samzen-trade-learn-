import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Sparkles } from 'lucide-react';

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function AnimatedTradingChart() {
  const [market, setMarket] = useState<'NIFTY 50' | 'BTC/USD' | 'EUR/USD'>('BTC/USD');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(68420.50);
  const [priceChange, setPriceChange] = useState<number>(+2.45);

  // Initialize candles
  useEffect(() => {
    let base = market === 'BTC/USD' ? 68000 : market === 'NIFTY 50' ? 24500 : 1.0850;
    const initial: Candle[] = [];
    for (let i = 0; i < 20; i++) {
      const open = base + (Math.random() - 0.48) * (base * 0.004);
      const close = open + (Math.random() - 0.45) * (base * 0.005);
      const high = Math.max(open, close) + Math.random() * (base * 0.002);
      const low = Math.min(open, close) - Math.random() * (base * 0.002);
      const volume = Math.floor(Math.random() * 500 + 200);
      initial.push({
        time: `${10 + Math.floor(i / 2)}:${(i % 2) * 30 || '00'}`,
        open, high, low, close, volume
      });
      base = close;
    }
    setCandles(initial);
    setCurrentPrice(base);
  }, [market]);

  // Simulated live chart ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.47) * (last.close * 0.002);
        const newClose = last.close + delta;
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);
        
        setCurrentPrice(newClose);
        setPriceChange((prevChange) => +(prevChange + delta * 0.01).toFixed(2));

        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          high: newHigh,
          low: newLow,
          close: newClose,
          volume: last.volume + Math.floor(Math.random() * 15)
        };
        return updated;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const isUp = priceChange >= 0;

  return (
    <div className="w-full bg-[#0E1726] border border-[#1D2A3E] rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#3DA9FC]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#59E3FF]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Controls & Ticker Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1D2A3E] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#070B14]/80 rounded-xl border border-[#1D2A3E]">
            {(['BTC/USD', 'NIFTY 50', 'EUR/USD'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMarket(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  market === m 
                    ? 'bg-[#3DA9FC] text-[#070B14] font-bold shadow-[0_0_15px_rgba(61,169,252,0.4)]' 
                    : 'text-[#9DB0C8] hover:text-[#EEF3FA]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#3DA9FC]/15 text-[#59E3FF] border border-[#3DA9FC]/30 text-[10px] font-mono font-semibold">
            <Activity className="w-3 h-3 animate-pulse" /> LIVE SIMULATION
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <div className="text-right">
            <div className="text-xs text-[#9DB0C8] uppercase tracking-widest text-[10px]">Real-Time Feed</div>
            <div className="text-lg font-bold text-[#EEF3FA] tracking-tight">
              {market === 'EUR/USD' ? `$${currentPrice.toFixed(4)}` : `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
            isUp 
              ? 'bg-[#3DA9FC]/20 text-[#59E3FF] border-[#3DA9FC]/40' 
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isUp ? '+' : ''}{priceChange}%
          </div>
        </div>
      </div>

      {/* Candlestick Canvas Simulation */}
      <div className="relative h-64 md:h-72 w-full flex items-end gap-1.5 sm:gap-2 pt-6 pb-8 border-b border-[#1D2A3E]/60 px-2">
        {/* Horizontal Price Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 text-[9px] font-mono text-[#9DB0C8]">
          <div className="border-b border-dashed border-[#1D2A3E] w-full flex justify-between"><span>Resistance 1</span><span>$70,200</span></div>
          <div className="border-b border-dashed border-[#59E3FF]/60 w-full flex justify-between text-[#59E3FF]"><span>Smart Money Order Block</span><span>POC</span></div>
          <div className="border-b border-dashed border-[#1D2A3E] w-full flex justify-between"><span>Demand Support</span><span>$66,800</span></div>
        </div>

        {/* Candlestick Rendering */}
        {candles.map((c, idx) => {
          const minP = Math.min(...candles.map((x) => x.low));
          const maxP = Math.max(...candles.map((x) => x.high));
          const range = maxP - minP || 1;

          const candleHeightPercent = Math.max(10, (Math.abs(c.close - c.open) / range) * 100);
          const candleBottomPercent = ((Math.min(c.open, c.close) - minP) / range) * 80;
          const wickHeightPercent = (Math.abs(c.high - c.low) / range) * 100;
          const wickBottomPercent = ((c.low - minP) / range) * 80;

          const isBull = c.close >= c.open;

          return (
            <div key={idx} className="flex-1 relative h-full flex flex-col justify-end items-center group">
              {/* Wick */}
              <div 
                className={`absolute w-[1.5px] ${isBull ? 'bg-[#59E3FF]' : 'bg-rose-400'} opacity-80 group-hover:opacity-100 transition-opacity`}
                style={{
                  height: `${wickHeightPercent}%`,
                  bottom: `${wickBottomPercent}%`
                }}
              />
              {/* Body */}
              <div 
                className={`w-full max-w-[14px] rounded-sm transition-all duration-300 relative z-10 ${
                  isBull 
                    ? 'bg-gradient-to-t from-[#3DA9FC] to-[#59E3FF] border border-[#59E3FF]/50 shadow-[0_0_10px_rgba(89,227,255,0.3)]' 
                    : 'bg-gradient-to-t from-rose-600 to-rose-400 border border-rose-300/40'
                }`}
                style={{
                  height: `${candleHeightPercent}%`,
                  bottom: `${candleBottomPercent}%`
                }}
              />
              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#070B14] border border-[#1D2A3E] p-2 rounded-lg text-[10px] font-mono text-[#EEF3FA] z-30 shadow-xl whitespace-nowrap">
                <div>O: {c.open.toFixed(2)}</div>
                <div>H: {c.high.toFixed(2)}</div>
                <div>L: {c.low.toFixed(2)}</div>
                <div className={isBull ? 'text-[#59E3FF] font-bold' : 'text-rose-400 font-bold'}>C: {c.close.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-chart Overlay / Educational Signal Tag */}
      <div className="mt-4 pt-2 flex flex-wrap justify-between items-center text-xs text-[#9DB0C8] font-mono gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-[#9DB0C8]/80">Masterclass Signal:</span>
          <span className="px-2.5 py-1 rounded-md bg-[#3DA9FC]/15 border border-[#3DA9FC]/30 text-[#59E3FF] font-bold text-[11px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#59E3FF]" /> INSTITUTIONAL DEMAND REJECTION
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-[#9DB0C8]">RSI: <strong className="text-[#59E3FF]">58.4 (Bullish Zone)</strong></span>
          <span className="text-[#9DB0C8]">20 EMA: <strong className="text-[#EEF3FA]">Above 50 EMA</strong></span>
        </div>
      </div>
    </div>
  );
}
