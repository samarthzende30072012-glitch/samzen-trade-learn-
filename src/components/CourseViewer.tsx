import React, { useState } from 'react';
import { ALL_COURSES } from '../data/courses';
import { MarketType, CourseLevel, UserProfile, Topic } from '../types';
import { 
  Lock, BookOpen, CheckCircle, Clock, ChevronRight, Award,
  Sparkles, ShieldAlert, FastForward, HelpCircle, ArrowLeft,
  Volume2, Play, Pause, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QuizSection from './QuizSection';
import AdBanner from './AdBanner';
import RoboticVideoPlayer from './RoboticVideoPlayer';
import ChapterNotesViewer from './ChapterNotesViewer';

interface CourseViewerProps {
  user: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => void;
  onGoProClick: () => void;
  onSimulateDayForward: () => void;
  simulatedDays: number;
  selectedMarket?: MarketType;
  setSelectedMarket?: (market: MarketType) => void;
  courses: any[];
  onUpdateCourses: (newCourses: any[]) => void;
  displayCurrency?: 'INR' | 'USD' | 'EUR';
  formatCurrency?: (valInINR: number, decimals?: number) => string;
}

export default function CourseViewer({ 
  user, 
  onUpdateUser, 
  onGoProClick, 
  onSimulateDayForward,
  simulatedDays,
  selectedMarket,
  setSelectedMarket,
  courses,
  onUpdateCourses
}: CourseViewerProps) {
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>('beginner');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [activeTopicView, setActiveTopicView] = useState<'video' | 'notes'>('video');

  // Note font size state
  const [notesFontSize, setNotesFontSize] = useState<number>(18); // default 18px (increased size)
  const [isStudyFullscreen, setIsStudyFullscreen] = useState<boolean>(false);

  // Speech synthesis audio states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);

  const handlePlayAudio = () => {
    if (!activeTopic) return;
    if ('speechSynthesis' in window) {
      if (isPausedAudio) {
        window.speechSynthesis.resume();
        setIsPausedAudio(false);
        setIsPlayingAudio(true);
        return;
      }
      window.speechSynthesis.cancel();
      const textToRead = `${activeTopic.title}. ${activeTopic.description}. ${activeTopic.content.replace(/\[DIAGRAM:[^\]]+\]/g, '')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => {
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
      };
      utterance.onend = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis not supported in your browser.');
    }
  };

  const handlePauseAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.pause();
        setIsPlayingAudio(false);
        setIsPausedAudio(true);
      }
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTopic]);


  // Personalized Questionnaire State
  const [interest, setInterest] = useState<'stocks' | 'forex' | 'crypto'>(user.interest || 'stocks');
  const [knowledgeLevel, setKnowledgeLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(user.knowledgeLevel || 'beginner');
  const [learningGoal, setLearningGoal] = useState<string>(user.learningGoal || 'Day Trading / Scalping');
  const [showPremiumBriefing, setShowPremiumBriefing] = useState<boolean>(false);

  const getPersonalizedSequence = () => {
    const sequence: { topicId: string; title: string; desc: string; market: MarketType; level: CourseLevel; type: string }[] = [];
    
    const prefInterest = user.interest || 'stocks';
    const prefLevel = user.knowledgeLevel || 'beginner';
    const prefGoal = user.learningGoal || 'Day Trading / Scalping';

    // 1. Core lesson matching interest
    if (prefInterest === 'stocks') {
      sequence.push({
        topicId: 'stocks-beg-1',
        title: 'Introduction to Stock Market',
        desc: 'Build your absolute core foundation of equity markets.',
        market: 'stocks',
        level: 'beginner',
        type: 'Core Foundation'
      });
    } else if (prefInterest === 'forex') {
      sequence.push({
        topicId: 'forex-beg-1',
        title: 'What is Forex & Currencies Trading?',
        desc: 'Understand the world\'s largest financial marketplace.',
        market: 'forex',
        level: 'beginner',
        type: 'Core Foundation'
      });
    } else {
      sequence.push({
        topicId: 'crypto-beg-1',
        title: 'Cryptocurrency Basics & Blockchain',
        desc: 'Understand decentralization, ledgers, and digital tokens.',
        market: 'crypto',
        level: 'beginner',
        type: 'Core Foundation'
      });
    }

    // 2. Skill level guided lesson matching interest + level
    if (prefInterest === 'stocks') {
      if (prefLevel === 'beginner') {
        sequence.push({
          topicId: 'stocks-beg-3',
          title: 'Reading Stock Charts & Candlesticks',
          desc: 'Learn the essential vocabulary of technical price action.',
          market: 'stocks',
          level: 'beginner',
          type: 'Level Guidance'
        });
      } else if (prefLevel === 'intermediate') {
        sequence.push({
          topicId: 'stocks-int-1',
          title: 'Moving Averages Demystified',
          desc: 'Filter price noise with Simple & Exponential Moving Averages.',
          market: 'stocks',
          level: 'intermediate',
          type: 'Level Guidance'
        });
      } else {
        sequence.push({
          topicId: 'stocks-adv-1',
          title: 'Fibonacci Retracement Strategies',
          desc: 'Identify structural support and target zones mathematically.',
          market: 'stocks',
          level: 'advanced',
          type: 'Level Guidance'
        });
      }
    } else if (prefInterest === 'forex') {
      if (prefLevel === 'beginner') {
        sequence.push({
          topicId: 'forex-beg-2',
          title: 'Pips, Lots, and Leverage Explained',
          desc: 'Master the core mathematical metrics of forex contracts.',
          market: 'forex',
          level: 'beginner',
          type: 'Level Guidance'
        });
      } else if (prefLevel === 'intermediate') {
        sequence.push({
          topicId: 'forex-int-1',
          title: 'Economic Calendars & High-Impact News',
          desc: 'Navigate monetary policy, CPI indices, and currency pairs.',
          market: 'forex',
          level: 'intermediate',
          type: 'Level Guidance'
        });
      } else {
        sequence.push({
          topicId: 'forex-adv-1',
          title: 'SMC (Smart Money Concepts) in Forex',
          desc: 'Track liquidity sweeps, mitigation blocks, and orders.',
          market: 'forex',
          level: 'advanced',
          type: 'Level Guidance'
        });
      }
    } else { // crypto
      if (prefLevel === 'beginner') {
        sequence.push({
          topicId: 'crypto-beg-2',
          title: 'Wallets, Gas Fees, and Crypto Exchanges',
          desc: 'Safeguard your assets and operate transactions securely.',
          market: 'crypto',
          level: 'beginner',
          type: 'Level Guidance'
        });
      } else if (prefLevel === 'intermediate') {
        sequence.push({
          topicId: 'crypto-int-1',
          title: 'Crypto Market Cycles & Halving Events',
          desc: 'Capitalize on four-year halving dynamics and psychology.',
          market: 'crypto',
          level: 'intermediate',
          type: 'Level Guidance'
        });
      } else {
        sequence.push({
          topicId: 'crypto-adv-1',
          title: 'On-Chain Metrics & Funding Rates',
          desc: 'Leverage public ledger analytics and derivative rates.',
          market: 'crypto',
          level: 'advanced',
          type: 'Level Guidance'
        });
      }
    }

    // 3. Goal-Oriented Lesson
    if (prefGoal.includes('Risk') || prefGoal.includes('Portfolio')) {
      sequence.push({
        topicId: 'stocks-beg-6',
        title: 'Risk Management 101',
        desc: 'Diligently implement the 1% rule and risk-to-reward ratios.',
        market: 'stocks',
        level: 'beginner',
        type: 'Goal Alignment'
      });
    } else if (prefGoal.includes('Day') || prefGoal.includes('Swing')) {
      if (prefInterest === 'stocks') {
        sequence.push({
          topicId: 'stocks-int-2',
          title: 'Relative Strength Index (RSI) Masterclass',
          desc: 'Spot overbought and oversold momentum divergences.',
          market: 'stocks',
          level: 'intermediate',
          type: 'Goal Alignment'
        });
      } else if (prefInterest === 'forex') {
        sequence.push({
          topicId: 'forex-adv-1',
          title: 'SMC (Smart Money Concepts) in Forex',
          desc: 'Target institutional liquidity sweeps for intraday plays.',
          market: 'forex',
          level: 'advanced',
          type: 'Goal Alignment'
        });
      } else {
        sequence.push({
          topicId: 'crypto-adv-1',
          title: 'On-Chain Metrics & Funding Rates',
          desc: 'Decode intraday open interest swings and arbitrage sweeps.',
          market: 'crypto',
          level: 'advanced',
          type: 'Goal Alignment'
        });
      }
    } else { // investing
      if (prefInterest === 'stocks') {
        sequence.push({
          topicId: 'stocks-beg-4',
          title: 'Support and Resistance Secrets',
          desc: 'Establish long-term accumulation entries at critical price floors.',
          market: 'stocks',
          level: 'beginner',
          type: 'Goal Alignment'
        });
      } else if (prefInterest === 'forex') {
        sequence.push({
          topicId: 'forex-int-1',
          title: 'Economic Calendars & High-Impact News',
          desc: 'Plan long-term macro trend hedges based on macro interest policy.',
          market: 'forex',
          level: 'intermediate',
          type: 'Goal Alignment'
        });
      } else {
        sequence.push({
          topicId: 'crypto-int-1',
          title: 'Crypto Market Cycles & Halving Events',
          desc: 'Navigate multi-year cycles to accumulate at absolute bear lows.',
          market: 'crypto',
          level: 'intermediate',
          type: 'Goal Alignment'
        });
      }
    }

    return sequence;
  };

  // Core authorization variables
  const isPro = user.proTier !== null;
  const isLifetime = user.proTier === 'lifetime';

  // Find the active course
  const currentCourse = courses.find(
    c => c.market === selectedMarket && c.level === selectedLevel
  );

  // Calculate Drip State
  // Calculate simulated days since joining
  const daysSinceJoining = simulatedDays;

  const isTopicLockedByDrip = (topic: Topic) => {
    if (isLifetime) return false; // Lifetime bypasses all locks
    return topic.dayIndex > daysSinceJoining;
  };

  const isLevelLocked = (level: CourseLevel) => {
    if (level === 'beginner') return false; // Beginner level is always free
    return !isPro; // Intermediate and Advanced require a subscription
  };

  // Interactive diagram rendering engine
  const renderInteractiveDiagram = (diagramType: string) => {
    switch (diagramType) {
      case 'SUPPORT_RESISTANCE':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
              📈 Interactive Support & Resistance Channel
            </h4>
            <div className="relative h-44 border border-white/10 bg-[#0E1726] rounded-lg overflow-hidden p-2">
              {/* Resistance line */}
              <div className="absolute top-8 left-0 right-0 border-t border-dashed border-rose-500 flex justify-between px-2 text-[8px] font-mono text-rose-600 font-bold">
                <span>REJECTION RESISTANCE ZONE (Seller Supply)</span>
                <span>₹90.00</span>
              </div>
              
              {/* Support line */}
              <div className="absolute bottom-8 left-0 right-0 border-t border-dashed border-emerald-500 flex justify-between px-2 text-[8px] font-mono text-emerald-600 font-bold">
                <span>ACCUMULATION SUPPORT ZONE (Buyer Demand)</span>
                <span>₹30.00</span>
              </div>

              {/* Price Action Path SVG */}
              <svg className="w-full h-full" viewBox="0 0 500 150">
                <path
                  d="M 10 110 L 100 35 L 180 110 L 260 35 L 340 110 L 420 35 L 480 15"
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Breakout Highlight */}
                <circle cx="480" cy="15" r="5" className="fill-emerald-500 stroke-black animate-ping" />
                <circle cx="480" cy="15" r="4" className="fill-emerald-500 stroke-black" />
              </svg>

              {/* Bounce Labels */}
              <div className="absolute top-[38px] left-[85px] bg-[#0F172A] text-white rounded px-1.5 py-0.5 text-[8px] font-mono shadow">
                Resistance Touch (Sell)
              </div>
              <div className="absolute bottom-[38px] left-[165px] bg-[#05D59E] text-white rounded px-1.5 py-0.5 text-[8px] font-mono shadow font-bold">
                Support Bounce (Buy)
              </div>
              <div className="absolute top-[18px] right-[25px] bg-emerald-600 text-white rounded px-1.5 py-0.5 text-[8px] font-mono shadow font-black animate-bounce">
                🚀 BULLISH BREAKOUT!
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed font-sans text-center">
              Price moves in ranges until buying momentum (demand) completely absorbs sell walls at resistance, triggering a powerful trend continuation (Breakout).
            </p>
          </div>
        );

      case 'RSI_OS_OB':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center">
              📊 Relative Strength Index (RSI) Overbought/Oversold Oscillator
            </h4>
            <div className="relative h-40 border border-white/10 bg-slate-900 rounded-lg overflow-hidden">
              {/* Overbought line */}
              <div className="absolute top-[30px] left-0 right-0 border-t border-dashed border-rose-500/50 flex justify-between px-2 text-[8px] font-mono text-rose-400">
                <span>OVERBOUGHT LIMIT (70)</span>
                <span>🐻 Bearish Reversal Danger</span>
              </div>
              
              {/* Oversold line */}
              <div className="absolute bottom-[30px] left-0 right-0 border-t border-dashed border-emerald-500/50 flex justify-between px-2 text-[8px] font-mono text-emerald-400">
                <span>OVERSOLD LIMIT (30)</span>
                <span>🐂 Bullish Rebound Zone</span>
              </div>

              {/* Shaded Neutral Channel */}
              <div className="absolute top-[30px] bottom-[30px] left-0 right-0 bg-[#05D59E]/5" />

              {/* RSI Oscillator Path */}
              <svg className="w-full h-full" viewBox="0 0 500 150">
                <path
                  d="M 10 75 L 80 125 L 160 20 L 240 75 L 320 135 L 420 20 L 480 75"
                  fill="none"
                  stroke="#05D59E"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              {/* Clickable/hoverable indicators */}
              <div className="absolute top-[12px] left-[140px] bg-rose-500 text-white font-mono text-[8px] rounded px-1.5 py-0.5 font-bold">
                RSI &gt; 70 (Overbought Sell Trigger)
              </div>
              <div className="absolute bottom-[12px] left-[300px] bg-emerald-500 text-white font-mono text-[8px] rounded px-1.5 py-0.5 font-black">
                RSI &lt; 30 (Oversold Buy Trigger)
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed text-center">
              A momentum oscillator reading above 70 implies unsustainable rapid buying, whereas a reading below 30 signals exhaustion and massive undervaluation.
            </p>
          </div>
        );

      case 'MOVING_AVERAGE_CROSSOVER':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center">
              ⚡ Double Moving Average Crossover (Golden & Death Cross)
            </h4>
            <div className="relative h-44 border border-white/10 bg-[#0E1726] rounded-lg overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 500 150">
                {/* Slow MA (Gold) */}
                <path
                  d="M 10 110 Q 150 100 250 75 T 490 40"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Fast MA (Blue) */}
                <path
                  d="M 10 130 C 120 150 180 20 250 75 C 320 120 400 10 490 20"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                
                {/* Cross Highlights */}
                <circle cx="250" cy="75" r="5" className="fill-emerald-400 stroke-black animate-ping" />
                <circle cx="250" cy="75" r="4.5" className="fill-emerald-400 stroke-black" />
              </svg>

              <div className="absolute top-[45px] left-[180px] bg-emerald-600 text-white rounded px-2 py-0.5 text-[8px] font-mono font-bold shadow-md">
                GOLDEN CROSS: Fast MA crosses above Slow MA ➔ Bullish Trend!
              </div>

              {/* Legends */}
              <div className="absolute bottom-2 left-2 flex gap-4 text-[9px] font-mono bg-[#0E1726]/90 p-1.5 border rounded">
                <span className="flex items-center gap-1.5 font-bold text-[#3B82F6]">
                  <span className="w-3 h-0.5 bg-[#3B82F6]" /> 9 EMA (Fast Signal)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-[#F59E0B]">
                  <span className="w-3 h-0.5 bg-[#F59E0B]" /> 50 SMA (Trend Anchor)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed text-center">
              The Golden Cross triggers when short-term momentum sweeps above the long-term averages, signaling a macro structural reversal.
            </p>
          </div>
        );

      case 'ORDER_BOOK_DEPTH':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center">
              🏦 Real-Time Electronic Order Book Depth Curves
            </h4>
            <div className="relative h-44 border border-white/10 bg-[#0F172A] rounded-lg overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 border-l border-white/10" />
              
              <div className="grid grid-cols-2 h-full">
                {/* Bids side */}
                <div className="relative flex items-end p-2 justify-start h-full">
                  <div className="absolute inset-0 bg-emerald-500/10 right-0 w-4/5 origin-left" />
                  <span className="text-[9px] font-mono text-emerald-400 font-bold z-10">
                    🟢 BUY BIDS SIDE (Liquidity Pool)<br />₹98.50 - Accumulation Block
                  </span>
                </div>

                {/* Asks side */}
                <div className="relative flex items-end p-2 justify-end h-full text-right">
                  <div className="absolute inset-0 bg-rose-500/10 left-0 w-4/5 origin-right ml-auto" />
                  <span className="text-[9px] font-mono text-rose-400 font-bold z-10">
                    🔴 SELL ASKS SIDE (Supply Overhang)<br />₹101.20 - Distribution Block
                  </span>
                </div>
              </div>

              {/* Order depth curve SVG overlay */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 150">
                {/* Bids curve (Green) */}
                <path d="M 0 30 Q 150 40 240 145 L 240 150 L 0 150 Z" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="2" />
                {/* Asks curve (Red) */}
                <path d="M 500 20 Q 350 40 260 145 L 260 150 L 500 150 Z" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="2" />
              </svg>

              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#0E1726] text-white font-mono font-bold text-[9px] rounded px-2 py-0.5 shadow-md">
                BID-ASK SPREAD: ₹2.70
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed text-center font-sans">
              The spread represents the friction of immediate liquidity. A thin spread indicates deep matching engine pools, minimizing execution slippage.
            </p>
          </div>
        );

      case 'BLOCKCHAIN_NODES':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center">
              ⛓️ Blockchain Cryptographic Verification Node Chain
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {/* Block 1 */}
              <div className="bg-[#0E1726] border-2 border-black rounded-lg p-2.5 text-[9px] font-mono space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-bold text-white block text-center border-b pb-1">BLOCK #3841</span>
                <div><strong>Nonce:</strong> 85401</div>
                <div className="truncate"><strong>Prev Hash:</strong> 0000a184</div>
                <div className="truncate text-emerald-600 font-bold"><strong>Hash:</strong> 0000bf72 ✓</div>
              </div>

              {/* Block 2 */}
              <div className="bg-[#0E1726] border-2 border-black rounded-lg p-2.5 text-[9px] font-mono space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-bold text-white block text-center border-b pb-1">BLOCK #3842</span>
                <div><strong>Nonce:</strong> 47312</div>
                <div className="truncate"><strong>Prev Hash:</strong> 0000bf72</div>
                <div className="truncate text-emerald-600 font-bold"><strong>Hash:</strong> 0000d210 ✓</div>
              </div>

              {/* Block 3 */}
              <div className="bg-[#0E1726] border-2 border-black rounded-lg p-2.5 text-[9px] font-mono space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-bold text-white block text-center border-b pb-1">BLOCK #3843</span>
                <div><strong>Nonce:</strong> 29505</div>
                <div className="truncate"><strong>Prev Hash:</strong> 0000d210</div>
                <div className="truncate text-emerald-600 font-bold"><strong>Hash:</strong> 0000ea39 ✓</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed text-center font-sans">
              Changing data in any single block alters its hash. This invalidates the next block's "Prev Hash", making malicious ledger alterations mathematically impossible.
            </p>
          </div>
        );

      case 'DOUBLE_TOP_BOTTOM':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center">
              📉 Double Top Pattern (Bearish Trend Reversal M-Formation)
            </h4>
            <div className="relative h-44 border border-white/10 bg-[#0E1726] rounded-lg overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 500 150">
                {/* M path */}
                <path
                  d="M 20 130 L 120 40 L 220 95 L 320 40 L 420 130 L 480 145"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                
                {/* Neckline */}
                <line x1="20" y1="95" x2="480" y2="95" stroke="#0F172A" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>

              <div className="absolute top-2 left-[100px] bg-black text-white text-[8px] font-mono rounded px-1.5 py-0.5 shadow-sm">
                Peak #1 (Resistance Rejection)
              </div>
              <div className="absolute top-2 right-[140px] bg-black text-white text-[8px] font-mono rounded px-1.5 py-0.5 shadow-sm">
                Peak #2 (Fails to breach Peak 1)
              </div>
              <div className="absolute bottom-[40px] left-[150px] bg-rose-600 text-white text-[8px] font-mono font-black rounded px-1.5 py-0.5 animate-bounce shadow-md">
                NECKLINE BREAKDOWN (Sell Confirmation!)
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed text-center font-sans">
              The double top indicates structural exhaustion. Buyers failed twice to drive price higher, allowing sellers to aggressively seize control below the neckline.
            </p>
          </div>
        );

      case 'WYCKOFF_PHASES':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center">
              🏫 Wyckoff Method Accumulation Schematic (Market Cycle)
            </h4>
            <div className="relative h-44 border border-white/10 bg-[#0E1726] rounded-lg overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 500 150">
                {/* Wyckoff curve */}
                <path
                  d="M 10 30 L 50 110 L 100 70 L 150 120 L 200 80 L 250 120 L 300 135 L 340 90 L 380 95 L 420 50 L 480 30"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                
                {/* Accumulation levels */}
                <line x1="40" y1="120" x2="330" y2="120" stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              </svg>

              <div className="absolute top-3 left-4 bg-slate-100 border text-[8px] font-mono p-1 rounded shadow-sm">
                <strong>Phase A:</strong> Stopping Trend
              </div>
              <div className="absolute bottom-10 left-1/3 bg-slate-100 border text-[8px] font-mono p-1 rounded shadow-sm">
                <strong>Phase C:</strong> Spring / Shakeout
              </div>
              <div className="absolute top-4 right-6 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[8px] font-mono p-1 rounded font-bold shadow-sm">
                <strong>Phase E:</strong> Markup & Trend Run
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed text-center font-sans">
              Smart money institutions accumulate positions during Phase B/C, manipulating panic selloffs (Springs) to trigger stop losses before launching the markup.
            </p>
          </div>
        );

      case 'FIBONACCI_RETRACEMENT':
        return (
          <div className="bg-slate-50 border-2 border-white/10 rounded-xl p-5 my-5 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider text-center">
              🧬 Fibonacci Retracement Golden Pocket Zones
            </h4>
            <div className="relative h-44 border border-white/10 bg-[#0E1726] rounded-lg overflow-hidden text-[8px] font-mono">
              {/* Fib lines */}
              <div className="absolute top-4 inset-x-0 border-t border-slate-300 flex justify-between px-2 text-slate-400">
                <span>0.0% (Swing High)</span>
                <span>₹100.00</span>
              </div>
              <div className="absolute top-[48px] inset-x-0 border-t border-amber-300 flex justify-between px-2 text-amber-600 bg-amber-500/5">
                <span>38.2% Retracement</span>
                <span>₹80.00</span>
              </div>
              <div className="absolute top-[80px] inset-x-0 border-t border-emerald-400 flex justify-between px-2 text-emerald-700 bg-emerald-500/10 font-bold">
                <span>61.8% Golden Pocket limit</span>
                <span>₹65.00</span>
              </div>
              <div className="absolute bottom-[16px] inset-x-0 border-t border-slate-300 flex justify-between px-2 text-slate-400">
                <span>100.0% (Swing Low)</span>
                <span>₹50.00</span>
              </div>

              {/* Price retracement line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 150">
                <path d="M 30 134 L 200 16 L 380 80 L 480 30" fill="none" stroke="#000" strokeWidth="2" />
              </svg>

              <div className="absolute top-[84px] left-1/2 -translate-x-1/2 bg-emerald-600 text-white rounded px-2 py-0.5 font-bold animate-pulse text-[9px] shadow-md">
                🐂 Golden Pocket Bounce Zone!
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed text-center font-sans">
              The 61.8% retracement level is mathematically proven to attract institutional buy-backs, offering the highest reward-to-risk entry parameter.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const handleTopicClick = (topic: Topic) => {
    if (isLevelLocked(selectedLevel)) return;
    if (isTopicLockedByDrip(topic)) return;
    setActiveTopic(topic);
    setShowQuiz(false);
    setActiveTopicView('video');
  };

  const handleMarkComplete = () => {
    if (!activeTopic) return;
    if (user.progress.includes(activeTopic.id)) return;

    const updatedUser: UserProfile = {
      ...user,
      progress: [...user.progress, activeTopic.id]
    };
    onUpdateUser(updatedUser);
  };

  const handleQuizComplete = (score: number) => {
    if (!activeTopic) return;

    const currentBestScore = user.quizScores[activeTopic.id] || 0;
    const newScores = { ...user.quizScores };
    if (score > currentBestScore) {
      newScores[activeTopic.id] = score;
    }

    // Automatically mark complete if scored >= 70%
    let updatedProgress = [...user.progress];
    if (score >= 70 && !updatedProgress.includes(activeTopic.id)) {
      updatedProgress.push(activeTopic.id);
    }

    const updatedUser: UserProfile = {
      ...user,
      progress: updatedProgress,
      quizScores: newScores
    };

    onUpdateUser(updatedUser);
  };

  // Level Completion Metrics
  const getLevelProgress = () => {
    if (!currentCourse) return 0;
    const total = currentCourse.topics.length;
    if (total === 0) return 0;
    
    const completed = currentCourse.topics.filter(t => user.progress.includes(t.id)).length;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="space-y-6">
      
      {/* Academy Hero Starting Banner */}
      <div id="academy-starting-banner" className="bg-[#0E1726] border-2 border-white/10 rounded p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#05D59E] via-[#0F172A] to-[#05D59E]" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="inline-flex bg-[#05D59E]/5 border border-[#05D59E]/30 text-[#05D59E] px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase">
              SZTrade Learn Academy • A Project by SAMZEN
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Start with <span className="text-[#05D59E] italic">Free Lessons</span>, Upgrade to Pro Subscription!
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Unlock a comprehensive curriculum built around fundamental, technical, and quantitative strategies. Complete beginner-level topics absolutely free of charge, then unlock the full library of advanced techniques and our real-time interactive trading sandbox through our flexible subscription plans.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              id="start-free-btn"
              onClick={() => {
                setSelectedLevel('beginner');
                setSelectedMarket('stocks');
                setActiveTopic(null);
                setShowQuiz(false);
              }}
              className="bg-[#0E1726] hover:bg-[#151D2A] text-white border border-white/10 text-xs font-bold px-4 py-2.5 rounded transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
            >
              Start Free (Beginner Stocks)
            </button>
            <button
              id="explore-pro-btn"
              onClick={onGoProClick}
              className="bg-[#05D59E] hover:bg-[#0F172A] hover:text-[#05D59E] text-white text-xs font-bold px-4 py-2.5 rounded transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,0.15)] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Pro Subscriptions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Personalized Learning Path Widget */}
      {!user.isPersonalizedSet ? (
        <div id="personalized-onboarding-form" className="bg-[#0E1726] border-2 border-white/10 rounded p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6">
          <div className="border-b border-white/10/10 pb-4">
            <h3 className="text-sm md:text-base font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#05D59E]" />
              Setup Your Personalized Academy Pathway
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Answer 3 brief questions to construct an optimized, customized progression map of lessons, quizzes, and simulation objectives tailored to your style.
            </p>
          </div>

          <div className="space-y-4">
            {/* Question 1: Market of Interest */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-white/70 uppercase tracking-wider">
                1. What is your primary market of interest?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['stocks', 'forex', 'crypto'] as const).map((m) => (
                  <button
                    id={`market-interest-${m}`}
                    key={m}
                    type="button"
                    onClick={() => setInterest(m)}
                    className={`p-3 rounded border text-xs font-bold transition-all ${interest === m ? 'border-2 border-[#05D59E] bg-[#05D59E]/5 text-[#05D59E]' : 'border-white/10/15 hover:border-black hover:bg-[#151D2A]/30'}`}
                  >
                    {m === 'stocks' ? '💼 Stocks' : m === 'forex' ? '💱 Forex' : '🪙 Crypto'}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Knowledge Level */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-white/70 uppercase tracking-wider">
                2. What is your current trading knowledge level?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                  <button
                    id={`knowledge-lvl-${lvl}`}
                    key={lvl}
                    type="button"
                    onClick={() => setKnowledgeLevel(lvl)}
                    className={`p-3 rounded border text-xs font-bold transition-all ${knowledgeLevel === lvl ? 'border-2 border-[#05D59E] bg-[#05D59E]/5 text-[#05D59E]' : 'border-white/10/15 hover:border-black hover:bg-[#151D2A]/30'}`}
                  >
                    <span className="capitalize">{lvl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: Learning Goal */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-white/70 uppercase tracking-wider">
                3. What is your primary trading goal?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Day Trading / Scalping', 'Long-Term Investing', 'Swing Trading', 'Risk & Portfolio Management'].map((goal) => (
                  <button
                    id={`goal-btn-${goal.replace(/\s+/g, '-')}`}
                    key={goal}
                    type="button"
                    onClick={() => setLearningGoal(goal)}
                    className={`p-3 rounded border text-xs font-bold transition-all leading-tight ${learningGoal === goal ? 'border-2 border-[#05D59E] bg-[#05D59E]/5 text-[#05D59E]' : 'border-white/10/15 hover:border-black hover:bg-[#151D2A]/30'}`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="generate-path-btn"
              onClick={() => {
                const updated: UserProfile = {
                  ...user,
                  interest,
                  knowledgeLevel,
                  learningGoal,
                  isPersonalizedSet: true
                };
                onUpdateUser(updated);
              }}
              className="w-full bg-[#0F172A] hover:bg-[#05D59E] hover:text-white text-white text-xs font-bold py-3 rounded transition-colors shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
            >
              Generate My Personalized Path ⚡
            </button>
          </div>
        </div>
      ) : (
        /* Personalized Path Overview */
        <div id="personalized-path-display" className="bg-[#0E1726] border-2 border-white/10 rounded p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10/10 pb-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#05D59E]" />
                Your Recommended Path: <span className="text-[#05D59E] italic font-normal capitalize">{user.interest} ({user.knowledgeLevel})</span>
              </h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Targeted goal: {user.learningGoal} • Handpicked sequence of core lessons
              </p>
            </div>
            <button
              id="reset-questionnaire-btn"
              onClick={() => {
                const updated: UserProfile = {
                  ...user,
                  isPersonalizedSet: false
                };
                onUpdateUser(updated);
              }}
              className="text-[10px] text-slate-400 hover:text-[#05D59E] font-mono font-bold uppercase underline decoration-dotted transition"
            >
              Reset Path Questionnaire ↺
            </button>
          </div>

          {/* Cards for recommended path sequence */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {getPersonalizedSequence().map((step, idx) => {
              const matchedCourse = ALL_COURSES.find(c => c.market === step.market && c.level === step.level);
              const resolvedTopic = matchedCourse?.topics.find(t => t.id === step.topicId);
              const completed = user.progress.includes(step.topicId);

              return (
                <div 
                  key={step.topicId} 
                  className={`bg-[#151D2A]/30 border rounded p-3.5 flex flex-col justify-between space-y-3 relative overflow-hidden transition-all duration-150 ${completed ? 'border-emerald-600 bg-emerald-50/20' : 'border-white/10/10 hover:border-black'}`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#05D59E]" style={{ display: completed ? 'none' : 'block' }} />
                  {completed && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />}

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                      <span className="bg-[#0E1726] px-1.5 py-0.5 rounded border border-white/10/10 font-bold uppercase">{step.type}</span>
                      <span className="font-bold">Step {idx + 1}</span>
                    </div>
                    <h4 className="text-xs font-serif font-bold text-white leading-tight pt-1">
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-slate-300 line-clamp-2">
                      {step.desc}
                    </p>
                  </div>

                  <div>
                    {resolvedTopic ? (
                      <button
                        id={`jump-step-${idx}`}
                        onClick={() => {
                          setSelectedMarket(step.market);
                          setSelectedLevel(step.level);
                          setActiveTopic(resolvedTopic);
                          setShowQuiz(false);
                          // Scroll layout dynamically
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className={`w-full py-1.5 rounded text-[10px] font-bold text-center border transition-all ${completed ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-white/10 bg-[#0E1726] text-white hover:bg-[#151D2A]'}`}
                      >
                        {completed ? 'Studied ✓ (Review)' : 'Jump to Lesson 🚀'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#05D59E] font-semibold">Lesson Locked/Unavailable</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Lifetime Sub - Step 4 custom live updated briefing */}
            <div className="bg-[#05D59E]/5 border-2 border-[#05D59E]/30 rounded p-3.5 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <span className="absolute top-1 right-1 text-[8px] font-mono bg-[#05D59E] text-white px-1 rounded uppercase tracking-wider animate-pulse">
                Live Briefing
              </span>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-[#05D59E]">
                  <span className="font-black bg-[#0E1726]/70 border border-[#05D59E]/20 px-1 py-0.5 rounded">⚡ CONTINUALLY UPDATED</span>
                  <span className="font-bold">Step 4</span>
                </div>
                <h4 className="text-xs font-serif font-bold text-white leading-tight pt-1">
                  Macro Tactical Volatility Briefing
                </h4>
                <p className="text-[10px] text-slate-300 line-clamp-2">
                  Continually refreshed quantitative models and active playbooks based on live interest policy.
                </p>
              </div>

              <div>
                {isLifetime ? (
                  <button
                    id="open-live-briefing-btn"
                    onClick={() => setShowPremiumBriefing(true)}
                    className="w-full py-1.5 rounded text-[10px] font-bold text-center border-2 border-[#05D59E] bg-[#0E1726] text-[#05D59E] hover:bg-[#05D59E]/10 transition-all"
                  >
                    Open Live Briefing 📖
                  </button>
                ) : (
                  <div className="space-y-1">
                    <button
                      id="unlock-lifetime-btn"
                      onClick={onGoProClick}
                      className="w-full py-1.5 rounded text-[10px] font-bold text-center bg-[#05D59E] text-white hover:bg-[#0F172A] hover:text-white transition-all flex items-center justify-center gap-1"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Unlock Lifetime Go Pro</span>
                    </button>
                    <p className="text-[8px] text-[#05D59E] text-center font-semibold">Requires Lifetime Premium Tier</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Briefing Modal for Lifetime Subscribers */}
      <AnimatePresence>
        {showPremiumBriefing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1A1A1A]/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0E1726] border-2 border-white/10 rounded max-w-2xl w-full p-6 space-y-5 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-white/10/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#05D59E] animate-spin" />
                  <div>
                    <h3 className="text-base font-serif font-bold text-white">
                      Go Pro Lifetime Briefing
                    </h3>
                    <span className="text-[9px] font-mono bg-[#05D59E] text-white px-1.5 py-0.2 rounded font-bold uppercase">
                      Updated: June 2026 (Live Feed Active)
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPremiumBriefing(false)}
                  className="p-1 border border-white/10/10 rounded hover:bg-[#151D2A]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white leading-relaxed font-sans">
                <div>
                  <h4 className="font-serif font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-1 flex items-center gap-1">
                    <span>🌍</span> Macro Capital Rotation Model
                  </h4>
                  <p className="mt-1 text-white/70">
                    With recent global interest decisions, sovereign yield spreads have compressed. We are witnessing high-conviction capital rotation from saturated high-multiple technology equities directly into spot decentralized blockchain protocols and high-yielding forex sweeps.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-1 flex items-center gap-1">
                    <span>⚡</span> High-Probability Liquidity Pools
                  </h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-white/70">
                    <li><strong>Stocks Sandbox (RELIANCE):</strong> Massive institutional order blocks confirmed at ₹2,400 to ₹2,420. Excellent buy liquidity floor for long entries.</li>
                    <li><strong>Crypto Sandbox (BTC):</strong> Spot exchange funding rates have normalized. A key imbalance remains around $61,500. Accumulate long structures patiently.</li>
                    <li><strong>Forex Sandbox (EUR/USD):</strong> Market structure shift confirmed on 4H charts. Targeting 1.0820 for liquidity sweeper plays.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-1 flex items-center gap-1">
                    <span>🛡️</span> Risk Policy Briefing
                  </h4>
                  <p className="mt-1 text-white/70">
                    Slippage remains high on volatile crypto pairs. Reduce position sizing to 0.5% maximum capital risk on short-term plays, and increase target R:R ratios to 1:3 on structural breakout setups.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10/10 pt-4 text-center">
                <button
                  onClick={() => setShowPremiumBriefing(false)}
                  className="bg-[#0F172A] hover:bg-[#05D59E] hover:text-white text-white font-bold py-2 px-6 rounded text-xs transition shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  Understood, Return to Course Viewer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upper controls & filter selectors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Market Selector */}
        <div className="flex bg-[#F2F1EF] p-1 border border-[#1A1A1A]/10 rounded w-full md:w-auto">
          {(['stocks', 'forex', 'crypto'] as const).map((market) => (
            <button
              key={market}
              onClick={() => {
                setSelectedMarket(market);
                setActiveTopic(null);
                setShowQuiz(false);
              }}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all duration-150 ${selectedMarket === market ? 'bg-[#1A1A1A] text-white font-black' : 'text-slate-300 hover:text-[#1A1A1A]'}`}
            >
              {market === 'stocks' ? '💼 Stocks' : market === 'forex' ? '💱 Forex' : '🪙 Crypto'}
            </button>
          ))}
        </div>

        {/* Level Selector */}
        <div className="flex bg-[#F2F1EF] p-1 border border-[#1A1A1A]/10 rounded w-full md:w-auto">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
            const locked = isLevelLocked(level);
            return (
              <button
                key={level}
                onClick={() => {
                  setSelectedLevel(level);
                  setActiveTopic(null);
                  setShowQuiz(false);
                }}
                className={`flex-1 md:flex-none px-3.5 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 ${selectedLevel === level ? 'bg-[#0F172A] text-white font-black' : 'text-slate-300 hover:text-white'}`}
              >
                {level === 'beginner' ? 'Beginner' : level === 'intermediate' ? 'Intermediate' : 'Advanced'}
                {locked && <Lock className="w-3 h-3 text-[#05D59E]" />}
              </button>
            );
          })}
        </div>

        {/* Next Course Track Action Button */}
        <button
          type="button"
          onClick={() => {
            const marketCycle: MarketType[] = ['stocks', 'forex', 'crypto'];
            const nextIdx = (marketCycle.indexOf(selectedMarket) + 1) % marketCycle.length;
            setSelectedMarket(marketCycle[nextIdx]);
            setSelectedLevel('beginner');
            setActiveTopic(null);
            setShowQuiz(false);
          }}
          className="w-full md:w-auto px-4 py-2.5 text-xs font-mono font-black rounded uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-indigo-500"
          title="Switch instantly to the next major course subject"
        >
          <span>Next Course Track ⏩</span>
        </button>
      </div>

      {/* Drip Status Alert box (Helpful debug tool for demonstration) */}
      <div className="bg-[#0E1726] border-2 border-white/10 rounded p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="space-y-1">
          <h4 className="text-xs font-mono font-bold text-[#05D59E] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Simulated Unlock Schedule
          </h4>
          <p className="text-xs text-white">
            {isLifetime ? (
              <span className="text-[#05D59E] font-bold">✨ Lifetime Pro active! All 18 topics are unlocked instantly & permanently bypass drip timers.</span>
            ) : (
              <span>Your Drip Level is: <strong className="text-[#05D59E] font-mono text-sm font-black">Day {daysSinceJoining + 1}</strong>. There are <strong className="text-[#05D59E] font-bold">{2 * (daysSinceJoining + 1)} topics</strong> available for you. 2 topics unlock on each subsequent day.</span>
            )}
          </p>
        </div>

        {!isLifetime && (
          <button
            onClick={onSimulateDayForward}
            className="shrink-0 flex items-center gap-1.5 bg-[#0E1726] hover:bg-[#151D2A] text-xs font-bold text-white px-3 py-1.5 rounded border border-white/10 transition"
          >
            <FastForward className="w-3.5 h-3.5 text-[#05D59E]" />
            <span>Simulate Day {daysSinceJoining + 2}</span>
          </button>
        )}
      </div>

      {/* Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Lesson List Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0E1726] border-2 border-white/10 rounded p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.15)]">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Course Syllabus
                </h3>
              </div>

              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-slate-300">Level Progress</span>
                <span className="text-[#05D59E] font-bold font-mono">{getLevelProgress()}%</span>
              </div>
              <div className="h-2 bg-[#151D2A] border border-white/10/10 rounded mt-2 overflow-hidden">
                <div 
                  className="h-full bg-[#05D59E] rounded transition-all duration-300"
                  style={{ width: `${getLevelProgress()}%` }}
                />
              </div>
            </div>

            {/* Level Lock State Panel if locked */}
            {isLevelLocked(selectedLevel) ? (
              <div className="py-6 px-4 text-center bg-[#151D2A]/40 border border-white/10/10 rounded space-y-4">
                <div className="mx-auto w-10 h-10 rounded bg-[#05D59E]/10 text-[#05D59E] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-white">Go Pro Required</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The {selectedLevel} courses require an active <strong className="text-[#05D59E] font-semibold">Go Pro</strong> lifetime or recurring membership to unlock.
                  </p>
                </div>
                <button
                  onClick={onGoProClick}
                  className="w-full py-2 bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white text-xs font-bold rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] transition-colors"
                >
                  Unlock Go Pro Now
                </button>
              </div>
            ) : (
              /* Topic Buttons list */
              <div className="space-y-2">
                {currentCourse?.topics.map((topic, index) => {
                  const lockedByDrip = isTopicLockedByDrip(topic);
                  const completed = user.progress.includes(topic.id);
                  const score = user.quizScores[topic.id];
                  const active = activeTopic?.id === topic.id;

                  return (
                    <button
                      key={topic.id}
                      disabled={lockedByDrip}
                      onClick={() => handleTopicClick(topic)}
                      className={`w-full p-3.5 rounded border text-left transition-all duration-150 flex items-start gap-3 relative ${active ? 'bg-[#05D59E]/5 border-2 border-[#05D59E] text-white' : lockedByDrip ? 'bg-[#151D2A]/40 border-white/10/10 text-slate-500 cursor-not-allowed' : 'bg-[#0E1726] border-white/10/20 text-white hover:bg-[#151D2A]/40 hover:border-black'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {completed ? (
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                        ) : lockedByDrip ? (
                          <Lock className="w-4.5 h-4.5 text-white/20" />
                        ) : (
                          <BookOpen className="w-4.5 h-4.5 text-[#05D59E]" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-serif font-bold leading-tight truncate">
                            {index + 1}. {topic.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 line-clamp-1 leading-snug">
                          {topic.description}
                        </p>

                        {/* Badges */}
                        <div className="flex gap-1.5 items-center pt-1">
                          <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                            Day {topic.dayIndex + 1} Topic
                          </span>
                          {score !== undefined && (
                            <span className="text-[8px] font-mono font-bold bg-[#05D59E]/10 text-[#05D59E] border border-[#05D59E]/20 px-1 py-0.2 rounded">
                              Quiz: {score}%
                            </span>
                          )}
                          {lockedByDrip && (
                            <span className="text-[8px] font-mono font-semibold text-[#05D59E] bg-[#05D59E]/5 px-1 rounded border border-[#05D59E]/10">
                              Locked till Day {topic.dayIndex + 1}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Lesson Reading Terminal (Right) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!activeTopic ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0E1726] border-2 border-white/10 rounded p-8 text-center text-slate-300 space-y-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.15)]"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-[#05D59E]/5 border border-[#05D59E]/20 text-[#05D59E] flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-serif italic font-bold text-[#1A1A1A] mb-1">Welcome to SZTrade Learn Academy</h3>
                  <p className="text-xs max-w-md mx-auto leading-relaxed">
                    Select a market and level above, then click on any unlocked lesson from the syllabus on the left to start learning.
                  </p>
                </div>
              </motion.div>
            ) : showQuiz ? (
              /* Quiz View inside active topic */
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setShowQuiz(false)}
                  className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/10/20 px-3 py-1.5 rounded bg-[#0E1726] hover:bg-[#151D2A] transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#05D59E]" />
                  <span>Back to Lesson Reading</span>
                </button>

                <QuizSection 
                  quizId={activeTopic.id} 
                  questions={activeTopic.quiz} 
                  onComplete={handleQuizComplete} 
                  level={selectedLevel}
                />
              </motion.div>
            ) : (
              /* Core Reading View of Active Topic */
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-[#0E1726] border-2 border-white/10 rounded p-6 md:p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
              >
                {/* Header */}
                <div className="border-b border-white/10/10 pb-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-[#151D2A] text-[#05D59E] border border-white/10/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {selectedMarket} • {selectedLevel}
                      </span>
                      {user.progress.includes(activeTopic.id) && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsStudyFullscreen(true)}
                      className="text-[10px] font-mono font-black text-white border border-white/10/15 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded shadow-sm transition"
                    >
                      ⛶ Expand Fullscreen View
                    </button>
                  </div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                    {activeTopic.title}
                  </h2>
                  <p className="text-slate-300 text-xs md:text-sm italic font-serif">
                    {activeTopic.description}
                  </p>
                </div>

                {/* Listen to Lesson Audio Player Bar */}
                <div className="bg-[#151D2A] border-2 border-[#05D59E]/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[3px_3px_0px_0px_rgba(5,213,158,0.2)]">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPlayingAudio ? 'bg-[#05D59E] text-slate-950 animate-pulse' : 'bg-[#0E1726] text-[#05D59E] border border-[#05D59E]/30'}`}>
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-black text-[#05D59E] uppercase tracking-wider block">
                        🔊 Browser Speech Synthesis Audio Player
                      </span>
                      <h4 className="text-xs font-serif font-bold text-white">
                        Listen to Lesson: {activeTopic.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {!isPlayingAudio ? (
                      <button
                        onClick={handlePlayAudio}
                        className="flex-1 sm:flex-none px-4 py-2 bg-[#05D59E] hover:bg-[#04bd8b] text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isPausedAudio ? 'Resume Audio' : 'Listen to Lesson'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseAudio}
                        className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Audio</span>
                      </button>
                    )}

                    {(isPlayingAudio || isPausedAudio) && (
                      <button
                        onClick={handleStopAudio}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        title="Stop Audio"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Option to Choose View Mode */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                    Choose View Mode (Click to Open Directly):
                  </span>
                  <div className="grid grid-cols-2 border-2 border-white/10 rounded overflow-hidden bg-[#151D2A] p-1 gap-1">
                    <button
                      onClick={() => setActiveTopicView('video')}
                      className={`py-2.5 text-xs font-mono font-bold uppercase rounded transition-all flex items-center justify-center gap-2 ${activeTopicView === 'video' ? 'bg-[#05D59E] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-white/70 hover:text-white hover:bg-black/5'}`}
                    >
                      📺 Dynamic Video Player
                    </button>
                    <button
                      onClick={() => setActiveTopicView('notes')}
                      className={`py-2.5 text-xs font-mono font-bold uppercase rounded transition-all flex items-center justify-center gap-2 ${activeTopicView === 'notes' ? 'bg-[#0F172A] text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,0.15)]' : 'text-white/70 hover:text-white hover:bg-black/5'}`}
                    >
                      📝 Study Notes & Diagrams
                    </button>
                  </div>
                </div>

                {/* Simulated Robotic AI Video */}
                {activeTopicView === 'video' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-[#05D59E] uppercase tracking-wider block">
                      🎙️ AI Vocal Lecture ({activeTopic.videoDuration || "15:00"} Minutes)
                    </span>
                    <RoboticVideoPlayer topic={activeTopic} />
                  </div>
                )}

                {/* Educational Body & Notes */}
                {activeTopicView === 'notes' && (
                  <div className="pt-2">
                    <ChapterNotesViewer 
                      topic={activeTopic} 
                      isCompleted={user.progress.includes(activeTopic.id)}
                      onCompleteChapter={() => handleQuizComplete(100)}
                    />
                  </div>
                )}

                    {/* Next Lesson / Course Progression Navigation block */}
                    {(() => {
                      const currentCourseObj = courses.find(c => c.market === selectedMarket && c.level === selectedLevel);
                      const currentTopics = currentCourseObj ? currentCourseObj.topics : [];
                      const activeTopicIndex = currentTopics.findIndex((t: any) => t.id === activeTopic.id);

                      if (activeTopicIndex !== -1 && activeTopicIndex + 1 < currentTopics.length) {
                        return (
                          <div className="border border-white/10/10 bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                            <div>
                              <span className="text-[9px] font-mono text-[#05D59E] uppercase tracking-widest font-black">CONTINUE ACADEMY TRACK</span>
                              <h5 className="text-xs font-bold text-white font-serif">Next Lesson: {currentTopics[activeTopicIndex + 1].title}</h5>
                            </div>
                            <button
                              onClick={() => {
                                handleTopicClick(currentTopics[activeTopicIndex + 1]);
                                window.scrollTo({ top: 350, behavior: 'smooth' });
                              }}
                              className="w-full sm:w-auto bg-[#05D59E] hover:bg-[#0F172A] hover:text-[#05D59E] text-white border-2 border-black font-black font-mono text-[10px] uppercase px-4 py-2 rounded tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>Next Lesson ➜</span>
                            </button>
                          </div>
                        );
                      } else if (activeTopicIndex !== -1 && activeTopicIndex + 1 === currentTopics.length) {
                        return (
                          <div className="border-2 border-[#05D59E] bg-emerald-500/5 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                            <div>
                              <span className="text-[9px] font-mono text-emerald-700 uppercase tracking-widest font-black">🎉 SYLLABUS TRACK COMPLETE</span>
                              <h5 className="text-sm font-black text-white font-serif">Advance to {selectedLevel === 'beginner' ? 'Intermediate Syllabus' : 'Advanced Elite Pro Track'}</h5>
                            </div>
                            <button
                              onClick={() => {
                                const nextLvl = selectedLevel === 'beginner' ? 'intermediate' : 'advanced';
                                setSelectedLevel(nextLvl);
                                const nextCourseObj = courses.find((c: any) => c.market === selectedMarket && c.level === nextLvl);
                                if (nextCourseObj && nextCourseObj.topics.length > 0) {
                                  setActiveTopic(nextCourseObj.topics[0]);
                                  setShowQuiz(false);
                                  setActiveTopicView('video');
                                  window.scrollTo({ top: 350, behavior: 'smooth' });
                                }
                              }}
                              className="w-full sm:w-auto bg-[#0F172A] text-[#05D59E] border-2 border-black font-black font-mono text-[10px] uppercase px-5 py-3 rounded tracking-wider shadow-[2px_2px_0px_0px_rgba(5,213,158,1)] transition-all flex items-center justify-center gap-1.5 animate-bounce"
                            >
                              <span>🏆 Advance Level Track ➜</span>
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                {/* Footer Actions */}
                <div className="border-t border-white/10/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    {!user.progress.includes(activeTopic.id) ? (
                      <button
                        onClick={handleMarkComplete}
                        className="bg-[#0E1726] hover:bg-[#151D2A] text-white px-5 py-2.5 rounded text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
                      >
                        <CheckCircle className="w-4 h-4 text-[#05D59E]" />
                        <span>Mark Lesson as Read</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200">
                        <CheckCircle className="w-4 h-4" />
                        Lesson Fully Studied
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowQuiz(true);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto bg-[#05D59E] hover:bg-[#0F172A] hover:text-[#05D59E] text-white px-5 py-2.5 rounded font-bold text-xs tracking-wider transition duration-150 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                  >
                    <span>Take Topic Quiz ({activeTopic.quiz.length} Questions)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Embedded Banner Ad for Free Users on Active Beginner Study */}
      {!isPro && selectedLevel === 'beginner' && (
        <div className="pt-4">
          <AdBanner isPro={isPro} onGoProClick={onGoProClick} />
        </div>
      )}

      {/* Immersive Fullscreen Study Modal Portal */}
      {isStudyFullscreen && activeTopic && (
        <div className="fixed inset-0 bg-[#0F172A]/98 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-5xl bg-[#0E1726] border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(5,213,158,1)] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0F172A] text-white px-6 py-4 flex justify-between items-center border-b-4 border-black shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-[#05D59E] font-black uppercase tracking-widest">
                  🏫 IMMERSIVE FULLSCALE STUDY TERMINAL
                </span>
                <h3 className="text-sm md:text-base font-serif font-bold text-white flex items-center gap-2">
                  <span>{activeTopic.title}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsStudyFullscreen(false)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs px-4 py-2 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
              >
                ✕ Close Fullscreen Mode
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Video visualization */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-50 border-2 border-white/10 p-4 rounded-xl">
                    <span className="text-[10px] font-mono font-bold text-[#05D59E] uppercase tracking-wider block mb-2">
                      🎙️ Lecture Vocal Audio Monitor
                    </span>
                    <RoboticVideoPlayer topic={activeTopic} />
                  </div>
                  
                  <div className="bg-[#05D59E]/5 border border-[#05D59E]/25 p-4 rounded-xl text-xs space-y-2">
                    <h5 className="font-bold text-white uppercase font-mono tracking-wider">💡 Fullscreen Guide:</h5>
                    <p className="text-white/70 leading-relaxed font-sans">
                      Study the masterclass lecture on the left or scroll through detailed professional-grade study notes and dynamic diagram structures on the right. Expand your trading mindset systematically.
                    </p>
                  </div>
                </div>

                {/* Right side: Study notes and interactive SVG diagrams */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Notes Control Sub-Bar */}
                  <div className="flex justify-between items-center bg-slate-100 border border-white/10/10 px-3 py-2 rounded-lg text-xs font-mono">
                    <span className="text-slate-300 font-bold">🔍 NOTES ZOOM SIZE:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNotesFontSize(Math.max(12, notesFontSize - 2))}
                        className="bg-[#0E1726] hover:bg-slate-200 border border-white/10/10 px-2.5 py-1 rounded font-mono font-bold text-slate-800"
                      >
                        A-
                      </button>
                      <span className="font-bold text-white font-mono w-12 text-center">{notesFontSize}px</span>
                      <button
                        type="button"
                        onClick={() => setNotesFontSize(Math.min(32, notesFontSize + 2))}
                        className="bg-[#0E1726] hover:bg-slate-200 border border-white/10/10 px-2.5 py-1 rounded font-mono font-bold text-slate-800"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <div 
                    style={{ fontSize: `${notesFontSize}px` }}
                    className="text-white leading-relaxed space-y-5 whitespace-pre-wrap font-sans bg-slate-50 p-6 rounded-2xl border-2 border-white/10"
                  >
                    {activeTopic.content.split('\n\n').map((block, bIdx) => {
                      if (block.startsWith('### ')) {
                        return <h3 key={bIdx} className="text-sm md:text-base font-serif font-bold text-[#1A1A1A] pt-4 flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-1">{block.replace('### ', '')}</h3>;
                      }
                      if (block.startsWith('[DIAGRAM: ')) {
                        const diagramType = block.replace('[DIAGRAM: ', '').replace(']', '').trim();
                        return <div key={bIdx}>{renderInteractiveDiagram(diagramType)}</div>;
                      }
                      if (block.startsWith('* ')) {
                        return (
                          <ul key={bIdx} className="list-disc pl-5 space-y-1 text-white">
                            {block.split('\n').map((li, lIdx) => (
                              <li key={lIdx}>{li.replace('* ', '')}</li>
                            ))}
                          </ul>
                        );
                      }
                      if (block.match(/^\d+\./)) {
                        return (
                          <ol key={bIdx} className="list-decimal pl-5 space-y-1 text-white">
                            {block.split('\n').map((li, lIdx) => (
                              <li key={lIdx}>{li.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                          </ol>
                        );
                      }
                      return <p key={bIdx}>{block}</p>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
