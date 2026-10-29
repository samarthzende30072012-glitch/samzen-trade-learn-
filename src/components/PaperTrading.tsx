import React, { useState, useEffect, useRef } from 'react';
import { TradingAsset, UserProfile, TradePosition, ClosedTrade, LimitOrder, PriceAlert } from '../types';
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
  RotateCcw, AlertTriangle, Briefcase, FileText, Plus, Minus,
  Bell, BellRing, BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { UNIVERSAL_ASSETS } from '../data/assetsDatabase';

import TerminalTutorial from './TerminalTutorial';
import MarketHeatmap from './MarketHeatmap';

export type TerminalPage = 'watchlist' | 'chart' | 'trade' | 'portfolio' | 'history' | 'alerts' | 'heatmap';

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
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('terminal_tutorial_seen'));

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
  const [chartSearchQuery, setChartSearchQuery] = useState('');
  const [isChartSearchOpen, setIsChartSearchOpen] = useState(false);

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

  // Price Alerts State & Browser Notification Integration
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('samzen_price_alerts');
      if (saved) return JSON.parse(saved);
      return user.priceAlerts || [];
    } catch {
      return user.priceAlerts || [];
    }
  });
  const priceAlertsRef = useRef<PriceAlert[]>(priceAlerts);

  useEffect(() => {
    priceAlertsRef.current = priceAlerts;
    try {
      localStorage.setItem('samzen_price_alerts', JSON.stringify(priceAlerts));
    } catch {}
    if (user.priceAlerts !== priceAlerts) {
      onUpdateUser({
        ...user,
        priceAlerts,
      });
    }
  }, [priceAlerts]);

  // Browser Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setTradeToast({ text: 'Browser notifications are not supported in this browser.', isError: true });
      return 'denied';
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        sounds.playClick();
        setTradeToast({ text: '🔔 Browser notifications enabled! You will be alerted when target prices hit.' });
      } else {
        setTradeToast({ text: 'Notification permission was not granted. In-app audio chimes will still sound.', isError: true });
      }
      return perm;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return Notification.permission;
    }
  };

  // Price Alert Modal & In-App Toast State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalAsset, setAlertModalAsset] = useState<TradingAsset>(selectedAsset);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertNote, setAlertNote] = useState<string>('');
  const [alertToast, setAlertToast] = useState<{
    id: string;
    symbol: string;
    targetPrice: number;
    currentPrice: number;
    condition: 'ABOVE' | 'BELOW';
    note?: string;
  } | null>(null);

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

  // Real-time market tick subscription & Price Alert Trigger Engine
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

      // Live Price Alert Evaluation
      const currentAlerts = priceAlertsRef.current;
      const triggeredList: PriceAlert[] = [];

      currentAlerts.forEach((alt) => {
        if (!alt.triggered && alt.symbol === tick.symbol) {
          const isHit =
            (alt.condition === 'ABOVE' && tick.price >= alt.targetPrice) ||
            (alt.condition === 'BELOW' && tick.price <= alt.targetPrice);

          if (isHit) {
            triggeredList.push(alt);

            // 1. Synthesized audio alert chime
            sounds.playAlert();

            // 2. Browser native desktop notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`🚨 Price Alert: ${alt.symbol} hit ₹${tick.price.toLocaleString()}!`, {
                  body: `${alt.symbol} crossed your target of ₹${alt.targetPrice.toLocaleString()} (${alt.condition === 'ABOVE' ? 'Risen above' : 'Fallen below'}).${alt.note ? ` Note: ${alt.note}` : ''}`,
                  icon: '/favicon.ico',
                });
              } catch (e) {
                console.warn('Browser notification error:', e);
              }
            }

            // 3. In-App Pop-up Toast
            setAlertToast({
              id: alt.id,
              symbol: alt.symbol,
              targetPrice: alt.targetPrice,
              currentPrice: tick.price,
              condition: alt.condition,
              note: alt.note,
            });
          }
        }
      });

      if (triggeredList.length > 0) {
        const triggeredIds = triggeredList.map((x) => x.id);
        setPriceAlerts((prev) =>
          prev.map((a) =>
            triggeredIds.includes(a.id)
              ? { ...a, triggered: true, triggeredAt: new Date().toISOString() }
              : a
          )
        );
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
      const pages: TerminalPage[] = ['watchlist', 'chart', 'trade', 'portfolio', 'history', 'alerts'];
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

  // Price Alert Action Handlers
  const handleOpenAlertModal = (asset?: TradingAsset) => {
    const targetAsset = asset || selectedAsset;
    setAlertModalAsset(targetAsset);
    const defaultTarget = Number((targetAsset.price * 1.01).toFixed(targetAsset.type === 'forex' ? 4 : 2));
    setAlertTargetPrice(defaultTarget.toString());
    setAlertCondition('ABOVE');
    setAlertNote('');
    setIsAlertModalOpen(true);
    sounds.playClick();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((p) => setNotificationPermission(p)).catch(() => {});
    }
  };

  const handleSaveAlert = () => {
    const numPrice = parseFloat(alertTargetPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setTradeToast({ text: 'Please enter a valid target price for the alert', isError: true });
      return;
    }

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      symbol: alertModalAsset.symbol,
      name: alertModalAsset.name,
      targetPrice: numPrice,
      condition: alertCondition,
      createdAt: new Date().toISOString(),
      triggered: false,
      note: alertNote.trim() || undefined,
    };

    setPriceAlerts((prev) => [newAlert, ...prev]);
    setIsAlertModalOpen(false);
    sounds.playOrderFill(true);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then((p) => setNotificationPermission(p)).catch(() => {});
    }

    setTradeToast({
      text: `🔔 Price Alert set for ${alertModalAsset.symbol} @ ₹${numPrice.toLocaleString(undefined, { minimumFractionDigits: alertModalAsset.type === 'forex' ? 4 : 2 })} (${alertCondition === 'ABOVE' ? 'Rises Above' : 'Falls Below'})!`,
    });
  };

  const handleDeletePriceAlert = (alertId: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId));
    sounds.playClick();
    setTradeToast({ text: 'Price alert removed.' });
  };

  const handleRearmPriceAlert = (alertId: string) => {
    setPriceAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, triggered: false, triggeredAt: undefined } : a))
    );
    sounds.playClick();
    setTradeToast({ text: '🔔 Alert re-armed! Listening for price targets.' });
  };

  const handleTestBrowserNotification = () => {
    sounds.playAlert();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`🔔 Test Alert: ${selectedAsset.symbol} hit target!`, {
          body: `Browser notification is working perfectly on this device! Current price: ₹${selectedAsset.price.toLocaleString()}`,
          icon: '/favicon.ico',
        });
        setTradeToast({ text: '✓ Browser test notification dispatched!' });
      } else {
        requestNotificationPermission();
      }
    } else {
      setTradeToast({ text: 'Browser notifications are not supported in this environment.', isError: true });
    }
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
      {showTutorial && (
        <TerminalTutorial
          onClose={() => {
            localStorage.setItem('terminal_tutorial_seen', 'true');
            setShowTutorial(false);
          }}
        />
      )}
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
          { id: 'heatmap', label: 'Heatmap', icon: BarChart3 },
          { id: 'chart', label: 'Interactive Chart', icon: TrendingUp },
          { id: 'trade', label: '1-Click Execute', icon: Zap },
          { id: 'portfolio', label: `Portfolio (${user.positions.length})`, icon: Wallet },
          { id: 'history', label: `Orders (${closedTrades.length})`, icon: Clock },
          { id: 'alerts', label: `Alerts (${priceAlerts.filter(a => !a.triggered).length})`, icon: Bell },
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

      {/* PAGE: MARKET HEATMAP */}
      {activePage === 'heatmap' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <MarketHeatmap
            assets={assets}
            onSelectAsset={(asset) => {
              setSelectedAsset(asset);
              setActivePage('chart');
              sounds.playClick();
              setTradeToast({ text: `Selected ${asset.symbol} from Heatmap` });
            }}
            theme={theme}
          />
        </div>
      )}

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
                          onClick={() => handleOpenAlertModal(asset)}
                          className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            isLight
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                          }`}
                          title={`Set Price Alert for ${asset.symbol}`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>

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
      {activePage === 'chart' && (() => {
        const topPicks = ['NIFTY 50', 'BANK NIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'TATAMOTORS', 'BTC/USD', 'ETH/USD', 'SOL/USD', 'XAU/USD', 'USD/INR', 'TSLA', 'AAPL', 'NVDA'];
        const currentActivePos = user.positions.find((p) => p.assetSymbol === selectedAsset.symbol);
        const livePnl = currentActivePos
          ? currentActivePos.type === 'BUY'
            ? (selectedAsset.price - currentActivePos.entryPrice) * currentActivePos.quantity
            : (currentActivePos.entryPrice - selectedAsset.price) * currentActivePos.quantity
          : 0;
        const livePnlPct = currentActivePos
          ? (((livePnl) / (currentActivePos.entryPrice * currentActivePos.quantity)) * 100).toFixed(2)
          : '0.00';

        const chartSearchResults = chartSearchQuery.trim()
          ? assets.filter(
              (a) =>
                a.symbol.toLowerCase().includes(chartSearchQuery.toLowerCase()) ||
                a.name.toLowerCase().includes(chartSearchQuery.toLowerCase())
            ).slice(0, 8)
          : [];

        return (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Quick 1-Tap Asset Selector Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                POPULAR:
              </span>
              {topPicks.map((sym) => {
                const a = assets.find((item) => item.symbol === sym) || { symbol: sym, price: 0, change: 0, name: sym } as TradingAsset;
                const isCurrent = a.symbol === selectedAsset.symbol;
                return (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedAsset(a);
                      sounds.playClick();
                    }}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                      isCurrent
                        ? isLight
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-[#00FF87] text-[#0A0E17] border-[#00FF87] shadow-[0_0_12px_rgba(0,255,135,0.4)]'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        : 'bg-[#121A28] text-slate-300 border-white/10 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span>{a.symbol}</span>
                    <span className={`text-[10px] font-mono ${
                      a.change >= 0 
                        ? (isCurrent ? (isLight ? 'text-emerald-300' : 'text-[#0A0E17] font-black') : 'text-emerald-500') 
                        : (isCurrent ? (isLight ? 'text-rose-300' : 'text-rose-950 font-black') : 'text-rose-500')
                    }`}>
                      {a.change >= 0 ? `+${a.change}%` : `${a.change}%`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Top Asset Info & Quick Search Header */}
            <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 font-mono text-xs transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {selectedAsset.symbol}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                      {selectedAsset.exchange}
                    </span>
                  </div>
                  <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedAsset.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <span className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurrency(selectedAsset.price, selectedAsset.type === 'forex' ? 4 : 2)}
                  </span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    selectedAsset.change >= 0 
                      ? isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-950/60 text-[#00FF87]' 
                      : isLight ? 'bg-rose-50 text-rose-700' : 'bg-rose-950/60 text-[#FF3366]'
                  }`}>
                    {selectedAsset.change >= 0 ? `+${selectedAsset.change}%` : `${selectedAsset.change}%`}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAlertModal(selectedAsset)}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isLight 
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' 
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                  }`}
                  title="Set Price Alert (Triggers browser notification when price target is reached)"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Set Alert</span>
                  {priceAlerts.filter((a) => !a.triggered && a.symbol === selectedAsset.symbol).length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsChartSearchOpen(!isChartSearchOpen)}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isChartSearchOpen
                      ? isLight ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[#00FF87] text-[#0A0E17] border-[#00FF87]'
                      : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-[#151D2A] text-slate-300 border-white/10 hover:text-white'
                  }`}
                  title="Search & Switch Asset"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePage('trade')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                  title="Open Detailed Order Ticket"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Advanced Ticket</span>
                </button>
              </div>
            </div>

            {/* Active Price Alerts on Current Symbol */}
            {(() => {
              const activeOnSym = priceAlerts.filter((a) => !a.triggered && a.symbol === selectedAsset.symbol);
              if (activeOnSym.length === 0) return null;
              return (
                <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-mono animate-in fade-in duration-150 ${
                  isLight ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold flex items-center gap-1.5 text-amber-400">
                      <BellRing className="w-3.5 h-3.5 animate-pulse" />
                      Active Alerts:
                    </span>
                    {activeOnSym.map((alt) => (
                      <span key={alt.id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
                        isLight ? 'bg-white border-amber-300 text-slate-800' : 'bg-black/50 border-amber-500/40 text-amber-300'
                      }`}>
                        <span>{alt.condition === 'ABOVE' ? '▲ Rises above' : '▼ Falls below'} {formatCurrency(alt.targetPrice, selectedAsset.type === 'forex' ? 4 : 2)}</span>
                        <button
                          onClick={() => handleDeletePriceAlert(alt.id)}
                          className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                          title="Delete alert"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setActivePage('alerts')}
                    className="text-[10px] font-bold underline hover:opacity-80 cursor-pointer"
                  >
                    Manage Alerts ({priceAlerts.length}) →
                  </button>
                </div>
              );
            })()}

            {/* Quick Asset Search Drawer */}
            {isChartSearchOpen && (
              <div className={`p-3 rounded-2xl border shadow-xl font-mono text-xs space-y-2 animate-in fade-in duration-150 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#121A28] border-white/15'
              }`}>
                <div className="relative">
                  <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    autoFocus
                    value={chartSearchQuery}
                    onChange={(e) => setChartSearchQuery(e.target.value)}
                    placeholder="Type ticker or company... (e.g. Reliance, Apple, Bitcoin, Gold)"
                    className={`w-full pl-9 pr-9 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                        : 'bg-[#0A0E17] border-white/15 text-white focus:border-[#00FF87]'
                    }`}
                  />
                  {chartSearchQuery && (
                    <button
                      onClick={() => setChartSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {chartSearchResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {chartSearchResults.map((asset) => (
                      <button
                        key={asset.symbol}
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsChartSearchOpen(false);
                          setChartSearchQuery('');
                          sounds.playClick();
                        }}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            : 'bg-[#0A0E17] hover:bg-[#151D2A] border-white/10'
                        }`}
                      >
                        <div className="font-bold">{asset.symbol}</div>
                        <div className="text-[10px] text-slate-400 truncate">{asset.name}</div>
                        <div className={`text-[10px] font-bold ${asset.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatCurrency(asset.price, asset.type === 'forex' ? 4 : 2)} ({asset.change >= 0 ? `+${asset.change}%` : `${asset.change}%`})
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            {/* 1-Click Rapid Trade Execution Bar (Directly Attached Below Chart) */}
            <div className={`p-4 rounded-2xl border shadow-2xl font-mono text-xs transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      QTY:
                    </span>
                    <div className={`flex items-center rounded-xl border p-0.5 ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121A28] border-white/10'
                    }`}>
                      <button
                        onClick={() => {
                          setOrderQuantity((q) => Math.max(1, q - 1));
                          sounds.playClick();
                        }}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className={`w-12 text-center font-bold text-xs bg-transparent focus:outline-none ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      />
                      <button
                        onClick={() => {
                          setOrderQuantity((q) => q + 1);
                          sounds.playClick();
                        }}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity Presets */}
                  <div className="hidden sm:flex items-center gap-1">
                    {[1, 5, 10, 25, 100].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setOrderQuantity(preset);
                          sounds.playClick();
                        }}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                          orderQuantity === preset
                            ? isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-white/20 text-white border-white/30'
                            : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-[#121A28] hover:bg-[#1E293B] text-slate-400 border-white/5'
                        }`}
                      >
                        {preset}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instant 1-Click Buy & Sell Buttons */}
                <div className="flex items-center gap-3 flex-1 sm:flex-initial justify-end">
                  {/* BUY BUTTON */}
                  <button
                    onClick={handleOneClickBuy}
                    className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isLight
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                        : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] shadow-[0_0_15px_rgba(0,255,135,0.4)]'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>BUY @ {formatCurrency(selectedAsset.price, selectedAsset.type === 'forex' ? 4 : 2)}</span>
                  </button>

                  {/* SELL BUTTON */}
                  <button
                    onClick={handleOneClickSell}
                    className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      isLight
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                        : 'bg-[#FF3366] hover:bg-[#ff1f57] text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>SELL @ {formatCurrency(selectedAsset.price, selectedAsset.type === 'forex' ? 4 : 2)}</span>
                  </button>
                </div>
              </div>

              {/* Bottom Status: Open Position Bar or Balance Indicator */}
              <div className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'
              }`}>
                {currentActivePos ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        currentActivePos.type === 'BUY'
                          ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/80 text-emerald-300'
                          : isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-950/80 text-rose-300'
                      }`}>
                        ACTIVE {currentActivePos.type} {currentActivePos.quantity}x
                      </span>
                      <span>Entry: {formatCurrency(currentActivePos.entryPrice)}</span>
                      <span>•</span>
                      <span className={`font-bold ${livePnl >= 0 ? (isLight ? 'text-emerald-600' : 'text-[#00FF87]') : (isLight ? 'text-rose-600' : 'text-[#FF3366]')}`}>
                        P&L: {livePnl >= 0 ? '+' : ''}{formatCurrency(livePnl)} ({livePnl >= 0 ? '+' : ''}{livePnlPct}%)
                      </span>
                    </div>

                    <button
                      onClick={() => handleClosePosition(currentActivePos)}
                      className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold transition cursor-pointer"
                    >
                      Close Position
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Available Capital: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{formatCurrency(user.demoBalance)}</strong></span>
                      <span>•</span>
                      <span>Est. Trade Cost: {formatCurrency(selectedAsset.price * orderQuantity)}</span>
                    </div>
                    <span className="text-[10px] opacity-75">1-Click Instant Execution Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* PAGE 6: PRICE ALERTS & BROWSER NOTIFICATIONS */}
      {activePage === 'alerts' && (() => {
        const activeAlerts = priceAlerts.filter((a) => !a.triggered);
        const triggeredAlerts = priceAlerts.filter((a) => a.triggered);

        return (
          <div className="space-y-4 animate-in fade-in duration-150 font-mono">
            {/* Top Header Card */}
            <div className={`p-5 rounded-3xl border shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base">Real-Time Price Alerts</h3>
                </div>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Trigger browser notifications and audio chimes when real-world market prices cross your targets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestBrowserNotification}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                  title="Test if your browser can receive desktop notifications"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Notification</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAlertModal(selectedAsset)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                    isLight
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Set New Alert</span>
                </button>
              </div>
            </div>

            {/* Browser Permission Status Banner */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
              notificationPermission === 'granted'
                ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2.5">
                {notificationPermission === 'granted' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {notificationPermission === 'granted'
                      ? 'Browser Desktop Notifications: ENABLED & ACTIVE'
                      : 'Browser Desktop Notifications: NOT ENABLED'}
                  </span>
                  <span className="text-[11px] opacity-80 block">
                    {notificationPermission === 'granted'
                      ? 'You will receive immediate system pop-ups even if you are viewing other browser tabs or software.'
                      : 'Click enable to receive native OS desktop alerts whenever target prices are crossed.'}
                  </span>
                </div>
              </div>

              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  Enable Browser Notifications
                </button>
              )}
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl border transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
              }`}>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>TOTAL PRICE ALERTS</span>
                <span className={`text-xl font-black block mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {priceAlerts.length} Configured
                </span>
              </div>

              <div className={`p-4 rounded-2xl border transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
              }`}>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ACTIVE LISTENING</span>
                <span className="text-xl font-black block mt-1 text-emerald-400">
                  {activeAlerts.length} Armed
                </span>
              </div>

              <div className={`p-4 rounded-2xl border transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
              }`}>
                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>TRIGGERED HITS</span>
                <span className="text-xl font-black block mt-1 text-amber-400">
                  {triggeredAlerts.length} Completed
                </span>
              </div>
            </div>

            {/* Alerts List */}
            <div className={`rounded-3xl border shadow-xl overflow-hidden transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/10'
              }`}>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm">Alert Rules & Targets</h4>
                </div>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Real-Time Ticker Monitored
                </span>
              </div>

              <div className="p-4">
                {priceAlerts.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <BellOff className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>No Price Alerts Configured</h4>
                      <p className={`text-xs max-w-sm mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Set an alert on your favorite stock, crypto, or forex pair to receive instant desktop notifications when target prices are reached.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAlertModal(selectedAsset)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      + Set Alert for {selectedAsset.symbol}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {priceAlerts.map((alt) => {
                      const asset = assets.find((a) => a.symbol === alt.symbol) || selectedAsset;
                      const curPrice = asset.price;
                      const diff = curPrice - alt.targetPrice;
                      const diffPct = Number(((diff / alt.targetPrice) * 100).toFixed(2));
                      const isTriggered = alt.triggered;

                      return (
                        <div
                          key={alt.id}
                          className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition ${
                            isTriggered
                              ? isLight ? 'bg-slate-50/80 border-slate-200 opacity-75' : 'bg-[#0A0E17]/60 border-white/5 opacity-70'
                              : isLight ? 'bg-amber-50/40 border-amber-200' : 'bg-[#121A28] border-amber-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${
                              isTriggered
                                ? isLight ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-white/5 text-slate-400 border-white/10'
                                : alt.condition === 'ABOVE'
                                ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/30'
                                : isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-[#FF3366]/20 text-[#FF3366] border-[#FF3366]/30'
                            }`}>
                              {alt.condition === 'ABOVE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                  {alt.symbol}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  alt.condition === 'ABOVE'
                                    ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                    : isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                                }`}>
                                  {alt.condition === 'ABOVE' ? '▲ RISES ABOVE' : '▼ FALLS BELOW'}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  isTriggered
                                    ? isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-slate-400'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {isTriggered ? 'TRIGGERED' : 'ARMED'}
                                </span>
                              </div>

                              <div className="text-xs mt-1 space-x-2">
                                <span>Target: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{formatCurrency(alt.targetPrice, asset.type === 'forex' ? 4 : 2)}</strong></span>
                                <span>•</span>
                                <span>Live: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{formatCurrency(curPrice, asset.type === 'forex' ? 4 : 2)}</strong></span>
                                {!isTriggered && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400">
                                      ({Math.abs(diffPct)}% away)
                                    </span>
                                  </>
                                )}
                              </div>

                              {alt.note && (
                                <p className="text-[11px] text-amber-400/90 italic mt-1">
                                  "{alt.note}"
                                </p>
                              )}

                              {isTriggered && alt.triggeredAt && (
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  Triggered at: {new Date(alt.triggeredAt).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const found = assets.find((a) => a.symbol === alt.symbol);
                                if (found) setSelectedAsset(found);
                                setActivePage('chart');
                                sounds.playClick();
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                  : 'bg-[#151D2A] hover:bg-[#1E293B] text-white border-white/10'
                              }`}
                            >
                              Chart
                            </button>

                            {isTriggered ? (
                              <button
                                type="button"
                                onClick={() => handleRearmPriceAlert(alt.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                                  isLight
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                }`}
                                title="Re-arm this alert to trigger again"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Re-arm</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleDeletePriceAlert(alt.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                              title="Delete alert"
                            >
                              <Trash2 className="w-4 h-4" />
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
        );
      })()}

      {/* Set Price Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl font-mono text-xs space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0E1726] border-white/10 text-white'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Set Price Alert</h3>
                  <span className="text-[11px] text-slate-400">{alertModalAsset.symbol} • {alertModalAsset.name}</span>
                </div>
              </div>
              <button onClick={() => setIsAlertModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Price Reference */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/10'
            }`}>
              <span className="text-slate-400 font-bold">CURRENT LIVE PRICE:</span>
              <span className="text-base font-black">
                {formatCurrency(alertModalAsset.price, alertModalAsset.type === 'forex' ? 4 : 2)}
              </span>
            </div>

            {/* Target Price Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold block text-slate-400">TARGET ALERT PRICE</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={alertTargetPrice}
                  onChange={(e) => {
                    setAlertTargetPrice(e.target.value);
                    const p = parseFloat(e.target.value);
                    if (!isNaN(p)) {
                      if (p > alertModalAsset.price) setAlertCondition('ABOVE');
                      else if (p < alertModalAsset.price) setAlertCondition('BELOW');
                    }
                  }}
                  placeholder="e.g. 2500"
                  className={`w-full p-3 rounded-xl border text-sm font-bold focus:outline-none transition ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0A0E17] border-white/15 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              {/* Quick Percent Presets (+1%, +2%, +5%, -1%, -2%, -5%) */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                {[-5, -2, -1, 1, 2, 5].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      const calculated = alertModalAsset.price * (1 + pct / 100);
                      setAlertTargetPrice(calculated.toFixed(alertModalAsset.type === 'forex' ? 4 : 2));
                      setAlertCondition(pct > 0 ? 'ABOVE' : 'BELOW');
                      sounds.playClick();
                    }}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                      pct > 0
                        ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/80'
                        : isLight ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-950/80'
                    }`}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Condition Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold block text-slate-400">TRIGGER WHEN PRICE</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setAlertCondition('ABOVE'); sounds.playClick(); }}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    alertCondition === 'ABOVE'
                      ? isLight ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[#00FF87] text-[#0A0E17] border-[#00FF87]'
                      : isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#121A28] text-slate-300 border-white/10'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Rises Above (▲)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAlertCondition('BELOW'); sounds.playClick(); }}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    alertCondition === 'BELOW'
                      ? isLight ? 'bg-rose-600 text-white border-rose-600' : 'bg-[#FF3366] text-white border-[#FF3366]'
                      : isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#121A28] text-slate-300 border-white/10'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Falls Below (▼)</span>
                </button>
              </div>
            </div>

            {/* Note / Tag */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold block text-slate-400">NOTE (OPTIONAL)</label>
              <input
                type="text"
                value={alertNote}
                onChange={(e) => setAlertNote(e.target.value)}
                placeholder="e.g. Resistance breakout, Stop Loss level, Take Profit"
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none transition ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-[#0A0E17] border-white/15 text-white focus:border-amber-400'
                }`}
              />
            </div>

            {/* Browser Notification Status */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              notificationPermission === 'granted'
                ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {notificationPermission === 'granted' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-[11px] font-bold">
                  {notificationPermission === 'granted'
                    ? 'Desktop & Browser Alerts: Active'
                    : 'Browser Notifications: Not Enabled'}
                </span>
              </div>
              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400 transition cursor-pointer"
                >
                  Enable Now
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAlert}
                className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                  isLight ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Save Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent In-App Alert Toast / Notification Banner */}
      <AnimatePresence>
        {alertToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 max-w-sm sm:max-w-md p-4 rounded-2xl border shadow-2xl backdrop-blur-xl bg-[#0E1726]/95 border-amber-500/60 text-white font-mono"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    🚨 Price Alert Hit
                  </span>
                  <button onClick={() => setAlertToast(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-black text-sm sm:text-base mt-0.5">
                  {alertToast.symbol} reached {formatCurrency(alertToast.currentPrice)}!
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Crossed target of {formatCurrency(alertToast.targetPrice)} ({alertToast.condition === 'ABOVE' ? 'Risen above' : 'Fallen below'}).
                  {alertToast.note ? ` Note: "${alertToast.note}"` : ''}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const a = assets.find((x) => x.symbol === alertToast.symbol);
                      if (a) setSelectedAsset(a);
                      setActivePage('chart');
                      setAlertToast(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Open Chart</span>
                  </button>
                  <button
                    onClick={() => setAlertToast(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
