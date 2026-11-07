import React, { useState } from 'react';
import { 
  BookOpen, Sparkles, Award, ArrowRight, ShieldCheck, 
  TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle,
  Volume2, VolumeX, Pause, Square, FileText, Download,
  Layers, BarChart2, Eye, Compass, Zap, Flame, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IMOConceptNotesProps {
  onLaunchTerminal: () => void;
  theme?: 'dark' | 'light';
}

export interface IMOConcept {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  accentColor: string;
  badge: string;
  category: 'SMC' | 'RISK' | 'STRUCTURE' | 'PSYCHOLOGY';
  summary: string;
  imoTakeaway: string;
  retailTrap: string;
  smartMoneyExecution: string;
  rules: string[];
  formula?: {
    name: string;
    expression: string;
    example: string;
  };
}

export const IMO_CONCEPTS: IMOConcept[] = [
  {
    id: 'order-block',
    number: '01',
    title: 'Order Blocks (OB) & Institutional Footprint',
    subtitle: 'Decoding where central banks and algorithmic liquidity providers load massive size',
    accentColor: '#00FF87',
    badge: 'Core SMC Pillar',
    category: 'SMC',
    summary: 'An Order Block is the last opposing candle before a violent, high-volume displacement move that breaks market structure. It represents unfilled institutional limit orders waiting to be mitigated.',
    imoTakeaway: 'IMO: Never chase breakouts into mid-air. Wait patiently for price to retrace and tap the 50% equilibrium (Mean Threshold) of the valid Order Block with confirming lower-timeframe rejection.',
    retailTrap: 'Retail traders buy the green breakout candle after the move has already extended 80 points, becoming liquidity exit fodder for smart money.',
    smartMoneyExecution: 'Institutions patiently wait for retail breakout buyers to be trapped, allow price to retest the Order Block unmitigated wick, and enter with a microscopic 5-point stop loss for a 1:4 risk-to-reward.',
    rules: [
      'Must cause a clear Break of Structure (BOS) or Change of Character (CHoCH).',
      'Must leave a Fair Value Gap (FVG) immediately following the order block.',
      'Entry is valid at either the Open or the 50% Mean Threshold of the order block candle.',
      'Invalidated if price closes completely beyond the opposite wick of the block.'
    ]
  },
  {
    id: 'fair-value-gap',
    number: '02',
    title: 'Fair Value Gaps (FVG) & Price Imbalances',
    subtitle: 'Exploiting the inefficiencies created by one-sided institutional buying or selling',
    accentColor: '#00F0FF',
    badge: 'Liquidity Imbalance',
    category: 'SMC',
    summary: 'An FVG is a 3-candle price formation where candle 1 high and candle 3 low do not overlap, leaving an imbalance space where only one side of the market was delivered.',
    imoTakeaway: 'IMO: The market is an algorithmic auction that hates inefficiencies. A Fair Value Gap acts as an institutional magnet; price almost always returns to fill at least 50% (CE - Consequent Encroachment) of the void.',
    retailTrap: 'Retailers view large candles as "too high to buy" or try to blindly fade massive momentum without waiting for imbalance mitigation.',
    smartMoneyExecution: 'Identify high-timeframe FVG, set limit alerts at the Consequent Encroachment (50% mark), and enter in the direction of the dominant institutional displacement.',
    rules: [
      'Formed strictly across 3 consecutive candles with no wick overlap between candle 1 and candle 3.',
      'Consequent Encroachment (CE) represents the true 50% algorithmic equilibrium level.',
      'Look for confluence where an FVG aligns directly with an unmitigated Order Block.'
    ]
  },
  {
    id: 'market-structure',
    number: '03',
    title: 'Market Structure: BOS vs CHoCH',
    subtitle: 'True trend continuation versus institutional reversal signals',
    accentColor: '#8B5CF6',
    badge: 'Structural Flow',
    category: 'STRUCTURE',
    summary: 'Break of Structure (BOS) confirms continuation of the prevailing trend by clearing previous swing highs/lows. Change of Character (CHoCH) is the first aggressive break against the trend, signaling institutional regime shift.',
    imoTakeaway: 'IMO: 90% of retail trend indicators lag by 14 to 20 bars. Price action structure is immediate; candle body closure beyond a swing point validates institutional commitment.',
    retailTrap: 'Retail traders rely on lagging moving average crosses after the move is 70% complete and get whipsawed when structure reverses.',
    smartMoneyExecution: 'Spot CHoCH on higher timeframe (1H/4H), drop to execution timeframe (5m/15m), and ride the new structure from the very base of the displacement leg.',
    rules: [
      'BOS requires a candle BODY close beyond the previous structural swing point (wicks are liquidity sweeps, not BOS).',
      'CHoCH signals the first shift from Higher-Lows to a Lower-Low, or Lower-Highs to a Higher-High.',
      'Combine structural breaks with trading session times (London Open, NY Open, NSE 09:15-11:30 AM).'
    ]
  },
  {
    id: 'liquidity-pools',
    number: '04',
    title: 'Liquidity Pools & Stop Runs (BSL / SSL)',
    subtitle: 'Where retail stops are concentrated and how institutions harvest them',
    accentColor: '#EC4899',
    badge: 'Order Harvesting',
    category: 'SMC',
    summary: 'Institutions cannot enter 10,000 contracts without slippage unless they find equal opposite retail orders. Buy-Side Liquidity (BSL) rests above double tops; Sell-Side Liquidity (SSL) rests below double bottoms.',
    imoTakeaway: 'IMO: If you cannot spot the liquidity in the market, YOUR stop loss is the liquidity. Treat obvious equal highs and equal lows as target zones to be swept before taking a trade.',
    retailTrap: 'Retailers put their stop losses 2 points above "clean double tops" or below "triple support floors", thinking it is safe.',
    smartMoneyExecution: 'Wait for the false breakout sweep of equal highs (BSL Run), watch for an immediate sharp displacement candle back into range, and enter short targeting internal discount liquidity.',
    rules: [
      'Equal Highs (EQH) = Extreme Buy-Side Liquidity (BSL).',
      'Equal Lows (EQL) = Extreme Sell-Side Liquidity (SSL).',
      'Wait for the raid / sweep candle to complete before executing on reversal confirmation.'
    ]
  },
  {
    id: 'risk-formula',
    number: '05',
    title: 'The Non-Negotiable 1% Capital Risk Matrix',
    subtitle: 'The mathematical equation separating lifelong profitable traders from wiped accounts',
    accentColor: '#F59E0B',
    badge: 'Mathematical Survival',
    category: 'RISK',
    summary: 'Never risk more than 1% of total account equity on any single trade idea. Position sizing is calculated backward from your stop-loss distance, NEVER based on round quantity numbers.',
    imoTakeaway: 'IMO: Trading is not about predicting the future; it is an exercise in asymmetric mathematical probabilities. With 1% risk and 1:3 reward, a 40% win rate generates substantial long-term wealth.',
    retailTrap: 'Retailers gamble fixed lots (e.g. always 100 shares or 1 lot) regardless of stop distance, losing 15-30% on a single bad trade.',
    smartMoneyExecution: 'Strictly calculate Quantity = (Account Equity × 0.01) ÷ (Entry Price - Stop Loss). If invalid, trade is skipped automatically.',
    rules: [
      'Maximum loss per trade ≤ 1.0% of current net account balance.',
      'Minimum target Risk-to-Reward ratio is 1:2.5 or 1:3.',
      'Daily circuit breaker: If 3 consecutive losses occur (3% total drawdown), terminal must be shut down for the day.'
    ],
    formula: {
      name: 'Institutional Position Size Formula',
      expression: 'Allowed Units = (Account Balance × 0.01) ÷ (|Entry Price - Stop Loss Price|)',
      example: 'On ₹1,00,000 balance: Max risk = ₹1,000. If Stop Loss distance = 20 points, Allowed Units = 1,000 / 20 = 50 Units.'
    }
  },
  {
    id: 'candlestick-anatomy',
    number: '06',
    title: 'Institutional Candlestick Anatomy & Wick Rejections',
    subtitle: 'Reading buyer vs seller absorption through wick-to-body ratios',
    accentColor: '#10B981',
    badge: 'Price Absorption',
    category: 'STRUCTURE',
    summary: 'A candlestick is a summary of auction psychology. Long wicks show where aggressive limit orders absorbed aggressive market orders and rejected the price back into balance.',
    imoTakeaway: 'IMO: A candle body tells you where price found consensus; a long wick reveals where market participants were trapped and rejected.',
    retailTrap: 'Retail traders assume a red candle always means bearish, ignoring that a 70% lower wick represents massive institutional buying.',
    smartMoneyExecution: 'Look for pin bar absorption tails where wick length > 2.5x body at key support zones or session liquidity levels.',
    rules: [
      'Wick > 2.5x body indicates heavy algorithmic absorption.',
      'Marubozu full body candle indicates aggressive institutional initiative.',
      'Doji represents momentary order equilibrium awaiting directional expansion.'
    ]
  },
  {
    id: 'polarity-flip',
    number: '07',
    title: 'Support-Turned-Resistance (RBS / SBR) Polarity Flips',
    subtitle: 'How trapped market participants create new demand and supply floors',
    accentColor: '#3B82F6',
    badge: 'Polarity Principle',
    category: 'STRUCTURE',
    summary: 'When a strong support floor is breached with high volume, traders who bought at support are trapped in severe loss. On the first retest, they exit at break-even, transforming old support into powerful new resistance.',
    imoTakeaway: 'IMO: Never buy a broken floor expecting it to magically hold. Wait for the retest from underneath to join the institutional short wave.',
    retailTrap: 'Retail traders average down on falling knives at broken support floors, getting liquidated on continuation.',
    smartMoneyExecution: 'Identify high-volume breakdown, mark the retest zone, and execute short with tight stops above the invalidation pivot.',
    rules: [
      'Resistance Becomes Support (RBS): Old ceiling becomes new institutional floor.',
      'Support Becomes Resistance (SBR): Old floor flips into heavy selling pressure on retest.',
      'Retest should occur on declining volume compared to the breakout bar.'
    ]
  },
  {
    id: 'fibonacci-pocket',
    number: '08',
    title: 'Fibonacci Golden Pocket (0.618 - 0.786)',
    subtitle: 'Algorithmic deep discount and premium retracement thresholds',
    accentColor: '#EAB308',
    badge: 'Algorithmic Equilibrium',
    category: 'SMC',
    summary: 'Institutions use algorithmic execution software calibrated to standard Fibonacci harmonic ratios. The 0.618 to 0.786 zone represents optimal discount pricing for institutional accumulation.',
    imoTakeaway: 'IMO: Do not buy at 0.382 or 0.50 retracements; they offer poor risk-to-reward. High-probability institutional setups occur between 0.618 and 0.786 deep discount.',
    retailTrap: 'Retailers jump in on tiny 20% pullbacks and panic when deep algorithmic sweeps shake them out.',
    smartMoneyExecution: 'Draw Fibonacci from Swing Low to Swing High on impulse leg; place limit orders in the 0.618 - 0.786 golden pocket with stop just below swing low.',
    rules: [
      'Draw from absolute swing low to swing high in an uptrend (Discount buy).',
      'Draw from absolute swing high to swing low in a downtrend (Premium sell).',
      'Look for confluence where 0.618 aligns with an unmitigated Order Block or FVG.'
    ]
  }
];

export default function IMOConceptNotes({ onLaunchTerminal, theme = 'dark' }: IMOConceptNotesProps) {
  const isLight = theme === 'light';
  const [selectedConceptId, setSelectedConceptId] = useState<string>(IMO_CONCEPTS[0].id);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'SMC' | 'RISK' | 'STRUCTURE'>('ALL');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);

  // Calculator state for the 1% risk interactive widget
  const [calcEquity, setCalcEquity] = useState<number>(100000);
  const [calcRiskPercent, setCalcRiskPercent] = useState<number>(1);
  const [calcEntry, setCalcEntry] = useState<number>(22450);
  const [calcStopLoss, setCalcStopLoss] = useState<number>(22400);

  const selectedConcept = IMO_CONCEPTS.find(c => c.id === selectedConceptId) || IMO_CONCEPTS[0];

  const filteredConcepts = activeCategory === 'ALL'
    ? IMO_CONCEPTS
    : IMO_CONCEPTS.filter(c => c.category === activeCategory);

  // Text-To-Speech Reader
  const handlePlayVoice = (concept: IMOConcept) => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio && !isPausedAudio) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      return;
    }
    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${concept.title}. ${concept.subtitle}. Summary: ${concept.summary}. Institutional Takeaway: ${concept.imoTakeaway}. Retail Trap: ${concept.retailTrap}. Smart Money Execution: ${concept.smartMoneyExecution}. Non-negotiable rules: ${concept.rules.join('. ')}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => { setIsPlayingAudio(true); setIsPausedAudio(false); };
    utterance.onend = () => { setIsPlayingAudio(false); setIsPausedAudio(false); };
    utterance.onerror = () => { setIsPlayingAudio(false); setIsPausedAudio(false); };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  // Position Sizing Calculation
  const riskAmount = (calcEquity * (calcRiskPercent / 100));
  const stopDistance = Math.abs(calcEntry - calcStopLoss);
  const allowedUnits = stopDistance > 0 ? Math.floor(riskAmount / stopDistance) : 0;
  const targetReward = stopDistance * 3; // 1:3 RR
  const takeProfitPrice = calcEntry >= calcStopLoss ? (calcEntry + targetReward) : (calcEntry - targetReward);

  return (
    <div className={`space-y-8 animate-in fade-in duration-200 transition-colors ${
      isLight ? 'text-slate-800' : 'text-white'
    }`}>
      {/* Top Banner Header */}
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
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Institutional Master Outline (IMO)</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                8 Battle-Tested Concept Blueprints
              </span>
            </div>

            <h1 className={`text-2xl sm:text-4xl font-serif font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Smart Money Concepts & Visual Concept Charts
            </h1>

            <p className={`text-xs sm:text-sm font-mono leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Color-coded institutional notes, interactive concept charts, algorithmic equations, and direct execution checklists. Master how banks deploy liquidity before trading simulator capital.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={onLaunchTerminal}
              className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xl hover:scale-105 active:scale-95 cursor-pointer ${
                isLight
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-[#00FF87] to-[#00F0FF] text-[#0A0E17] shadow-[0_0_20px_rgba(0,255,135,0.4)]'
              }`}
            >
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              <span>Test in Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
          {(['ALL', 'SMC', 'RISK', 'STRUCTURE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer text-[11px] whitespace-nowrap ${
                activeCategory === cat
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#00FF87] text-[#0A0E17] font-black shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                  : isLight
                  ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#0E1726] border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All 8 Concepts' : cat === 'SMC' ? 'Smart Money Concepts' : cat === 'RISK' ? '1% Risk Management' : 'Market Structure'}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Viewing {filteredConcepts.length} of {IMO_CONCEPTS.length} Master Outlines
        </span>
      </div>

      {/* 2-Column Responsive Layout: Concept Cards Grid (Left 5 cols) + In-Depth Concept Chart & IMO Study Stage (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Concept Selector Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Select Concept Outline
            </span>
          </div>

          <div className="space-y-3">
            {filteredConcepts.map((concept) => {
              const isSelected = selectedConceptId === concept.id;

              return (
                <div
                  key={concept.id}
                  onClick={() => {
                    setSelectedConceptId(concept.id);
                    if (isPlayingAudio) handleStopVoice();
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? isLight
                        ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-[#121B2A] border-[#00FF87] shadow-[0_0_20px_rgba(0,255,135,0.15)] ring-1 ring-[#00FF87]/40'
                      : isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200'
                      : 'bg-[#0E1726] hover:bg-[#121B2A] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase"
                      style={{ 
                        backgroundColor: `${concept.accentColor}20`, 
                        color: concept.accentColor,
                        border: `1px solid ${concept.accentColor}40`
                      }}
                    >
                      IMO {concept.number} • {concept.badge}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {concept.category}
                    </span>
                  </div>

                  <h3 className={`text-base font-serif font-black ${
                    isSelected 
                      ? isLight ? 'text-emerald-700' : 'text-[#00FF87]' 
                      : isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {concept.title}
                  </h3>

                  <p className="text-xs font-mono text-slate-400 line-clamp-2 leading-relaxed">
                    {concept.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-white/5 text-slate-400">
                    <span className="truncate max-w-[200px]">{concept.rules.length} Execution Rules</span>
                    <span className={`font-bold ${isSelected ? (isLight ? 'text-emerald-700' : 'text-[#00FF87]') : ''}`}>
                      {isSelected ? 'Active Blueprint ➔' : 'Inspect'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Depth Detailed Concept Chart & IMO Study Stage */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            {/* Header of Active Concept */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase"
                    style={{ backgroundColor: `${selectedConcept.accentColor}20`, color: selectedConcept.accentColor }}
                  >
                    IMO Concept {selectedConcept.number}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">• {selectedConcept.badge}</span>
                </div>
                <h2 className={`text-xl sm:text-2xl font-serif font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedConcept.title}
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {selectedConcept.subtitle}
                </p>
              </div>

              {/* Voice Audio Listen Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePlayVoice(selectedConcept)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                    isPlayingAudio && !isPausedAudio
                      ? 'bg-amber-500 text-black'
                      : isLight
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-[#00FF87] text-[#0A0E17] hover:bg-[#00e577]'
                  }`}
                  title="Listen to audio explanation"
                >
                  {isPlayingAudio && !isPausedAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPausedAudio ? 'Resume' : 'Listen Voice'}</span>
                    </>
                  )}
                </button>

                {(isPlayingAudio || isPausedAudio) && (
                  <button
                    type="button"
                    onClick={handleStopVoice}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                    title="Stop Voice"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            </div>

            {/* INTERACTIVE VISUAL CONCEPT CHART DISPLAY */}
            <div className={`p-5 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className="font-bold flex items-center gap-1.5 text-[#00FF87]">
                  <BarChart2 className="w-4 h-4" />
                  <span>Technical Diagram: {selectedConcept.title}</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Institutional Blueprint</span>
              </div>

              {/* Dynamic Diagram Renderers based on selected concept */}
              {selectedConcept.id === 'order-block' && (
                <div className="p-4 rounded-xl bg-[#070B12] border border-emerald-500/30 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span className="text-rose-400">1. Bearish Order Block (Supply)</span>
                    <span className="text-[#00FF87]">2. Bullish Order Block (Demand)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 h-44 relative border border-dashed border-white/10 rounded-xl p-3 items-center">
                    {/* Bearish OB Illustration */}
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="text-[10px] text-rose-400 font-bold">Bearish OB (Sell Imbalance)</div>
                      <div className="flex items-end gap-1">
                        <div className="w-4 h-14 bg-emerald-500/80 rounded-xs" title="Up Candle Before Drop" />
                        <div className="w-4 h-24 bg-rose-500 rounded-xs shadow-lg" title="Aggressive Displacement Candle" />
                        <div className="w-4 h-20 bg-rose-500 rounded-xs" />
                      </div>
                      <div className="text-[9px] text-slate-400 text-center">Retest to 50% Mean Threshold = Short Entry</div>
                    </div>

                    {/* Bullish OB Illustration */}
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="text-[10px] text-[#00FF87] font-bold">Bullish OB (Buy Imbalance)</div>
                      <div className="flex items-end gap-1">
                        <div className="w-4 h-12 bg-rose-500/80 rounded-xs" title="Down Candle Before Rally" />
                        <div className="w-4 h-24 bg-emerald-500 rounded-xs shadow-lg" title="Displacement Rally" />
                        <div className="w-4 h-20 bg-emerald-500 rounded-xs" />
                      </div>
                      <div className="text-[9px] text-slate-400 text-center">Retest to OB wick = High Probability Long</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedConcept.id === 'fair-value-gap' && (
                <div className="p-4 rounded-xl bg-[#070B12] border border-cyan-500/30 space-y-3 font-mono text-xs">
                  <span className="text-cyan-400 font-bold block text-center">3-Candle Imbalance & Consequent Encroachment (CE)</span>
                  <div className="relative h-44 border border-dashed border-cyan-500/40 rounded-xl flex items-center justify-center gap-6 p-4">
                    {/* Candle 1 */}
                    <div className="flex flex-col items-center">
                      <div className="w-1 h-4 bg-emerald-400" />
                      <div className="w-7 h-10 bg-emerald-500 rounded-xs text-[8px] text-black font-bold flex items-center justify-center">C1</div>
                      <div className="w-1 h-3 bg-emerald-400" />
                    </div>

                    {/* FVG Gap Box */}
                    <div className="relative border-2 border-dashed border-cyan-400 bg-cyan-500/10 px-3 py-6 rounded-md text-center">
                      <span className="text-[10px] font-bold text-cyan-300 block">FVG Void</span>
                      <span className="text-[9px] text-slate-400 block">50% CE Target</span>
                    </div>

                    {/* Candle 2 (Displacement) */}
                    <div className="flex flex-col items-center">
                      <div className="w-1 h-3 bg-emerald-400" />
                      <div className="w-8 h-28 bg-emerald-400 rounded-xs text-[9px] text-black font-bold flex items-center justify-center">C2 (Run)</div>
                      <div className="w-1 h-4 bg-emerald-400" />
                    </div>

                    {/* Candle 3 */}
                    <div className="flex flex-col items-center">
                      <div className="w-1 h-5 bg-emerald-400" />
                      <div className="w-7 h-12 bg-emerald-500 rounded-xs text-[8px] text-black font-bold flex items-center justify-center">C3</div>
                      <div className="w-1 h-3 bg-emerald-400" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    The gap between Candle 1 High and Candle 3 Low is an unmitigated FVG. Algorithmic engines target this void for fill before moving higher.
                  </p>
                </div>
              )}

              {selectedConcept.id === 'market-structure' && (
                <div className="p-4 rounded-xl bg-[#070B12] border border-purple-500/30 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-purple-300 font-bold text-[11px]">
                    <span>Higher-Highs / Higher-Lows (BOS)</span>
                    <span className="text-amber-400">Change of Character (CHoCH)</span>
                  </div>
                  <div className="relative h-40 border border-white/10 rounded-xl flex items-center justify-between px-6 bg-gradient-to-r from-purple-500/5 to-transparent">
                    <div className="text-center">
                      <span className="text-emerald-400 font-bold block">HH1 ➔ HL1</span>
                      <span className="text-[9px] text-slate-400">Bullish BOS</span>
                    </div>
                    <div className="text-center">
                      <span className="text-emerald-400 font-bold block">HH2 ➔ HL2</span>
                      <span className="text-[9px] text-slate-400">Trend Continuation</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-rose-500/20 border border-rose-500">
                      <span className="text-rose-400 font-black block">CHoCH Break ⬇</span>
                      <span className="text-[9px] text-slate-300">Lower Low Confirmed</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    BOS confirms current direction. CHoCH marks the exact candle where market structure breaks in the opposing direction.
                  </p>
                </div>
              )}

              {selectedConcept.id === 'liquidity-pools' && (
                <div className="p-4 rounded-xl bg-[#070B12] border border-pink-500/30 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-rose-400">Equal Highs (EQH) • Buy-Side Liquidity</span>
                    <span className="text-[#00FF87]">Smart Money Reverse Dump</span>
                  </div>
                  <div className="relative h-40 border-t-2 border-dashed border-rose-400/80 rounded-xl p-4 flex flex-col justify-between bg-gradient-to-b from-rose-500/10 to-transparent">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="bg-rose-500 text-white px-2 py-0.5 rounded font-bold">Retail Stop Clusters (BSL)</span>
                      <span className="text-amber-400 font-black animate-pulse">⚡ Liquidity Raid Spike</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-white">Equal High 1</span>
                      <span className="text-slate-500">•••</span>
                      <span className="text-xs font-bold text-white">Equal High 2</span>
                      <span className="text-rose-400 font-bold">➔ False Breakout Sweep</span>
                    </div>
                    <div className="text-center text-[10px] text-emerald-400 font-bold">
                      Institutional Absorption complete. Price violently reverses to the downside.
                    </div>
                  </div>
                </div>
              )}

              {selectedConcept.id === 'risk-formula' && (
                <div className="p-4 rounded-xl bg-[#070B12] border border-amber-500/30 space-y-4 font-mono text-xs">
                  <span className="text-amber-400 font-bold block text-center uppercase tracking-wider">
                    Interactive 1% Risk & Position Size Simulator
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                      <span className="text-[9px] text-slate-400 block">Account Equity</span>
                      <input
                        type="number"
                        value={calcEquity}
                        onChange={(e) => setCalcEquity(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-white text-xs mt-1 border-b border-white/20 focus:outline-none"
                      />
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/30">
                      <span className="text-[9px] text-amber-400 block">Max Risk %</span>
                      <input
                        type="number"
                        value={calcRiskPercent}
                        onChange={(e) => setCalcRiskPercent(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-amber-400 text-xs mt-1 border-b border-amber-500/40 focus:outline-none"
                      />
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                      <span className="text-[9px] text-slate-400 block">Entry Price</span>
                      <input
                        type="number"
                        value={calcEntry}
                        onChange={(e) => setCalcEntry(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-[#00F0FF] text-xs mt-1 border-b border-white/20 focus:outline-none"
                      />
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-rose-500/30">
                      <span className="text-[9px] text-rose-400 block">Stop Loss Price</span>
                      <input
                        type="number"
                        value={calcStopLoss}
                        onChange={(e) => setCalcStopLoss(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-rose-400 text-xs mt-1 border-b border-rose-500/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Max Allowed Loss:</span>
                      <strong className="text-amber-400 text-sm">₹{riskAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Mandatory Max Units:</span>
                      <strong className="text-[#00FF87] text-sm">{allowedUnits} Units</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">1:3 Target TP Price:</span>
                      <strong className="text-cyan-400 text-sm">₹{takeProfitPrice.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedConcept.id === 'candlestick-anatomy' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#070B12] rounded-xl border border-emerald-500/30 font-mono text-center text-xs">
                  <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block mb-1">Bullish Marubozu</span>
                    <div className="w-8 h-20 bg-emerald-500 mx-auto rounded-xs" />
                    <span className="text-[10px] text-slate-400 mt-2 block">100% Buyer Dominance</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-amber-500/30">
                    <span className="text-amber-400 font-bold block mb-1">Pin Bar Hammer</span>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-6 bg-emerald-500 rounded-xs" />
                      <div className="w-1 h-20 bg-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Heavy Liquidity Absorption</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-rose-500/30">
                    <span className="text-rose-400 font-bold block mb-1">Bearish Rejection</span>
                    <div className="flex flex-col items-center">
                      <div className="w-1 h-20 bg-rose-400" />
                      <div className="w-8 h-6 bg-rose-500 rounded-xs" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">Supply Overwhelming Buyers</span>
                  </div>
                </div>
              )}

              {selectedConcept.id === 'polarity-flip' && (
                <div className="p-4 rounded-xl bg-[#070B12] border border-blue-500/30 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-rose-400">Old Resistance Level</span>
                    <span className="text-emerald-400">New Institutional Support Floor</span>
                  </div>
                  <div className="relative h-36 border-b-2 border-dashed border-cyan-400/70 rounded-xl flex items-center justify-between px-6 bg-gradient-to-b from-cyan-500/5 to-transparent">
                    <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded font-bold">Trapped Sellers</span>
                    <div className="text-center">
                      <span className="text-xs font-black text-[#00FF87] block">Volume Breakout ➔</span>
                      <span className="text-[10px] text-slate-400">Pullback Retest (Enter Long)</span>
                    </div>
                    <span className="bg-[#00FF87] text-[#0A0E17] text-[9px] px-2 py-0.5 rounded font-bold">New Demand Floor</span>
                  </div>
                </div>
              )}

              {selectedConcept.id === 'fibonacci-pocket' && (
                <div className="p-4 rounded-xl bg-[#070B12] border border-yellow-500/30 space-y-2 font-mono text-xs">
                  <span className="text-yellow-400 font-bold block text-center">Algorithmic Fibonacci Retracement Ratios</span>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/5 text-[10px]">
                      <span className="text-slate-400">0.000 Swing High (Take Profit)</span>
                      <span className="text-slate-400">Target Level</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/5 text-[10px]">
                      <span className="text-slate-400">0.500 Equilibrium (Fair Value)</span>
                      <span className="text-slate-400">Neutral</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-yellow-500/20 border border-yellow-400 text-[11px] font-bold">
                      <span className="text-yellow-300">0.618 - 0.786 Golden Pocket</span>
                      <span className="text-[#00FF87]">High Probability Buy Zone 🎯</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-rose-500/30 text-[10px]">
                      <span className="text-rose-400">1.000 Swing Low (Stop Loss)</span>
                      <span className="text-rose-400">Invalidation Level</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* In My Opinion (IMO) Institutional Takeaway Box */}
            <div className={`p-5 rounded-2xl border flex items-start gap-3.5 leading-relaxed text-xs sm:text-sm font-mono ${
              isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-[#00FF87]/10 border-[#00FF87]/30 text-emerald-300'
            }`}>
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-[#00FF87]" />
              <div className="space-y-1">
                <strong className="block font-black uppercase tracking-wider text-white">
                  Institutional Master Takeaway (IMO):
                </strong>
                <p>{selectedConcept.imoTakeaway}</p>
              </div>
            </div>

            {/* Retail Trap vs Smart Money Execution Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Retail Trap */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                isLight ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>The Retail Mistake (Trap):</span>
                </div>
                <p className="leading-relaxed">{selectedConcept.retailTrap}</p>
              </div>

              {/* Smart Money Execution */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2 text-[#00FF87] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Smart Money Execution:</span>
                </div>
                <p className="leading-relaxed">{selectedConcept.smartMoneyExecution}</p>
              </div>
            </div>

            {/* Non-Negotiable Execution Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Non-Negotiable Execution Checklist:</span>
              </h4>
              <div className="space-y-2">
                {selectedConcept.rules.map((rule, rIdx) => (
                  <div 
                    key={rIdx}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0A0E17] border-white/5 text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mathematical Formula Callout if any */}
            {selectedConcept.formula && (
              <div className={`p-5 rounded-2xl border space-y-2 font-mono ${
                isLight ? 'bg-blue-50 border-blue-200 text-blue-950' : 'bg-[#0E1A2D] border-blue-500/30 text-blue-200'
              }`}>
                <span className="text-xs font-bold uppercase tracking-wider block text-cyan-400">
                  {selectedConcept.formula.name}
                </span>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-bold text-white text-xs sm:text-sm">
                  {selectedConcept.formula.expression}
                </div>
                <p className="text-[11px] text-slate-400">
                  <strong>Example:</strong> {selectedConcept.formula.example}
                </p>
              </div>
            )}

            {/* Bottom CTA: Test In Simulator */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <span className="text-xs font-mono text-slate-400">
                Ready to spot this pattern on live charts?
              </span>

              <button
                type="button"
                onClick={onLaunchTerminal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FF87] to-[#00F0FF] text-[#0A0E17] hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Launch Trading Simulator</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
