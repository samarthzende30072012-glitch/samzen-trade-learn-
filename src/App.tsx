import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, TradingAsset } from './types';
import { UNIVERSAL_ASSETS } from './data/assetsDatabase';
import { marketWS } from './services/marketWebSocket';
import { syncUserProfileToFirestore, logoutFirebase } from './services/firebase';

// Views & Components
import PaperTrading from './components/PaperTrading';
import MarketHeatmap from './components/MarketHeatmap';
import IMOConceptNotes from './components/IMOConceptNotes';
import LearningDashboard from './components/LearningDashboard';
import AboutAndLegalSection from './components/AboutAndLegalSection';
import AdminPortal from './components/AdminPortal';
import AIChatbot from './components/AIChatbot';
import Footer from './components/Footer';

// Modals
import AuthScreen from './components/AuthScreen';
import SettingsModal from './components/SettingsModal';
import GoProSection from './components/GoProSection';
import TradePerformanceSummaryModal from './components/TradePerformanceSummaryModal';
import FeedbackModal from './components/FeedbackModal';
import LegalPolicies, { PolicyType } from './components/LegalPolicies';

// Icons
import { 
  TrendingUp, BarChart2, BookOpen, ShieldCheck, 
  Wallet, FileText, Sun, Moon, Sliders, LogOut, User, 
  Sparkles, Clock, ArrowRight, ArrowLeft, CheckCircle2, 
  Menu, X, Building2, Scale, Zap, Shield, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default guest profile
const DEFAULT_GUEST_USER: UserProfile = {
  email: 'scholar@samzen.com',
  name: 'Scholar Trader',
  joinedAt: new Date().toISOString(),
  proTier: null,
  proExpiresAt: null,
  paperTradingPassExpiresAt: null,
  demoBalance: 100000,
  progress: ['beg-0', 'beg-1'],
  quizScores: { 'candlestick-basics': 85 },
  positions: [],
  holdings: [],
  transactionHistory: [
    {
      id: 'init-demo',
      type: 'DEPOSIT',
      amount: 100000,
      timestamp: new Date().toISOString(),
    },
  ],
};

export type AppView = 'terminal' | 'heatmap' | 'concepts' | 'learning' | 'about';

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const savedEmail = localStorage.getItem('last_logged_in_email');
      if (savedEmail) {
        const saved = localStorage.getItem(`user_profile_${savedEmail}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_GUEST_USER;
  });

  // Primary Focus: Paper Trading Simulator is the DEFAULT view!
  const [currentView, setCurrentView] = useState<AppView>('terminal');

  // Selected asset from Heatmap to open in Terminal
  const [selectedHeatmapAsset, setSelectedHeatmapAsset] = useState<TradingAsset | undefined>(undefined);

  // Theme: 'dark' (Midnight Obsidian #0A0E17) vs 'light' (Clean Light #F8FAFC)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('samzen_app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    return 'dark';
  });

  const [displayCurrency, setDisplayCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR');
  const [activeUsers, setActiveUsers] = useState<number>(() => marketWS.getActiveUsersCount());
  const [isMuted, setIsMuted] = useState(false);

  // Modals state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isTradeSummaryModalOpen, setIsTradeSummaryModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [selectedLegalPolicy, setSelectedLegalPolicy] = useState<PolicyType>('risk');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Auth requirement handler
  const pendingActionRef = useRef<(() => void) | null>(null);
  const isLight = theme === 'light';

  // Synchronize theme to document element
  useEffect(() => {
    try {
      localStorage.setItem('samzen_app_theme', theme);
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('light-theme');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  const handleUpdateUser = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    localStorage.setItem(`user_profile_${updatedProfile.email}`, JSON.stringify(updatedProfile));
    syncUserProfileToFirestore(updatedProfile.email, updatedProfile);
  };

  const isAuthenticated = Boolean(
    user && 
    user.email && 
    user.email !== 'scholar@samzen.com' && 
    localStorage.getItem('last_logged_in_email')
  );

  const executeWithAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      pendingActionRef.current = action;
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    if ((loggedInUser as any).isAdmin) {
      setIsAdminView(true);
      setIsAuthModalOpen(false);
      return;
    }
    setUser(loggedInUser);
    localStorage.setItem('last_logged_in_email', loggedInUser.email);
    localStorage.setItem(`user_profile_${loggedInUser.email}`, JSON.stringify(loggedInUser));
    syncUserProfileToFirestore(loggedInUser.email, loggedInUser);
    setIsAuthModalOpen(false);

    if (pendingActionRef.current) {
      const pending = pendingActionRef.current;
      pendingActionRef.current = null;
      pending();
    }
  };

  const handleLogOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    try {
      await logoutFirebase();
    } catch {
      // ignore
    }
    setUser(DEFAULT_GUEST_USER);
    localStorage.removeItem('last_logged_in_email');
    setCurrentView('terminal');
  };

  const handleOpenLegal = (policy: PolicyType = 'risk') => {
    setSelectedLegalPolicy(policy);
    setIsLegalModalOpen(true);
  };

  // Toggle User threshold
  const handleToggleEngine = () => {
    const next = marketWS.toggleUserThreshold();
    setActiveUsers(next);
  };

  // -------------------------------------------------------------
  // SECRET ADMIN PORTAL (TRIGGERED VIA PASSCODE 30072012)
  // -------------------------------------------------------------
  if (isAdminView) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#070B14] text-white'}`}>
        <AdminPortal
          onExitAdmin={() => setIsAdminView(false)}
          theme={theme}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEDICATED FULL-SCREEN TRADING TERMINAL VIEW (ZERODHA KITE / UPSTOX STYLE)
  // -------------------------------------------------------------
  if (currentView === 'terminal') {
    return (
      <div className={`h-screen w-screen flex flex-col font-sans overflow-hidden select-none transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#070B14] text-white'
      }`}>
        <AIChatbot theme={theme} />
        <div className="flex-1 overflow-hidden">
          <PaperTrading
            user={user}
            onUpdateUser={handleUpdateUser}
            onGoProClick={() => setIsUpgradeModalOpen(true)}
            displayCurrency={displayCurrency}
            initialAsset={selectedHeatmapAsset}
            onExitTerminal={() => setCurrentView('learning')}
            onNavigateTab={(tab) => setCurrentView(tab)}
            onExportPdf={() => setIsTradeSummaryModalOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        </div>

        {/* Global Modals inside Terminal */}
        <TradePerformanceSummaryModal
          user={user}
          isOpen={isTradeSummaryModalOpen}
          onClose={() => setIsTradeSummaryModalOpen(false)}
          onUpdateUser={handleUpdateUser}
          theme={theme}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          theme={theme}
          onThemeChange={setTheme}
          currency={displayCurrency}
          onCurrencyChange={setDisplayCurrency}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          onResetCapital={() => {
            handleUpdateUser({
              ...user,
              demoBalance: 100000,
              positions: [],
              limitOrders: [],
              closedTrades: [],
            });
          }}
        />
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-4xl w-full my-auto">
              <GoProSection
                user={user}
                onUpdateUser={handleUpdateUser}
                onClose={() => setIsUpgradeModalOpen(false)}
                displayCurrency={displayCurrency}
                formatCurrency={formatCurrency}
                onRequireAuth={() => executeWithAuth(() => {})}
              />
            </div>
          </div>
        )}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative max-w-md w-full">
              <AuthScreen
                onLoginSuccess={handleLoginSuccess}
                initialMode={authMode}
                onBack={() => setIsAuthModalOpen(false)}
                onAdminTrigger={() => {
                  setIsAuthModalOpen(false);
                  setIsAdminView(true);
                }}
                theme={theme}
              />
            </div>
          </div>
        )}
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          theme={theme}
          userEmail={user.email}
          username={user.username || user.name}
        />
        <LegalPolicies
          initialPolicy={selectedLegalPolicy}
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
        />
      </div>
    );
  }

  const navTabs: { id: AppView; label: string; icon: any; badge?: string }[] = [
    { id: 'terminal', label: 'Trading Terminal', icon: TrendingUp, badge: 'Live Simulator' },
    { id: 'heatmap', label: 'Market Heatmap', icon: BarChart2 },
    { id: 'concepts', label: 'IMO Concept Notes', icon: BookOpen, badge: '8 Pillar Notes' },
    { id: 'learning', label: 'Learning & Growth', icon: Layers },
    { id: 'about', label: 'About & Legal', icon: Building2 },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors max-w-full overflow-x-hidden ${
      isLight 
        ? 'bg-[#F8FAFC] text-slate-800' 
        : 'bg-[#070B14] text-white selection:bg-[#00FF87]/20 selection:text-[#00FF87]'
    }`}>
      <AIChatbot theme={theme} />

      {/* 0. TOP COMPLIANCE STRIP */}
      <div className={`py-1.5 px-3 sm:px-4 text-center text-[10px] font-mono border-b flex items-center justify-between ${
        isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-[#151208] border-amber-900/40 text-amber-400'
      }`}>
        <div className="flex items-center gap-1.5 mx-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-bold tracking-tight">
            Samzen TradeLearn Institutional Paper Simulator • Non-SEBI Registered Sandbox • 100% Risk-Free Capital
          </span>
        </div>
        <button
          onClick={() => setCurrentView('about')}
          className="underline text-[10px] hidden md:inline hover:opacity-80 cursor-pointer"
        >
          48-Hour Refund Policy & Legal
        </button>
      </div>

      {/* 1. MASTER TOP NAVIGATION BAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${
        isLight ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-[#0A0E17]/95 border-white/10 shadow-lg'
      }`}>
        <div className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setCurrentView('terminal')}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <img
                  src="/assets/aistudio/Samzen_Neon_Trading_Emblem_c452c366.png"
                  alt="Samzen Emblem"
                  className="w-9 h-9 rounded-xl object-cover shadow-md border border-white/20 group-hover:scale-105 transition-transform"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-serif font-bold text-sm tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      SAMZEN <span className={`italic ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`}>TRADELEARN</span>
                    </span>
                  </div>
                  <p className={`text-[10px] font-mono leading-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Official Institutional Terminal
                  </p>
                </div>
              </button>
            </div>

            {/* Center: Strict Click-Based Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl border font-mono text-xs shadow-inner">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentView(tab.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer relative ${
                      isActive
                        ? isLight
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-[#00FF87] text-[#0A0E17] font-black shadow-[0_0_15px_rgba(0,255,135,0.4)]'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.badge && !isActive && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-emerald-400'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: User Threshold Engine, PDF Export, Capital, Theme, Settings & Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 font-mono text-xs">
              
              {/* User-Driven (>= 10 Users) vs 31-Day Historical (< 10 Users) Engine Switcher */}
              <button
                type="button"
                onClick={handleToggleEngine}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition cursor-pointer shrink-0 ${
                  activeUsers >= 10
                    ? isLight 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' 
                      : 'bg-[#00FF87]/15 border-[#00FF87]/40 text-[#00FF87] hover:bg-[#00FF87]/25 shadow-[0_0_12px_rgba(0,255,135,0.2)]'
                    : isLight 
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                }`}
                title="Strict User Threshold: >= 10 Users (User-Driven Execution) vs < 10 Users (31-Day Historical Data Engine). Click to toggle."
              >
                <span className={`w-2 h-2 rounded-full ${activeUsers >= 10 ? 'bg-[#00FF87] animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline">
                  {activeUsers >= 10 ? `⚡ User-Driven (${activeUsers} Users >= 10)` : `📅 31-Day Old (${activeUsers} Users < 10)`}
                </span>
                <span className="sm:hidden font-bold">
                  {activeUsers >= 10 ? `⚡ 10+ Users` : `📅 31d Old`}
                </span>
              </button>

              {/* PDF Summary Export Trigger */}
              <button
                type="button"
                onClick={() => setIsTradeSummaryModalOpen(true)}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition cursor-pointer ${
                  isLight
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                }`}
                title="Export Formatted PDF Trade History & Performance Summary"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              {/* Demo Capital Badge */}
              <div className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121A28] border-white/10'
              }`}>
                <Wallet className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`} />
                <span className="font-bold">{formatCurrency(user.demoBalance, 0)}</span>
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                    : 'bg-[#121A28] hover:bg-[#1E293B] text-amber-400 border-white/10'
                }`}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Settings Trigger */}
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                    : 'bg-[#121A28] hover:bg-[#1E293B] text-slate-300 border-white/10'
                }`}
                title="Platform Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* User Profile / Auth Button */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                    isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#00FF87]/10 border-[#00FF87]/20 text-[#00FF87]'
                  }`}>
                    <User className="w-3.5 h-3.5" />
                    <span className="font-bold truncate max-w-[110px]">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogOut}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isLight ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] border-[#00FF87]'
                  }`}
                >
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl border transition cursor-pointer ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#121A28] border-white/10 text-white'
                }`}
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Secondary Navigation Dropdown */}
          {isMobileMenuOpen && (
            <div className={`lg:hidden py-3 border-t font-mono text-xs space-y-1.5 animate-in slide-in-from-top-2 duration-150 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentView(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl font-bold flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? isLight
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#00FF87] text-[#0A0E17]'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTradeSummaryModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border font-bold text-center flex items-center justify-center gap-2 ${
                    isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF Summary</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. MAIN VIEW CONTENT (STRICT DEFINED END, NO ENDLESS SCROLLING) */}
      <main className="flex-grow p-2 sm:p-4 max-w-[1920px] w-full mx-auto">
        {/* VIEW 2: INSTITUTIONAL MARKET HEATMAP */}
        {currentView === 'heatmap' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className={`p-4 sm:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0E1726] border-white/10 shadow-lg'
            }`}>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BarChart2 className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`} />
                  <span>Institutional Multi-Sector Market Heatmap</span>
                </h2>
                <p className={`text-xs font-mono mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Real-time D3 treemap grouped across Indian Equities, 24/7 Crypto, and Global Forex. Click any block to immediately chart it in the Trading Terminal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('terminal')}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition shadow-md ${
                  isLight 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17]'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Return to Trading Terminal</span>
              </button>
            </div>

            <MarketHeatmap
              assets={UNIVERSAL_ASSETS}
              onSelectAsset={(asset) => {
                setSelectedHeatmapAsset(asset);
                setCurrentView('terminal');
              }}
              theme={theme}
            />
          </div>
        )}

        {/* VIEW 3: DETAILED COLOURFUL IMO NOTES & VISUAL CONCEPT CHARTS */}
        {currentView === 'concepts' && (
          <div className="animate-in fade-in duration-150">
            <IMOConceptNotes
              onLaunchTerminal={() => setCurrentView('terminal')}
              theme={theme}
            />
          </div>
        )}

        {/* VIEW 4: LEARNING DASHBOARD & 30-DAY RECHARTS PERFORMANCE GROWTH */}
        {currentView === 'learning' && (
          <div className="animate-in fade-in duration-150">
            <LearningDashboard
              user={user}
              onUpdateUser={handleUpdateUser}
              onBackToHome={() => setCurrentView('terminal')}
              onLaunchTerminal={() => setCurrentView('terminal')}
              onOpenUpgradeModal={() => executeWithAuth(() => setIsUpgradeModalOpen(true))}
              onRequireAuth={() => executeWithAuth(() => {})}
              theme={theme}
            />
          </div>
        )}

        {/* VIEW 5: ABOUT SAMZEN & CONSOLIDATED LEGAL POLICIES */}
        {currentView === 'about' && (
          <div className="animate-in fade-in duration-150">
            <AboutAndLegalSection
              onLaunchTerminal={() => setCurrentView('terminal')}
              theme={theme}
            />
          </div>
        )}
      </main>

      {/* 3. COMPACT FOOTER WITH DIRECT ACCESS TO POLICIES */}
      <Footer 
        onOpenAbout={() => setCurrentView('about')} 
        onOpenPolicy={() => handleOpenLegal('terms')} 
      />

      {/* 4. MODALS */}

      {/* Formatted PDF Performance Summary Review Modal */}
      <TradePerformanceSummaryModal
        user={user}
        isOpen={isTradeSummaryModalOpen}
        onClose={() => setIsTradeSummaryModalOpen(false)}
        onUpdateUser={handleUpdateUser}
        theme={theme}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        currency={displayCurrency}
        onCurrencyChange={setDisplayCurrency}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onResetCapital={() => {
          handleUpdateUser({
            ...user,
            demoBalance: 100000,
            positions: [],
            limitOrders: [],
            closedTrades: [],
          });
        }}
      />

      {/* Pro Membership & Certification Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-auto">
            <GoProSection
              user={user}
              onUpdateUser={handleUpdateUser}
              onClose={() => setIsUpgradeModalOpen(false)}
              displayCurrency={displayCurrency}
              formatCurrency={formatCurrency}
              onRequireAuth={() => executeWithAuth(() => {})}
            />
          </div>
        </div>
      )}

      {/* Auth Screen Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full">
            <AuthScreen
              onLoginSuccess={handleLoginSuccess}
              initialMode={authMode}
              onBack={() => setIsAuthModalOpen(false)}
              onAdminTrigger={() => {
                setIsAuthModalOpen(false);
                setIsAdminView(true);
              }}
              theme={theme}
            />
          </div>
        </div>
      )}

      {/* Individual Policy Modal */}
      <LegalPolicies
        initialPolicy={selectedLegalPolicy}
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* User Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        theme={theme}
        userEmail={user.email}
        username={user.username || user.name}
      />
    </div>
  );
}
