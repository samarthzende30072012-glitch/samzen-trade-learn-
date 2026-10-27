import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ProTier } from '../types';
import { 
  User, Crown, ShieldAlert, Sparkles, Send, HelpCircle, 
  MessageSquare, Lightbulb, Wallet, RefreshCw, Landmark, ArrowRight,
  Globe, CheckCircle, MessageCircle, Bug, LogOut, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccountManagerProps {
  user: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => void;
  displayCurrency?: 'INR' | 'USD' | 'EUR';
  onChangeCurrency?: (currency: 'INR' | 'USD' | 'EUR') => void;
  onLogOut?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AccountManager({ 
  user, 
  onUpdateUser, 
  displayCurrency, 
  onChangeCurrency,
  onLogOut
}: AccountManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'support'>('profile');
  
  // Balance modifier state
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [balanceAction, setBalanceAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [balanceMessage, setBalanceMessage] = useState<string | null>(null);

  // AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`chat_history_${user.email}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Welcome to the Premium Support Terminal! 👋\n\nI am your **Pro Coach** (by AAP), trading advisor and feedback agent. Ask me anything about:\n• Technical indicators (RSI, Fib, SMA, EMA, BB)\n• Paper trading controls & rules\n• Platform feature suggestions or bug feedback\n\nHow can I help you sharpen your edge today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputText, setInputText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(`chat_history_${user.email}`, JSON.stringify(chatMessages));
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleUpdateTier = (tier: ProTier | null) => {
    const updated: UserProfile = {
      ...user,
      proTier: tier,
      proExpiresAt: tier ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
    };
    onUpdateUser(updated);
  };

  const handleBalanceModify = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(balanceInput);
    if (isNaN(amount) || amount <= 0) {
      setBalanceMessage("Please enter a valid numeric amount.");
      return;
    }

    let newBalance = user.demoBalance;
    if (balanceAction === 'deposit') {
      newBalance += amount;
      setBalanceMessage(`Successfully deposited ₹${amount.toLocaleString()} into your paper trading sandbox!`);
    } else {
      if (newBalance < amount) {
        setBalanceMessage("Insufficient paper trading balance to perform this withdrawal.");
        return;
      }
      newBalance -= amount;
      setBalanceMessage(`Successfully simulated withdrawal of ₹${amount.toLocaleString()} from sandbox!`);
    }

    const updated: UserProfile = {
      ...user,
      demoBalance: newBalance,
      transactionHistory: [
        {
          id: `manual-mod-${Date.now()}`,
          type: 'DEPOSIT',
          amount: balanceAction === 'deposit' ? amount : -amount,
          timestamp: new Date().toISOString()
        },
        ...user.transactionHistory
      ]
    };
    onUpdateUser(updated);
    setBalanceInput('');
    setTimeout(() => setBalanceMessage(null), 4000);
  };

  const handleSendAiMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userProfile: {
            name: user.email.split('@')[0],
            email: user.email,
            proTier: user.proTier || 'Free',
            demoBalance: user.demoBalance
          }
        })
      });

      const data = await response.json();
      const aiReplyText = data.reply || "Sorry, I had trouble parsing the network. Can you please restate your query?";
      
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("[AI Help Fetch Error]", err);
      const aiMsg: ChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        sender: 'ai',
        text: "It looks like the system is offline. Please rest assured your constructive feedback has been cached locally in this browser sandbox!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearChatHistory = () => {
    const welcome = [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Welcome back! Ask me anything about trading indicators, how to buy/sell, or submit feedback and platform suggestions below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setChatMessages(welcome);
    localStorage.removeItem(`chat_history_${user.email}`);
  };

  const presetPrompts = [
    { label: "📊 Bollinger & RSI Strategy", text: "Please explain a classic trading strategy using Bollinger Bands paired with RSI." },
    { label: "🛠️ Fibonacci Guide", text: "How do I draw and trade using Fibonacci retracement levels in this paper trading sandbox?" },
    { label: "💡 Feature Suggestion", text: "I have a suggestion for the platform: I would love to see a real-time price alarm feature!" },
    { label: "🐞 Report Simulator Issue", text: "Feedback: I noticed a minor issue with the chart grid lines spacing on small viewports." }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Header Selector */}
      <div className="flex bg-[#151D2A] p-1 border border-black/10 rounded-xl max-w-md">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'profile' ? 'bg-[#0F172A] text-white shadow' : 'text-slate-300 hover:text-white'}`}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Profile & Settings</span>
        </button>
        <button
          onClick={() => setActiveSubTab('support')}
          className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'support' ? 'bg-[#0F172A] text-white shadow' : 'text-slate-300 hover:text-white'}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#05D59E]" />
          <span>AI Coach & Feedback</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Details (Left Panel) */}
        <div className={`lg:col-span-4 space-y-6`}>
          
          {/* User Profile Summary Card */}
          <div className="bg-[#0E1726] border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-black bg-[#05D59E]/10 flex items-center justify-center text-xl font-bold font-mono text-white">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-white truncate w-48">{user.email}</h3>
                <span className="text-[10px] font-mono text-slate-400 block">Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="border-t border-black/5 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Mobile Number:</span>
                <span className="font-bold text-white">{user.phoneNumber || "Not Verified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Learning Track:</span>
                <span className="font-bold text-white capitalize">{user.interest || "Stocks"} Segment</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Knowledge Level:</span>
                <span className="font-bold text-[#05D59E] uppercase font-mono tracking-wider text-[10px]">{user.knowledgeLevel || "Beginner"}</span>
              </div>
            </div>
          </div>

          {/* Subscription & Account Status */}
          <div className="bg-[#0E1726] border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(5,213,158,1)] space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Membership Status</h4>
              {user.proTier ? (
                <span className="bg-[#05D59E] text-white border border-black font-mono font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <Crown className="w-2.5 h-2.5" /> PRO STUDENT
                </span>
              ) : (
                <span className="bg-[#151D2A] text-slate-300 border border-black/10 font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold">
                  FREE ACCESS
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {user.proTier 
                  ? "Congratulations! You have complete lifetime access to all 108 Advanced Masterclass topics, customized quizzes, high-frequency audio engines, and unlimited paper trading."
                  : "Upgrade to premium to bypass learning locks, access advanced technical notes, and unlock specialized indicators like Heikin Ashi."
                }
              </p>

              <div className="pt-2 flex flex-col gap-2">
                {user.proTier ? (
                  <button
                    onClick={() => handleUpdateTier(null)}
                    className="w-full text-center bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs py-2.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition"
                  >
                    📉 Downgrade to Free Mode
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateTier('lifetime')}
                    className="w-full text-center bg-[#05D59E] hover:bg-[#05D59E]/80 text-white font-mono font-black text-xs py-2.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Instantly Unlock PRO Mode</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Session & Security Card */}
          <div className="bg-[#0E1726] border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Session & Security</h4>
              </div>
              <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Active Session
              </span>
            </div>

            <div className="text-xs space-y-2 text-slate-700 font-sans border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono text-[11px]">Provider:</span>
                <span className="font-bold text-[11px] font-mono capitalize text-white">
                  {user.authProvider === 'google' ? 'Google Account' : user.authProvider === 'email_otp' ? 'Gmail OTP' : 'Direct Account'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono text-[11px]">Signed In As:</span>
                <span className="font-mono text-[11px] font-bold text-slate-900 truncate max-w-[170px]" title={user.email}>
                  {user.email}
                </span>
              </div>
            </div>

            {onLogOut && (
              <button
                type="button"
                onClick={onLogOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono font-bold text-xs rounded-xl border border-rose-300 transition active:translate-y-0.5 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Main interactive cards (Right Panel) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeSubTab === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Locale Currency Configurator */}
                <div className="bg-[#0E1726] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-white">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-black text-white">Sandbox Display Currency</h4>
                      <p className="text-xs text-slate-400">Change visual currency denomination in simulator</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { code: 'INR', symbol: '₹ (INR)', desc: 'Indian Rupee' },
                      { code: 'USD', symbol: '$ (USD)', desc: 'US Dollar' },
                      { code: 'EUR', symbol: '€ (EUR)', desc: 'Euro currency' }
                    ].map((cur) => (
                      <button
                        key={cur.code}
                        onClick={() => onChangeCurrency(cur.code as 'INR' | 'USD' | 'EUR')}
                        className={`p-3 border-2 rounded-xl text-center transition-all ${displayCurrency === cur.code ? 'border-indigo-600 bg-indigo-50/40 shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]' : 'border-[#E2E8F0] hover:bg-slate-50'}`}
                      >
                        <span className="block text-xs font-bold text-white font-mono">{cur.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mt-0.5">{cur.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sandbox Capital Simulator Controls */}
                <div className="bg-[#0E1726] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-black text-white">Sandbox Capital Controller</h4>
                      <p className="text-xs text-slate-400">Simulate rapid capital injection in real-time</p>
                    </div>
                  </div>

                  <form onSubmit={handleBalanceModify} className="space-y-4">
                    <div className="text-[10px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Action Mode:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">📥 Deposit Capital</span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">₹ (INR)</span>
                        <input
                          type="number"
                          placeholder="Enter simulation amount (e.g., 50000)"
                          value={balanceInput}
                          onChange={(e) => setBalanceInput(e.target.value)}
                          className="w-full bg-[#0E1726] border-2 border-black rounded-xl pl-16 pr-3 py-2 text-xs focus:outline-none focus:border-[#05D59E] font-mono text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-mono font-black text-xs px-5 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 transition"
                      >
                        Add Capital
                      </button>
                    </div>

                    {balanceMessage && (
                      <p className="text-[11px] font-bold font-mono text-emerald-800 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{balanceMessage}</span>
                      </p>
                    )}
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="support"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.15 }}
                className="bg-[#0E1726] border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex flex-col h-[520px]"
              >
                {/* Chat Header */}
                <div className="bg-[#0F172A] text-white px-4 py-3 flex justify-between items-center border-b-4 border-black">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#05D59E] animate-pulse" />
                    <div>
                      <h4 className="text-xs font-mono font-black text-[#05D59E] tracking-widest uppercase">
                        🤖 PRO COACH BY AAP • ADVISOR & FEEDBACK
                      </h4>
                      <span className="text-[9px] text-white/50 font-mono uppercase">Powered by Pro Coach (by AAP)</span>
                    </div>
                  </div>
                  <button
                    onClick={clearChatHistory}
                    className="text-[9px] font-mono bg-[#0E1726]/10 hover:bg-[#0E1726]/20 px-2 py-1 rounded text-white border border-white/10"
                  >
                    Clear History
                  </button>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          {msg.sender === 'user' ? 'Student' : 'Pro Coach'}
                        </span>
                        <span className="text-[9px] font-mono text-white/30">•</span>
                        <span className="text-[9px] font-mono text-white/30">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap border shadow-sm ${msg.sender === 'user' ? 'bg-[#0F172A] text-white border-black rounded-tr-none' : 'bg-[#0E1726] text-slate-800 border-white/10 rounded-tl-none'}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-mono text-[#05D59E] font-black uppercase tracking-wider animate-pulse">AI Agent is thinking...</span>
                      </div>
                      <div className="bg-[#0E1726] text-slate-800 border border-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#05D59E] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[#05D59E] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[#05D59E] rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[10px] text-slate-400 font-mono">Analyzing syllabus context</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Preset Suggestions Area */}
                <div className="p-2 bg-slate-100 border-t border-black/10 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                  {presetPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendAiMessage(p.text)}
                      className="px-2.5 py-1 bg-[#0E1726] hover:bg-slate-200 border border-black/10 rounded-full text-[10px] font-bold text-slate-700 whitespace-nowrap font-mono transition shadow-sm"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Message Input Box */}
                <div className="p-3 border-t-2 border-black bg-[#0E1726] shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message or share feedback (e.g. suggest a new feature)..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage(inputText)}
                      className="flex-grow bg-slate-50 border-2 border-black rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#05D59E] font-sans text-white"
                    />
                    <button
                      onClick={() => handleSendAiMessage(inputText)}
                      disabled={!inputText.trim() || isAiLoading}
                      className="bg-[#05D59E] text-white p-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#05D59E]/80 active:translate-y-0.5 transition flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Feedback log disclaimer to address specific user prompt logic */}
                  <div className="mt-2 text-[9px] text-slate-400 font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-[#05D59E]" />
                    <span>Suggestions and feedback are logged securely inside our product team's review system.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
