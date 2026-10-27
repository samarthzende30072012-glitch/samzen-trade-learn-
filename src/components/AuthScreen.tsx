import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { 
  Shield, KeyRound, Mail, Lock, CheckCircle2, 
  Eye, EyeOff, AlertCircle, RefreshCw, ArrowRight,
  Sparkles, Check, Globe, Smartphone, HelpCircle, 
  ChevronDown, ExternalLink, User as UserIcon,
  Zap, Copy, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithGoogle, 
  syncUserProfileToFirestore, 
  loadUserProfileFromFirestore,
  setupPhoneRecaptcha,
  clearPhoneRecaptcha,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  formatE164PhoneNumber,
  validatePhoneNumber,
  getFirebaseErrorMessage,
  FormattedFirebaseError
} from '../services/firebase';
import { ConfirmationResult } from 'firebase/auth';

interface AuthScreenProps {
  onLoginSuccess: (userProfile: UserProfile) => void;
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: '🇮🇳 India (+91)' },
  { code: '+1', country: 'US', label: '🇺🇸 USA / Canada (+1)' },
  { code: '+44', country: 'GB', label: '🇬🇧 UK (+44)' },
  { code: '+971', country: 'AE', label: '🇦🇪 UAE (+971)' },
  { code: '+61', country: 'AU', label: '🇦🇺 Australia (+61)' },
  { code: '+65', country: 'SG', label: '🇸🇬 Singapore (+65)' },
  { code: '+49', country: 'DE', label: '🇩🇪 Germany (+49)' },
  { code: '+966', country: 'SA', label: '🇸🇦 Saudi Arabia (+966)' },
  { code: '+33', country: 'FR', label: '🇫🇷 France (+33)' },
  { code: '+81', country: 'JP', label: '🇯🇵 Japan (+81)' },
];

// Reusable 6-Box High-Fidelity OTP Input
interface OtpBoxesProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

function OtpBoxes({ value, onChange, onComplete, disabled }: OtpBoxesProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (combined.length === 6 && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      onChange(pasteData);
      const targetIndex = Math.min(pasteData.length, 5);
      inputsRef.current[targetIndex]?.focus();
      if (pasteData.length === 6 && onComplete) {
        onComplete(pasteData);
      }
    }
  };

  return (
    <div className="flex justify-between items-center gap-2 max-w-sm mx-auto">
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d*"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-12 h-14 text-center font-mono font-black text-2xl rounded-xl border-2 transition-all outline-none ${
              isFilled 
                ? 'border-[#05D59E] bg-[#05D59E]/5 text-white shadow-[2px_2px_0px_0px_rgba(5,213,158,1)]' 
                : 'border-white/15/30 bg-[#0E1726] text-white focus:border-white/15 focus:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
            } disabled:opacity-50 disabled:bg-[#1E293B]`}
          />
        );
      })}
    </div>
  );
}

export default function AuthScreen({ onLoginSuccess, initialMode, onBack }: AuthScreenProps) {
  // Navigation tabs
  const [authMode, setAuthMode] = useState<'phone' | 'email' | 'password'>('phone');
  
  // Password Mode: Sub-toggle (Sign in vs Register)
  const [passwordSubMode, setPasswordSubMode] = useState<'signin' | 'register'>(
    initialMode === 'signup' ? 'register' : 'signin'
  );

  // --- Phone OTP Flow States (Firebase Authentication) ---
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [enteredPhoneOtp, setEnteredPhoneOtp] = useState('');
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneError, setPhoneError] = useState<FormattedFirebaseError | null>(null);
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // --- Email OTP Flow States ---
  const [email, setEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [enteredEmailOtp, setEnteredEmailOtp] = useState('');
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  // --- Password Login / Register States ---
  const [regName, setRegName] = useState('');
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');

  // --- Google Sign-in States ---
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  // Phone countdown timer
  useEffect(() => {
    let timer: any;
    if (phoneCountdown > 0) {
      timer = setInterval(() => {
        setPhoneCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phoneCountdown]);

  // Email countdown timer
  useEffect(() => {
    let timer: any;
    if (emailCountdown > 0) {
      timer = setInterval(() => {
        setEmailCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailCountdown]);

  // Clean up reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      clearPhoneRecaptcha();
    };
  }, []);

  // Helper to build or retrieve user profile
  const getOrCreateProfile = (
    userIdentifier: string, 
    authProvider: 'google' | 'email_otp' | 'phone_otp' | 'password',
    userName?: string
  ): UserProfile => {
    const cleanId = userIdentifier.trim().toLowerCase();
    const existingStr = localStorage.getItem(`user_profile_${cleanId}`);
    if (existingStr) {
      try {
        const parsed = JSON.parse(existingStr);
        return {
          ...parsed,
          authProvider: authProvider || parsed.authProvider
        };
      } catch (e) {
        // ignore fallback
      }
    }

    return {
      email: cleanId.includes('@') ? cleanId : `${cleanId.replace(/[^0-9]/g, '')}@student.samzentradingcourse.com`,
      name: userName || (cleanId.includes('@') ? cleanId.split('@')[0] : `Trader ${cleanId.slice(-4)}`),
      authProvider,
      phoneNumber: cleanId.startsWith('+') ? cleanId : undefined,
      joinedAt: new Date().toISOString(),
      proTier: null,
      proExpiresAt: null,
      paperTradingPassExpiresAt: null,
      demoBalance: 50000, // Initial sandbox balance: ₹50,000
      progress: [],
      quizScores: {},
      positions: [],
      holdings: [],
      transactionHistory: [
        {
          id: `init-${Date.now()}`,
          type: 'DEPOSIT',
          amount: 50000,
          timestamp: new Date().toISOString()
        }
      ]
    };
  };

  // --- FIREBASE PHONE OTP: Step 1: Send SMS OTP ---
  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneError(null);
    setPhoneSuccessMsg('');

    const formattedE164 = formatE164PhoneNumber(phoneNumber, phoneCountryCode);
    const validation = validatePhoneNumber(formattedE164);
    if (!validation.isValid) {
      setPhoneError({
        title: 'Invalid Phone Number',
        message: validation.error || 'Please enter a valid phone number with country code.',
        code: 'auth/invalid-phone-number',
        isConfigIssue: false
      });
      return;
    }

    setIsSendingPhoneOtp(true);

    try {
      // Setup invisible reCAPTCHA verifier mounted on #recaptcha-container
      const verifier = setupPhoneRecaptcha('recaptcha-container', 'invisible');
      const confirmation = await sendFirebasePhoneOtp(formattedE164, verifier);
      
      setPhoneConfirmationResult(confirmation);
      setPhoneOtpSent(true);
      setPhoneCountdown(60);
      setPhoneSuccessMsg(`Verification code sent via SMS to ${formattedE164}.`);
    } catch (err: any) {
      console.error('[Firebase Phone Auth] Send OTP error:', err);
      const formattedErr = getFirebaseErrorMessage(err);
      setPhoneError(formattedErr);
      if (formattedErr.isConfigIssue) {
        setShowConfigGuide(true);
      }
      clearPhoneRecaptcha();
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // --- FIREBASE PHONE OTP: Step 2: Verify SMS OTP ---
  const handleVerifyPhoneOtp = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || enteredPhoneOtp).trim();
    setPhoneError(null);

    if (!targetCode || targetCode.length < 6) {
      setPhoneError({
        title: 'Incomplete Verification Code',
        message: 'Please enter the complete 6-digit verification code sent to your mobile phone.',
        code: 'auth/invalid-verification-code',
        isConfigIssue: false
      });
      return;
    }

    if (!phoneConfirmationResult) {
      setPhoneError({
        title: 'Session Expired',
        message: 'The verification session expired. Please request a new OTP code.',
        code: 'auth/session-expired',
        isConfigIssue: false
      });
      return;
    }

    setIsVerifyingPhoneOtp(true);

    try {
      const user = await verifyFirebasePhoneOtp(phoneConfirmationResult, targetCode);
      const verifiedPhone = user.phoneNumber || formatE164PhoneNumber(phoneNumber, phoneCountryCode);
      const emailIdentifier = `${verifiedPhone.replace(/[^0-9]/g, '')}@student.samzentradingcourse.com`;
      
      let profile = getOrCreateProfile(
        emailIdentifier,
        'phone_otp',
        `Trader (${verifiedPhone.slice(-4)})`
      );
      profile.phoneNumber = verifiedPhone;

      // Sync user profile to Cloud Firestore
      const remote = await loadUserProfileFromFirestore(user.uid);
      if (remote) {
        profile = { ...profile, ...remote, phoneNumber: verifiedPhone };
      } else {
        await syncUserProfileToFirestore(user.uid, profile);
      }

      localStorage.setItem(`user_profile_${profile.email}`, JSON.stringify(profile));
      localStorage.setItem('last_logged_in_email', profile.email);
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error('[Firebase Phone Auth] Verify OTP error:', err);
      const formattedErr = getFirebaseErrorMessage(err);
      setPhoneError(formattedErr);
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  // Autofill test credentials for quick evaluation
  const handleAutofillTestPhone = () => {
    setPhoneCountryCode('+91');
    setPhoneNumber('9999999999');
    setPhoneError(null);
  };

  // --- GOOGLE SIGN IN (REAL FIREBASE AUTH) ---
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleNotice(null);
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        const googleEmail = result.user.email || '';
        const googleName = result.user.displayName || googleEmail.split('@')[0];
        let profile = getOrCreateProfile(googleEmail, 'google', googleName);
        const remote = await loadUserProfileFromFirestore(result.user.uid);
        if (remote) {
          profile = { ...profile, ...remote };
        } else {
          await syncUserProfileToFirestore(result.user.uid, profile);
        }
        localStorage.setItem(`user_profile_${profile.email}`, JSON.stringify(profile));
        localStorage.setItem('last_logged_in_email', profile.email);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.warn('[Firebase Google Auth] Status:', err?.code, err?.message);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setGoogleNotice('Google authentication popup was blocked by your browser. You can allow popups, or use Phone OTP / Gmail OTP below.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setGoogleNotice('Google sign-in popup was closed before completion. Please try again or select Phone OTP.');
      } else {
        const formatted = getFirebaseErrorMessage(err);
        setGoogleNotice(`${formatted.title}: ${formatted.message}`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // --- EMAIL OTP FLOW ---
  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setEmailErrorMsg('Please enter a valid Gmail / Email address.');
      return;
    }

    setEmailErrorMsg('');
    setIsSendingEmailOtp(true);
    setEmailSuccessMessage('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmailOtpSent(true);
        setEmailCountdown(60);
        setEmailSuccessMessage(
          `Verification code dispatched to ${email.trim()}. Please check your Gmail inbox and Spam folder.`
        );
      } else {
        setEmailErrorMsg(data.error || 'Failed to dispatch email OTP.');
      }
    } catch (err: any) {
      console.error('Send Email OTP error:', err);
      setEmailErrorMsg('Network error while requesting verification code. Please check your connection.');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || enteredEmailOtp).trim();
    if (!targetCode || targetCode.length < 6) {
      setEmailErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setEmailErrorMsg('');
    setIsVerifyingEmailOtp(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: targetCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const profile = getOrCreateProfile(email, 'email_otp');
        await syncUserProfileToFirestore(profile.email, profile);
        localStorage.setItem(`user_profile_${profile.email}`, JSON.stringify(profile));
        localStorage.setItem('last_logged_in_email', profile.email);
        onLoginSuccess(profile);
      } else {
        setEmailErrorMsg(data.error || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      console.error('Verify Email OTP error:', err);
      setEmailErrorMsg('Verification error occurred. Please try again.');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  // --- PASSWORD LOGIN & REGISTER ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    const cleanEmail = passwordEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setPasswordErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setPasswordErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (passwordSubMode === 'register') {
      if (password !== confirmPassword) {
        setPasswordErrorMsg('Passwords do not match. Please re-enter.');
        return;
      }
      
      const existingUser = localStorage.getItem(`user_profile_${cleanEmail}`);
      if (existingUser) {
        setPasswordErrorMsg('An account with this email already exists. Please sign in instead.');
        return;
      }

      const profile = getOrCreateProfile(cleanEmail, 'password', regName.trim() || undefined);
      localStorage.setItem(`user_pass_${cleanEmail}`, password);
      localStorage.setItem(`user_profile_${cleanEmail}`, JSON.stringify(profile));
      localStorage.setItem('last_logged_in_email', profile.email);
      await syncUserProfileToFirestore(profile.email, profile);
      onLoginSuccess(profile);
    } else {
      // Sign in mode
      const savedPass = localStorage.getItem(`user_pass_${cleanEmail}`);
      const savedProfileStr = localStorage.getItem(`user_profile_${cleanEmail}`);

      if (savedPass && savedProfileStr) {
        if (savedPass === password) {
          const profile = JSON.parse(savedProfileStr);
          await syncUserProfileToFirestore(profile.email, profile);
          localStorage.setItem('last_logged_in_email', profile.email);
          onLoginSuccess(profile);
        } else {
          setPasswordErrorMsg('Incorrect password. You can also sign in via Phone OTP or Gmail OTP.');
        }
      } else {
        // First-time automatic setup
        const profile = getOrCreateProfile(cleanEmail, 'password');
        localStorage.setItem(`user_pass_${cleanEmail}`, password);
        localStorage.setItem(`user_profile_${cleanEmail}`, JSON.stringify(profile));
        localStorage.setItem('last_logged_in_email', profile.email);
        await syncUserProfileToFirestore(profile.email, profile);
        onLoginSuccess(profile);
      }
    }
  };

  // --- INSTANT DEMO SCHOLAR ACCESS ---
  const handleDemoScholarLogin = () => {
    const demoEmail = 'guest.scholar@samzentradingcourse.com';
    const profile: UserProfile = {
      email: demoEmail,
      name: 'Guest Scholar',
      authProvider: 'password',
      joinedAt: new Date().toISOString(),
      proTier: null,
      proExpiresAt: null,
      paperTradingPassExpiresAt: null,
      demoBalance: 50000,
      progress: [],
      quizScores: {},
      positions: [],
      holdings: [],
      transactionHistory: [
        {
          id: `demo-${Date.now()}`,
          type: 'DEPOSIT',
          amount: 50000,
          timestamp: new Date().toISOString()
        }
      ]
    };
    localStorage.setItem(`user_profile_${demoEmail}`, JSON.stringify(profile));
    localStorage.setItem('last_logged_in_email', demoEmail);
    onLoginSuccess(profile);
  };

  return (
    <div className="max-w-md w-full mx-auto relative py-6">
      
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container" className="flex justify-center" />

      {/* Main Authentication Card */}
      <div className="bg-[#0E1726] border-2 border-white/15 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        <div className="p-1 bg-[#05D59E]" />
        
        <div className="p-6 sm:p-8 space-y-6">
          {onBack && (
            <button
              onClick={onBack}
              className="group inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#05D59E]" />
              Back to Course Overview
            </button>
          )}

          {/* Logo & Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#151D2A] border-2 border-white/15 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-white mb-1">
              <Shield className="w-6 h-6 text-[#05D59E]" />
            </div>
            <h1 className="text-2xl font-serif italic font-black text-white tracking-tight">
              SZTrade Learn
            </h1>
            <p className="text-[10px] font-mono font-bold text-[#05D59E] uppercase tracking-widest">
              SAMZEN Trading Course • A Project by SAMZEN
            </p>
          </div>

          {/* 1-CLICK SIGN IN WITH GOOGLE */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#0E1726] hover:bg-[#151D2A] text-white py-3.5 px-4 rounded-xl border-2 border-white/15 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-mono font-bold text-xs disabled:opacity-60 cursor-pointer active:translate-y-0.5"
            >
              {isGoogleLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>CONNECTING GOOGLE ACCOUNT...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>CONTINUE WITH GOOGLE ACCOUNT</span>
                </>
              )}
            </button>

            {/* Google Notice Alert (if popup was blocked or closed) */}
            {googleNotice && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span>{googleNotice}</span>
                </div>
              </motion.div>
            )}

            {/* Visual Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-white/15/15 w-full" />
              <span className="bg-[#0E1726] px-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest absolute">
                OR AUTHENTICATE WITH
              </span>
            </div>
          </div>

          {/* Authentication Mode Switcher Tabs */}
          <div className="grid grid-cols-3 bg-[#151D2A] p-1 border border-white/15/15 rounded-xl text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode('phone');
                setPhoneError(null);
              }}
              className={`py-2 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'phone' 
                  ? 'bg-[#0F172A] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#05D59E]" />
              <span>PHONE SMS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setEmailErrorMsg('');
              }}
              className={`py-2 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'email' 
                  ? 'bg-[#0F172A] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#05D59E]" />
              <span>GMAIL OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setPasswordErrorMsg('');
              }}
              className={`py-2 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'password' 
                  ? 'bg-[#0F172A] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#05D59E]" />
              <span>PASSWORD</span>
            </button>
          </div>

          {/* ========================================================== */}
          {/* TAB 1: FIREBASE PHONE OTP */}
          {/* ========================================================== */}
          {authMode === 'phone' && (
            <div className="space-y-4">
              
              {/* Phone Error Alert */}
              {phoneError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-3.5 rounded-xl text-xs space-y-1.5 shadow-sm"
                >
                  <div className="flex items-start gap-2 font-bold text-rose-950">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="flex-1">
                      <span>{phoneError.title}</span>
                      <p className="font-normal font-sans text-rose-800 text-[11px] mt-0.5 leading-relaxed">
                        {phoneError.message}
                      </p>
                    </div>
                  </div>

                  {phoneError.code && (
                    <div className="pt-1.5 border-t border-rose-200 flex justify-between items-center text-[10px] font-mono text-rose-700">
                      <span>Code: <code className="font-bold">{phoneError.code}</code></span>
                      {phoneError.isConfigIssue && (
                        <button
                          type="button"
                          onClick={() => setShowConfigGuide(!showConfigGuide)}
                          className="underline font-bold text-rose-900 hover:text-white flex items-center gap-0.5"
                        >
                          {showConfigGuide ? 'Hide Setup Guide' : 'View Setup Guide'}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Collapsible Firebase Console Configuration Guide */}
              {showConfigGuide && (
                <div className="bg-[#151D2A] border border-white/15 rounded-xl p-3 text-xs space-y-2 text-white">
                  <div className="flex items-center justify-between font-bold text-[11px] font-mono text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#05D59E]" />
                      Firebase Console Configuration Steps:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfigGuide(false)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-200 leading-relaxed font-sans">
                    <li>
                      <strong>Enable Phone Provider:</strong> In <a href="https://console.firebase.google.com/project/silent-tempo-37c1c/authentication/providers" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center gap-0.5 font-bold">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a>, open <em>Authentication → Sign-in method</em>, click <strong>Phone</strong> and turn on <strong>Enable</strong>.
                    </li>
                    <li>
                      <strong>Add Authorized Domain:</strong> Under <em>Authentication → Settings → Authorized domains</em>, ensure <code>localhost</code> and your preview hostname are added.
                    </li>
                    <li>
                      <strong>Zero-Cost Free Testing:</strong> Under <em>Sign-in method → Phone</em>, expand <em>"Phone numbers for testing"</em> and add <code>+91 99999 99999</code> with code <code>123456</code>.
                    </li>
                  </ol>
                </div>
              )}

              {/* Step 1: Mobile Phone Number Input */}
              {!phoneOtpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1.5 font-bold">
                      Enter Mobile Phone Number
                    </label>

                    {/* Country Code + Phone Input */}
                    <div className="flex gap-2">
                      <div className="relative w-36 shrink-0">
                        <select
                          value={phoneCountryCode}
                          onChange={(e) => setPhoneCountryCode(e.target.value)}
                          className="w-full appearance-none bg-[#151D2A] border-2 border-white/15/20 hover:border-white/15 focus:border-[#05D59E] focus:outline-none px-2.5 py-3 rounded-xl text-xs font-mono font-bold text-white cursor-pointer"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3.5 pointer-events-none text-slate-400" />
                      </div>

                      <div className="relative flex-1">
                        <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-[#05D59E]" />
                        <input
                          type="tel"
                          required
                          placeholder="98765 43210"
                          value={phoneNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('+')) {
                              const match = COUNTRY_CODES.find((c) => val.startsWith(c.code));
                              if (match) {
                                setPhoneCountryCode(match.code);
                                setPhoneNumber(val.slice(match.code.length).trim());
                                return;
                              }
                            }
                            setPhoneNumber(val);
                          }}
                          className="w-full bg-[#0E1726] border-2 border-white/15/20 hover:border-white/15 focus:border-[#05D59E] focus:outline-none pl-9 pr-3 py-3 rounded-xl text-xs font-mono font-bold text-white"
                        />
                      </div>
                    </div>

                    {/* Quick Test Pill & Target Display */}
                    <div className="flex justify-between items-center mt-2 px-0.5 text-[10px] font-mono">
                      <span className="text-slate-400">
                        Target: <strong className="text-white">{formatE164PhoneNumber(phoneNumber, phoneCountryCode) || `${phoneCountryCode}...`}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutofillTestPhone}
                        className="inline-flex items-center gap-1 text-[#05D59E] hover:text-white font-bold underline cursor-pointer"
                        title="Autofill standard Firebase test credentials"
                      >
                        <Sparkles className="w-3 h-3 text-[#05D59E]" />
                        Demo Number?
                      </button>
                    </div>
                  </div>

                  {/* Test number helper card */}
                  <div className="p-2.5 bg-[#151D2A] border border-white/10 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
                    <span>🧪 Firebase Test Mode: <strong>+91 99999 99999</strong> (Code: <strong>123456</strong>)</span>
                    <button
                      type="button"
                      onClick={handleAutofillTestPhone}
                      className="px-2 py-0.5 bg-[#0E1726] border border-white/15 rounded text-[10px] font-mono font-bold text-white hover:bg-[#1E293B]"
                    >
                      Fill
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingPhoneOtp || !phoneNumber.trim()}
                    className="w-full bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white py-3.5 rounded-xl font-mono font-black text-xs tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSendingPhoneOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>DISPATCHING SMS OTP...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>SEND OTP VIA SMS</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 font-sans leading-relaxed">
                    Firebase sends an official 6-digit verification code to your mobile device.
                  </p>
                </form>
              ) : (
                /* Step 2: 6-Box OTP Verification */
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>SMS Dispatched Successfully!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      Enter the 6-digit verification code sent to <strong className="font-mono text-white">{formatE164PhoneNumber(phoneNumber, phoneCountryCode)}</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider font-bold">
                        Enter 6-Digit SMS Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneOtpSent(false);
                          setEnteredPhoneOtp('');
                          setPhoneError(null);
                        }}
                        className="text-[10px] font-mono text-[#05D59E] hover:underline font-bold"
                      >
                        Change Number
                      </button>
                    </div>

                    {/* 6 Discrete Digit Boxes */}
                    <OtpBoxes
                      value={enteredPhoneOtp}
                      onChange={setEnteredPhoneOtp}
                      onComplete={(code) => handleVerifyPhoneOtp(code)}
                      disabled={isVerifyingPhoneOtp}
                    />

                    {/* Resend Link with 60s Countdown */}
                    <div className="flex justify-between items-center text-[10px] font-mono mt-2 px-1">
                      <span className="text-slate-400">Didn't receive SMS?</span>
                      <button
                        type="button"
                        disabled={phoneCountdown > 0 || isSendingPhoneOtp}
                        onClick={() => handleSendPhoneOtp()}
                        className={`font-bold uppercase tracking-wider flex items-center gap-1 ${
                          phoneCountdown > 0 || isSendingPhoneOtp
                            ? 'text-white/30 cursor-not-allowed'
                            : 'text-[#05D59E] hover:underline cursor-pointer'
                        }`}
                      >
                        {isSendingPhoneOtp ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : phoneCountdown > 0 ? (
                          <span>Resend in {phoneCountdown}s</span>
                        ) : (
                          <span>Resend SMS Code ⟳</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyPhoneOtp()}
                    disabled={isVerifyingPhoneOtp || enteredPhoneOtp.length < 6}
                    className="w-full bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white py-3.5 rounded-xl font-mono font-black text-xs tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isVerifyingPhoneOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>VERIFYING WITH FIREBASE...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>VERIFY & LOG IN</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: GMAIL / EMAIL OTP */}
          {/* ========================================================== */}
          {authMode === 'email' && (
            <div className="space-y-4">
              
              {emailErrorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{emailErrorMsg}</span>
                </motion.div>
              )}

              {!emailOtpSent ? (
                <form onSubmit={handleSendEmailOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1.5 font-bold">
                      Your Gmail / Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#05D59E]" />
                      <input
                        type="email"
                        required
                        placeholder="you@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#0E1726] border-2 border-white/15/20 hover:border-white/15 focus:border-[#05D59E] focus:outline-none pl-10 pr-3 py-3 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                      A 6-digit verification code will be dispatched directly to your Gmail inbox.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmailOtp || !email.includes('@')}
                    className="w-full bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white py-3.5 rounded-xl font-mono font-black text-xs tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSendingEmailOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>DISPATCHING OTP TO GMAIL...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>SEND OTP TO GMAIL</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>OTP Dispatched to Gmail</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      Check your Gmail inbox for <strong className="font-mono text-white">{email}</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider font-bold">
                        Enter 6-Digit OTP Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOtpSent(false);
                          setEnteredEmailOtp('');
                          setEmailErrorMsg('');
                        }}
                        className="text-[10px] font-mono text-[#05D59E] hover:underline font-bold"
                      >
                        Change Email
                      </button>
                    </div>

                    {/* 6 Discrete Digit Boxes */}
                    <OtpBoxes
                      value={enteredEmailOtp}
                      onChange={setEnteredEmailOtp}
                      onComplete={(code) => handleVerifyEmailOtp(code)}
                      disabled={isVerifyingEmailOtp}
                    />

                    <div className="flex justify-between items-center text-[10px] font-mono mt-2 px-1">
                      <span className="text-slate-400">Didn't receive email?</span>
                      <button
                        type="button"
                        disabled={emailCountdown > 0 || isSendingEmailOtp}
                        onClick={() => handleSendEmailOtp()}
                        className={`font-bold uppercase tracking-wider flex items-center gap-1 ${
                          emailCountdown > 0 || isSendingEmailOtp
                            ? 'text-white/30 cursor-not-allowed'
                            : 'text-[#05D59E] hover:underline cursor-pointer'
                        }`}
                      >
                        {isSendingEmailOtp ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : emailCountdown > 0 ? (
                          <span>Resend in {emailCountdown}s</span>
                        ) : (
                          <span>Resend to Gmail ⟳</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyEmailOtp()}
                    disabled={isVerifyingEmailOtp || enteredEmailOtp.length < 6}
                    className="w-full bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white py-3.5 rounded-xl font-mono font-black text-xs tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isVerifyingEmailOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>VERIFYING OTP...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>VERIFY & LOG IN</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: PASSWORD LOGIN & CREATE ACCOUNT */}
          {/* ========================================================== */}
          {authMode === 'password' && (
            <div className="space-y-4">
              
              {/* Toggle Sign in vs Register */}
              <div className="flex border-b border-white/15/10 text-xs font-mono pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordSubMode('signin');
                    setPasswordErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 font-bold transition-colors ${
                    passwordSubMode === 'signin'
                      ? 'text-white border-b-2 border-[#05D59E]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordSubMode('register');
                    setPasswordErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 font-bold transition-colors ${
                    passwordSubMode === 'register'
                      ? 'text-white border-b-2 border-[#05D59E]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {passwordErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                {passwordSubMode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1 font-bold">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-[#05D59E]" />
                      <input
                        type="text"
                        required
                        placeholder="Arjun Mehta"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-[#0E1726] border-2 border-white/15/20 hover:border-white/15 focus:border-[#05D59E] focus:outline-none pl-10 pr-3 py-2.5 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1 font-bold">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#05D59E]" />
                    <input
                      type="email"
                      required
                      placeholder="scholar@example.com"
                      value={passwordEmail}
                      onChange={(e) => setPasswordEmail(e.target.value)}
                      className="w-full bg-[#0E1726] border-2 border-white/15/20 hover:border-white/15 focus:border-[#05D59E] focus:outline-none pl-10 pr-3 py-2.5 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1 font-bold">
                    Password (Min 6 Characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#05D59E]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0E1726] border-2 border-white/15/20 hover:border-white/15 focus:border-[#05D59E] focus:outline-none pl-10 pr-10 py-2.5 rounded-xl text-xs font-mono text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-[#05D59E]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passwordSubMode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1 font-bold">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#05D59E]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#0E1726] border-2 border-white/15/20 hover:border-white/15 focus:border-[#05D59E] focus:outline-none pl-10 pr-3 py-2.5 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#05D59E] hover:bg-[#0F172A] text-white hover:text-white py-3.5 rounded-xl font-mono font-black text-xs tracking-wider uppercase transition shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                >
                  {passwordSubMode === 'register' ? 'CREATE FREE ACCOUNT & LOG IN' : 'SIGN IN WITH PASSWORD'}
                </button>
              </form>
            </div>
          )}

          {/* Quick Sandbox Guest Access */}
          <div className="pt-2 border-t border-white/15/10 text-center">
            <button
              type="button"
              onClick={handleDemoScholarLogin}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-white transition-colors py-1 px-2 rounded hover:bg-[#1E293B]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Guest Scholar Access (₹50,000 Sandbox Balance) ➔</span>
            </button>
          </div>

          {/* Security Badge Footer */}
          <div className="pt-1 text-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#05D59E]" />
              Official Firebase Auth & Cloud Firestore Synchronized
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
