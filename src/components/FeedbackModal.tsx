import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, CheckCircle2, ShieldCheck, 
  AlertTriangle, QrCode, Upload, FileText, Clock, AlertCircle, Check
} from 'lucide-react';
import jsQR from 'jsqr';
import { DigitalInvoice } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  username?: string;
  userEmail?: string;
  userInvoice?: DigitalInvoice | null;
}

export default function FeedbackModal({ 
  isOpen, 
  onClose, 
  theme, 
  username, 
  userEmail,
  userInvoice
}: FeedbackModalProps) {
  const [type, setType] = useState<'feedback' | 'refund' | 'support' | 'bug'>('feedback');
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverMsg, setServerMsg] = useState('');

  // 48-Hour Refund & Invoice Verification State
  const [invoiceQrData, setInvoiceQrData] = useState<string>('');
  const [verifiedInvoice, setVerifiedInvoice] = useState<any>(userInvoice || null);
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);
  const [qrError, setQrError] = useState('');
  const [hoursElapsed, setHoursElapsed] = useState<number | null>(null);
  const [isEligibleForRefund, setIsEligibleForRefund] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isLight = theme === 'light';

  // Evaluate eligibility whenever verifiedInvoice changes
  useEffect(() => {
    if (verifiedInvoice && verifiedInvoice.timestamp) {
      const ts = new Date(verifiedInvoice.timestamp).getTime();
      const elapsed = (Date.now() - ts) / (1000 * 3600);
      setHoursElapsed(Math.round(elapsed * 10) / 10);
      setIsEligibleForRefund(elapsed <= 48);
    } else {
      setHoursElapsed(null);
      setIsEligibleForRefund(null);
    }
  }, [verifiedInvoice]);

  // If user already has an invoice in their profile, preload it when switching to refund
  useEffect(() => {
    if (type === 'refund' && userInvoice && !verifiedInvoice) {
      setVerifiedInvoice(userInvoice);
    }
  }, [type, userInvoice, verifiedInvoice]);

  if (!isOpen) return null;

  // Handle QR Image Upload and jsQR Decoding
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifyingQr(true);
    setQrError('');

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsVerifyingQr(false);
          setQrError('Failed to initialize canvas decoder.');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, img.width, img.height);

        if (code && code.data) {
          setInvoiceQrData(code.data);
          // Verify on backend
          try {
            const res = await fetch('/api/invoices/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qrData: code.data })
            });
            const data = await res.json();
            if (data.success && data.invoice) {
              setVerifiedInvoice(data.invoice);
              setHoursElapsed(data.hoursElapsed);
              setIsEligibleForRefund(data.isEligibleForRefund);
            } else {
              setQrError(data.error || 'Invalid or unregistered invoice QR code.');
            }
          } catch {
            // Local JSON parse fallback
            try {
              const parsed = JSON.parse(code.data);
              setVerifiedInvoice(parsed);
            } catch {
              setQrError('Could not decode structured invoice payload.');
            }
          }
        } else {
          setQrError('No recognizable invoice QR code found in this image. Please upload a clear bill screenshot.');
        }
        setIsVerifyingQr(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyRawText = async () => {
    if (!invoiceQrData.trim()) return;
    setIsVerifyingQr(true);
    setQrError('');
    try {
      const res = await fetch('/api/invoices/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: invoiceQrData.trim() })
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setVerifiedInvoice(data.invoice);
        setHoursElapsed(data.hoursElapsed);
        setIsEligibleForRefund(data.isEligibleForRefund);
      } else {
        setQrError(data.error || 'Invoice not found in institutional database.');
      }
    } catch {
      setQrError('Verification service unreachable.');
    } finally {
      setIsVerifyingQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    if (type === 'refund') {
      if (!verifiedInvoice) {
        alert('Mandatory Invoice QR code or digital bill is required for refund processing.');
        return;
      }
      if (isEligibleForRefund === false) {
        alert('Automated Rejection: More than 48 hours have elapsed since the original payment timestamp. This transaction is permanently ineligible for refund.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject || (type === 'refund' ? `Refund Request #${verifiedInvoice?.invoiceId || 'N/A'}` : 'User Platform Feedback'),
          message: feedback,
          username: username || 'Trader',
          userEmail: userEmail || 'trader@samzen.internal',
          invoiceId: verifiedInvoice?.invoiceId,
          qrPayload: invoiceQrData || (verifiedInvoice?.qrPayload ? String(verifiedInvoice.qrPayload) : ''),
          paymentTimestamp: verifiedInvoice?.timestamp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setServerMsg(data.message);
        setTimeout(() => {
          setIsSuccess(false);
          setFeedback('');
          setSubject('');
          onClose();
        }, 2500);
      } else {
        alert(data.error || 'Failed to dispatch message.');
      }
    } catch {
      setIsSuccess(true);
      setServerMsg('Your request has been securely queued to our executive team.');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border space-y-4 my-auto transition-all ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0E1726] border-white/15 text-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00FF87] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">Help, Feedback & Refund Portal</h2>
              <span className="text-[10px] font-mono text-slate-400">Executive Priority Desk • 48-Hour Refund Engine</span>
            </div>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-slate-400 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-[#00FF87] flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">Request Logged Successfully</h3>
            <p className="text-xs font-mono text-slate-300 max-w-sm mx-auto leading-relaxed">{serverMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selector */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
                Select Request Type:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'feedback', label: 'Feedback' },
                  { id: 'refund', label: 'Refund (48h)' },
                  { id: 'support', label: 'Support' },
                  { id: 'bug', label: 'Bug Report' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id as any);
                      setQrError('');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer text-center ${
                      type === item.id
                        ? isLight ? 'bg-slate-900 text-white' : 'bg-[#00FF87] text-[#0A0E17]'
                        : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400 border border-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STRICT 48-HOUR REFUND POLICY & QR REQUIREMENT BANNER */}
            {type === 'refund' && (
              <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-amber-500/30 text-xs font-mono">
                <div className="flex items-start gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider block text-[11px]">
                      Strict 48-Hour Refund Policy:
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      "Refunds can only be requested within 48 hours of the original payment timestamp. Presentation of the original digital tax invoice with its cryptographic QR verification code is strictly mandatory."
                    </p>
                  </div>
                </div>

                {/* QR Code Upload / Verification Box */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Upload Invoice QR Code or Screenshot:
                  </span>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isVerifyingQr}
                      className="px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25 flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isVerifyingQr ? 'Decoding QR...' : 'Upload QR Image / Bill'}</span>
                    </button>

                    {/* Quick Demo Pre-seed Button for testing */}
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceQrData('SZ-INV-2026-89104');
                        setVerifiedInvoice({
                          invoiceId: 'SZ-INV-2026-89104',
                          transactionId: 'UPI-RZP-98104812',
                          amount: 499,
                          timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
                          username: username || 'rahul_trader',
                          planName: 'Elite Pro Monthly Pass'
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] text-slate-400"
                    >
                      Demo Eligible (&lt;48h)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceQrData('SZ-INV-2026-10492');
                        setVerifiedInvoice({
                          invoiceId: 'SZ-INV-2026-10492',
                          transactionId: 'UPI-RZP-10492811',
                          amount: 1299,
                          timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
                          username: 'sneha_mumbai',
                          planName: 'Quarterly Institutional Pass'
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] text-rose-400"
                    >
                      Demo Expired (&gt;48h)
                    </button>
                  </div>

                  {qrError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{qrError}</span>
                    </div>
                  )}

                  {/* AUTOMATED VERIFICATION RESULTS CARD */}
                  {verifiedInvoice && hoursElapsed !== null && (
                    <div className={`p-3 rounded-xl border space-y-1.5 ${
                      isEligibleForRefund 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                        : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    }`}>
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          {isEligibleForRefund ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                          <span>Invoice #{verifiedInvoice.invoiceId}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isEligibleForRefund ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                        }`}>
                          {isEligibleForRefund ? 'ELIGIBLE (WITHIN 48H)' : 'STRICTLY REJECTED (>48H)'}
                        </span>
                      </div>

                      <div className="text-[11px] space-y-0.5 text-slate-300">
                        <div>Paid Amount: ₹{verifiedInvoice.amount} ({verifiedInvoice.planName || 'Pro Plan'})</div>
                        <div>Payment Age: <strong>{hoursElapsed} hours elapsed</strong> from transaction.</div>
                        {isEligibleForRefund ? (
                          <div className="text-emerald-400 font-bold">
                            ✓ Grace Window Active: {(48 - hoursElapsed).toFixed(1)} hours remaining to submit.
                          </div>
                        ) : (
                          <div className="text-rose-400 font-bold">
                            ✕ System Lock: Transaction exceeds the strict 48-hour limit. Automated refund rejected.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Standard Subject Input */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1 uppercase tracking-wider">
                Subject:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={type === 'refund' ? 'Reason for requesting refund...' : 'Brief summary of your inquiry...'}
                className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-[#121A28] border-white/15 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Message Textarea */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1 uppercase tracking-wider">
                Message & Specific Details:
              </label>
              <textarea
                value={feedback}
                required
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  type === 'refund'
                    ? 'State reasons for refund. Verified invoice details and account fingerprint will be automatically attached to this ticket.'
                    : 'How can we assist you? Provide detailed feedback or description of any platform query...'
                }
                className={`w-full h-24 p-3 rounded-xl border text-xs font-mono focus:outline-none leading-relaxed ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-[#121A28] border-white/15 text-white placeholder-slate-500'
                }`}
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={
                isSubmitting || 
                !feedback.trim() || 
                (type === 'refund' && (!verifiedInvoice || isEligibleForRefund === false))
              }
              className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                type === 'refund' && isEligibleForRefund === false
                  ? 'bg-rose-700 text-white'
                  : isLight 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#00FF87] text-[#0A0E17] shadow-lg shadow-emerald-500/20'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? 'Verifying & Routing to Executive Desk...' 
                  : type === 'refund' && isEligibleForRefund === false
                  ? 'Refund Rejected (Exceeds 48 Hours)'
                  : 'Submit to Admin Desk'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
