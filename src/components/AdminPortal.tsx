import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Users, Mail, RefreshCw, Search, CheckCircle2, 
  XCircle, Clock, DollarSign, Key, Zap, Trash2, Ban, 
  MessageSquare, ArrowLeft, Send, Check, AlertTriangle, 
  Sparkles, Filter, ChevronRight, Lock, Eye, LogOut,
  QrCode, Camera, CameraOff, UploadCloud, FileCheck, Smartphone, ExternalLink
} from 'lucide-react';
import jsQR from 'jsqr';
import { AdminUserRecord, MailboxItem } from '../types';

interface AdminPortalProps {
  onExitAdmin: () => void;
  theme?: 'dark' | 'light';
}

export default function AdminPortal({ onExitAdmin, theme = 'dark' }: AdminPortalProps) {
  const isLight = theme === 'light';

  // Tabs: 'users' | 'mailbox' | 'scanner' | 'coupons'
  const [activeTab, setActiveTab] = useState<'users' | 'mailbox' | 'scanner' | 'coupons'>('users');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 42,
    activeUsers: 28,
    activePro: 18,
    activeTrial: 14,
    totalRevenue: 24890,
    unreadMailbox: 2,
  });

  // QR Scanner & Verification States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Users CRM State
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  // Edit / Action modal state
  const [actionType, setActionType] = useState<
    'activate_pro' | 'deactivate_pro' | 'set_duration' | 'assign_code' | 'recharge' | 'ban' | null
  >(null);
  const [subDurationDays, setSubDurationDays] = useState<number>(30);
  const [planAmountPaid, setPlanAmountPaid] = useState<number>(299);
  const [customNewCode, setCustomNewCode] = useState<string>('');
  const [rechargeBalanceAmount, setRechargeBalanceAmount] = useState<number>(1000000);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Mailbox State
  const [mailbox, setMailbox] = useState<MailboxItem[]>([]);
  const [mailFilter, setMailFilter] = useState<'all' | 'refund' | 'feedback' | 'support'>('all');
  const [selectedMail, setSelectedMail] = useState<MailboxItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoadingMail, setIsLoadingMail] = useState(false);

  // Coupon Management State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState<number>(20);
  const [newUsageLimit, setNewUsageLimit] = useState<'unlimited' | 'single'>('unlimited');
  const [couponMsg, setCouponMsg] = useState('');

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) setCoupons(data.coupons);
    } catch (e) {
      console.warn('Failed to fetch coupons:', e);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode,
          discountType: newDiscountType,
          discountValue: newDiscountValue,
          usageLimit: newUsageLimit
        })
      });
      const data = await res.json();
      if (data.success) {
        setCouponMsg(data.message);
        setNewCouponCode('');
        fetchCoupons();
        setTimeout(() => setCouponMsg(''), 3000);
      } else {
        alert(data.error || 'Failed to create coupon.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating coupon.');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Delete coupon ${code}?`)) return;
    try {
      const res = await fetch('/api/admin/coupons/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) fetchCoupons();
    } catch (e) {
      alert('Failed to delete coupon.');
    }
  };

  // Load Admin Stats & Users
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats({
          totalUsers: data.totalUsers || 42,
          activeUsers: data.activeUsers || 28,
          activePro: data.activePro || 18,
          activeTrial: data.activeTrial || 14,
          totalRevenue: data.totalRevenue || 24890,
          unreadMailbox: data.unreadMailbox || 0,
        });
      }
    } catch (e) {
      console.warn('Failed to fetch admin stats:', e);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchMailbox = async () => {
    setIsLoadingMail(true);
    try {
      const res = await fetch(`/api/admin/mailbox?filter=${mailFilter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setMailbox(data.items);
      }
    } catch (e) {
      console.warn('Failed to load mailbox:', e);
    } finally {
      setIsLoadingMail(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchMailbox();
    fetchCoupons();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  useEffect(() => {
    fetchMailbox();
  }, [mailFilter]);

  // Clean up camera stream on tab switch or unmount
  useEffect(() => {
    if (activeTab !== 'scanner') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Unable to access device camera. Please check camera permissions or upload an invoice QR image below.');
      setIsCameraActive(false);
    }
  };

  const scanLoop = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      stopCamera();
      handleVerifyQR(code.data);
      return;
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const handleVerifyQR = async (qrData: string) => {
    setIsVerifying(true);
    setScanNotice('Verifying cryptographic invoice signature with server...');
    try {
      const res = await fetch('/api/invoices/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload: qrData, invoiceId: qrData.trim() })
      });
      const data = await res.json();
      setVerificationResult(data);
      setScanNotice(null);
    } catch (e: any) {
      setVerificationResult({
        valid: false,
        status: 'NETWORK_ERROR',
        message: e.message || 'Failed to verify invoice with server.'
      });
      setScanNotice(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleVerifyQR(code.data);
        } else {
          alert('No recognizable QR code detected in the uploaded image. Please upload a clear photo or screenshot of the invoice QR.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Execute User CRM Action
  const handleExecuteUserAction = async () => {
    if (!selectedUser || !actionType) return;
    try {
      const payload: any = {
        username: selectedUser.username,
        action: actionType,
      };

      if (actionType === 'activate_pro' || actionType === 'set_duration') {
        payload.subscriptionDays = subDurationDays;
        payload.amountPaid = planAmountPaid;
      } else if (actionType === 'assign_code') {
        payload.newAccessCode = customNewCode || undefined;
      } else if (actionType === 'recharge') {
        payload.rechargeAmount = rechargeBalanceAmount;
      }

      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setActionSuccessMsg(`Success: ${result.message}`);
        setTimeout(() => {
          setActionSuccessMsg('');
          setActionType(null);
          fetchUsers();
          fetchStats();
        }, 1200);
      } else {
        alert(result.error || 'Action failed.');
      }
    } catch (e: any) {
      alert(e.message || 'Error executing action');
    }
  };

  // Delete User
  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}" from the database?`)) return;
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action: 'delete' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
      }
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  // Update Mailbox Item Status
  const handleUpdateMailStatus = async (id: string, status: 'reviewed' | 'resolved') => {
    try {
      const res = await fetch('/api/admin/mailbox/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes: replyText || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        fetchMailbox();
        fetchStats();
      }
    } catch (e) {
      alert('Failed to update mailbox item');
    }
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 font-sans ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#06090F] text-white'
    }`}>
      {/* Top Header & Secret Admin Status */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className={`p-4 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl backdrop-blur-md ${
          isLight 
            ? 'bg-white/95 border-red-200 shadow-red-500/5' 
            : 'bg-[#0E1726]/90 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-500 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-widest text-red-500 uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                  CONFIDENTIAL • AUTH CODE 30072012
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live CRM
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight mt-1">
                Samzen Executive Command & CRM Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchStats();
                fetchUsers();
                fetchMailbox();
              }}
              className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
              title="Refresh CRM Data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-red-500/25"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Admin Mode</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Total Registered</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                {stats.totalUsers}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Traders</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Active Users (Live)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#00FF87]">
                {stats.activeUsers}
              </span>
              <span className="text-[11px] font-mono text-indigo-400">(&lt; 50 = MM Bot ON)</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Paid Pro Subscriptions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">
                {stats.activePro}
              </span>
              <span className="text-xs font-mono text-slate-400">/ {stats.activeTrial} in Trial</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
          }`}>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Central Mailbox</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-sky-400">
                {stats.unreadMailbox}
              </span>
              <span className="text-xs font-mono text-slate-400">Unresolved Inquiries</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'users'
                ? isLight ? 'bg-slate-900 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Database & Codes ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mailbox')}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer relative ${
              activeTab === 'mailbox'
                ? isLight ? 'bg-slate-900 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Centralized Mailbox ({mailbox.length})</span>
            {stats.unreadMailbox > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'scanner'
                ? isLight ? 'bg-slate-900 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan User QR & Verify</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'coupons'
                ? isLight ? 'bg-slate-900 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Coupon Management ({coupons.length})</span>
          </button>
        </div>

        {/* TAB 4: COUPON MANAGEMENT */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Create Coupon Card */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00FF87]" />
                <span>Generate New Discount Coupon</span>
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Create custom discount codes with percentage or flat rate and usage limits (unlimited vs single-use).
              </p>

              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Coupon Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE30"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-xs font-mono text-white placeholder-slate-600 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Discount Type:</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-xs font-mono text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Rate (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Discount Value:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Usage Limit:</label>
                  <select
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-xs font-mono text-white"
                  >
                    <option value="unlimited">Unlimited Uses</option>
                    <option value="single">Single Use (Restricted)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
                  >
                    Generate Coupon
                  </button>
                </div>
              </form>

              {couponMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                  {couponMsg}
                </div>
              )}
            </div>

            {/* Coupons List Table */}
            <div className={`rounded-3xl border overflow-hidden shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="p-5 border-b border-white/10">
                <h3 className="text-base font-serif font-bold text-white">Active Discount Coupons ({coupons.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className={`border-b ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#121A28] border-white/10 text-slate-400'}`}>
                      <th className="p-4">Coupon Code</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Usage Limit</th>
                      <th className="p-4">Redeemed Count</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">
                          No active coupons created yet.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c) => (
                        <tr key={c.code} className="hover:bg-white/5 transition">
                          <td className="p-4 font-bold text-white text-sm">{c.code}</td>
                          <td className="p-4 text-[#00FF87] font-bold">
                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </td>
                          <td className="p-4 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              c.usageLimit === 'single' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {c.usageLimit}
                            </span>
                          </td>
                          <td className="p-4">{c.usedCount} times</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(c.code)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: USERS CRM DATABASE */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search database by Username or 8-digit Access Code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-mono text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* User Records Table */}
            <div className={`rounded-3xl border overflow-hidden shadow-xl ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className={`border-b ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#121A28] border-white/10 text-slate-400'}`}>
                      <th className="py-3.5 px-4">Username & Email</th>
                      <th className="py-3.5 px-4">8-Digit Access Code</th>
                      <th className="py-3.5 px-4">Subscription Status</th>
                      <th className="py-3.5 px-4">Days / Expiry</th>
                      <th className="py-3.5 px-4">Paid Amount</th>
                      <th className="py-3.5 px-4">Virtual Balance</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => {
                      const isPro = u.status === 'active_pro';
                      const isTrial = u.status === 'active_trial';
                      const isBanned = u.status === 'banned';

                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {u.username === 'samarth_trade' && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                  Founder
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded bg-[#0A0E17] border border-[#00FF87]/30 text-[#00FF87] font-bold tracking-widest text-xs">
                              {u.accessCode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isPro && (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                Pro Active ({u.proTier?.toUpperCase()})
                              </span>
                            )}
                            {isTrial && (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                                2-Day Trial
                              </span>
                            )}
                            {isBanned && (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                                Banned
                              </span>
                            )}
                            {!isPro && !isTrial && !isBanned && (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-500/20 text-slate-400 border border-slate-500/30">
                                Expired / Free
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {u.subscriptionDays ? `${u.subscriptionDays} Days` : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            ₹{u.amountPaid || 0}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            ₹{u.demoBalance?.toLocaleString() || '10,00,000'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('activate_pro');
                                  setSubDurationDays(30);
                                  setPlanAmountPaid(299);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] transition cursor-pointer"
                                title="Manage Subscription & Duration"
                              >
                                Activate / Edit
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('assign_code');
                                  setCustomNewCode('');
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-[11px] transition cursor-pointer"
                                title="Reassign 8-Digit Access Code"
                              >
                                Code
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('recharge');
                                  setRechargeBalanceAmount(1000000);
                                }}
                                className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 text-[11px] transition cursor-pointer"
                                title="Recharge Virtual Capital"
                              >
                                ₹+
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CENTRALIZED MAILBOX (Feedback & Refund Portal) */}
        {activeTab === 'mailbox' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {(['all', 'refund', 'feedback', 'support'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMailFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer uppercase ${
                      mailFilter === cat
                        ? isLight ? 'bg-slate-900 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                        : isLight ? 'bg-white text-slate-600 border border-slate-200' : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-400">
                All inquiries submitted from the website interface arrive here automatically.
              </span>
            </div>

            {/* Mailbox List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mailbox.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border space-y-3 shadow-xl transition ${
                    item.status === 'new'
                      ? 'border-sky-500/40 bg-[#0E1726]'
                      : 'border-white/10 bg-[#0A0E17]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${
                      item.type === 'refund'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : item.type === 'feedback'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}>
                      {item.type}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{item.subject}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      From: <span className="text-white">{item.username}</span> ({item.userEmail})
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed font-sans">
                    {item.message}
                  </p>

                  {item.invoiceId && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-400">Attached QR Invoice:</span>
                        <span className="text-emerald-400 font-bold">{item.invoiceId}</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('scanner');
                          handleVerifyQR(item.invoiceId!);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>Verify in Scanner</span>
                      </button>
                    </div>
                  )}

                  {item.isEligibleForRefund !== undefined && (
                    <div className={`text-[11px] font-mono px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                      item.isEligibleForRefund
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      {item.isEligibleForRefund ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Strict 48-Hour Refund Status: <strong>Eligible</strong> (Payment timestamp within 48h)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Strict 48-Hour Refund Status: <strong>Disqualified</strong> (Elapsed time exceeds 48 hours)</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-[11px] font-mono font-bold ${
                      item.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      Status: {item.status.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-2">
                      {item.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateMailStatus(item.id, 'resolved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0A0E17] font-mono text-xs font-bold transition cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN QR SCANNER & AUTHENTICITY VERIFICATION */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Header info card */}
            <div className={`p-5 rounded-3xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-serif font-black text-white">
                        Student Bill Authenticity & 48-Hour Refund Scanner
                      </h2>
                      <p className="text-xs font-mono text-slate-400">
                        Scan student invoice QR codes to verify cryptographic authenticity and automatically audit the strict 48-hour refund cutoff.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isCameraActive ? (
                    <button
                      onClick={startCamera}
                      className="px-4 py-2.5 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono text-xs font-black flex items-center gap-2 shadow-lg shadow-[#00FF87]/20 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span>Stop Camera</span>
                    </button>
                  )}

                  <label className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold flex items-center gap-2 border border-white/10 transition cursor-pointer">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Camera Viewport & Manual Code Input Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Live Camera or Visual Frame */}
              <div className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
              }`}>
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  Live HTML5 Camera Optical Reader
                </h3>

                {isCameraActive ? (
                  <div className="relative w-full aspect-video sm:h-72 bg-black rounded-2xl overflow-hidden border border-[#00FF87]/40 shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Radar scan animation reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_25px_rgba(0,255,135,0.4)]">
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FF87]" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#00FF87]" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#00FF87]" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#00FF87]" />
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00FF87] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                        Scanning for Samzen digital bill QR code...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-72 bg-[#06090F] border border-dashed border-white/15 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Camera Standby</h4>
                      <p className="text-xs font-mono text-slate-400 max-w-xs mt-1">
                        Click 'Start Camera Scanner' above to scan physical invoices, phone screens, or printed bills.
                      </p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition cursor-pointer"
                    >
                      Turn On Camera
                    </button>
                  </div>
                )}

                {cameraError && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Camera Notice:</span> {cameraError}
                    </div>
                  </div>
                )}

                {/* Offscreen canvas used for scanning */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Right Column: Manual Code Entry & Pre-seeded Test Sandbox */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'
              }`}>
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-400" />
                    Direct Invoice Lookup & Test Verification
                  </h3>
                  <p className="text-xs text-slate-300 mb-3 font-sans">
                    Enter the Invoice ID (e.g. <code className="text-emerald-400 font-mono">SZ-INV-2026-89104</code>) or paste the complete QR JSON string:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SZ-INV-2026-89104 or raw QR payload..."
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualCodeInput.trim()) {
                          handleVerifyQR(manualCodeInput.trim());
                        }
                      }}
                      className="flex-1 p-3 rounded-xl bg-[#06090F] border border-white/20 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
                    />
                    <button
                      onClick={() => {
                        if (manualCodeInput.trim()) {
                          handleVerifyQR(manualCodeInput.trim());
                        }
                      }}
                      disabled={isVerifying || !manualCodeInput.trim()}
                      className="px-4 py-3 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono text-xs font-black disabled:opacity-50 transition cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                {/* Preset Sandbox for Instant Test Verification */}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                    Instant Test Verification Presets:
                  </span>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setManualCodeInput('SZ-INV-2026-89104');
                        handleVerifyQR('SZ-INV-2026-89104');
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="font-bold">Test Authentic Invoice (&lt; 48h Active)</div>
                          <div className="text-[10px] text-slate-400">SZ-INV-2026-89104 • Rahul Trader • Within refund window</div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20">
                        Test Eligible
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setManualCodeInput('SZ-INV-2026-10492');
                        handleVerifyQR('SZ-INV-2026-10492');
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="font-bold">Test Expired Invoice (&gt; 48h Lapsed)</div>
                          <div className="text-[10px] text-slate-400">SZ-INV-2026-10492 • Priya Sharma • Paid 72h ago</div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20">
                        Test Expired
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        const fakePayload = JSON.stringify({
                          invoiceId: 'SZ-INV-COUNTERFEIT-999',
                          username: 'fraudulent_actor',
                          amount: 9999,
                          timestamp: Date.now(),
                          signature: 'tampered_fake_signature_hash_0000'
                        });
                        setManualCodeInput('SZ-INV-COUNTERFEIT-999');
                        handleVerifyQR(fakePayload);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="font-bold">Test Fraudulent / Altered Invoice QR</div>
                          <div className="text-[10px] text-slate-400">Forged signature & unrecorded transaction token</div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/20">
                        Test Reject
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scanning / Loading notice */}
            {isVerifying && (
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-xs flex items-center justify-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{scanNotice || 'Verifying cryptographic invoice signature with server...'}</span>
              </div>
            )}

            {/* VERIFICATION RESULT CARD */}
            {verificationResult && (
              <div className={`p-6 rounded-3xl border shadow-2xl space-y-5 transition animate-in fade-in duration-300 ${
                verificationResult.valid
                  ? verificationResult.invoice?.isEligibleForRefund
                    ? 'bg-[#0E1726] border-emerald-500/50 shadow-emerald-500/10'
                    : 'bg-[#0E1726] border-amber-500/50 shadow-amber-500/10'
                  : 'bg-[#0E1726] border-red-500/50 shadow-red-500/10'
              }`}>
                {/* Result Status Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    {verificationResult.valid ? (
                      verificationResult.invoice?.isEligibleForRefund ? (
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Clock className="w-7 h-7" />
                        </div>
                      )
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                        <XCircle className="w-7 h-7" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded border ${
                          verificationResult.valid
                            ? verificationResult.invoice?.isEligibleForRefund
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {verificationResult.status || (verificationResult.valid ? 'AUTHENTIC' : 'INVALID')}
                        </span>

                        <span className="text-xs font-mono text-slate-400">
                          Invoice ID: <strong className="text-white">{verificationResult.invoiceId || 'N/A'}</strong>
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold font-serif text-white mt-1">
                        {verificationResult.valid
                          ? verificationResult.invoice?.isEligibleForRefund
                            ? 'Authentic & Valid Bill • Eligible for 48-Hour Refund'
                            : 'Authentic Bill • Strict 48-Hour Refund Window Lapsed'
                          : 'Counterfeit or Unverified Invoice Record'}
                      </h3>
                      <p className="text-xs font-mono text-slate-300 mt-0.5">
                        {verificationResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVerificationResult(null)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-mono text-xs transition cursor-pointer"
                    >
                      Clear Result
                    </button>
                  </div>
                </div>

                {/* If authentic, show deep metadata breakdown */}
                {verificationResult.valid && verificationResult.invoice && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
                        <span className="text-slate-400 block text-[11px]">STUDENT USERNAME</span>
                        <span className="text-white font-bold text-sm mt-0.5 block">
                          {verificationResult.invoice.username}
                        </span>
                        <span className="text-emerald-400 text-[11px]">
                          Code: {verificationResult.invoice.accessCode}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
                        <span className="text-slate-400 block text-[11px]">VERIFIED GMAIL & MOBILE</span>
                        <span className="text-white font-bold text-[12px] truncate block mt-0.5">
                          {verificationResult.invoice.gmailAddress}
                        </span>
                        <span className="text-slate-300 text-[11px]">
                          +91 {verificationResult.invoice.mobileNumber}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
                        <span className="text-slate-400 block text-[11px]">HARDWARE DEVICE FINGERPRINT</span>
                        <div className="flex items-center gap-1.5 text-white font-bold text-[12px] mt-0.5">
                          <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">{verificationResult.invoice.deviceName}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          IP: {verificationResult.invoice.ipAddress || 'Client Node'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
                        <span className="text-slate-400 block text-[11px]">AMOUNT & TIMESTAMP</span>
                        <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
                          ₹{verificationResult.invoice.amountPaid} • {verificationResult.invoice.planName}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(verificationResult.invoice.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Strict 48-Hour Refund Policy Evaluation Box */}
                    <div className={`p-4 rounded-2xl border font-mono text-xs space-y-2 ${
                      verificationResult.invoice.isEligibleForRefund
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          48-Hour Refund Policy Audit:
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-black/40 border border-white/10">
                          {verificationResult.elapsedHours} Hours Elapsed
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {verificationResult.invoice.isEligibleForRefund ? (
                          <>
                            Transaction occurred <strong>{verificationResult.elapsedHours} hours</strong> ago. 
                            This is strictly within the guaranteed 48-hour satisfaction and refund window. 
                            The student is legitimately entitled to request an authorized refund under platform policy.
                          </>
                        ) : (
                          <>
                            Transaction occurred <strong>{verificationResult.elapsedHours} hours</strong> ago. 
                            This strictly exceeds the 48-hour statutory refund deadline. Per Samzen Legal & Refund Policy, 
                            automated and manual refund claims for this invoice are permanently locked and rejected.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Cryptographic HMAC Details */}
                    <div className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-emerald-400" />
                        <span>HMAC SHA-256 Signature:</span>
                        <code className="text-slate-300">{verificationResult.invoice.signature?.slice(0, 24)}...</code>
                      </div>
                      <span className="text-emerald-400 font-bold">✓ Signature Matches Database Hash</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setSearchQuery(verificationResult.invoice.username);
                          setActiveTab('users');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        <span>Open User Record in CRM</span>
                      </button>

                      {verificationResult.invoice.isEligibleForRefund && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to process a refund for ${verificationResult.invoice.username} (₹${verificationResult.invoice.amountPaid}) and deactivate their Pro access?`)) return;
                            try {
                              const res = await fetch('/api/admin/update-user', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  username: verificationResult.invoice.username,
                                  action: 'deactivate_pro'
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                alert(`Refund logged and Pro access deactivated for ${verificationResult.invoice.username}.`);
                                fetchUsers();
                                fetchStats();
                              }
                            } catch (e) {
                              alert('Failed to process refund in system.');
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Approve & Log Refund</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Modal */}
        {actionType && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E1726] border-white/20 text-white'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold font-serif">
                  Manage User: <span className="text-[#00FF87] font-mono">{selectedUser.username}</span>
                </h3>
                <button
                  onClick={() => setActionType(null)}
                  className="text-slate-400 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              {actionType === 'activate_pro' && (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Set Subscription Duration (Days):</label>
                    <input
                      type="number"
                      value={subDurationDays}
                      onChange={(e) => setSubDurationDays(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Input Plan Amount Paid (₹):</label>
                    <input
                      type="number"
                      value={planAmountPaid}
                      onChange={(e) => setPlanAmountPaid(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-white"
                    />
                  </div>
                </div>
              )}

              {actionType === 'assign_code' && (
                <div className="space-y-3 font-mono text-xs">
                  <label className="text-slate-400 block">Enter Custom 8-Digit Code (Leave blank to auto-generate):</label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. 58392019"
                    value={customNewCode}
                    onChange={(e) => setCustomNewCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-white tracking-widest text-center text-sm font-bold"
                  />
                </div>
              )}

              {actionType === 'recharge' && (
                <div className="space-y-3 font-mono text-xs">
                  <label className="text-slate-400 block">Recharge Virtual Trading Balance (₹):</label>
                  <input
                    type="number"
                    value={rechargeBalanceAmount}
                    onChange={(e) => setRechargeBalanceAmount(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-[#0A0E17] border border-white/20 text-white"
                  />
                </div>
              )}

              {actionSuccessMsg && (
                <p className="text-xs font-mono text-emerald-400 font-bold">{actionSuccessMsg}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setActionType(null)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteUserAction}
                  className="flex-1 py-3 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] font-mono text-xs font-black cursor-pointer shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
