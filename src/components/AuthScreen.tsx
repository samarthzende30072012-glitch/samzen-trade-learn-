import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  Shield, KeyRound, Lock, CheckCircle2, 
  Eye, EyeOff, AlertCircle, RefreshCw, ArrowRight,
  Sparkles, Check, Smartphone, HelpCircle, 
  User as UserIcon, Zap, Copy, ArrowLeft, ShieldAlert,
  Mail, Phone, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getDeviceFingerprint, 
  isDeviceTrialClaimed, 
  markDeviceTrialClaimed,
  detectDeviceModel
} from '../services/fingerprint';

interface AuthScreenProps {
  onLoginSuccess: (userProfile: UserProfile) => void;
  onAdminTrigger?: () => void;
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
  theme?: 'dark' | 'light';
}

export default function AuthScreen({ 
  onLoginSuccess, 
  onAdminTrigger,
  initialMode = 'login', 
  onBack,
  theme = 'dark' 
}: AuthScreenProps) {
  const isLight = theme === 'light';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Common State
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Device Fingerprint State
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isTrialAlreadyUsed, setIsTrialAlreadyUsed] = useState(false);

  // LOGIN STATE
  // Identifier can be either Username OR 8-digit Access Code OR Secret Code 30072012
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // SIGNUP STEPPER STATE
  // Step 1: Personal Verification (Gmail, Mobile, Device Name) & Username
  // Step 2: Master Password
  // Step 3: 8-Digit Access Code & Device Trial Verification
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [signupGmail, setSignupGmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupDeviceName, setSignupDeviceName] = useState(() => detectDeviceModel());
  const [isEditingDeviceName, setIsEditingDeviceName] = useState(false);

  const [signupUsername, setSignupUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const [signupAccessCode, setSignupAccessCode] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isCodeAvailable, setIsCodeAvailable] = useState<boolean | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const isGmailValid = signupGmail.trim().toLowerCase().endsWith('@gmail.com') && signupGmail.trim().length >= 11;
  const isMobileValid = signupMobile.replace(/\D/g, '').length === 10;

  // Initialize Device Fingerprinting on mount
  useEffect(() => {
    const fpData = getDeviceFingerprint();
    setFingerprint(fpData.hash);
    const claimed = isDeviceTrialClaimed(fpData.hash);
    setIsTrialAlreadyUsed(claimed);
  }, []);

  // Username Availability Debounce
  useEffect(() => {
    if (mode !== 'signup' || signupStep !== 1) return;
    const clean = signupUsername.trim().toLowerCase();
    if (clean.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        setIsUsernameAvailable(data.available);
        if (!data.available) {
          setErrorMsg(data.message || 'Username already taken.');
        } else {
          setErrorMsg('');
        }
      } catch {
        // Fallback check against localStorage
        const existing = localStorage.getItem(`user_profile_${clean}`);
        setIsUsernameAvailable(!existing);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [signupUsername, mode, signupStep]);

  // Code Availability Debounce
  useEffect(() => {
    if (mode !== 'signup' || signupStep !== 3) return;
    const clean = signupAccessCode.trim();
    if (clean.length !== 8) {
      setIsCodeAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingCode(true);
      try {
        const res = await fetch(`/api/auth/check-code?code=${encodeURIComponent(clean)}`);
        const data = await res.json();
        setIsCodeAvailable(data.available);
        if (!data.available) {
          setErrorMsg(data.message || 'Access code is already registered.');
        } else {
          setErrorMsg('');
        }
      } catch {
        setIsCodeAvailable(true);
      } finally {
        setIsCheckingCode(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [signupAccessCode, mode, signupStep]);

  // Generate 8-Digit Access Code (AI/Algorithmic)
  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/generate-code', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.code) {
        setSignupAccessCode(data.code);
        setIsCodeAvailable(true);
      } else {
        // Fallback local random generator
        const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
        setSignupAccessCode(randomCode);
        setIsCodeAvailable(true);
      }
    } catch {
      const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      setSignupAccessCode(randomCode);
      setIsCodeAvailable(true);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setErrorMsg('Please enter your Username or 8-digit Access Code.');
      return;
    }

    // SECRET ADMIN CODE TRIGGER: '30072012'
    if (cleanId === '30072012') {
      if (onAdminTrigger) {
        onAdminTrigger();
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      // Check if secret admin returned from backend
      if (data.success && data.isAdmin) {
        if (onAdminTrigger) {
          onAdminTrigger();
          return;
        }
      }

      if (data.success && data.user) {
        const u = data.user;
        const profile: UserProfile = {
          email: u.email,
          username: u.username,
          accessCode: u.accessCode,
          name: u.username,
          authProvider: 'access_code',
          joinedAt: u.joinedAt || new Date().toISOString(),
          proTier: u.proTier,
          proExpiresAt: u.proExpiresAt,
          paperTradingPassExpiresAt: null,
          demoBalance: u.demoBalance || 1000000,
          progress: ['beg-0', 'beg-1'],
          quizScores: {},
          positions: [],
          holdings: [],
          isTrial: u.isTrial,
          trialExpiresAt: u.trialExpiresAt,
          deviceFingerprint: fingerprint,
          transactionHistory: [
            {
              id: 'init-demo',
              type: 'DEPOSIT',
              amount: 1000000,
              timestamp: new Date().toISOString(),
            },
          ],
        };

        localStorage.setItem('last_logged_in_username', u.username);
        localStorage.setItem(`user_profile_${u.username}`, JSON.stringify(profile));
        localStorage.setItem('samzen_access_key', u.accessCode);

        onLoginSuccess(profile);
      } else {
        setErrorMsg(data.error || 'Invalid credentials or account does not exist.');
      }
    } catch (err: any) {
      // Local fallback lookup
      const saved = localStorage.getItem(`user_profile_${cleanId.toLowerCase()}`);
      if (saved) {
        const profile = JSON.parse(saved);
        onLoginSuccess(profile);
      } else {
        setErrorMsg('Login failed. Please verify your username/code or create a new account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Complete Signup
  const handleCompleteSignup = async () => {
    if (!signupAccessCode || signupAccessCode.length !== 8) {
      setErrorMsg('Please generate or enter a valid 8-digit access code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupUsername.trim().toLowerCase(),
          password: signupPassword,
          accessCode: signupAccessCode.trim(),
          gmailAddress: signupGmail.trim().toLowerCase(),
          email: signupGmail.trim().toLowerCase(),
          mobileNumber: signupMobile.trim(),
          deviceName: signupDeviceName.trim(),
          deviceFingerprint: fingerprint,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        const profile: UserProfile = {
          email: u.email || signupGmail.trim().toLowerCase(),
          username: u.username,
          gmailAddress: u.gmailAddress || signupGmail.trim().toLowerCase(),
          mobileNumber: u.mobileNumber || signupMobile.trim(),
          deviceName: u.deviceName || signupDeviceName.trim(),
          accessCode: u.accessCode,
          name: u.username,
          authProvider: 'access_code',
          joinedAt: u.joinedAt || new Date().toISOString(),
          proTier: u.proTier,
          proExpiresAt: u.proExpiresAt,
          paperTradingPassExpiresAt: null,
          demoBalance: 1000000,
          progress: ['beg-0', 'beg-1'],
          quizScores: {},
          positions: [],
          holdings: [],
          isTrial: u.isTrial,
          trialExpiresAt: u.trialExpiresAt,
          deviceFingerprint: fingerprint,
          transactionHistory: [
            {
              id: 'init-demo',
              type: 'DEPOSIT',
              amount: 1000000,
              timestamp: new Date().toISOString(),
            },
          ],
        };

        // Mark device fingerprint as trial claimed
        if (data.trialGranted) {
          markDeviceTrialClaimed(fingerprint);
        }

        localStorage.setItem('last_logged_in_username', u.username);
        localStorage.setItem(`user_profile_${u.username}`, JSON.stringify(profile));
        localStorage.setItem('samzen_access_key', u.accessCode);

        setSuccessMsg(data.message || 'Account activated successfully!');
        setTimeout(() => {
          onLoginSuccess(profile);
        }, 1000);
      } else {
        setErrorMsg(data.error || 'Failed to complete registration.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto rounded-3xl border shadow-2xl p-6 sm:p-8 backdrop-blur-xl transition-all ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50' 
        : 'bg-[#0E1726]/95 border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]'
    }`}>
      {/* Brand & Header */}
      <div className="space-y-3 text-center mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00FF87] to-[#00F0FF] p-0.5 mx-auto shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-[#0A0E17] rounded-[14px] flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#00FF87]" />
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight">
            Samzen TradeLearn Account
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Institutional Gateway • 8-Digit Access Architecture
          </p>
        </div>

        {/* Tab switch between Login and Register */}
        <div className="flex rounded-xl p-1 bg-black/30 border border-white/10 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer ${
              mode === 'login'
                ? isLight ? 'bg-white text-slate-900 shadow' : 'bg-[#00FF87] text-[#0A0E17] shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Login / Access Code
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setSignupStep(1);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer ${
              mode === 'signup'
                ? isLight ? 'bg-white text-slate-900 shadow' : 'bg-[#00FF87] text-[#0A0E17] shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account & Trial
          </button>
        </div>
      </div>

      {/* ERROR & SUCCESS NOTICES */}
      {errorMsg && (
        <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MODE 1: LOGIN (Supports Username OR 8-Digit Code OR Secret Admin 30072012) */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Username or 8-Digit Access Code:</span>
              <span className="text-[10px] text-slate-500">e.g. rahul_trader or 84920183</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => {
                  setLoginIdentifier(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter Username or 8-Digit Code"
                className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm font-mono tracking-wider focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    : 'bg-[#0A0E17] border-white/20 text-white placeholder-slate-500 focus:border-[#00FF87]'
                }`}
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {loginIdentifier === '30072012' && (
              <span className="text-[11px] font-mono text-amber-400 font-bold block mt-1 animate-pulse">
                ⚡ Secret Executive Admin Passcode Detected
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
              Password:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={loginIdentifier !== '30072012'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Account password"
                className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                    : 'bg-[#0A0E17] border-white/20 text-white placeholder-slate-500 focus:border-[#00FF87]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50 ${
              loginIdentifier === '30072012'
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
                : isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] shadow-emerald-500/25'
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>
              {loginIdentifier === '30072012'
                ? 'Unlock Hidden Admin Dashboard'
                : 'Login with Account / Code'}
            </span>
          </button>
        </form>
      )}

      {/* MODE 2: SIGNUP STEPPER */}
      {mode === 'signup' && (
        <div className="space-y-4">
          {/* Stepper Progress Indicator */}
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 border-b border-white/10 pb-2">
            <span className={signupStep === 1 ? 'text-[#00FF87] font-bold' : ''}>1. Identity & Device</span>
            <span>→</span>
            <span className={signupStep === 2 ? 'text-[#00FF87] font-bold' : ''}>2. Security</span>
            <span>→</span>
            <span className={signupStep === 3 ? 'text-[#00FF87] font-bold' : ''}>3. 8-Digit Code</span>
          </div>

          {/* STEP 1: Enhanced Identity (Gmail, Mobile, Device Fingerprint) & Username */}
          {signupStep === 1 && (
            <div className="space-y-3.5">
              {/* Mandatory Gmail Address */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Valid Gmail Address:</span>
                  </span>
                  {isGmailValid && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Gmail Verified
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={signupGmail}
                    onChange={(e) => setSignupGmail(e.target.value.trim().toLowerCase())}
                    placeholder="student.trader@gmail.com"
                    className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none transition ${
                      isGmailValid
                        ? 'border-emerald-500 bg-emerald-500/5 text-white'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0A0E17] border-white/20 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
                {!isGmailValid && signupGmail.length > 0 && (
                  <span className="text-[10px] font-mono text-amber-400 mt-0.5 block">
                    Must end with @gmail.com for institutional tax invoice delivery.
                  </span>
                )}
              </div>

              {/* Mandatory 10-Digit Mobile Number */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mobile Number:</span>
                  </span>
                  {isMobileValid && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> 10-Digits OK
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <div className={`px-3 py-3 rounded-xl border text-xs font-mono font-bold flex items-center shrink-0 ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#0A0E17] border-white/20 text-slate-300'
                  }`}>
                    <span>🇮🇳 +91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none transition ${
                      isMobileValid
                        ? 'border-emerald-500 bg-emerald-500/5 text-white'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0A0E17] border-white/20 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Mobile Device Name for Fingerprinting */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Device Model (Fingerprinting):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingDeviceName(!isEditingDeviceName)}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> {isEditingDeviceName ? 'Lock' : 'Edit'}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!isEditingDeviceName}
                    value={signupDeviceName}
                    onChange={(e) => setSignupDeviceName(e.target.value)}
                    placeholder="e.g. Apple iPhone 15 Pro, OnePlus 12"
                    className={`w-full p-3 rounded-xl border text-xs font-mono transition ${
                      isEditingDeviceName
                        ? 'bg-[#0A0E17] border-indigo-500 text-white'
                        : isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-[#070B12] border-white/10 text-slate-300'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                  Auto-detected hardware signature locked to 2-Day Trial & Billing QR.
                </span>
              </div>

              {/* Create Unique Username */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Create Username:</span>
                  </span>
                  {isCheckingUsername && (
                    <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
                    </span>
                  )}
                  {isUsernameAvailable === true && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Available
                    </span>
                  )}
                  {isUsernameAvailable === false && (
                    <span className="text-[10px] text-rose-400 font-bold">Taken</span>
                  )}
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="e.g. rahul_trader"
                    className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none transition ${
                      isUsernameAvailable === true
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : isUsernameAvailable === false
                        ? 'border-rose-500 bg-rose-500/5'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0A0E17] border-white/20 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!isGmailValid || !isMobileValid || !signupUsername || signupUsername.length < 3 || isUsernameAvailable === false}
                onClick={() => {
                  setErrorMsg('');
                  setSignupStep(2);
                }}
                className={`w-full py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 ${
                  isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17] shadow-lg shadow-emerald-500/20'
                }`}
              >
                <span>Continue to Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Choose Password */}
          {signupStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Create Master Password:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-white/20 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Confirm Password:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-white/20 text-white'
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-mono text-xs cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!signupPassword || signupPassword.length < 6 || signupPassword !== signupConfirmPassword}
                  onClick={() => {
                    setErrorMsg('');
                    handleGenerateCode();
                    setSignupStep(3);
                  }}
                  className={`flex-1 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 ${
                    isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17] shadow-lg'
                  }`}
                >
                  <span>Continue to 8-Digit Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 8-Digit Access Code & Device Trial Verification */}
          {signupStep === 3 && (
            <div className="space-y-4">
              {/* Device 2-Day Trial Notice */}
              <div className={`p-3.5 rounded-2xl border text-xs font-mono ${
                isTrialAlreadyUsed
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>
                    {isTrialAlreadyUsed
                      ? 'Device Fingerprint Status: Trial Expired'
                      : 'Device Fingerprint Status: 2-Day Free Trial Available'}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed font-sans">
                  {isTrialAlreadyUsed
                    ? 'This physical device has already consumed the ₹0 / 2-Day Free Trial. Direct Pro subscription will be required.'
                    : 'Congratulations! This device is verified and eligible for an instant ₹0 / 2-Day Free Trial with full terminal access.'}
                </p>
              </div>

              {/* 8-Digit Code Input & AI Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Your 8-Digit Unique Access Code:
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    className="text-[11px] font-mono text-[#00FF87] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{isGeneratingCode ? 'Generating...' : 'AI Generate Code'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={8}
                    value={signupAccessCode}
                    onChange={(e) => {
                      setSignupAccessCode(e.target.value.replace(/\D/g, ''));
                      setErrorMsg('');
                    }}
                    placeholder="e.g. 84920183"
                    className={`w-full p-4 rounded-xl border text-center text-lg sm:text-xl font-mono font-bold tracking-[0.35em] focus:outline-none transition ${
                      isCodeAvailable === true
                        ? 'border-emerald-500 bg-emerald-500/5 text-[#00FF87]'
                        : isCodeAvailable === false
                        ? 'border-rose-500 bg-rose-500/5 text-rose-400'
                        : isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#0A0E17] border-white/20 text-white'
                    }`}
                  />
                  <Zap className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <span className="text-[10px] font-mono text-slate-400 mt-1 block text-center">
                  You can use either your Username (<strong className="text-white">{signupUsername}</strong>) or this 8-digit code to log in anytime.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSignupStep(2)}
                  className="px-4 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-mono text-xs cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || signupAccessCode.length !== 8 || isCodeAvailable === false}
                  onClick={handleCompleteSignup}
                  className={`flex-1 py-4 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 ${
                    isLight ? 'bg-emerald-600 text-white' : 'bg-[#00FF87] text-[#0A0E17] shadow-xl shadow-emerald-500/25'
                  }`}
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isTrialAlreadyUsed
                      ? 'Complete & Continue'
                      : 'Activate ₹0 Free Trial'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
