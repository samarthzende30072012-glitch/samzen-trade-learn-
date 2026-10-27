import React, { useState, useEffect, useRef } from 'react';
import { TradingAsset, UserProfile, TradePosition, ClosedTrade, LimitOrder } from '../types';
import { 
  SamzenTerminalChart, 
  SamzenTerminalChartRef, 
  ChartTimeframe, 
  ChartType,
  DrawingMetadata,
  DrawingToolType
} from './SamzenTerminalChart';
import { marketWS, MarketTick } from '../services/marketWebSocket';
import { 
  getAssetMarketStatus, 
  MarketStatusInfo 
} from '../services/marketHours';
import { sounds } from '../services/soundEffects';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Wallet, RefreshCw, PlusCircle, CheckCircle2, 
  Search, Clock, Volume2, VolumeX, Maximize2, Trash2, Globe, 
  X, Zap, Check, ArrowRight, ArrowLeft, ShieldCheck, Flame, 
  ChevronDown, Sun, Moon, Sliders, List, BarChart3, Layers, 
  RotateCcw, AlertTriangle, Briefcase, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Comprehensive Universal Real-World Asset Directory (Searchable 100%)
const UNIVERSAL_ASSETS: TradingAsset[] = [
  // --- US EQUITIES (GLOBAL STOCKS) ---
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.8, change: 3.45, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Automotive & Clean Tech' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 228.4, change: 1.15, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Consumer Electronics' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 138.2, change: 4.82, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Semiconductors & AI' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 428.5, change: 0.85, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Cloud & AI Software' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 186.4, change: 1.62, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'E-Commerce & Cloud' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 585.0, change: 2.05, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Social Media & VR' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', price: 166.8, change: 0.72, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Search & Cloud' },

  // --- INDIAN EQUITIES (NSE / BSE) ---
  { symbol: 'NIFTY50', name: 'Nifty 50 Benchmark Index', price: 24380.0, change: 0.65, type: 'stock', history: [], exchange: 'NSE', sector: 'Indices' },
  { symbol: 'BANKNIFTY', name: 'Nifty Bank Index', price: 51240.0, change: 0.92, type: 'stock', history: [], exchange: 'NSE', sector: 'Indices' },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2980.5, change: 1.25, type: 'stock', history: [], exchange: 'NSE', sector: 'Energy & Telecom' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3940.0, change: -0.42, type: 'stock', history: [], exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1680.2, change: 0.78, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Ltd.', price: 1865.0, change: -1.15, type: 'stock', history: [], exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1245.4, change: 1.48, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', price: 985.0, change: 2.35, type: 'stock', history: [], exchange: 'NSE', sector: 'Automobile' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 842.5, change: 1.95, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1420.0, change: 0.52, type: 'stock', history: [], exchange: 'NSE', sector: 'Telecom' },
  { symbol: 'ITC', name: 'ITC Limited', price: 492.5, change: -0.28, type: 'stock', history: [], exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', price: 162.0, change: 3.12, type: 'stock', history: [], exchange: 'NSE', sector: 'Metals & Mining' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', price: 3120.0, change: 2.15, type: 'stock', history: [], exchange: 'NSE', sector: 'Infrastructure' },

  // --- CRYPTO (24/7/365 LIVE STREAMED VIA BINANCE WEBSOCKET) ---
  { symbol: 'BTC/USD', name: 'Bitcoin (Binance Live Stream)', price: 67450.0, change: 2.85, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Layer 1 Digital Gold' },
  { symbol: 'ETH/USD', name: 'Ethereum (Binance Live Stream)', price: 3520.4, change: 1.95, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Smart Contracts' },
  { symbol: 'SOL/USD', name: 'Solana (Binance Live Stream)', price: 178.6, change: 5.62, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'High Performance L1' },
  { symbol: 'BNB/USD', name: 'Binance Coin (Binance Live Stream)', price: 594.2, change: 1.15, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Exchange Ecosystem' },
  { symbol: 'XRP/USD', name: 'Ripple (Binance Live Stream)', price: 0.542, change: -0.85, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Cross-Border Payments' },
  { symbol: 'DOGE/USD', name: 'Dogecoin (Binance Live Stream)', price: 0.142, change: 4.25, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Memecoin' },

  // --- FOREX & PRECIOUS METALS ---
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0845, change: 0.12, type: 'forex', history: [], exchange: 'FOREX', sector: 'Major Pair' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.298, change: -0.15, type: 'forex', history: [], exchange: 'FOREX', sector: 'Major Pair' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 152.4, change: 0.38, type: 'forex', history: [], exchange: 'FOREX', sector: 'Major Pair' },
  { symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', price: 84.15, change: 0.04, type: 'forex', history: [], exchange: 'FOREX', sector: 'Exotic Cross' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.668, change: 0.45, type: 'forex', history: [], exchange: 'FOREX', sector: 'Commodity Currency' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.385, change: -0.08, type: 'forex', history: [], exchange: 'FOREX', sector: 'Major Pair' },
  { symbol: 'XAU/USD', name: 'Spot Gold / US Dollar', price: 2735.5, change: 0.88, type: 'forex', history: [], exchange: 'FOREX', sector: 'Precious Metals' },
];

export type TerminalPage = 'watchlist' | 'chart' | 'trade' | 'portfolio' | 'history';

interface PaperTradingProps {
  user: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => void;
  onGoProClick: () => void;
  displayCurrency: 'INR' | 'USD' | 'EUR';
  activeMarket?: 'stocks' | 'forex' | 'crypto';
  onExitTerminal?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
}

export default function PaperTrading({ 
  user, 
  onUpdateUser, 
  onGoProClick, 
  displayCurrency, 
  activeMarket,
  onExitTerminal,
  theme = 'dark',
  onToggleTheme,
  onOpenSettings,
}: PaperTradingProps) {
  const chartRef = useRef<SamzenTerminalChartRef | null>(null);

  // Native App-Like Pagination state: 'watchlist' | 'chart' | 'trade' | 'portfolio' | 'history'
  const [activePage, setActivePage] = useState<TerminalPage>('chart');

  // Touch Swipe Gesture Tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isLight = theme === 'light';

  const getCurrencyDetails = () => {
    switch (displayCurrency) {
      case 'USD': return { symbol: '$', rate: 1 / 84 };
      case 'EUR': return { symbol: '€', rate: 1 / 91 };
      default: return { symbol: '₹', rate: 1 };
    }
  };

  const formatCurrency = (valInINR: number, decimals: number = 0) => {
    const { symbol, rate } = getCurrencyDetails();
    const converted = valInINR * rate;
    if (displayCurrency === 'INR') {
      return `${symbol}${Math.round(valInINR).toLocaleString()}`;
    }
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  // Assets state
  const [assets, setAssets] = useState<TradingAsset[]>(UNIVERSAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<TradingAsset>(UNIVERSAL_ASSETS[0]);
  
  // Universal Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'INDIAN' | 'US' | 'CRYPTO' | 'FOREX'>('ALL');

  // Chart configuration
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('15m');
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [drawingMetadata, setDrawingMetadata] = useState<DrawingMetadata | null>(null);

  // Market hours & status
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo>(() =>
    getAssetMarketStatus(UNIVERSAL_ASSETS[0].type, UNIVERSAL_ASSETS[0].symbol)
  );
  const [showClosedMarketModal, setShowClosedMarketModal] = useState(false);

  // 1-Click Order Execution State
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderMode, setOrderMode] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');
  const [tradeToast, setTradeToast] = useState<{ text: string; isError?: boolean } | null>(null);

  // Capital Deposit / Reset Modal
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // Audio state
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  // Align with activeMarket prop
  useEffect(() => {
    if (activeMarket) {
      if (activeMarket === 'stocks') {
        const found = UNIVERSAL_ASSETS.find((a) => a.exchange === 'NSE');
        if (found) setSelectedAsset(found);
      } else if (activeMarket === 'forex') {
        const found = UNIVERSAL_ASSETS.find((a) => a.type === 'forex');
        if (found) setSelectedAsset(found);
      } else if (activeMarket === 'crypto') {
        const found = UNIVERSAL_ASSETS.find((a) => a.type === 'crypto');
        if (found) setSelectedAsset(found);
      }
    }
  }, [activeMarket]);

  // Update market status
  useEffect(() => {
    const update = () => {
      setMarketStatus(getAssetMarketStatus(selectedAsset.type, selectedAsset.symbol));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Real-time market tick subscription
  useEffect(() => {
    const unsubscribe = marketWS.subscribe((tick: MarketTick) => {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.symbol === tick.symbol) {
            return {
              ...a,
              price: tick.price,
              change: tick.change24h,
              high24h: tick.high24h,
              low24h: tick.low24h,
              volume24h: tick.volume24h,
            };
          }
          return a;
        })
      );

      if (tick.symbol === selectedAsset.symbol) {
        setSelectedAsset((prev) => ({
          ...prev,
          price: tick.price,
          change: tick.change24h,
          high24h: tick.high24h,
          low24h: tick.low24h,
          volume24h: tick.volume24h,
        }));
        if (chartRef.current) {
          chartRef.current.updateTick(tick.price);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedAsset.symbol]);

  // Native App Swipe Gestures for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe (> 50px) that is dominant over vertical scrolling
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      const pages: TerminalPage[] = ['watchlist', 'chart', 'trade', 'portfolio', 'history'];
      const curIdx = pages.indexOf(activePage);
      if (deltaX < 0 && curIdx < pages.length - 1) {
        // Swiped Left -> Advance to next page
        setActivePage(pages[curIdx + 1]);
        sounds.playClick();
      } else if (deltaX > 0 && curIdx > 0) {
        // Swiped Right -> Return to previous page
        setActivePage(pages[curIdx - 1]);
        sounds.playClick();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Search filtering
  const searchResults = assets.filter((a) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query === '' ||
      a.symbol.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query) ||
      (a.sector && a.sector.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    if (categoryFilter === 'INDIAN') return a.exchange === 'NSE' || a.exchange === 'BSE';
    if (categoryFilter === 'US') return a.exchange === 'NASDAQ' || a.exchange === 'NYSE';
    if (categoryFilter === 'CRYPTO') return a.type === 'crypto';
    if (categoryFilter === 'FOREX') return a.type === 'forex';
    return true;
  });

  // 1-Click Buy Execution
  const handleOneClickBuy = () => {
    if (!marketStatus.isOpen && orderMode === 'MARKET') {
      setShowClosedMarketModal(true);
      return;
    }

    const price = orderMode === 'LIMIT' && limitPriceInput ? parseFloat(limitPriceInput) : selectedAsset.price;
    const totalCost = price * orderQuantity;

    if (user.demoBalance < totalCost) {
      setTradeToast({
        text: `Insufficient funds! Required ₹${totalCost.toLocaleString()}, Balance: ₹${user.demoBalance.toLocaleString()}`,
        isError: true,
      });
      return;
    }

    const newPosition: TradePosition = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      assetSymbol: selectedAsset.symbol,
      assetName: selectedAsset.name,
      type: 'BUY',
      quantity: orderQuantity,
      entryPrice: price,
      timestamp: new Date().toISOString(),
      status: 'OPEN',
    };

    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'BUY' as const,
      symbol: selectedAsset.symbol,
      amount: -totalCost,
      shares: orderQuantity,
      price: price,
      timestamp: new Date().toISOString(),
    };

    onUpdateUser({
      ...user,
      demoBalance: Number((user.demoBalance - totalCost).toFixed(2)),
      positions: [newPosition, ...user.positions],
      transactionHistory: [newTx, ...user.transactionHistory],
    });

    sounds.playOrderFill(true);
    setTradeToast({ text: `Bought ${orderQuantity}x ${selectedAsset.symbol} @ ₹${price.toLocaleString()}!` });
  };

  // 1-Click Sell / Short Execution
  const handleOneClickSell = () => {
    if (!marketStatus.isOpen && orderMode === 'MARKET') {
      setShowClosedMarketModal(true);
      return;
    }

    const price = orderMode === 'LIMIT' && limitPriceInput ? parseFloat(limitPriceInput) : selectedAsset.price;
    const totalCost = price * orderQuantity;
    const marginRequired = totalCost * 0.2; // 20% margin

    if (user.demoBalance < marginRequired) {
      setTradeToast({
        text: `Insufficient margin! Margin required: ₹${marginRequired.toLocaleString()}`,
        isError: true,
      });
      return;
    }

    const newPosition: TradePosition = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      assetSymbol: selectedAsset.symbol,
      assetName: selectedAsset.name,
      type: 'SELL',
      quantity: orderQuantity,
      entryPrice: price,
      timestamp: new Date().toISOString(),
      status: 'OPEN',
    };

    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'SELL' as const,
      symbol: selectedAsset.symbol,
      amount: 0,
      shares: orderQuantity,
      price: price,
      timestamp: new Date().toISOString(),
    };

    onUpdateUser({
      ...user,
      positions: [newPosition, ...user.positions],
      transactionHistory: [newTx, ...user.transactionHistory],
    });

    sounds.playOrderFill(false);
    setTradeToast({ text: `Short Sold ${orderQuantity}x ${selectedAsset.symbol} @ ₹${price.toLocaleString()}!` });
  };

  // 1-Click Close Position
  const handleClosePosition = (position: TradePosition) => {
    const curP = marketWS.getPrice(position.assetSymbol) || selectedAsset.price;
    const pnl = position.type === 'BUY'
      ? (curP - position.entryPrice) * position.quantity
      : (position.entryPrice - curP) * position.quantity;

    const pnlPercent = Number((((curP - position.entryPrice) / position.entryPrice) * 100 * (position.type === 'BUY' ? 1 : -1)).toFixed(2));
    const cashBack = position.type === 'BUY' ? position.entryPrice * position.quantity + pnl : pnl;

    const closedRecord: ClosedTrade = {
      id: `closed-${Date.now()}`,
      symbol: position.assetSymbol,
      name: position.assetName,
      type: position.type,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice: curP,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent,
      timestamp: new Date().toISOString(),
    };

    const remaining = user.positions.filter((p) => {
      if (p.id && position.id) return p.id !== position.id;
      return p.timestamp !== position.timestamp || p.assetSymbol !== position.assetSymbol;
    });

    onUpdateUser({
      ...user,
      demoBalance: Number((user.demoBalance + cashBack).toFixed(2)),
      positions: remaining,
      closedTrades: [closedRecord, ...(user.closedTrades || [])],
    });

    sounds.playOrderFill(pnl >= 0);
    setTradeToast({
      text: `Closed ${position.assetSymbol}: ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent}%)`,
      isError: pnl < 0,
    });
  };

  // Queue After-Market Order (AMO)
  const handleQueueAMO = () => {
    setShowClosedMarketModal(false);
    const newLimit: LimitOrder = {
      id: `amo-${Date.now()}`,
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      type: 'BUY',
      quantity: orderQuantity,
      targetPrice: selectedAsset.price,
      timestamp: new Date().toISOString(),
    };

    onUpdateUser({
      ...user,
      limitOrders: [...(user.limitOrders || []), newLimit],
    });

    sounds.playClick();
    setTradeToast({ text: `Queued After-Market Order (AMO) for ${selectedAsset.symbol} at open!` });
  };

  // Clear All Drawings
  const handleClearDrawings = () => {
    if (!chartRef.current) return;
    const res = chartRef.current.clearAllDrawings();
    setDrawingMetadata(chartRef.current.getDrawingMetadata());
    setTradeToast({ text: `Cleared ${res.clearedCount} drawing(s) from chart.` });
  };

  // Reset Capital
  const handleResetCapital = (presetVal: number) => {
    onUpdateUser({
      ...user,
      demoBalance: presetVal,
      positions: [],
      limitOrders: [],
      closedTrades: [],
      transactionHistory: [
        {
          id: `dep-reset-${Date.now()}`,
          type: 'DEPOSIT',
          amount: presetVal,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    sounds.playWhoosh();
    setTradeToast({ text: `Reset capital to ₹${presetVal.toLocaleString()}` });
  };

  // Deposit custom funds
  const handleDepositFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;

    onUpdateUser({
      ...user,
      demoBalance: user.demoBalance + val,
      transactionHistory: [
        {
          id: `dep-${Date.now()}`,
          type: 'DEPOSIT',
          amount: val,
          timestamp: new Date().toISOString(),
        },
        ...user.transactionHistory,
      ],
    });

    setDepositAmount('');
    setIsDepositModalOpen(false);
    sounds.playOrderFill(true);
    setTradeToast({ text: `Added ₹${val.toLocaleString()} to Demo Capital!` });
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Calculate live unrealized P&L
  const totalUnrealizedPnL = user.positions.reduce((acc, pos) => {
    const curP = marketWS.getPrice(pos.assetSymbol) || selectedAsset.price;
    const diff = pos.type === 'BUY' ? (curP - pos.entryPrice) * pos.quantity : (pos.entryPrice - curP) * pos.quantity;
    return acc + diff;
  }, 0);

  const closedTrades = user.closedTrades || [];

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`space-y-4 font-sans select-none min-h-screen transition-colors ${
        isLight ? 'text-slate-800' : 'text-white'
      }`}
    >
      {/* 1. TOP BROKER APP HEADER WITH DEDICATED EXIT BUTTON */}
      <header className={`rounded-2xl border p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 relative z-30 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0A0E17] border-white/10'
      }`}>
        {/* Left: Dedicated Exit Button & Brand */}
        <div className="flex items-center gap-3">
          {onExitTerminal && (
            <button
              type="button"
              onClick={onExitTerminal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition shadow-sm active:scale-95 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                  : 'bg-[#151D2A] hover:bg-[#1E293B] text-white border-white/15'
              }`}
              title="Exit to Educational Marketing Homepage"
            >
              <ArrowLeft className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`} />
              <span>Exit Trading Terminal</span>
            </button>
          )}

          <div className={`h-6 w-[1px] hidden sm:block ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/Samzen_Neon_Trading_Emblem_c452c366.png"
              alt="Samzen Neon Trading Emblem"
              className="w-9 h-9 rounded-xl object-cover shadow-lg border border-white/20"
            />
            <span className={`font-serif font-bold text-sm tracking-tight hidden sm:inline ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              SAMZEN <span className={`italic ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`}>TERMINAL</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase hidden md:inline border ${
              isLight
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-[#00FF87]/10 text-[#00FF87] border-[#00FF87]/20'
            }`}>
              Proprietary Quantum Engine
            </span>
          </div>
        </div>

        {/* Right: Balance, Theme, Audio & Settings Controls */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
          {/* Demo Capital */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/10'
          }`}>
            <Wallet className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`} />
            <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>DEMO:</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(user.demoBalance, 0)}</span>
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className={`text-[11px] font-bold hover:underline pl-1 cursor-pointer ${
                isLight ? 'text-emerald-600' : 'text-[#00FF87]'
              }`}
            >
              + Add
            </button>
          </div>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                  : 'bg-[#121A28] hover:bg-[#1E293B] text-amber-400 border-white/10'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Fresh Light Mode'}
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isMuted
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-emerald-600 border-slate-200'
                : 'bg-[#121A28] text-[#00FF87] border-white/10 hover:bg-[#1E293B]'
            }`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings Modal Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                  : 'bg-[#121A28] hover:bg-[#1E293B] text-slate-300 border-white/10'
              }`}
              title="Platform Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. NATIVE APP-LIKE TAB PAGINATION & SWIPE NAV BAR */}
      <nav className={`flex items-center justify-between p-1 rounded-2xl border shadow-lg overflow-x-auto scrollbar-none font-mono text-xs transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
      }`}>
        {[
          { id: 'watchlist', label: 'Watchlist', icon: List },
          { id: 'chart', label: 'Interactive Chart', icon: TrendingUp },
          { id: 'trade', label: '1-Click Execute', icon: Zap },
          { id: 'portfolio', label: `Portfolio (${user.positions.length})`, icon: Wallet },
          { id: 'history', label: `Orders (${closedTrades.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activePage === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActivePage(tab.id as TerminalPage);
                sounds.playClick();
              }}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                isSelected
                  ? isLight
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#00FF87] text-[#0A0E17] shadow-[0_0_15px_rgba(0,255,135,0.4)]'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-[#121A28]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Swipe Hint */}
      <div className={`sm:hidden flex items-center justify-between px-2 text-[10px] font-mono ${
        isLight ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <span>⇠ Swipe left/right for tabs</span>
        <span>Tap tabs to jump</span>
      </div>

      {/* Instant Notification Toast */}
      <AnimatePresence>
        {tradeToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between shadow-lg ${
              tradeToast.isError
                ? isLight
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                : isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{tradeToast.text}</span>
            </div>
            <button onClick={() => setTradeToast(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. DEDICATED NATIVE-APP PAGES */}

      {/* PAGE 1: WATCHLIST & UNIVERSAL SEARCH */}
      {activePage === 'watchlist' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Universal Search Bar */}
          <div className={`rounded-2xl border p-4 shadow-xl transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0A0E17] border-white/10'
          }`}>
            <div className="relative flex items-center">
              <Search className={`w-4 h-4 absolute left-3.5 ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any real-world asset... (Tesla, Apple, Nifty 50, Reliance, Bitcoin, Gold, EUR/USD)"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border font-mono text-xs sm:text-sm focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                    : 'bg-[#121A28] border-white/15 text-white placeholder-slate-400 focus:border-[#00FF87]'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-none font-mono text-xs">
              {(['ALL', 'INDIAN', 'US', 'CRYPTO', 'FOREX'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase transition text-[11px] cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat
                      ? isLight
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#00FF87] text-[#0A0E17]'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-[#151D2A] text-slate-300 hover:text-white'
                  }`}
                >
                  {cat === 'INDIAN' ? '🇮🇳 NSE/BSE' : cat === 'US' ? '🇺🇸 US Equities' : cat === 'CRYPTO' ? '🪙 24/7 Crypto' : cat === 'FOREX' ? '💱 Forex & Gold' : 'Universal (All)'}
                </button>
              ))}
            </div>
          </div>

          {/* Watchlist Table */}
          <div className={`rounded-2xl border shadow-xl overflow-hidden font-mono text-xs transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold">Real-World Market Screener</span>
                <span className={`text-[11px] px-2 py-0.5 rounded ${
                  isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-300'
                }`}>
                  {searchResults.length} Assets
                </span>
              </div>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                100% Real-Time Synchronized
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {searchResults.map((asset) => {
                const status = getAssetMarketStatus(asset.type, asset.symbol);
                const isSelected = asset.symbol === selectedAsset.symbol;
                return (
                  <div
                    key={asset.symbol}
                    className={`p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 transition ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                          : 'bg-[#00FF87]/10 border-l-4 border-[#00FF87]'
                        : isLight
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-[#121A28]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {asset.symbol}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                            isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-black/40 text-slate-400 border-white/5'
                          }`}>
                            {asset.exchange}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: status.isOpen ? (isLight ? '#059669' : '#00FF87') : (isLight ? '#E11D48' : '#FF3366') }}
                            title={status.sessionName}
                          />
                        </div>
                        <span className={`text-xs block truncate max-w-[200px] sm:max-w-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {asset.name} • {asset.sector}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <span className={`font-black text-sm block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          ₹{asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 4 : 2 })}
                        </span>
                        <span className={`text-xs font-bold ${
                          asset.change >= 0 
                            ? isLight ? 'text-emerald-600' : 'text-[#00FF87]' 
                            : isLight ? 'text-rose-600' : 'text-[#FF3366]'
                        }`}>
                          {asset.change >= 0 ? `+${asset.change}%` : `${asset.change}%`}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setActivePage('chart');
                            sounds.playClick();
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                              : 'bg-[#151D2A] hover:bg-[#1E293B] text-white border-white/10'
                          }`}
                        >
                          Chart
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setActivePage('trade');
                            sounds.playClick();
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                            isLight
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17]'
                          }`}
                        >
                          Trade
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: INTERACTIVE CHART VIEW */}
      {activePage === 'chart' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Quick Asset Bar & Navigation to Trade */}
          <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 font-mono text-xs transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {selectedAsset.symbol}
              </span>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {selectedAsset.name}
              </span>
              <span className={`text-xs font-bold ${
                selectedAsset.change >= 0 
                  ? isLight ? 'text-emerald-600' : 'text-[#00FF87]' 
                  : isLight ? 'text-rose-600' : 'text-[#FF3366]'
              }`}>
                {selectedAsset.change >= 0 ? `+${selectedAsset.change}%` : `${selectedAsset.change}%`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePage('watchlist')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-[#151D2A] text-slate-300 border-white/10'
                }`}
              >
                Change Asset
              </button>

              <button
                type="button"
                onClick={() => setActivePage('trade')}
                className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isLight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-[#00FF87] text-[#0A0E17] hover:bg-[#00e577]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open Order Ticket</span>
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <SamzenTerminalChart
            ref={chartRef}
            symbol={selectedAsset.symbol}
            name={selectedAsset.name}
            currentPrice={selectedAsset.price}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            chartType={chartType}
            onChartTypeChange={setChartType}
            currencySymbol={getCurrencyDetails().symbol}
            displayDecimals={selectedAsset.type === 'forex' ? 4 : 2}
            isMarketOpen={marketStatus.isOpen}
            onDrawingMetadataChange={setDrawingMetadata}
            theme={theme}
          />
        </div>
      )}

      {/* PAGE 3: 1-CLICK ORDER EXECUTION STATION */}
      {activePage === 'trade' && (
        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-150">
          <div className={`border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0E1726] border-white/10 text-white'
          }`}>
            
            {/* Asset Header & Live Price */}
            <div className={`border-b pb-4 flex items-center justify-between ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div>
                <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {selectedAsset.exchange} • {selectedAsset.type.toUpperCase()}
                </span>
                <h2 className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {selectedAsset.symbol}
                </h2>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {selectedAsset.name}
                </span>
              </div>

              <div className="text-right font-mono">
                <span className={`text-3xl font-black block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ₹{selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: selectedAsset.type === 'forex' ? 4 : 2 })}
                </span>
                <span className={`text-xs font-bold ${
                  selectedAsset.change >= 0 
                    ? isLight ? 'text-emerald-600' : 'text-[#00FF87]' 
                    : isLight ? 'text-rose-600' : 'text-[#FF3366]'
                }`}>
                  {selectedAsset.change >= 0 ? `+${selectedAsset.change}%` : `${selectedAsset.change}%`}
                </span>
              </div>
            </div>

            {/* Real-World Market Hours Status Badge */}
            <div
              className={`p-3 rounded-2xl border text-xs font-mono flex items-center justify-between ${
                marketStatus.isOpen
                  ? isLight 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : isLight
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: marketStatus.isOpen ? (isLight ? '#059669' : '#00FF87') : (isLight ? '#E11D48' : '#FF3366') }}
                />
                {marketStatus.sessionName}
              </span>
              <span className="text-[11px] uppercase font-bold">{marketStatus.countdown}</span>
            </div>

            {/* If Closed, Show AMO notice */}
            {!marketStatus.isOpen && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono ${
                isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Market is currently closed. Queue an After-Market Order (AMO).</span>
                </div>
                <button
                  type="button"
                  onClick={handleQueueAMO}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition cursor-pointer shrink-0"
                >
                  Queue AMO
                </button>
              </div>
            )}

            {/* Quantity Selector with Quick Buttons */}
            <div className="space-y-2 font-mono text-xs">
              <div className={`flex justify-between text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span>Quantity (Shares / Units):</span>
                <span>
                  Total Value: <strong className={isLight ? 'text-slate-900' : 'text-white'}>₹{(orderQuantity * selectedAsset.price).toLocaleString()}</strong>
                </span>
              </div>

              <div className={`flex items-center border rounded-2xl overflow-hidden px-4 py-2.5 ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#121A28] border-white/10'
              }`}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-full bg-transparent font-bold text-base focus:outline-none ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                />
              </div>

              {/* Quick Quantity Chips */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 5, 10, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setOrderQuantity(qty)}
                    className={`py-1.5 rounded-xl text-center font-bold text-xs transition cursor-pointer ${
                      orderQuantity === qty
                        ? isLight
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#00FF87] text-[#0A0E17]'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-[#121A28] hover:bg-[#1E293B] text-slate-300'
                    }`}
                  >
                    {qty}x
                  </button>
                ))}
              </div>
            </div>

            {/* Order Mode (Instant Market vs Limit) */}
            <div className={`flex items-center justify-between text-xs font-mono border-t pt-4 ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-400'
            }`}>
              <span>Execution Mode:</span>
              <div className={`flex gap-1 p-0.5 rounded-xl border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121A28] border-white/5'
              }`}>
                <button
                  type="button"
                  onClick={() => setOrderMode('MARKET')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    orderMode === 'MARKET'
                      ? isLight
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#00FF87] text-[#0A0E17]'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Instant Market
                </button>
                <button
                  type="button"
                  onClick={() => setOrderMode('LIMIT')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    orderMode === 'LIMIT'
                      ? isLight
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[#00F0FF] text-[#0A0E17]'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Limit Order
                </button>
              </div>
            </div>

            {orderMode === 'LIMIT' && (
              <div className="space-y-1.5 font-mono text-xs animate-in fade-in duration-150">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Trigger Limit Price:</span>
                <input
                  type="number"
                  step="0.01"
                  value={limitPriceInput}
                  onChange={(e) => setLimitPriceInput(e.target.value)}
                  placeholder={`Current: ₹${selectedAsset.price}`}
                  className={`w-full border rounded-2xl px-4 py-2.5 focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600' 
                      : 'bg-[#121A28] border-white/10 text-white focus:border-[#00FF87]'
                  }`}
                />
              </div>
            )}

            {/* GIANT, VISUALLY DISTINCT ONE-CLICK BUY & SELL BUTTONS */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* GIANT BUY / LONG BUTTON */}
              <button
                type="button"
                onClick={handleOneClickBuy}
                className={`group relative overflow-hidden py-5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider transition-all duration-150 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-gradient-to-br from-[#00FF87] to-[#00d670] hover:from-[#00e577] hover:to-[#00c567] text-[#0A0E17] shadow-[0_0_25px_rgba(0,255,135,0.4)]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                  <span>BUY / LONG</span>
                </div>
                <span className="text-[10px] font-bold opacity-80">1-Click Instant Execution</span>
              </button>

              {/* GIANT SELL / SHORT BUTTON */}
              <button
                type="button"
                onClick={handleOneClickSell}
                className={`group relative overflow-hidden py-5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider transition-all duration-150 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isLight
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-gradient-to-br from-[#FF3366] to-[#e61e52] hover:from-[#ff1f57] hover:to-[#cc1746] text-white shadow-[0_0_25px_rgba(255,51,102,0.4)]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight className="w-5 h-5 stroke-[3]" />
                  <span>SELL / SHORT</span>
                </div>
                <span className="text-[10px] font-bold opacity-80">1-Click Instant Margin Short</span>
              </button>
            </div>

            {/* Quick Link to Chart */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActivePage('chart')}
                className={`text-xs font-mono font-bold hover:underline ${
                  isLight ? 'text-emerald-700' : 'text-[#00FF87]'
                }`}
              >
                View Live Technical Chart for {selectedAsset.symbol} ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 4: PORTFOLIO & ACTIVE POSITIONS */}
      {activePage === 'portfolio' && (
        <div className="space-y-4 animate-in fade-in duration-150 font-mono">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>DEMO CAPITAL</span>
              <span className={`text-xl font-black block mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {formatCurrency(user.demoBalance, 0)}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ACTIVE POSITIONS</span>
              <span className={`text-xl font-black block mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {user.positions.length} Open
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>UNREALIZED LIVE P&L</span>
              <span className={`text-xl font-black block mt-1 ${
                totalUnrealizedPnL >= 0 
                  ? isLight ? 'text-emerald-600' : 'text-[#00FF87]' 
                  : isLight ? 'text-rose-600' : 'text-[#FF3366]'
              }`}>
                {totalUnrealizedPnL >= 0 ? '+' : ''}₹{totalUnrealizedPnL.toFixed(2)}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>CAPITAL CONTROLS</span>
                <span className="text-xs font-bold block mt-1">Reset / Refill</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                  isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                }`}
              >
                Manage
              </button>
            </div>
          </div>

          {/* Open Positions Table */}
          <div className={`rounded-3xl border shadow-xl overflow-hidden transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm">Open Positions ({user.positions.length})</h3>
              </div>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                1-Click Close Available
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              {user.positions.length === 0 ? (
                <div className={`text-center py-10 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  No open positions currently. Go to <button onClick={() => setActivePage('trade')} className="text-emerald-500 font-bold underline">1-Click Trade</button> or <button onClick={() => setActivePage('watchlist')} className="text-emerald-500 font-bold underline">Watchlist</button> to place an order.
                </div>
              ) : (
                <div className="space-y-3">
                  {user.positions.map((pos, idx) => {
                    const curPrice = marketWS.getPrice(pos.assetSymbol) || pos.entryPrice;
                    const pnl = pos.type === 'BUY'
                      ? (curPrice - pos.entryPrice) * pos.quantity
                      : (pos.entryPrice - curPrice) * pos.quantity;
                    const returnPct = Number((((curPrice - pos.entryPrice) / pos.entryPrice) * 100 * (pos.type === 'BUY' ? 1 : -1)).toFixed(2));
                    const isProfit = pnl >= 0;

                    return (
                      <div
                        key={pos.id || idx}
                        className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                              pos.type === 'BUY'
                                ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-[#00FF87]/20 text-[#00FF87]'
                                : isLight ? 'bg-rose-100 text-rose-800' : 'bg-[#FF3366]/20 text-[#FF3366]'
                            }`}
                          >
                            {pos.type}
                          </span>
                          <div>
                            <span className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {pos.assetSymbol}
                            </span>
                            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {pos.quantity} units @ ₹{pos.entryPrice}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div>
                            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              CURRENT PRICE
                            </span>
                            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              ₹{curPrice.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              LIVE P&L
                            </span>
                            <span className={`text-base font-black ${
                              isProfit 
                                ? isLight ? 'text-emerald-600' : 'text-[#00FF87]' 
                                : isLight ? 'text-rose-600' : 'text-[#FF3366]'
                            }`}>
                              {isProfit ? '+' : ''}₹{pnl.toFixed(2)} ({isProfit ? '+' : ''}{returnPct}%)
                            </span>
                          </div>

                          {/* 1-Click Close Position */}
                          <button
                            type="button"
                            onClick={() => handleClosePosition(pos)}
                            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                          >
                            Close Position
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 5: ORDER AUDIT & TRADE HISTORY */}
      {activePage === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-150 font-mono">
          <div className={`rounded-3xl border shadow-xl overflow-hidden transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm">Execution Ledger ({closedTrades.length} Trades Closed)</h3>
              </div>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                100% Audit Trail
              </span>
            </div>

            <div className="p-4">
              {closedTrades.length === 0 ? (
                <div className={`text-center py-10 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  No completed trades yet. Close open positions from the Portfolio tab to review audit history here.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {closedTrades.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.type === 'BUY'
                              ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-[#00FF87]/20 text-[#00FF87]'
                              : isLight ? 'bg-rose-100 text-rose-800' : 'bg-[#FF3366]/20 text-[#FF3366]'
                          }`}
                        >
                          {t.type}
                        </span>
                        <div>
                          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.symbol}</span>
                          <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {t.quantity} units • Exit @ ₹{t.exitPrice} • {new Date(t.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-black text-sm block ${
                          t.pnl >= 0 
                            ? isLight ? 'text-emerald-600' : 'text-[#00FF87]' 
                            : isLight ? 'text-rose-600' : 'text-[#FF3366]'
                        }`}>
                          {t.pnl >= 0 ? '+' : ''}₹{t.pnl.toLocaleString()} ({t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Capital Management Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-3xl border p-6 space-y-5 shadow-2xl font-mono ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0E1726] border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className="font-bold text-sm">Demo Capital Manager</h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Reset Presets */}
            <div className="space-y-2">
              <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Quick Balance Presets:
              </span>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[50000, 100000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      handleResetCapital(amt);
                      setIsDepositModalOpen(false);
                    }}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                        : 'bg-[#121A28] hover:bg-[#1E293B] text-white border-white/10'
                    }`}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Deposit Form */}
            <form onSubmit={handleDepositFunds} className="space-y-3 pt-2">
              <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Add Custom Amount:
              </span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 50000"
                className={`w-full p-3 rounded-xl border text-sm font-bold focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    : 'bg-[#121A28] border-white/10 text-white focus:border-[#00FF87]'
                }`}
              />
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17]'
                }`}
              >
                Deposit Virtual Funds
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Weekend Closure / Market Closed Modal */}
      <AnimatePresence>
        {showClosedMarketModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative font-mono text-xs ${
                isLight 
                  ? 'bg-white border-rose-300 text-slate-800' 
                  : 'bg-[#0A0E17] border-rose-500/40 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-serif font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Market Closed (Weekend / Off-Hours)
                  </h3>
                  <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>{selectedAsset.exchange} Exchange</p>
                </div>
              </div>

              <p className={`p-3.5 rounded-2xl border leading-relaxed ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#121A28] border-white/5 text-slate-300'
              }`}>
                {selectedAsset.exchange === 'NSE' || selectedAsset.exchange === 'BSE'
                  ? 'The Indian Stock Market operates Monday through Friday from 09:15 AM to 03:30 PM IST. Exchanges are strictly closed on Saturdays, Sundays, and national clearing holidays.'
                  : selectedAsset.exchange === 'NASDAQ' || selectedAsset.exchange === 'NYSE'
                  ? 'US Stock Exchanges trade Monday through Friday from 09:30 AM to 04:00 PM EST, and remain closed over weekends.'
                  : 'This asset is currently outside active trading hours.'}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleQueueAMO}
                  className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs transition cursor-pointer ${
                    isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                  }`}
                >
                  Queue AMO (At Open)
                </button>
                <button
                  type="button"
                  onClick={() => setShowClosedMarketModal(false)}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#151D2A] text-slate-300 border-white/10'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
