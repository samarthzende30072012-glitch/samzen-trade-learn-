import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserProfile } from '../types';

interface PerformanceGraphProps {
  user: UserProfile;
  theme: 'dark' | 'light';
}

export default function PerformanceGraph({ user, theme }: PerformanceGraphProps) {
  const isLight = theme === 'light';

  const data = useMemo(() => {
    const history = user.transactionHistory || [];
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get initial balance from first transaction or assume 0
    let currentBalance = 0;
    
    // Group transactions by day
    const dailyBalances: Record<string, number> = {};
    
    // Initialize last 30 days
    for (let i = 0; i <= 30; i++) {
        const d = new Date(thirtyDaysAgo);
        d.setDate(thirtyDaysAgo.getDate() + i);
        dailyBalances[d.toISOString().split('T')[0]] = 0;
    }

    // Sort transactions
    const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate daily balances
    let runningBalance = 0;
    for (const tx of sortedHistory) {
      const txDate = tx.timestamp.split('T')[0];
      if (tx.type === 'DEPOSIT') {
        runningBalance += tx.amount;
      } else if (tx.type === 'BUY' || tx.type === 'SELL') {
        // This is tricky, buy/sell affects holding, not cash balance directly unless we have cash flow info
        // Simplified approach for performance graph: track deposit only or use total asset value if possible.
        // Given only transactionHistory and demoBalance, we assume demoBalance is the end result.
        // For simplicity here, just plot deposits
      }
      if (dailyBalances.hasOwnProperty(txDate)) {
        dailyBalances[txDate] = runningBalance;
      }
    }

    // Fill missing days
    let lastKnownBalance = 0;
    return Object.entries(dailyBalances).map(([date, balance]) => {
        if (balance === 0) {
            balance = lastKnownBalance;
        } else {
            lastKnownBalance = balance;
        }
        return { date: date.split('-').slice(1).join('/'), balance };
    });
  }, [user.transactionHistory]);

  return (
    <div className={`p-6 rounded-3xl border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0E1726] border-white/10'}`}>
      <h3 className={`text-lg font-serif font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
        Demo Account Performance (30 Days)
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isLight ? '#059669' : '#00FF87'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isLight ? '#059669' : '#00FF87'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#1E293B'} />
            <XAxis dataKey="date" stroke={isLight ? '#64748B' : '#64748B'} tick={{fontSize: 10}} />
            <YAxis stroke={isLight ? '#64748B' : '#64748B'} tick={{fontSize: 10}} />
            <Tooltip 
              contentStyle={{ backgroundColor: isLight ? '#fff' : '#0A0E17', border: 'none', borderRadius: '12px' }}
              itemStyle={{ color: isLight ? '#000' : '#00FF87', fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="balance" stroke={isLight ? '#059669' : '#00FF87'} fillOpacity={1} fill="url(#colorBalance)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
