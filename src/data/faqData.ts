export interface FAQItem {
  id: string;
  category: 'Indian Equities & F&O' | 'Forex' | 'Crypto' | 'Options' | 'Simulator & Risk';
  question: string;
  answer: string;
  tags: string[];
}

export const TRADING_FAQS: FAQItem[] = [
  // --- Indian Equities & F&O ---
  {
    id: 'in-1',
    category: 'Indian Equities & F&O',
    question: 'What are the exact trading hours for the Indian Stock Market (NSE / BSE)?',
    answer: 'The Indian stock exchanges operate Monday through Friday from 09:15 AM to 03:30 PM IST. A pre-market order collection window runs from 09:00 AM to 09:08 AM IST. The exchanges are completely closed on Saturdays, Sundays, and notified exchange holidays.',
    tags: ['Hours', 'NSE', 'BSE', 'Timing']
  },
  {
    id: 'in-2',
    category: 'Indian Equities & F&O',
    question: 'What is the difference between MIS (Intraday) and CNC / NRML (Delivery) in Indian markets?',
    answer: 'MIS (Margin Intraday Square-off) gives intraday leverage (up to 5x for equities) but automatically auto-squares off by 03:15–03:20 PM IST. CNC (Cash and Carry) requires 100% upfront capital and allows holding shares overnight in your Demat account with zero liquidation urgency.',
    tags: ['MIS', 'CNC', 'Intraday', 'Delivery']
  },
  {
    id: 'in-3',
    category: 'Indian Equities & F&O',
    question: 'What is Securities Transaction Tax (STT) and stamp duty on Indian trades?',
    answer: 'STT is levied by the Government of India on transactions made on domestic stock exchanges. For equity delivery, STT is 0.1% on both buy and sell legs. For equity intraday, STT is 0.025% on the sell side only. For equity options, STT is charged on the premium turnover.',
    tags: ['Taxes', 'STT', 'Charges']
  },
  {
    id: 'in-4',
    category: 'Indian Equities & F&O',
    question: 'What are Nifty 50 and Bank Nifty lot sizes?',
    answer: 'In the Indian derivatives segment, contracts are traded in standardized lot sizes set by SEBI. For Nifty 50, standard lot size is 25 (or revised periodically by exchange circulars). For Bank Nifty, lot sizes trade in multiples of 15. You cannot trade fractional quantities in F&O.',
    tags: ['Nifty', 'BankNifty', 'Lot Size', 'F&O']
  },

  // --- Forex ---
  {
    id: 'fx-1',
    category: 'Forex',
    question: 'How do Forex market sessions work across timezones?',
    answer: 'The global Forex market operates 24 hours a day, 5 days a week, moving across four primary trading sessions: Sydney (10 PM to 7 AM GMT), Tokyo (12 AM to 9 AM GMT), London (8 AM to 5 PM GMT), and New York (1 PM to 10 PM GMT). The highest volume and volatility occur during the London-New York session overlap (1:00 PM to 5:00 PM GMT).',
    tags: ['Sessions', 'London', 'New York', 'Volume']
  },
  {
    id: 'fx-2',
    category: 'Forex',
    question: 'What is a PIP and how do you calculate its monetary value?',
    answer: 'A PIP (Percentage in Point) is the standard unit of measurement for currency price changes. For most currency pairs (like EUR/USD), 1 pip equals 0.0001. For Yen pairs (like USD/JPY), 1 pip equals 0.01. On a standard lot (100,000 units) of EUR/USD, a 1 pip movement equals exactly $10 USD.',
    tags: ['Pip', 'Lot Size', 'EUR/USD']
  },
  {
    id: 'fx-3',
    category: 'Forex',
    question: 'What are Major, Minor, and Exotic currency pairs?',
    answer: 'Major pairs always include the US Dollar paired with another major economy currency (EUR/USD, GBP/USD, USD/JPY, AUD/USD) and have the highest liquidity and lowest spreads. Minor pairs (crosses) exclude USD (e.g., EUR/GBP, GBP/JPY). Exotic pairs pair a major currency with a developing economy (e.g., USD/ZAR, USD/TRY) and have wider spreads and heightened volatility.',
    tags: ['Majors', 'Crosses', 'Exotics']
  },

  // --- Crypto ---
  {
    id: 'cr-1',
    category: 'Crypto',
    question: 'Why do crypto markets trade 24/7/365 without closing?',
    answer: 'Unlike traditional centralized stock exchanges with national regulatory boundaries and local clearing houses, cryptocurrencies operate on global, decentralized blockchain networks with automated smart contracts and peer-to-peer liquidity pools that never sleep or shut down for weekends.',
    tags: ['24/7', 'Decentralized', 'Crypto']
  },
  {
    id: 'cr-2',
    category: 'Crypto',
    question: 'What is the difference between Spot trading and Futures/Perpetual contracts?',
    answer: 'In Spot trading, you own the underlying cryptocurrency asset directly in your wallet. In Perpetual Futures (Perps), you trade derivative contracts tracking the index price without an expiration date, using funding rates (settled every 8 hours) to keep the contract price pegged to spot.',
    tags: ['Spot', 'Perpetuals', 'Funding Rate']
  },
  {
    id: 'cr-3',
    category: 'Crypto',
    question: 'What is Slippage and how can it be minimized in fast-moving crypto?',
    answer: 'Slippage is the difference between the expected order execution price and the actual fill price. It happens during rapid market moves or when placing large market orders in thin order books. Use Limit Orders rather than Market Orders to completely avoid negative slippage.',
    tags: ['Slippage', 'Order Execution', 'Volatility']
  },

  // --- Options ---
  {
    id: 'opt-1',
    category: 'Options',
    question: 'What is Theta Decay and why does it penalize option buyers?',
    answer: 'Theta is the rate of decline in the value of an option due to the passage of time. Because options have an expiration date, their extrinsic (time) value steadily decays every single day even if the underlying price does not move. Theta decay accelerates exponentially in the final 7 days before expiration.',
    tags: ['Theta', 'Decay', 'Option Greeks']
  },
  {
    id: 'opt-2',
    category: 'Options',
    question: 'What is the Put-Call Ratio (PCR) and how do institutional traders use it?',
    answer: 'PCR is calculated by dividing total Put Open Interest by total Call Open Interest. It serves as a powerful sentiment and contrarian indicator. When PCR drops below 0.65, call open interest is overly dominant, indicating an oversold bounce candidate. When PCR exceeds 1.45, excessive complacency warns of potential top-heavy correction.',
    tags: ['PCR', 'Open Interest', 'Contrarian']
  },
  {
    id: 'opt-3',
    category: 'Options',
    question: 'What is India VIX and how does it correlate with Nifty option premiums?',
    answer: 'India VIX measures the expected 30-day market volatility derived from Nifty option bid-ask quotes. When VIX is low (<12), option premiums are cheap, favoring directional option buying. When VIX spikes above 18–20, implied volatility swells option prices, making option selling strategies (iron condors, credit spreads) highly favorable.',
    tags: ['VIX', 'Volatility', 'Premiums']
  },

  // --- Simulator & Risk ---
  {
    id: 'sim-1',
    category: 'Simulator & Risk',
    question: 'How realistic is the Samzen TradeLearn Paper Trading simulator?',
    answer: 'The simulator replicates real-world institutional terminal execution: live tick synchronization via WebSocket, authentic TradingView candlestick rendering, real market hours logic for global exchanges, bid-ask spreads, and realistic slippage modeling so your paper performance transfers directly to live trading.',
    tags: ['Simulator', 'TradingView', 'Real-time']
  },
  {
    id: 'sim-2',
    category: 'Simulator & Risk',
    question: 'Why should I never risk more than 1% of my account on a single setup?',
    answer: 'The 1% risk rule protects you from mathematical ruin. Even a professional trader with a 65% win rate will inevitably face 5–7 consecutive losses due to statistical clustering. If you risk 10% per trade, 6 losses destroy over 46% of your capital. At 1% risk, 6 losses represent only ~5.8% drawdown, which is effortlessly recoverable.',
    tags: ['1% Rule', 'Drawdown', 'Capital Preservation']
  },
  {
    id: 'sim-3',
    category: 'Simulator & Risk',
    question: 'What is a trailing stop-loss and when should I activate it?',
    answer: 'A trailing stop automatically moves upward with price as your trade becomes profitable, locking in gains while leaving upside potential open. Activate trailing stops after your trade achieves at least a 1:1 or 1:1.5 Risk-to-Reward milestone, anchoring the stop below the latest higher swing low on your execution timeframe.',
    tags: ['Trailing Stop', 'Profit Lock', 'Exit Strategy']
  }
];
