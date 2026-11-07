import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { DigitalInvoice } from '../types';
import { 
  ShieldCheck, Download, Printer, CheckCircle, 
  Clock, Smartphone, Mail, Hash, AlertTriangle, X,
  FileText, Sparkles, Building2, User
} from 'lucide-react';

interface DigitalInvoiceModalProps {
  invoice: DigitalInvoice;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export default function DigitalInvoiceModal({
  invoice,
  isOpen,
  onClose,
  theme = 'dark'
}: DigitalInvoiceModalProps) {
  const isLight = theme === 'light';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      invoice.qrPayload || JSON.stringify({
        inv: invoice.invoiceId,
        tx: invoice.transactionId,
        usr: invoice.username,
        amt: invoice.amount,
        ts: invoice.timestamp,
        code: invoice.accessCode
      }),
      {
        width: 180,
        margin: 2,
        color: {
          dark: '#0A0E17',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      },
      (error) => {
        if (error) console.error('QR Render Error:', error);
        else setQrGenerated(true);
      }
    );
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className={`relative w-full max-w-xl rounded-3xl border shadow-2xl p-6 sm:p-8 transition-all my-auto ${
          isLight 
            ? 'bg-white border-slate-300 text-slate-900 shadow-slate-300/60' 
            : 'bg-[#0E1726] border-white/15 text-white shadow-[0_0_50px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close Invoice"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00FF87] to-[#00F0FF] p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0A0E17] rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#00FF87]" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FF87] font-black block">
                Official Digital Tax Bill & Receipt
              </span>
              <h2 className="text-xl font-serif font-black tracking-tight">
                SAMZEN TRADELEARN
              </h2>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle className="w-3.5 h-3.5" />
              STATUS: PAID
            </span>
            <span className="text-[11px] font-mono text-slate-400 block mt-1">
              Invoice #{invoice.invoiceId}
            </span>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-5 text-xs font-mono border-b border-white/10">
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Student / Account</span>
            <div className="font-bold flex items-center gap-1.5 text-white">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{invoice.username}</span>
            </div>
            <div className="text-slate-300 flex items-center gap-1.5 truncate">
              <Mail className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="truncate">{invoice.email}</span>
            </div>
            <div className="text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3 h-3 text-amber-400 shrink-0" />
              <span>+91 {invoice.mobileNumber}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Transaction & Hardware</span>
            <div className="font-bold text-white flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="truncate">{invoice.transactionId}</span>
            </div>
            <div className="text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="text-slate-300 flex items-center gap-1.5 truncate">
              <Smartphone className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate">{invoice.deviceName || 'Registered Mobile Device'}</span>
            </div>
          </div>
        </div>

        {/* Itemized Purchase Table */}
        <div className="py-4 space-y-2 border-b border-white/10 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px]">
            <span>Subscription Tier / Educational Pass</span>
            <span>Total Paid</span>
          </div>

          <div className="flex justify-between items-center py-2 bg-white/5 px-3 rounded-xl">
            <div>
              <span className="font-bold text-white block">{invoice.planName}</span>
              <span className="text-[10px] text-emerald-400">Institutional SMC + Dynamic MM Bot Simulator + Audio Explainer</span>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-[#00FF87]">₹{invoice.amount.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400 block">INR (Taxes Included)</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-slate-400">Unique 8-Digit Access Code:</span>
            <span className="font-black text-amber-400 tracking-wider">#{invoice.accessCode}</span>
          </div>
        </div>

        {/* Dynamic Authenticity Verification QR Code */}
        <div className="pt-5 flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 p-4 rounded-2xl border border-emerald-500/30">
          <div className="bg-white p-2.5 rounded-2xl shadow-xl shrink-0 border-2 border-emerald-400">
            <canvas ref={canvasRef} className="rounded-lg w-[130px] h-[130px]" />
          </div>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-1.5 text-xs font-mono font-black uppercase text-[#00FF87]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mandatory Authenticity QR Code</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              This cryptographic QR invoice is uniquely tethered to your payment timestamp and hardware fingerprint.
            </p>
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>48-Hour Refund Rule:</strong> This QR code is strictly required to verify authenticity for any support or refund requests within 48 hours of payment.
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#00FF87] hover:bg-[#00e577] text-[#0A0E17] text-xs font-mono font-black uppercase tracking-wider transition cursor-pointer shadow-lg"
          >
            Done / Access Platform
          </button>
        </div>
      </div>
    </div>
  );
}
