import { TradingAsset } from '../types';

export const UNIVERSAL_ASSETS: TradingAsset[] = [
  // ==========================================
  // 1. INDIAN EQUITIES & INDICES (NSE / BSE)
  // ==========================================
  { symbol: 'NIFTY50', name: 'Nifty 50 Benchmark Index', price: 24385.50, change: -0.45, type: 'stock', history: [], exchange: 'NSE', sector: 'Indices' },
  { symbol: 'BANKNIFTY', name: 'Nifty Bank Index', price: 51220.80, change: -0.62, type: 'stock', history: [], exchange: 'NSE', sector: 'Indices' },
  { symbol: 'FINNIFTY', name: 'Nifty Financial Services Index', price: 23640.20, change: -0.38, type: 'stock', history: [], exchange: 'NSE', sector: 'Indices' },
  { symbol: 'SENSEX', name: 'BSE Sensex Benchmark Index', price: 80110.60, change: -0.48, type: 'stock', history: [], exchange: 'BSE', sector: 'Indices' },
  
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2985.40, change: -0.32, type: 'stock', history: [], exchange: 'NSE', sector: 'Energy & Telecom' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3945.00, change: -0.85, type: 'stock', history: [], exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1682.50, change: -0.42, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Ltd.', price: 1860.20, change: -1.25, type: 'stock', history: [], exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1248.80, change: 0.35, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', price: 982.50, change: -0.95, type: 'stock', history: [], exchange: 'NSE', sector: 'Automobile' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 840.10, change: -0.55, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1425.60, change: 0.75, type: 'stock', history: [], exchange: 'NSE', sector: 'Telecom' },
  { symbol: 'ITC', name: 'ITC Limited', price: 494.20, change: 0.18, type: 'stock', history: [], exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', price: 159.80, change: -1.45, type: 'stock', history: [], exchange: 'NSE', sector: 'Metals & Mining' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', price: 3125.00, change: 0.65, type: 'stock', history: [], exchange: 'NSE', sector: 'Conglomerate' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', price: 1785.40, change: -0.22, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', price: 1195.00, change: -0.68, type: 'stock', history: [], exchange: 'NSE', sector: 'Banking' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', price: 3620.00, change: 0.85, type: 'stock', history: [], exchange: 'NSE', sector: 'Engineering' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', price: 12450.00, change: -0.72, type: 'stock', history: [], exchange: 'NSE', sector: 'Automobile' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd.', price: 265.50, change: 2.45, type: 'stock', history: [], exchange: 'NSE', sector: 'Consumer Internet' },

  // ==========================================
  // 2. GLOBAL CRYPTOCURRENCIES (24/7 LIVE STREAMED)
  // ==========================================
  { symbol: 'BTC/USD', name: 'Bitcoin (Live Binance Stream)', price: 67320.00, change: -1.25, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Digital Gold / L1' },
  { symbol: 'ETH/USD', name: 'Ethereum (Live Binance Stream)', price: 2515.50, change: -1.82, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Smart Contracts' },
  { symbol: 'SOL/USD', name: 'Solana (Live Binance Stream)', price: 174.40, change: 2.15, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'High Performance L1' },
  { symbol: 'BNB/USD', name: 'Binance Coin (Live Stream)', price: 588.60, change: -0.45, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Exchange Ecosystem' },
  { symbol: 'XRP/USD', name: 'XRP Ripple (Live Stream)', price: 0.528, change: -2.10, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Payments' },
  { symbol: 'DOGE/USD', name: 'Dogecoin (Live Stream)', price: 0.138, change: 3.40, type: 'crypto', history: [], exchange: 'BINANCE', sector: 'Memecoin' },

  // ==========================================
  // 3. FOREX & COMMODITIES
  // ==========================================
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0825, change: -0.18, type: 'forex', history: [], exchange: 'FOREX', sector: 'Major Currency' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2965, change: -0.25, type: 'forex', history: [], exchange: 'FOREX', sector: 'Major Currency' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 153.20, change: 0.45, type: 'forex', history: [], exchange: 'FOREX', sector: 'Major Currency' },
  { symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', price: 84.18, change: 0.05, type: 'forex', history: [], exchange: 'FOREX', sector: 'Emerging Cross' },
  { symbol: 'XAU/USD', name: 'Spot Gold / US Dollar', price: 2738.40, change: 0.65, type: 'forex', history: [], exchange: 'COMMODITY', sector: 'Precious Metals' },
  { symbol: 'USOIL', name: 'WTI Crude Oil', price: 71.40, change: -1.65, type: 'forex', history: [], exchange: 'COMMODITY', sector: 'Energy' },

  // ==========================================
  // 4. US EQUITIES
  // ==========================================
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 262.40, change: 3.85, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Automotive & AI' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 231.20, change: 0.45, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Consumer Tech' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 141.50, change: 2.15, type: 'stock', history: [], exchange: 'NASDAQ', sector: 'Semiconductors & AI' }
];
