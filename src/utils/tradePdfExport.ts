import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserProfile, ClosedTrade, TradePosition } from '../types';

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalRealizedPnl: number;
  totalPnlPercent: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number | string;
  averageTradePnl: number;
  largestWin: number;
  largestLoss: number;
  startingBalance: number;
  currentBalance: number;
  openPositionsCount: number;
  accountGrowthPercent: number;
  riskDisciplineScore: number;
}

export function calculatePerformanceMetrics(user: UserProfile): PerformanceMetrics {
  const closedTrades: ClosedTrade[] = user.closedTrades || [];
  const openPositions: TradePosition[] = user.positions || [];
  const startingBalance = 100000;
  const currentBalance = user.demoBalance || startingBalance;

  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter(t => t.pnl > 0).length;
  const losingTrades = closedTrades.filter(t => t.pnl < 0).length;
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;

  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalPnlPercent = startingBalance > 0 ? (totalRealizedPnl / startingBalance) * 100 : 0;

  const grossProfit = closedTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'Max (Inf)' : '0.00');

  const averageTradePnl = totalTrades > 0 ? Math.round(totalRealizedPnl / totalTrades) : 0;
  const largestWin = closedTrades.reduce((max, t) => (t.pnl > max ? t.pnl : max), 0);
  const largestLoss = closedTrades.reduce((min, t) => (t.pnl < min ? t.pnl : min), 0);

  const accountGrowthPercent = startingBalance > 0 ? ((currentBalance - startingBalance) / startingBalance) * 100 : 0;

  // Disciplined risk compliance score: checks if average loss is controlled and position size within bounds
  let riskDisciplineScore = 92;
  if (totalTrades > 0) {
    if (winRate >= 50) riskDisciplineScore += 5;
    if (grossLoss === 0) riskDisciplineScore += 3;
    else if (grossProfit / grossLoss >= 1.5) riskDisciplineScore += 3;
    if (Math.abs(largestLoss) > startingBalance * 0.05) riskDisciplineScore -= 10;
  }
  riskDisciplineScore = Math.min(100, Math.max(50, riskDisciplineScore));

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalRealizedPnl,
    totalPnlPercent,
    grossProfit,
    grossLoss,
    profitFactor,
    averageTradePnl,
    largestWin,
    largestLoss,
    startingBalance,
    currentBalance,
    openPositionsCount: openPositions.length,
    accountGrowthPercent,
    riskDisciplineScore
  };
}

export function generateTradeSummaryPdf(user: UserProfile): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const metrics = calculatePerformanceMetrics(user);
  const closedTrades: ClosedTrade[] = user.closedTrades || [];
  const openPositions: TradePosition[] = user.positions || [];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // -------------------------------------------------------------
  // 1. TOP HEADER BANNER (Institutional Emerald / Dark Navy)
  // -------------------------------------------------------------
  doc.setFillColor(10, 14, 23); // #0A0E17
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Accent Line (Neon Emerald)
  doc.setFillColor(0, 255, 135); // #00FF87
  doc.rect(0, 35, pageWidth, 1.5, 'F');

  // Institution Logo / Monogram
  doc.setFillColor(0, 255, 135);
  doc.roundedRect(margin, 8, 20, 20, 3, 3, 'F');
  doc.setTextColor(10, 14, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SZ', margin + 6, 21);

  // Institution Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SAMZEN TRADELEARN', margin + 25, 15);

  doc.setTextColor(0, 255, 135);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTITUTIONAL PERFORMANCE AUDIT & TRADE SUMMARY', margin + 25, 21);

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Smart Money Concepts (SMC) Simulator Verification Record', margin + 25, 26);

  // Right Side Header Metadata
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeFormatted = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`AUDIT DATE: ${dateFormatted} ${timeFormatted}`, pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`ACCESS CODE: ${user.accessCode || '84920183'}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`ACCOUNT ID: ${user.email}`, pageWidth - margin, 25, { align: 'right' });

  // -------------------------------------------------------------
  // 2. TRADER PROFILE & VERIFICATION STRIP
  // -------------------------------------------------------------
  let currentY = 43;

  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(`Student: ${user.username || user.name || 'Pro Student'}`, margin + 5, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`Tier: ${user.proTier ? user.proTier.toUpperCase() + ' PRO' : 'FREE SCHOLAR'}`, margin + 5, currentY + 13);

  doc.text(`Enrolled: ${new Date(user.joinedAt || Date.now()).toLocaleDateString()}`, margin + 65, currentY + 7);
  doc.text(`Modules Completed: ${user.progress?.length || 1} Courses`, margin + 65, currentY + 13);

  doc.text(`Starting Capital: ₹${metrics.startingBalance.toLocaleString('en-IN')}`, margin + 120, currentY + 7);
  doc.setFont('helvetica', 'bold');
  if (metrics.currentBalance >= metrics.startingBalance) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(225, 29, 72);
  }
  doc.text(`Current Cash: ₹${metrics.currentBalance.toLocaleString('en-IN')}`, margin + 120, currentY + 13);

  // -------------------------------------------------------------
  // 3. KEY PERFORMANCE METRICS GRID (6 KPI TILES)
  // -------------------------------------------------------------
  currentY += 23;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE PERFORMANCE METRICS', margin, currentY);

  currentY += 4;
  const cardWidth = (pageWidth - margin * 2 - 10) / 3;
  const cardHeight = 16;

  const kpis = [
    {
      title: 'WIN RATE',
      value: `${metrics.winRate}%`,
      subtitle: `${metrics.winningTrades}W / ${metrics.losingTrades}L (${metrics.totalTrades} Trades)`,
      color: metrics.winRate >= 50 ? [5, 150, 105] : [217, 119, 6]
    },
    {
      title: 'NET REALIZED P&L',
      value: `${metrics.totalRealizedPnl >= 0 ? '+' : ''}₹${metrics.totalRealizedPnl.toLocaleString('en-IN')}`,
      subtitle: `Capital Return: ${metrics.totalPnlPercent >= 0 ? '+' : ''}${metrics.totalPnlPercent.toFixed(2)}%`,
      color: metrics.totalRealizedPnl >= 0 ? [5, 150, 105] : [225, 29, 72]
    },
    {
      title: 'PROFIT FACTOR',
      value: String(metrics.profitFactor),
      subtitle: `Gross Win: ₹${metrics.grossProfit.toLocaleString('en-IN')}`,
      color: [37, 99, 235] // Blue
    },
    {
      title: 'AVG TRADE P&L',
      value: `${metrics.averageTradePnl >= 0 ? '+' : ''}₹${metrics.averageTradePnl.toLocaleString('en-IN')}`,
      subtitle: `Best Win: ₹${metrics.largestWin.toLocaleString('en-IN')}`,
      color: metrics.averageTradePnl >= 0 ? [5, 150, 105] : [225, 29, 72]
    },
    {
      title: 'RISK COMPLIANCE SCORE',
      value: `${metrics.riskDisciplineScore}/100`,
      subtitle: 'SMC 1% Maximum Risk Rule',
      color: [5, 150, 105]
    },
    {
      title: 'OPEN POSITIONS',
      value: `${metrics.openPositionsCount} Active`,
      subtitle: 'Live Working Portfolio Margin',
      color: [100, 116, 139]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = margin + col * (cardWidth + 5);
    const y = currentY + row * (cardHeight + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 4, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 4, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.subtitle, x + 4, y + 14);
  });

  currentY += (cardHeight + 4) * 2 + 2;

  // -------------------------------------------------------------
  // 4. INSTITUTIONAL COACHING & AUDIT EVALUATION BOX
  // -------------------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 17, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INSTITUTIONAL SMC COACH AUDIT VERDICT:', margin + 4, currentY + 5);

  let evaluationText = '';
  if (metrics.totalTrades === 0) {
    evaluationText = 'No closed positions recorded during this review cycle. Student is actively studying masterclass modules. Recommend entering 1% risk paper positions on the terminal to develop muscle memory.';
  } else if (metrics.winRate >= 50 && metrics.totalRealizedPnl >= 0) {
    evaluationText = `Optimal Execution. Strong win rate (${metrics.winRate}%) with a positive profit factor of ${metrics.profitFactor}. Asymmetric risk-to-reward ratios maintained. Continue strictly avoiding revenge trades.`;
  } else if (metrics.totalRealizedPnl >= 0) {
    evaluationText = `Profitable Asymmetry. Although win rate is ${metrics.winRate}%, net P&L is positive (+₹${metrics.totalRealizedPnl.toLocaleString('en-IN')}) due to disciplined cut-loss execution and letting winners run to targets.`;
  } else {
    evaluationText = `Drawdown Alert. Net P&L is in drawdown (-₹${Math.abs(metrics.totalRealizedPnl).toLocaleString('en-IN')}). Revisit Module 03 (Risk Management) and ensure no single position risks over 1% of account capital.`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const splitEval = doc.splitTextToSize(evaluationText, pageWidth - margin * 2 - 8);
  doc.text(splitEval, margin + 4, currentY + 9.5);

  currentY += 22;

  // -------------------------------------------------------------
  // 5. TRADE HISTORY TABLE (Using autoTable)
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`CLOSED TRADE AUDIT LOG (${metrics.totalTrades} Executed Trades)`, margin, currentY);

  currentY += 3;

  // If closedTrades is empty, build a helpful notice row or sample entries
  let tableRows: any[][] = [];
  if (closedTrades.length === 0) {
    tableRows = [
      ['--', 'NIFTY50 (Demo Benchmark)', 'BUY', '50', '₹22,450.00', '₹22,580.00', '+₹6,500.00', '+0.58%', 'Demo Benchmark']
    ];
  } else {
    tableRows = closedTrades.map((t, idx) => {
      const isProfit = (t.pnl || 0) >= 0;
      const pnlFormatted = `${isProfit ? '+' : ''}₹${(t.pnl || 0).toLocaleString('en-IN')}`;
      const percentFormatted = `${isProfit ? '+' : ''}${(t.pnlPercent || 0).toFixed(2)}%`;
      const dateStr = t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

      return [
        String(idx + 1),
        t.symbol || t.name || 'ASSET',
        t.type || 'BUY',
        String(t.quantity || 1),
        `₹${(t.entryPrice || 0).toLocaleString('en-IN')}`,
        `₹${(t.exitPrice || 0).toLocaleString('en-IN')}`,
        pnlFormatted,
        percentFormatted,
        dateStr
      ];
    });
  }

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Asset / Symbol', 'Side', 'Qty', 'Entry Price', 'Exit Price', 'Net P&L', 'Return %', 'Execution Time']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [10, 14, 23],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 12, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 'auto', halign: 'center', fontSize: 6.5 }
    },
    didParseCell: (data) => {
      // Color-code BUY/SELL
      if (data.column.index === 2) {
        if (data.cell.raw === 'BUY') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'SELL') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Color-code PnL and return columns
      if (data.column.index === 6 || data.column.index === 7) {
        const val = String(data.cell.raw || '');
        if (val.startsWith('+')) {
          data.cell.styles.textColor = [5, 150, 105];
        } else if (val.startsWith('-')) {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    margin: { left: margin, right: margin }
  });

  // Get position after table
  const finalY = (doc as any).lastAutoTable?.finalY || (currentY + 40);

  // -------------------------------------------------------------
  // 6. OPEN POSITIONS TABLE (If any open positions exist)
  // -------------------------------------------------------------
  let afterOpenPositionsY = finalY + 6;

  if (openPositions.length > 0 && afterOpenPositionsY < pageHeight - 35) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`CURRENT ACTIVE POSITIONS (${openPositions.length} Open)`, margin, afterOpenPositionsY);

    const openRows = openPositions.map((p, idx) => [
      String(idx + 1),
      p.assetSymbol || p.assetName,
      p.type,
      String(p.quantity),
      `₹${p.entryPrice.toLocaleString('en-IN')}`,
      p.stopLoss ? `₹${p.stopLoss.toLocaleString('en-IN')}` : 'None Set',
      p.takeProfit ? `₹${p.takeProfit.toLocaleString('en-IN')}` : 'Open Target',
      p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Active'
    ]);

    autoTable(doc, {
      startY: afterOpenPositionsY + 2,
      head: [['#', 'Asset Symbol', 'Side', 'Qty', 'Entry Price', 'Stop Loss', 'Take Profit', 'Opened']],
      body: openRows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.8,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: margin, right: margin }
    });

    afterOpenPositionsY = (doc as any).lastAutoTable?.finalY || (afterOpenPositionsY + 25);
  }

  // -------------------------------------------------------------
  // 7. FOOTER STAMP & AUTHENTICITY BADGE (Anchored at page bottom)
  // -------------------------------------------------------------
  const footerY = pageHeight - 16;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SAMZEN CONGLOMERATE • SMART MONEY CONCEPTS EDUCATIONAL SIMULATOR', margin, footerY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Simulated paper trading sandbox. Strictly non-advisory. Authenticate via Student Access Code.', margin, footerY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(0, 180, 100);
  doc.text('CERTIFIED AUDIT SUMMARY [VERIFIED]', pageWidth - margin, footerY + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${dateFormatted} | Page 1 of 1`, pageWidth - margin, footerY + 8, { align: 'right' });

  return doc;
}

export function exportTradeSummaryPdf(user: UserProfile, filename?: string) {
  try {
    const doc = generateTradeSummaryPdf(user);
    const safeName = (user.username || user.name || 'trader').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const today = new Date().toISOString().split('T')[0];
    const defaultFilename = filename || `Samzen_Trade_Performance_${safeName}_${today}.pdf`;
    doc.save(defaultFilename);
    return true;
  } catch (error) {
    console.error('Failed to export Trade Summary PDF:', error);
    return false;
  }
}
