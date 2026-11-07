export type MarketType = 'stocks' | 'forex' | 'crypto';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type ProTier = 'weekly' | 'monthly' | 'yearly' | 'lifetime';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown-like rich text
  dayIndex: number; // For drip lock (e.g., Day 1 has topics 0,1; Day 2 has 2,3, etc.)
  quiz: QuizQuestion[];
  videoUrl?: string; // Simulated robotic video url
  videoDuration?: string; // e.g. "18:45"
  videoTitle?: string;
}

export interface Course {
  market: MarketType;
  level: CourseLevel;
  topics: Topic[];
}

export interface TradingAsset {
  symbol: string;
  name: string;
  price: number;
  change: number; // percentage change
  type: 'stock' | 'forex' | 'crypto';
  history: number[]; // chart history
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  exchange?: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE' | 'FOREX' | 'BINANCE' | 'COMMODITY';
  sector?: string;
}

export interface TradePosition {
  id?: string;
  assetSymbol: string;
  assetName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  timestamp: string;
  stopLoss?: number;
  takeProfit?: number;
  status?: 'OPEN' | 'CLOSED' | 'PENDING_AMO';
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: string;
}

export interface LimitOrder {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  targetPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  note?: string;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  quantity: number;
  averageEntryPrice: number;
}

export interface UserProfile {
  email: string;
  username?: string;
  accessCode?: string; // 8-digit unique code
  name?: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'email_otp' | 'phone_otp' | 'password' | 'access_code';
  phoneNumber?: string;
  joinedAt: string; // ISO String
  proTier: ProTier | null;
  proExpiresAt: string | null; // ISO String or null (null for lifetime/no pro)
  paperTradingPassExpiresAt: string | null; // ISO String for day pass (₹9)
  demoBalance: number;
  progress: string[]; // List of topic IDs completed
  quizScores: Record<string, number>; // quizId -> best percentage score
  positions: TradePosition[];
  holdings: PortfolioHolding[];
  closedTrades?: ClosedTrade[];
  limitOrders?: LimitOrder[];
  priceAlerts?: PriceAlert[];
  interest?: 'stocks' | 'forex' | 'crypto';
  knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningGoal?: string;
  isPersonalizedSet?: boolean;
  isTrial?: boolean;
  trialExpiresAt?: string | null;
  deviceFingerprint?: string;
  isDeactivated?: boolean;
  isAdmin?: boolean;
  mobileNumber?: string;
  deviceName?: string;
  gmailAddress?: string;
  invoice?: DigitalInvoice;
  subscriptionAmountPaid?: number;
  transactionHistory: {
    id: string;
    type: 'DEPOSIT' | 'BUY' | 'SELL';
    symbol?: string;
    amount: number; // Cash change
    shares?: number;
    price?: number;
    timestamp: string;
  }[];
}

export interface DigitalInvoice {
  invoiceId: string;
  transactionId: string;
  username: string;
  email: string;
  mobileNumber: string;
  deviceName: string;
  deviceFingerprint?: string;
  planName: string;
  proTier: ProTier;
  amount: number;
  currency: string;
  timestamp: string;
  expiresAt: string;
  accessCode: string;
  status: 'PAID' | 'REFUNDED' | 'DISPUTED';
  qrPayload: string;
  signature?: string;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  mobileNumber?: string;
  deviceName?: string;
  gmailAddress?: string;
  accessCode: string;
  password?: string;
  joinedAt: string;
  proTier: ProTier | null;
  proExpiresAt: string | null;
  isTrial: boolean;
  trialExpiresAt: string | null;
  deviceFingerprint?: string;
  status: 'active_trial' | 'active_pro' | 'expired' | 'banned' | 'deactivated';
  subscriptionDays: number;
  amountPaid: number;
  demoBalance: number;
  lastActive: string;
  invoice?: DigitalInvoice;
}

export interface MailboxItem {
  id: string;
  type: 'feedback' | 'refund' | 'support' | 'bug';
  userId?: string;
  username?: string;
  userEmail?: string;
  mobileNumber?: string;
  invoiceId?: string;
  qrPayload?: string;
  paymentTimestamp?: string;
  isEligibleForRefund?: boolean;
  subject?: string;
  message: string;
  createdAt: string;
  status: 'new' | 'reviewed' | 'resolved';
  adminNotes?: string;
}

