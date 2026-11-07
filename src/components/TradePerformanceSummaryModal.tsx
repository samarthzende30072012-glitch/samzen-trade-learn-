import React, { useState } from 'react';
import { UserProfile, ClosedTrade } from '../types';
import { 
  FileText, Download, Printer, X, ShieldCheck, 
  TrendingUp, TrendingDown, Award, Sparkles, AlertCircle,
  CheckCircle, ArrowUpRight, ArrowDownRight, Clock,
  RefreshCw, BarChart2, Layers
} from 'lucide-react';
import { calculatePerformanceMetrics, exportTradeSummaryPdf } from '../utils/tradePdfExport';

interface TradePerformanceSummaryModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
  theme?: 'dark' | 'light';
}

export default function TradePerformanceSummaryModal({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  theme = 'dark'
}: TradePerformanceSummaryModalProps) {
  const isLight = theme === 'light';
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const metrics = calculatePerformanceMetrics(user);
  const closedTrades: ClosedTrade[] = user.closedTrades || [];
  const openPositions = user.positions || [];

  const handleDownloadPdf = () => {
    setIsExporting(true);
    setTimeout(() => {
      const success = exportTradeSummaryPdf(user);
      setIsExporting(false);
      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    }, 400);
  };

  const handleSeedBenchmarkTrades = () => {
    if (!onUpdateUser) return;
    const now = Date.now();
    const benchmarkTrades: ClosedTrade[] = [
      {
        id: `bench-1-${now}`,
        symbol: 'NIFTY50',
        name: 'NIFTY 50 Index',
        type: 'BUY',
        quantity: 50,
        entryPrice: 22450,
        exitPrice: 22580,
        pnl: 6500,
        pnlPercent: 0.58,
        timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString()
      },
      {
        id: `bench-2-${now}`,
        symbol: 'BANKNIFTY',
        name: 'Bank Nifty Index',
        type: 'BUY',
        quantity: 30,
        entryPrice: 48200,
        exitPrice: 48490,
        pnl: 8700,
        pnlPercent: 0.60,
        timestamp: new Date(now - 1000 * 60 * 60 * 36).toISOString()
      },
      {
        id: `bench-3-${now}`,
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        type: 'SELL',
        quantity: 40,
        entryPrice: 2980,
        exitPrice: 3010,
        pnl: -1200,
        pnlPercent: -1.01,
        timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: `bench-4-${now}`,
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        type: 'BUY',
        quantity: 0.05,
        entryPrice: 66200,
        exitPrice: 67800,
        pnl: 80, // USD converted equivalent or points
        pnlPercent: 2.42,
        timestamp: new Date(now - 1000 * 60 * 60 * 12).toISOString()
      },
      {
        id: `bench-5-${now}`,
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        type: 'BUY',
        quantity: 25,
        entryPrice: 178.5,
        exitPrice: 184.2,
        pnl: 142.5,
        pnlPercent: 3.19,
        timestamp: new Date(now - 1000 * 60 * 60 * 4).toISOString()
      }
    ];

    onUpdateUser({
      ...user,
      closedTrades: benchmarkTrades,
      demoBalance: user.demoBalance + 14000
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl p-6 sm:p-8 transition-all my-auto max-h-[92vh] overflow-y-auto ${
          isLight 
            ? 'bg-white border-slate-300 text-slate-900 shadow-slate-300/60' 
            : 'bg-[#0E1726] border-white/15 text-white shadow-[0_0_50px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Close Summary"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00FF87] to-[#00F0FF] p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-[#0A0E17] rounded-[14px] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#00FF87]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FF87] font-black">
                  Official Audit & Verification
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  SMC Certified
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight">
                Trading Performance & History Review
              </h2>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={handlePrint}
              className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isLight 
                  ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Print formatted document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className={`px-4 py-2 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-200 shadow-lg cursor-pointer ${
                exportSuccess
                  ? 'bg-emerald-500 text-black'
                  : isLight
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-[#00FF87] to-[#00F0FF] hover:opacity-95 text-[#0A0E17] shadow-[0_0_20px_rgba(0,255,135,0.4)]'
              }`}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Student & Account Identity Strip */}
        <div className={`mt-5 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs font-mono ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0A0E17] border-white/5 text-slate-300'
        }`}>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Student / Trader</span>
            <span className="font-bold text-sm text-white">{user.username || user.name || 'Scholar Student'}</span>
            <span className="text-[11px] text-slate-400 block">{user.email}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Account Tier</span>
            <span className={`font-bold uppercase ${user.proTier ? 'text-[#00FF87]' : 'text-amber-400'}`}>
              {user.proTier ? `${user.proTier} PRO` : 'Free Scholar'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Access Code</span>
            <span className="font-bold tracking-widest text-[#00F0FF]">
              {user.accessCode || '84920183'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Demo Account Balance</span>
            <span className="font-bold text-emerald-400 text-sm">
              ₹{user.demoBalance.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 6 Executive Performance Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-5">
          {/* Win Rate */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
              <span>Win Rate</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className={`text-2xl font-black font-mono ${metrics.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {metrics.winRate}%
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {metrics.winningTrades} Wins / {metrics.losingTrades} Losses
            </div>
          </div>

          {/* Realized P&L */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
              <span>Net Realized P&L</span>
              {metrics.totalRealizedPnl >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <div className={`text-2xl font-black font-mono ${metrics.totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.totalRealizedPnl >= 0 ? '+' : ''}₹{metrics.totalRealizedPnl.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Return: {metrics.totalPnlPercent >= 0 ? '+' : ''}{metrics.totalPnlPercent.toFixed(2)}%
            </div>
          </div>

          {/* Profit Factor */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
              <span>Profit Factor</span>
              <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black font-mono text-[#00F0FF]">
              {metrics.profitFactor}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Gross Win: ₹{metrics.grossProfit.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Average Trade P&L */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
              <span>Avg Trade P&L</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className={`text-xl font-bold font-mono ${metrics.averageTradePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.averageTradePnl >= 0 ? '+' : ''}₹{metrics.averageTradePnl.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Best: +₹{metrics.largestWin.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Risk Discipline Score */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
              <span>Risk Discipline</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-[#00FF87]">
              {metrics.riskDisciplineScore}/100
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              1% Rule Compliance
            </div>
          </div>

          {/* Total Trades & Active */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
              <span>Portfolio Activity</span>
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {metrics.totalTrades} Closed
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {metrics.openPositionsCount} Open Positions
            </div>
          </div>
        </div>

        {/* Institutional Coach Feedback Callout */}
        <div className={`mt-5 p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 leading-relaxed text-xs font-mono ${
          metrics.totalTrades === 0
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
            : metrics.totalRealizedPnl >= 0
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
        }`}>
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-[#00FF87]" />
          <div className="space-y-1">
            <strong className="block uppercase tracking-wider font-bold text-white">
              SMC Performance Review Verdict:
            </strong>
            <p>
              {metrics.totalTrades === 0
                ? 'You currently have zero closed trades in this session. Practice paper trades in the Trading Terminal to build your audited performance record.'
                : metrics.winRate >= 50 && metrics.totalRealizedPnl >= 0
                ? `Excellent statistical performance. Win rate is standing at ${metrics.winRate}% with an optimal Profit Factor of ${metrics.profitFactor}. Continue taking only high-probability Order Block / FVG setups.`
                : metrics.totalRealizedPnl >= 0
                ? `Positive Expectancy. Even though your win rate is ${metrics.winRate}%, you are profitably extracting asymmetric returns (+₹${metrics.totalRealizedPnl.toLocaleString('en-IN')}) by cutting losses early and letting runners hit TP.`
                : `Capital Drawdown detected. Total realized P&L is -₹${Math.abs(metrics.totalRealizedPnl).toLocaleString('en-IN')}. Verify stop-loss discipline and ensure risk per trade is strictly capped at 1% of equity.`}
            </p>
          </div>
        </div>

        {/* Trade Log Section */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Closed Trade Audit Log ({closedTrades.length})</span>
            </h3>

            {closedTrades.length === 0 && onUpdateUser && (
              <button
                onClick={handleSeedBenchmarkTrades}
                className="text-xs font-mono text-[#00FF87] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load 5 Benchmark Practice Trades</span>
              </button>
            )}
          </div>

          {closedTrades.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E17] border-white/5'
            }`}>
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
              <p className="text-xs font-mono text-slate-400">
                No closed trades yet. Once you buy or sell assets and close positions in the Trading Terminal, each execution is verified and logged here.
              </p>
              {onUpdateUser && (
                <button
                  onClick={handleSeedBenchmarkTrades}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30 hover:bg-[#00FF87]/25 transition cursor-pointer"
                >
                  Seed Benchmark Practice Trades to Test Export
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left font-mono text-xs">
                <thead className={`border-b text-[10px] uppercase font-bold ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#0A0E17] border-white/10 text-slate-400'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Entry</th>
                    <th className="py-2.5 px-3 text-right">Exit</th>
                    <th className="py-2.5 px-3 text-right">Net P&L</th>
                    <th className="py-2.5 px-3 text-right">Return %</th>
                    <th className="py-2.5 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {closedTrades.map((t, idx) => {
                    const isProfit = t.pnl >= 0;
                    return (
                      <tr 
                        key={t.id || idx}
                        className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}
                      >
                        <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{t.symbol}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{t.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">₹{t.entryPrice.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">₹{t.exitPrice.toLocaleString('en-IN')}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? '+' : ''}₹{t.pnl.toLocaleString('en-IN')}
                        </td>
                        <td className={`py-2.5 px-3 text-right ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {t.timestamp ? new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Open Positions Section if any */}
        {openPositions.length > 0 && (
          <div className="mt-5 space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Active Open Positions ({openPositions.length})
            </h4>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-[#0A0E17] text-slate-400">
                  <tr>
                    <th className="py-2 px-3">Symbol</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Entry Price</th>
                    <th className="py-2 px-3 text-right">Stop Loss</th>
                    <th className="py-2 px-3 text-right">Take Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {openPositions.map((pos, pIdx) => (
                    <tr key={pos.id || pIdx}>
                      <td className="py-2 px-3 font-bold text-white">{pos.assetSymbol}</td>
                      <td className="py-2 px-3 text-emerald-400">{pos.type}</td>
                      <td className="py-2 px-3 text-right">{pos.quantity}</td>
                      <td className="py-2 px-3 text-right">₹{pos.entryPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right text-slate-400">{pos.stopLoss ? `₹${pos.stopLoss.toLocaleString('en-IN')}` : 'None'}</td>
                      <td className="py-2 px-3 text-right text-slate-400">{pos.takeProfit ? `₹${pos.takeProfit.toLocaleString('en-IN')}` : 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Bottom Sticky Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Official Samzen Conglomerate Simulator Record • 100% Client-Side Verified</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-mono font-bold hover:bg-white/5 transition cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 bg-gradient-to-r from-[#00FF87] to-[#00F0FF] text-[#0A0E17] hover:opacity-90 shadow-[0_0_20px_rgba(0,255,135,0.4)] transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Formatted PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
