import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import AuthScreen from './components/AuthScreen';
import QuizSection from './components/QuizSection';
import CourseViewer from './components/CourseViewer';
import PaperTrading from './components/PaperTrading';
import GoProSection from './components/GoProSection';
import AccountManager from './components/AccountManager';
import StrategyPamphlets from './components/StrategyPamphlets';
import TradingFAQ from './components/TradingFAQ';
import AboutSamzen from './components/AboutSamzen';
import LegalPolicies, { PolicyType } from './components/LegalPolicies';
import SettingsModal from './components/SettingsModal';
import LearningDashboard from './components/LearningDashboard';
import FeedbackModal from './components/FeedbackModal';
import Footer from './components/Footer';
import { syncUserProfileToFirestore, logoutFirebase } from './services/firebase';
import { ALL_COURSES } from './data/courses';
import { marketWS } from './services/marketWebSocket';
import { 
  BookOpen, TrendingUp, Award, Crown, LogOut, Sparkles, 
  Clock, ShieldCheck, Wallet, CheckCircle, ChevronRight, HelpCircle, User,
  FileText, Bookmark, Layers, ArrowRight, ArrowLeft, Globe, Shield,
  ExternalLink, Zap, Play, BarChart2, Sun, Moon, Sliders, AlertTriangle,
  Flame, CheckCircle2, Check, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AIChatbot from './components/AIChatbot';

// Default guest profile if user starts without an account
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

  // Top level View Controller: 'home' (Marketing Homepage) vs 'learning' (Uncluttered Dashboard) vs 'terminal' (Full-screen App)
  const [currentView, setCurrentView] = useState<'home' | 'learning' | 'terminal'>('home');

  // Education Homepage sub-tabs: 'courses' | 'pamphlets' | 'faq' | 'about' | 'quizzes' | 'gopro'
  const [eduTab, setEduTab] = useState<'courses' | 'pamphlets' | 'faq' | 'about' | 'quizzes' | 'gopro'>('courses');

  // Theme Customization: 'dark' (Midnight Obsidian #0A0E17) vs 'light' (Fresh Light Mode #F8FAFC)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('samzen_app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    return 'dark';
  });

  // Currency & Market Preferences
  const [displayCurrency, setDisplayCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR');
  const [activeMarket, setActiveMarket] = useState<'stocks' | 'forex' | 'crypto'>('stocks');

  // Modals
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [selectedLegalPolicy, setSelectedLegalPolicy] = useState<PolicyType>('risk');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Audio state
  const [isMuted, setIsMuted] = useState(false);

  // Simulated day index for drip-feed testing
  const [simulatedDays, setSimulatedDays] = useState<number>(0);

  // Live Marquee Ticker Prices
  const [marqueePrices, setMarqueePrices] = useState<Record<string, number>>(() => marketWS.getAllCurrentPrices());

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

  useEffect(() => {
    const unsub = marketWS.subscribe((tick) => {
      setMarqueePrices((prev) => ({
        ...prev,
        [tick.symbol]: tick.price,
      }));
    });
    return () => unsub();
  }, []);

  const [courses, setCourses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('custom_courses_data');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ALL_COURSES;
  });

  const handleUpdateCourses = (newCourses: any[]) => {
    setCourses(newCourses);
    localStorage.setItem('custom_courses_data', JSON.stringify(newCourses));
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

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem('last_logged_in_email', loggedInUser.email);
    localStorage.setItem(`user_profile_${loggedInUser.email}`, JSON.stringify(loggedInUser));
    syncUserProfileToFirestore(loggedInUser.email, loggedInUser);
    setIsAuthModalOpen(false);
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
    setCurrentView('home');
    setEduTab('courses');
  };

  const handleOpenLegal = (policy: PolicyType = 'risk') => {
    setSelectedLegalPolicy(policy);
    setIsLegalModalOpen(true);
  };

  // -------------------------------------------------------------
  // IMMERSIVE FULL-SCREEN APP ENVIRONMENT: PAPER TRADING TERMINAL
  // When launched, educational marketing site is completely hidden!
  // Dedicated "Exit Trading Terminal" button returns directly to Learning.
  // -------------------------------------------------------------
  if (currentView === 'terminal') {
    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors ${
        isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#070B14] text-white selection:bg-[#00FF87]/20 selection:text-[#00FF87]'
      }`}>
        <AIChatbot theme={theme} />
      <main className="flex-grow p-2 sm:p-4 max-w-[1920px] w-full mx-auto">
          <PaperTrading
            user={user}
            onUpdateUser={handleUpdateUser}
            onGoProClick={() => setIsUpgradeModalOpen(true)}
            displayCurrency={displayCurrency}
            activeMarket={activeMarket}
            onExitTerminal={() => setCurrentView('learning')}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        </main>

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

        {/* Upgrade Modal for Gated Downloads */}
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-4xl w-full my-auto">
              <GoProSection
                user={user}
                onUpdateUser={handleUpdateUser}
                onClose={() => setIsUpgradeModalOpen(false)}
                displayCurrency={displayCurrency}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODULE 2: THE UNCLUTTERED LEARNING DASHBOARD & COURSE NAVIGATION
  // Distraction-free dedicated learning page with "Learn this topic" flow!
  // -------------------------------------------------------------
  if (currentView === 'learning') {
    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0A0E17] text-white selection:bg-[#00FF87]/20 selection:text-[#00FF87]'
      }`}>
        <AIChatbot theme={theme} />
      <LearningDashboard
          user={user}
          onUpdateUser={handleUpdateUser}
          onBackToHome={() => setCurrentView('home')}
          onLaunchTerminal={() => setCurrentView('terminal')}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
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

        {/* Upgrade Modal for Gated Downloads */}
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-4xl w-full my-auto">
              <GoProSection
                user={user}
                onUpdateUser={handleUpdateUser}
                onClose={() => setIsUpgradeModalOpen(false)}
                displayCurrency={displayCurrency}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODULE 1: MARKETING & EDUCATION-FIRST HOMEPAGE
  // Leads entirely with aggressive branding, value propositions, and learning!
  // The simulator is NOT accessible at the top or middle.
  // The final CTA at the absolute bottom launches the terminal!
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#0A0E17] text-white selection:bg-[#00FF87]/20 selection:text-[#00FF87]'
    }`}>
      <AIChatbot theme={theme} />
      {/* 0. EDUCATIONAL DISCLAIMER */}
      <div className={`py-2 px-4 text-center text-[10px] uppercase tracking-widest font-mono border-b ${
        isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-[#1A1608] border-amber-900/50 text-amber-500'
      }`}>
        Disclaimer: Samzen TradeLearn is purely an educational platform and paper trading simulator. It is NOT a SEBI-registered investment advisory or financial service.
      </div>
      {/* 1. TOP ANNOUNCEMENT STRIP: RHYMING HOOKS */}
      <div className={`border-b py-2 px-4 text-center text-xs font-mono transition-colors ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#0E1726] border-white/10 text-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <span className="text-[11px] hidden md:inline">
            Official Institution of Samzen Conglomerate
          </span>
          <p className="font-bold text-[11px] truncate flex items-center gap-2 mx-auto md:mx-0">
            <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${isLight ? 'bg-emerald-600' : 'bg-[#00FF87]'}`} />
            <span className={isLight ? 'text-emerald-700' : 'text-[#00FF87]'}>"Master the Chart, Before Markets Tear You Apart"</span>
            <span className="opacity-40">•</span>
            <span className={isLight ? 'text-blue-700' : 'text-[#00F0FF]'}>"Buy the Course, Master the Market"</span>
          </p>
          <span className="text-[11px] font-mono font-bold text-[#00FF87] hidden lg:inline">
            100% Zero-Lag Simulation Sandbox
          </span>
        </div>
      </div>

      {/* 2. STICKY HOMEPAGE HEADER (NO TERMINAL AT THE TOP!) */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${
        isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0A0E17]/95 border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Samzen_Neon_Trading_Emblem_c452c366.png"
                alt="Samzen Neon Trading Emblem"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-xl border border-white/30 cursor-pointer hover:scale-105 transition duration-200"
                onClick={() => setIsLogoModalOpen(true)}
                title="Click to view emblem full size"
              />
              <div>
                <span className={`text-base font-serif font-bold tracking-tight block ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  SAMZEN <span className={`italic ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`}>TRADELEARN</span>
                </span>
                <span className={`text-[10px] font-mono block tracking-widest uppercase ${
                  isLight ? 'text-blue-600' : 'text-[#00F0FF]'
                }`}>
                  Institutional Academy
                </span>
              </div>
            </div>

            {/* Middle Nav Links: Pure Education */}
            <nav className="hidden lg:flex items-center gap-6 font-mono text-xs font-bold">
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' });
                  setCurrentView('learning');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black transition cursor-pointer ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-[#00FF87]/15 border-[#00FF87]/40 text-[#00FF87] hover:bg-[#00FF87]/25 shadow-[0_0_12px_rgba(0,255,135,0.2)]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Learning Dashboard</span>
              </button>
              <button 
                onClick={() => setEduTab('courses')}
                className={`transition cursor-pointer ${eduTab === 'courses' ? (isLight ? 'text-emerald-700 font-black' : 'text-[#00FF87] font-black') : 'opacity-70 hover:opacity-100'}`}
              >
                Curriculum
              </button>
              <button 
                onClick={() => setEduTab('pamphlets')}
                className={`transition cursor-pointer ${eduTab === 'pamphlets' ? (isLight ? 'text-emerald-700 font-black' : 'text-[#00FF87] font-black') : 'opacity-70 hover:opacity-100'}`}
              >
                Strategy Pamphlets
              </button>
              <button 
                onClick={() => setEduTab('faq')}
                className={`transition cursor-pointer ${eduTab === 'faq' ? (isLight ? 'text-emerald-700 font-black' : 'text-[#00FF87] font-black') : 'opacity-70 hover:opacity-100'}`}
              >
                Knowledge Base
              </button>
              <button 
                onClick={() => setEduTab('about')}
                className={`transition cursor-pointer ${eduTab === 'about' ? (isLight ? 'text-emerald-700 font-black' : 'text-[#00FF87] font-black') : 'opacity-70 hover:opacity-100'}`}
              >
                About Us
              </button>
              <button 
                onClick={() => handleOpenLegal('terms')}
                className={`transition cursor-pointer ${isLight ? 'text-slate-600' : 'text-slate-400'} opacity-70 hover:opacity-100`}
              >
                Policy
              </button>
            </nav>

            {/* Right Controls: Theme Toggle, Settings, Currency, Account (NO TERMINAL BUTTON) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Currency Dropdown */}
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#121A28] border-white/10 text-white'
              }`}>
                <span className="text-[10px] opacity-60 font-bold uppercase">CUR:</span>
                <select
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value as any)}
                  className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option className="bg-[#0E1726] text-white" value="INR">INR (₹)</option>
                  <option className="bg-[#0E1726] text-white" value="USD">USD ($)</option>
                  <option className="bg-[#0E1726] text-white" value="EUR">EUR (€)</option>
                </select>
              </div>

              {/* Go Pro Plans Header Button */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('pricing-checkout');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else setEduTab('gopro');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer shadow-md ${
                  isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                    : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                }`}
                title="View Elite Paid Plans"
              >
                <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Go Pro Plans</span>
              </button>

              {/* Theme Toggle Button (Sun/Moon) */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                    : 'bg-[#121A28] hover:bg-[#1E293B] text-amber-400 border-white/10'
                }`}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Fresh Light Mode'}
              >
                {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                    : 'bg-[#121A28] hover:bg-[#1E293B] text-slate-300 border-white/10'
                }`}
                title="Settings & Color Customization"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* User Sign In / Profile */}
              {user.email !== 'scholar@samzen.com' ? (
                <button
                  onClick={() => setEduTab('account' as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#121A28] border-white/10 text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="truncate max-w-[100px]">{user.name || user.email}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#121A28] border-white/10 text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5 opacity-60" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Hamburger Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2.5 rounded-xl border transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' 
                    : 'bg-[#121A28] hover:bg-[#1E293B] text-white border-white/15'
                }`}
                title="Toggle Mobile Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-[#00FF87]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden border-t px-4 py-6 space-y-4 font-mono text-xs shadow-2xl animate-in slide-in-from-top duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A0E17] border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-bold uppercase tracking-wider text-[#00FF87]">Samzen Navigation Menu</span>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' });
                  setCurrentView('learning');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold"
              >
                <BookOpen className="w-4 h-4" />
                <span>Learning Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setEduTab('courses');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition ${
                  eduTab === 'courses' ? 'border-[#00FF87] bg-[#00FF87]/10 text-[#00FF87]' : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <span>🏛️ Academy Syllabus & Curriculum</span>
              </button>

              <button
                onClick={() => {
                  setEduTab('pamphlets');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition ${
                  eduTab === 'pamphlets' ? 'border-[#00FF87] bg-[#00FF87]/10 text-[#00FF87]' : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <span>📚 Strategy Pamphlets & Notes</span>
              </button>

              <button
                onClick={() => {
                  setEduTab('faq');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition ${
                  eduTab === 'faq' ? 'border-[#00FF87] bg-[#00FF87]/10 text-[#00FF87]' : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <span>💡 Knowledge Base & FAQ</span>
              </button>

              <button
                onClick={() => {
                  setEduTab('about');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition ${
                  eduTab === 'about' ? 'border-[#00FF87] bg-[#00FF87]/10 text-[#00FF87]' : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <span>🛡️ About Samzen & Leadership</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('pricing-checkout');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else setEduTab('gopro');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition ${
                  eduTab === 'gopro' ? 'border-amber-400 bg-amber-500/10 text-amber-300' : 'border-amber-500/40 hover:bg-amber-500/10'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Go Pro Elite Membership Plans</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setIsSettingsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Settings & Theme</span>
              </button>

              <button
                onClick={() => {
                  handleOpenLegal('terms');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Legal & Policy</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. LIVE MARKET MARQUEE STRIP */}
      <div className={`border-b py-2.5 overflow-x-auto scrollbar-none font-mono text-xs transition-colors ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#070B12] border-white/10 text-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-6 whitespace-nowrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-emerald-600' : 'bg-[#00FF87]'}`} />
            <span className={`text-[10px] uppercase font-bold ${isLight ? 'text-emerald-700' : 'text-[#00FF87]'}`}>
              Institutional Synchronizer:
            </span>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            {[
              { sym: 'NIFTY50', name: 'Nifty 50' },
              { sym: 'BANKNIFTY', name: 'Bank Nifty' },
              { sym: 'RELIANCE', name: 'Reliance' },
              { sym: 'TSLA', name: 'Tesla' },
              { sym: 'NVDA', name: 'NVIDIA' },
              { sym: 'BTC/USD', name: 'Bitcoin' },
              { sym: 'ETH/USD', name: 'Ethereum' },
              { sym: 'XAU/USD', name: 'Gold' },
            ].map((t) => {
              const p = marqueePrices[t.sym] || 100;
              return (
                <div key={t.sym} className="flex items-center gap-1.5 shrink-0">
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t.name}:</span>
                  <span className={`font-extrabold ${isLight ? 'text-emerald-600' : 'text-[#00FF87]'}`}>
                    ₹{p.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          <span className={`text-[11px] font-bold shrink-0 hidden md:inline opacity-70`}>
            24/7 Tick Feed Active
          </span>
        </div>
      </div>

      {/* 4. AGGRESSIVE MARKETING & HERO VALUE PROPOSITION SECTION */}
      <section className="relative overflow-hidden py-14 md:py-20 border-b border-white/10">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-3xl pointer-events-none ${
          isLight ? 'bg-emerald-500/10' : 'bg-[#00FF87]/5'
        }`} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono font-bold tracking-wider uppercase ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-[#00FF87]/10 border-[#00FF87]/30 text-[#00FF87]'
          }`}>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>High-Octane Institutional Trading Education</span>
          </div>

          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight max-w-5xl mx-auto leading-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            Stop Donating Capital. <br />
            <span className={isLight ? 'text-emerald-600 italic' : 'text-[#00FF87] italic'}>
              Master the System.
            </span>
          </h1>

          {/* Aggressive Rhyming Hooks */}
          <div className="space-y-2 max-w-2xl mx-auto font-serif italic">
            <p className={`text-xl md:text-2xl font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              "Master the Chart, Before Markets Tear You Apart."
            </p>
            <p className={`text-sm md:text-base font-semibold ${isLight ? 'text-blue-700' : 'text-[#00F0FF]'}`}>
              "Buy the course, master the market — trade with precision, fuel your vision."
            </p>
          </div>

          <p className={`text-xs md:text-sm max-w-2xl mx-auto leading-relaxed font-sans ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            Over <strong>95% of retail traders surrender their hard-earned money</strong> within 90 days due to emotional revenge trading and zero institutional risk mathematics. Samzen TradeLearn replaces guessing with audited Smart Money Concepts, mathematical risk formulas, and battle-tested blueprints.
          </p>

          {/* Education-First Action Buttons (NO TERMINAL AT THE TOP!) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                setCurrentView('learning');
              }}
              className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-2xl flex items-center justify-center gap-3 cursor-pointer ${
                isLight
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/20'
                  : 'bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#00FF87] text-[#0A0E17] shadow-[0_0_35px_rgba(0,255,135,0.5)] hover:scale-105 active:scale-95 ring-4 ring-[#00FF87]/30'
              }`}
            >
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
              <span>Start Learning — Enter Academy</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEduTab('pamphlets');
                window.scrollTo({ top: 750, behavior: 'smooth' });
              }}
              className={`w-full sm:w-auto px-8 py-5 rounded-2xl border font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                  : 'bg-[#121A28] hover:bg-[#1E293B] text-white border-white/15'
              }`}
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>Download Strategy Pamphlets</span>
            </button>
          </div>

          {/* Key Value Proposition Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
            <div className={`border rounded-2xl p-5 space-y-2 shadow-lg transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Smart Money Concepts (SMC)
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Decode institutional liquidity pools, breaker blocks, fair value gaps (FVG), and order flow rather than retail lagging indicators.
              </p>
            </div>

            <div className={`border rounded-2xl p-5 space-y-2 shadow-lg transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">📐</span>
                <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Non-Negotiable 1% Risk Formula
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Mathematical capital sizing ensures you survive streaks of adversity while capturing asymmetric 1:3 and 1:4 risk-to-reward ratios.
              </p>
            </div>

            <div className={`border rounded-2xl p-5 space-y-2 shadow-lg transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Conglomerate Pedigree
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Backed by the visionary Samzen Conglomerate charter, delivering institutional infrastructure to aspiring professional operators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING & CHECKOUT SECTION (MOVED IMMEDIATELY AFTER MAIN VALUE PROPOSITION) */}
      <section id="pricing-checkout" className={`py-14 px-4 sm:px-6 lg:px-8 border-b transition-colors ${
        isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#0E1726]/40 border-white/10'
      }`}>
        <GoProSection
          user={user}
          onUpdateUser={handleUpdateUser}
          displayCurrency={displayCurrency}
          formatCurrency={formatCurrency}
        />
      </section>

      {/* 5. EDUCATION NAVIGATION TABS */}
      <div className={`sticky top-20 z-30 backdrop-blur-md border-b transition-colors ${
        isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0A0E17]/95 border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none font-mono text-xs">
            {[
              { id: 'courses', label: 'Academy Syllabus', icon: BookOpen },
              { id: 'pamphlets', label: 'Strategy Pamphlets', icon: Bookmark },
              { id: 'faq', label: 'Knowledge Base & FAQ', icon: HelpCircle },
              { id: 'about', label: 'About Samzen Conglomerate', icon: ShieldCheck },
              { id: 'quizzes', label: 'Quiz Analytics', icon: Award },
              { id: 'gopro', label: 'Go Pro Tiers', icon: Crown },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = eduTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setEduTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-[#151D2A] text-white border border-[#00FF87]/50 shadow-[0_0_15px_rgba(0,255,135,0.15)]'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-white hover:bg-[#121A28]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. MAIN EDUCATIONAL STAGE BODY */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={eduTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* 1. ACADEMY & COURSES VIEW */}
            {eduTab === 'courses' && (
              <CourseViewer
                user={user}
                onUpdateUser={handleUpdateUser}
                onGoProClick={() => setEduTab('gopro')}
                onSimulateDayForward={() => setSimulatedDays((prev) => prev + 1)}
                simulatedDays={simulatedDays}
                selectedMarket={activeMarket}
                setSelectedMarket={setActiveMarket}
                courses={courses}
                onUpdateCourses={handleUpdateCourses}
              />
            )}

            {/* 2. STRATEGY PAMPHLETS VIEW */}
            {eduTab === 'pamphlets' && (
              <StrategyPamphlets
                isPro={user.proTier !== null}
                onUpgradeClick={() => setIsUpgradeModalOpen(true)}
              />
            )}

            {/* 3. KNOWLEDGE BASE & FAQ VIEW */}
            {eduTab === 'faq' && (
              <TradingFAQ />
            )}

            {/* 4. ABOUT SAMZEN CONGLOMERATE ORIGIN */}
            {eduTab === 'about' && (
              <AboutSamzen
                onLaunchTerminal={() => setCurrentView('terminal')}
                onOpenLegal={() => handleOpenLegal('terms')}
              />
            )}

            {/* 5. QUIZZES VIEW */}
            {eduTab === 'quizzes' && (
              <QuizSection user={user} onUpdateUser={handleUpdateUser} />
            )}

            {/* 6. GO PRO VIEW */}
            {eduTab === 'gopro' && (
              <GoProSection
                user={user}
                onUpdateUser={handleUpdateUser}
                displayCurrency={displayCurrency}
                formatCurrency={formatCurrency}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* 7. SAMZEN INSTITUTIONAL ACADEMY PILLARS */}
        <section className={`border rounded-3xl p-6 sm:p-8 space-y-5 transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
        }`}>
          <div className="flex items-center gap-3 border-b pb-4 border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-lg font-serif font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Samzen Institutional Academy Framework
              </h3>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                The 4 Pillars of Professional Execution & Capital Preservation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono leading-relaxed">
            <div className={`border rounded-2xl p-4 space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
            }`}>
              <span className={`text-[11px] font-bold uppercase block ${isLight ? 'text-emerald-700' : 'text-[#00FF87]'}`}>
                1. Continuous Double Auction & Order Book Mechanics
              </span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Master the central limit order book, bid-ask spreads, and institutional iceberg accumulation. Decode where algorithmic liquidity pools rest rather than reacting to retail lagging indicators.
              </p>
            </div>

            <div className={`border rounded-2xl p-4 space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
            }`}>
              <span className={`text-[11px] font-bold uppercase block ${isLight ? 'text-blue-700' : 'text-[#00F0FF]'}`}>
                2. Non-Negotiable 1% Risk Mathematics
              </span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Calculate exact position size down to the single unit backward from your stop-loss distance. Structure asymmetric 1:2 and 1:3 payoffs to compound capital across all market environments.
              </p>
            </div>

            <div className={`border rounded-2xl p-4 space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
            }`}>
              <span className={`text-[11px] font-bold uppercase block ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                3. Smart Money Concepts (SMC) & Liquidity Sweeps
              </span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Trade where institutions build their positions: Order Blocks, Fair Value Gaps (FVG), Break of Structure (BOS), and false breakout sweep traps (Turtle Soup setups).
              </p>
            </div>

            <div className={`border rounded-2xl p-4 space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
            }`}>
              <span className={`text-[11px] font-bold uppercase block ${isLight ? 'text-amber-700' : 'text-[#FFD700]'}`}>
                4. High-Fidelity Simulation Sandbox
              </span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Develop emotional resilience and muscle memory in our proprietary paper trading terminal powered by real-time tick feeds, multi-timeframe charting, and institutional trade journals.
              </p>
            </div>
          </div>
        </section>

        {/* 8. THE FINAL CALL TO ACTION AT THE ABSOLUTE BOTTOM OF THE HOMEPAGE */}
        <section className={`rounded-3xl border p-8 md:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl transition-colors ${
          isLight 
            ? 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border-slate-200' 
            : 'bg-gradient-to-br from-[#0A0E17] via-[#0E1726] to-[#0A0E17] border-white/15'
        }`}>
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isLight ? 'bg-emerald-500/10' : 'bg-[#00FF87]/10'
          }`} />

          <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider ${
              isLight
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-[#00FF87]/15 text-[#00FF87] border-[#00FF87]/40'
            }`}>
              <Flame className="w-4 h-4 animate-bounce" />
              <span>The Inaugural Samzen Simulation Experience</span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-serif font-black tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Ready to Put Knowledge to the Test?
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Now that you have explored the institutional theory and risk management mathematics, step into our zero-lag, proprietary simulation terminal. Experience live market synchronization with ₹1,00,000 in virtual capital.
            </p>

            {/* THE FINAL CALL TO ACTION BUTTON (PROMINENT GLOWING) */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'instant' });
                  setCurrentView('terminal');
                }}
                className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer ${
                  isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20'
                    : 'bg-gradient-to-r from-[#00FF87] via-[#00F0FF] to-[#00FF87] text-[#0A0E17] shadow-[0_0_40px_rgba(0,255,135,0.6)] ring-4 ring-[#00FF87]/30'
                }`}
              >
                <TrendingUp className="w-5 h-5 stroke-[3]" />
                <span>Launch Trading Terminal</span>
                <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isLight ? 'bg-white' : 'bg-[#0A0E17]'}`} />
              </button>
            </div>

            <div className={`flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] font-mono ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                100% Zero Capital Risk
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Live Real-World Market Sync
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Dedicated Exit Button Included
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* 9. MAIN FOOTER */}
      <footer className={`border-t py-10 px-4 text-xs font-mono transition-colors ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#070B12] border-white/5 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-white/10">
            <div className="space-y-1">
              <span className={`text-sm font-serif font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                SAMZEN TRADELEARN
              </span>
              <p className="text-[11px] opacity-70">Inaugural Flagship Project of the Samzen Conglomerate</p>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px]">
              <button onClick={() => setEduTab('courses')} className="hover:underline">Academy Syllabus</button>
              <button onClick={() => setEduTab('pamphlets')} className="hover:underline">Strategy Pamphlets</button>
              <button onClick={() => setEduTab('faq')} className="hover:underline">Knowledge Base</button>
              <button onClick={() => setEduTab('about')} className="hover:underline">About Samzen</button>
              <button onClick={() => handleOpenLegal('risk')} className="text-rose-500 hover:underline">Risk Policy</button>
              <button onClick={() => handleOpenLegal('terms')} className="text-emerald-500 hover:underline">Terms & Charter</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] opacity-70">
            <span>© 2026 Samzen Conglomerate • All educational rights reserved.</span>
            <span>Educational simulation software. No real funds involved.</span>
          </div>
        </div>
      </footer>

      {/* Upgrade Modal for Gated Downloads */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-auto">
            <GoProSection
              user={user}
              onUpdateUser={handleUpdateUser}
              onClose={() => setIsUpgradeModalOpen(false)}
              displayCurrency={displayCurrency}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
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

      {/* Legal Policies Modal */}
      <LegalPolicies
        initialPolicy={selectedLegalPolicy}
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full">
            <AuthScreen
              onLoginSuccess={handleLoginSuccess}
              initialMode={authMode}
              onBack={() => setIsAuthModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Full Size Logo Modal */}
      {isLogoModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsLogoModalOpen(false)}
        >
          <div className="relative max-w-2xl w-full p-4 flex flex-col items-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <img
              src="/assets/aistudio/Samzen_Neon_Trading_Emblem_c452c366.png"
              alt="Samzen Neon Trading Emblem Full"
              className="w-full max-h-[80vh] rounded-3xl object-contain shadow-[0_0_50px_rgba(0,255,135,0.4)] border-2 border-[#00FF87]/50"
            />
            <div className="text-center space-y-1">
              <h3 className="text-lg font-serif font-bold text-white tracking-tight">Samzen Neon Trading Emblem</h3>
              <p className="text-xs font-mono text-[#00FF87]">Official Insignia of Samzen TradeLearn & Conglomerate</p>
            </div>
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
            >
              Close View
            </button>
          </div>
        </div>
      )}

        <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} theme={theme} />
        {isAboutModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-4xl w-full my-auto bg-[#0A0E17] p-6 rounded-3xl border border-white/10 relative">
              <button onClick={() => setIsAboutModalOpen(false)} className="absolute top-4 right-4 text-white hover:text-rose-400 text-xl font-bold">✕</button>
              <AboutSamzen onLaunchTerminal={() => { setCurrentView('terminal'); setIsAboutModalOpen(false); }} onOpenLegal={() => { handleOpenLegal('risk'); setIsAboutModalOpen(false); }} />
            </div>
          </div>
        )}

        <Footer onOpenAbout={() => setIsAboutModalOpen(true)} onOpenPolicy={() => handleOpenLegal('terms')} />
      </div>
    );
  }
