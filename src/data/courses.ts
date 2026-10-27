import { Course, Topic, QuizQuestion, MarketType, CourseLevel } from '../types';

// Seeded generator to ensure consistent generation across renders without using external math libraries
function getSeededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

// 1. Handcrafted Baseline Topics with Deep Indian Market context
const HandcraftedStocksBeginner: Topic[] = [
  {
    id: 'stocks-beg-1',
    title: 'NSE, BSE, and the Indian Capital Markets',
    description: 'Learn the primary foundation of Indian Equities: National Stock Exchange (NSE), Bombay Stock Exchange (BSE), and the regulator SEBI.',
    dayIndex: 0,
    content: `### Introduction to Indian Capital Markets
The Indian stock market is one of the oldest and most vibrant in the world. It is driven by two primary national stock exchanges:
1. **National Stock Exchange (NSE):** Established in 1992, NSE introduced fully automated screen-based electronic trading in India. Its benchmark index is the **Nifty 50**.
2. **Bombay Stock Exchange (BSE):** Established in 1875, BSE is Asia's first stock exchange. Its benchmark index is the **Sensex** (Sensitivity Index).

### The Regulator: SEBI
The **Securities and Exchange Board of India (SEBI)** is the apex regulator of capital markets in India. SEBI's primary goals are to:
* Protect the interests of retail investors.
* Promote and regulate the development of stock exchanges.
* Prevent unfair trade practices and market manipulations.

### Key Indexes: Nifty 50 and Sensex
* **Nifty 50:** Comprises the 50 largest, most liquid companies listed on the NSE (such as Reliance Industries, HDFC Bank, TCS, and Infosys).
* **Sensex:** Comprises 30 financially sound and liquid companies listed on the BSE.
Both indexes utilize the free-float market capitalization-weighted method for calculation.

### Indian Demat Accounts (CDSL & NSDL)
In India, shares cannot be held in physical form. They are stored electronically in a **Demat Account** maintained by two central depositories:
* **NSDL (National Securities Depository Limited):** Backed primarily by NSE.
* **CDSL (Central Depository Services Limited):** Backed primarily by BSE.
Traders open Demat and Trading accounts through registered brokerage firms (such as Zerodha, Groww, Angel One, or traditional bank brokers).`,
    quiz: [
      {
        id: 'sb1q1',
        question: 'Which of the following is Asia\'s oldest stock exchange?',
        options: [
          'National Stock Exchange (NSE)',
          'Bombay Stock Exchange (BSE)',
          'Shanghai Stock Exchange (SSE)',
          'Tokyo Stock Exchange (TSE)'
        ],
        correctAnswerIndex: 1,
        explanation: 'The Bombay Stock Exchange (BSE), established in 1875, is Asia\'s first and oldest stock exchange.'
      },
      {
        id: 'sb1q2',
        question: 'Which regulatory body governs stock exchanges and protects investors in India?',
        options: [
          'Reserve Bank of India (RBI)',
          'Securities and Exchange Board of India (SEBI)',
          'Ministry of Finance',
          'IRDAI'
        ],
        correctAnswerIndex: 1,
        explanation: 'SEBI is the primary regulator of securities and capital markets in India.'
      }
    ]
  },
  {
    id: 'stocks-beg-2',
    title: 'Indian Brokerage Systems & Demat Accounts',
    description: 'Understand the difference between discount brokers (Zerodha, Groww) and traditional brokers, plus Demat vs Trading accounts.',
    dayIndex: 0,
    content: `### Trading Account vs. Demat Account
In the Indian stock market ecosystem, you need a dual-account structure to buy and hold shares:
* **Trading Account:** Used to place buy and sell orders. It acts as the bridge between your bank account and the stock exchange.
* **Demat Account (Dematerialized):** Acts like a secure bank locker where your financial securities (shares, mutual funds, ETFs) are stored electronically.

### Depositories: CDSL and NSDL
All Demat accounts in India are maintained by depository participants who are members of either:
* **CDSL (Central Depository Services Limited)**
* **NSDL (National Securities Depository Limited)**
The depository acts as the ultimate custodian of your digital share certificates.

### Broker Categories in India
1. **Discount Brokers:** Brokers like Zerodha, Groww, or Angel One. They offer low, flat-rate brokerages (typically ₹0 for delivery, and flat ₹20 for intraday/F&O). They do not offer advisory services.
2. **Full-Service Brokers:** Traditional firms like ICICI Direct, HDFC Securities, or Sharekhan. They charge a percentage-based brokerage but offer custom research reports, dedicated relationship managers, and offline branches.`,
    quiz: [
      {
        id: 'sb2q1',
        question: 'What is the primary function of a Demat account in India?',
        options: [
          'To transfer money from bank accounts',
          'To store purchased shares and securities electronically',
          'To buy option contracts directly',
          'To apply for tax refunds'
        ],
        correctAnswerIndex: 1,
        explanation: 'A Demat account is used purely as an electronic vault to hold your shares and securities securely.'
      }
    ]
  }
];

const HandcraftedForexBeginner: Topic[] = [
  {
    id: 'forex-beg-1',
    title: 'Introduction to Forex & USD/INR Pairs',
    description: 'Understand the global foreign exchange marketplace, major pairs, and how the Reserve Bank of India (RBI) manages currency volatility.',
    dayIndex: 0,
    content: `### What is Forex?
Forex (Foreign Exchange) is the global marketplace for exchanging national currencies. With over **$7.5 Trillion** traded daily, it is the largest, most liquid financial market in the world. It is open 24 hours a day, 5 days a week.

### The Indian Forex Ecosystem
In India, trading in foreign currency pairs is strictly regulated under the **Foreign Exchange Management Act (FEMA)**.
* Standard retail traders can trade exchange-traded currency derivatives (ETCDs) on NSE and BSE.
* The allowed pairs include: **USD/INR**, **EUR/INR**, **GBP/INR**, and **JPY/INR**.
* Cross-currency pairs like **EUR/USD**, **GBP/USD**, and **USD/JPY** are also permitted but have specific liquidity guidelines.

### Role of the Reserve Bank of India (RBI)
The **Reserve Bank of India (RBI)** continuously monitors and manages the exchange rate of the Indian Rupee (INR) against major currencies:
* **Forex Reserves:** RBI maintains massive sovereign reserves of foreign currencies (primarily USD) to guard against abrupt capital outflows.
* **Exchange Rate Intervention:** If the Rupee depreciates too rapidly, RBI may sell USD from its reserves to buy INR. If the Rupee appreciates excessively, RBI may buy USD to keep Indian exports globally competitive.`,
    quiz: [
      {
        id: 'fb1q1',
        question: 'Which regulatory body manages the foreign exchange policy and Rupee stability in India?',
        options: [
          'SEBI',
          'Reserve Bank of India (RBI)',
          'Ministry of External Affairs',
          'NITI Aayog'
        ],
        correctAnswerIndex: 1,
        explanation: 'The RBI manages monetary policy, exchange rate stability, and India\'s sovereign foreign exchange reserves.'
      }
    ]
  }
];

const HandcraftedCryptoBeginner: Topic[] = [
  {
    id: 'crypto-beg-1',
    title: 'Crypto Assets & 1% TDS Taxation in India',
    description: 'Learn the fundamentals of Bitcoin, Ethereum, and understand the rigorous Indian VDA (Virtual Digital Asset) tax rules.',
    dayIndex: 0,
    content: `### Cryptocurrency and Blockchain Basics
A cryptocurrency is a decentralized digital asset secured by cryptographic ledgers called blockchains. Bitcoin (BTC) acts as digital gold with a fixed supply cap of 21 Million, while Ethereum (ETH) serves as a decentralized smart-contract supercomputer.

### The Indian Crypto Regulatory Landscape
Indian authorities categorize cryptocurrencies as **Virtual Digital Assets (VDAs)**. Cryptocurrencies are legal to trade, but are subject to a strict national taxation regime introduced in 2022:

### Key VDA Tax Rules in India:
1. **30% Flat Tax on Income:** Any gains or profits made from trading, selling, or exchanging crypto are taxed at a flat rate of **30%** (plus applicable surcharges).
2. **No Set-Off of Losses:** You cannot offset losses in one crypto pair (e.g., losing on ETH) against profits made in another crypto pair (e.g., gaining on BTC).
3. **1% TDS (Tax Deducted at Source):** Under Section 194S of the Income Tax Act, a **1% TDS** is deducted from the seller on every single transaction on Indian crypto exchanges (like WazirX, CoinDCX, Bitbns).
4. **No Deductions Allowed:** No deductions or business expense claims are allowed except for the direct cost of acquisition.`,
    quiz: [
      {
        id: 'cb1q1',
        question: 'What flat tax rate is applied to cryptocurrency profits in India?',
        options: [
          '10%',
          '20%',
          '30%',
          '18% GST'
        ],
        correctAnswerIndex: 2,
        explanation: 'India charges a flat 30% tax on any profits realized from Virtual Digital Assets (VDAs) or cryptocurrency transactions.'
      },
      {
        id: 'cb1q2',
        question: 'What is the percentage of TDS deducted on cryptocurrency transactions on Indian exchanges?',
        options: [
          '0.1%',
          '1%',
          '5%',
          '10%'
        ],
        correctAnswerIndex: 1,
        explanation: 'A 1% Tax Deducted at Source (TDS) is charged on transaction sell values to keep track of VDA transfers under Section 194S.'
      }
    ]
  }
];

// 2. High-quality Dynamic Content Templates to safely fill up the exact counts
// beginnerCount = 14, intermediateCount = 30, advancedCount = 60

// Topic names database for Stocks, Forex, and Crypto
const StocksBeginnerTitles = [
  'NSE and BSE Ecosystem Foundations',
  'Indian Brokerage Systems & Demat Accounts',
  'Reading Nifty & Sensex Candlestick Charts',
  'Drawing Support & Resistance on Reliance Industries',
  'Volume Indicators & Trendlines on Nifty 50',
  'Risk Management and Stop-Loss on Indian Blue Chips',
  'Securities and Exchange Board of India (SEBI) Rules',
  'Pre-market, Regular and Post-market Session Timings',
  'Corporate Actions: Ex-Dates, Splits and Bonus Issues',
  'Market Cap Categories: Nifty Next 50 & Midcap Indices',
  'Indian IPOs: Allotment Ratios & Grey Market Premium (GMP)',
  'Securities Transaction Tax (STT) and Taxation Rules',
  'Indian Depositories CDSL and NSDL Vault Mechanics',
  'Averaging down vs Hedging on Core Indian Equities'
];

const StocksIntermediateTitles = [
  'Simple Moving Average (SMA) Trends on Nifty Futures',
  'Relative Strength Index (RSI) Divergences on HDFC Bank',
  'Bollinger Bands Squeeze Setups on Tata Motors',
  'Average True Range (ATR) Volatility Stops',
  'MACD Histogram Crossover Confirmation',
  'Double Tops and Double Bottoms on Bank Nifty',
  'Head and Shoulders Structural Reversals',
  'Bullish and Bearish Engulfing Candlestick Triggers',
  'The Hammer and Shooting Star Candlestick Pinbars',
  'Gaps and Window Analysis: Gap-up Openings in Earnings',
  'Pivot Points: Camarilla & Fibonacci Level Calculators',
  'Multi-Timeframe Top-Down Analysis (1D to 15M Charts)',
  'The Dow Theory: Accumulation, Markup, and Distribution',
  'Introduction to Elliott Wave Impulses and Corrections',
  'Nifty Option Chain Basics: Call and Put Options',
  'Strike Prices, Moneyness: ITM, ATM, and OTM Options',
  'Open Interest (OI) Built-up: Long Buildup vs Short Covering',
  'Fundamental Analysis Ratios: P/E and P/B Evaluators',
  'Debt-to-Equity and Dividend Yield Indicators',
  'Analyzing Quarterly Results (Q1, Q2, Q3, Q4) Filings',
  'Tracking Institutional Flows: FII (Foreign) vs DII (Domestic)',
  'Position Sizing with the Fixed-Ratio Capital Formula',
  'How Block Deals and Bulk Deals Impact Market Price',
  'The Psychology of Fear, Greed, and Overtrading',
  'Constructing and Formatting a Digital Trading Journal',
  'Backtesting Breakout Strategies with Historic NSE Data',
  'Identifying Circuit Filters and Upper/Lower Limits',
  'Algorithmic Trading Platforms & Broker APIs in India',
  'Post-Trade Performance Metrics and Win-Rate Math',
  'Trading Ranges and Channel Envelopes'
];

const StocksAdvancedTitles = Array.from({ length: 60 }, (_, i) => {
  const topics = [
    'Fibonacci Retracement and Golden Pocket Entries',
    'Smart Money Concepts (SMC): Liquidity Sweeps & Mitigation',
    'Order Flow Analysis: Imbalance Footprint Charts',
    'Options Greeks: Delta and Gamma Hedging Strategies',
    'Options Greeks: Theta Decay & Vega Volatility plays',
    'Statistical Arbitrage & Pairs Trading (Nifty Banking Stocks)',
    'High-Frequency Algorithmic Execution and Colocation',
    'Delta Neutral Options Strategies: Iron Condors & Butterflies',
    'Implied Volatility (IV) Squeeze and Crushes during Earnings',
    'Quantitative Factor Investing and Multi-Asset Portfolios',
    'Indian Derivatives Margin Rules: Peak Margin Requirements',
    'Short-Selling Securities Lending and Borrowing (SLB) Scheme',
    'Smart Money Order Blocks & Market Structure Shifts (MSS)',
    'Fair Value Gaps (FVG) and Liquidity Pool Traps',
    'Institutional Accumulation Wyckoff Schematics',
    'Hedging Equity Portfolios with Nifty index Puts',
    'Arbitrage between NSE and BSE Listings',
    'Intermarket Divergences: USD/INR vs Nifty 50 Spreads',
    'Corporate Restructuring and Mergers Arbitrage Trading',
    'VIX (Volatility Index) Masterclass for Intraday Indices'
  ];
  return topics[i % topics.length] + ` (Advanced Module ${i + 1})`;
});

// Forex dynamic titles
const ForexBeginnerTitles = Array.from({ length: 14 }, (_, i) => {
  const list = [
    'Introduction to Forex & USD/INR Pairs',
    'Pips, Lots, and Micro-Lot Size Calculations',
    'Forex Leverage & Margin Call Protection Rules',
    'Currency Majors, Minors, and Exotic Pair Structures',
    'Understanding Base vs Quote Currencies Mechanics',
    'Forex Market Hours: Tokyo, London & New York Sessions',
    'Reserve Bank of India (RBI) Forex Operations',
    'Bid-Ask Spreads and Electronic Communication Networks (ECN)',
    'Introduction to Economic Calendars for Currency Traders',
    'Analyzing USD Index (DXY) as a Macro Compass',
    'The Concept of Carry Trade and Interest Rate Spreads',
    'Spot Forex vs Currency Futures on NSE',
    'Slippage and Broker Execution Speeds',
    'Preserving Forex Trading Capital under Volatility'
  ];
  return list[i % list.length] + (i >= list.length ? ` (Part ${Math.floor(i / list.length) + 1})` : '');
});

const ForexIntermediateTitles = Array.from({ length: 30 }, (_, i) => {
  const list = [
    'Moving Average Crossovers on GBP/USD',
    'RSI Extreme Readings and Divergences on EUR/USD',
    'Economic Reports: Consumer Price Index (CPI) Inflation',
    'Central Bank Monetary Policy Decisions & Interest Rates',
    'Non-Farm Payroll (NFP) Trading Playbook',
    'Support & Resistance Floors in Highly Leveraged Pairs',
    'Bollinger Bands Outlier Sweeps in USD/JPY',
    'Average True Range (ATR) for Currency Stop-Loss Placement',
    'Chart Patterns: Descending Triangles in Euro Currency',
    'Forex Pivot Points: Standard vs Camarilla Calculations',
    'The Importance of Swap Rates (Overnight Rollover Fees)',
    'Multi-Timeframe Top-Down Strategy for Forex Intraday',
    'Economic Calendar High-Impact Event Navigation',
    'Macro Correlation: Oil Prices vs Canadian Dollar (CAD)',
    'Commodity Currency Cycles: AUD and NZD Dynamics',
    'Risk Management: Position Sizing on Forex Accounts',
    'Building a Professional Forex Trading Log',
    'Understanding Market Maker Models and Liquidity Provision',
    'Forex Order Books: Assessing Retail Sentiment Feeds',
    'Backtesting Trend-Following Strategies on Historical Forex'
  ];
  return list[i % list.length] + ` (Module ${i + 1})`;
});

const ForexAdvancedTitles = Array.from({ length: 60 }, (_, i) => {
  const list = [
    'Smart Money Concepts (SMC) in Forex Markets',
    'Order Blocks, Breaker Blocks, and Mitigation Zones',
    'Fair Value Gaps (FVG) & Price Delivery Inefficiencies',
    'Liquidity Sweeps of Previous Day Highs and Lows (PDH/PDL)',
    'Interest Rate Parity & Macro Valuation Models',
    'Algorithmic Arbitrage between Spot and Futures Forex',
    'Quantitative Momentum Models for Sovereign Currency',
    'Market Structure Breaks (MSB) vs False Change of Characters',
    'Central Bank Reserves Asset Allocations Analysis',
    'Trading the News: High-Frequency Sentiment Algos',
    'Delta-Neutral Currency Hedging for Import-Export Funds',
    'Advanced Fibonacci Confluences in FX Order Blocks'
  ];
  return list[i % list.length] + ` (Expert Module ${i + 1})`;
});

// Crypto dynamic titles
const CryptoBeginnerTitles = Array.from({ length: 14 }, (_, i) => {
  const list = [
    'Crypto Assets & 1% TDS Taxation in India',
    'Understanding Bitcoin Blockchain Ledger Foundations',
    'Ethereum, Smart Contracts, and Decentralized Applications',
    'Custodial Exchange Wallets vs Cold Hardware Wallets',
    'How to Buy, Sell, and Safe-Transfer Digital Tokens',
    'Gas Fees, Network Transactions and Congestion Mechanics',
    'Centralized (CEX) vs Decentralized (DEX) Exchanges',
    'The Concept of Bitcoin Scarcity & 21 Million Limit',
    'Introduction to Cryptography and Public/Private Keys',
    'Crypto Market Capitalization: Large-Caps vs Altcoins',
    'Stablecoins: USDT, USDC, and Fiat-Pegged collateral',
    'Spot Trading vs Margin Trading in Crypto Markets',
    'Spotting Scams: Rug Pulls and Safe Smart Contracts',
    'Safeguarding Your 12-Word Seed Phrase Seed Vaults'
  ];
  return list[i % list.length] + (i >= list.length ? ` (Part ${Math.floor(i / list.length) + 1})` : '');
});

const CryptoIntermediateTitles = Array.from({ length: 30 }, (_, i) => {
  const list = [
    'Bitcoin Halving Cycles and 4-Year Market Psychology',
    'RSI Oversold Swings & Divergences in Altcoins',
    'Moving Average Golden Cross Indicators on Bitcoin',
    'Crypto Market Cycles: Bitcoin Dominance (BTC.D) Index',
    'The Rise of Layer 1 vs Layer 2 Scaling Solutions',
    'Decentralized Finance (DeFi) Yield Pools & Liquidity Mining',
    'Non-Fungible Tokens (NFTs) and Digital Art Mechanics',
    'Crypto Bollinger Bands Breakout Volatility Scans',
    'Tracking Whales Ledger Balances & Active Address Metrics',
    'Understanding Order Books and Depth Charts on Binance',
    'Perpetual Futures: Funding Rates and Pegging Mechanics',
    'Introduction to On-Chain Transaction Analytics',
    'How Proof-of-Work (PoW) Differs from Proof-of-Stake (PoS)',
    'Crypto Mining Rig Economics vs Liquid Staking Pools',
    'Regulatory Updates: SEC Classifications & G20 Guidelines',
    'Spotting Altcoin Bottoms using RSI & MACD Divergence',
    'Risk Management: Setting Leverage on Perpetual Futures',
    'Building a Scalping Routine for Volatile Meme Assets',
    'Understanding Smart Contract Audits & Protocol Risks',
    'Backtesting Grid Trading Bots in Crypto Sandboxes'
  ];
  return list[i % list.length] + ` (Module ${i + 1})`;
});

const CryptoAdvancedTitles = Array.from({ length: 60 }, (_, i) => {
  const list = [
    'On-Chain Metrics: MVRV Ratio and Exchange Net Inflows',
    'Perpetual Funding Rate Arbitrage Strategies',
    'Liquidations and Squeezes: Tracking Long/Short Liquidation Pools',
    'Decentralized Autonomous Organizations (DAOs) Governance',
    'MEV (Maximal Extractable Value) and Sandwich Bots',
    'Algorithmic Stablecoins Backing Mechanics & Risks',
    'Zero-Knowledge (ZK) Rollups Deep Technical Review',
    'Quantitative Sentiment Analysis of Crypto Social Media',
    'Crypto Derivatives Pricing: Gamma & Vega Options Greek Hedging',
    'Statistical Arbitrage across Multiple DEX Liquidity Pools',
    'Cross-Chain Bridges Vulnerabilities and Smart Contract Security',
    'DeFi Flash Loans and Arbitrage Execution Algorithms'
  ];
  return list[i % list.length] + ` (Expert Module ${i + 1})`;
});


// Programmatic Generator Function
function generateDynamicCourse(
  market: MarketType,
  level: CourseLevel,
  handcrafted: Topic[],
  titlesList: string[],
  targetCount: number
): Course {
  const topics: Topic[] = [];
  const rng = getSeededRandom(`${market}-${level}-super-seed`);

  // Fill existing first
  handcrafted.forEach((h, idx) => {
    const qList = [...h.quiz];
    if (qList.length < 5) {
      if (qList.length < 2) {
        qList.push({
          id: `${h.id}-q2`,
          question: `Under standard capital protection rules for "${h.title}", what represents the most disciplined risk limit?`,
          options: [
            `Risking a maximum of 1% to 2% of total account equity per trade using stop-losses.`,
            `Risking your entire account balance to quickly recover from consecutive losses.`,
            `Widening stop-losses indefinitely during highly volatile sessions.`,
            `Using 50x leverage on all assets without any position sizing calculations.`
          ],
          correctAnswerIndex: 0,
          explanation: `Sizing positions defensively (maximum 1% to 2% risk) is crucial to survive multiple consecutive losing trades.`
        });
      }
      if (qList.length < 3) {
        qList.push({
          id: `${h.id}-q3`,
          question: `How should a student manage executing orders when spreads widen or liquidity is low for "${h.title}"?`,
          options: [
            `Utilize limit orders defensively, or pause trading until liquidity returns to normal.`,
            `Execute huge market buy orders immediately to jump in before prices move.`,
            `Increase position size to compensate for transaction costs and execution drag.`,
            `Switch to highly speculative cross-pairs that have wider slippage.`
          ],
          correctAnswerIndex: 0,
          explanation: `Using limit orders prevents unexpected execution price slippage when spreads are wider than normal.`
        });
      }
      qList.push({
        id: `${h.id}-q4`,
        question: `In technical analysis for "${h.title}", which factor provides the strongest validation of a key support or resistance pivot?`,
        options: [
          `High relative trading volume demonstrating massive interest and buy/sell absorption.`,
          `The price touching the level exactly at 11:30 AM regardless of volume.`,
          `A news article published in a tabloid recommending the asset.`,
          `The asset's price moving below its historical all-time low value.`
        ],
        correctAnswerIndex: 0,
        explanation: `High volume confirms that institutional capital is active at that level, validating support or resistance strength.`
      });
      qList.push({
        id: `${h.id}-q5`,
        question: `Which psychological habit separates elite practitioners of "${h.title}" from struggling traders?`,
        options: [
          `Executing trades strictly according to pre-written rules, regardless of emotions or short-term results.`,
          `Averaging down on losing positions in anger to show the market who is right.`,
          `Constantly checking price action every 30 seconds and altering strategies during live trades.`,
          `Chasing the biggest daily gainer shares on social media to double capital instantly.`
        ],
        correctAnswerIndex: 0,
        explanation: `Rule-based, emotionless discipline and strict consistency are the cornerstones of institutional-grade trading success.`
      });
    }

    // Append default diagram tags to handcrafted if they don't have one
    let expandedContent = h.content;
    if (!expandedContent.includes('[DIAGRAM:')) {
      if (h.id.includes('stocks')) {
        expandedContent += '\n\n[DIAGRAM: SUPPORT_RESISTANCE]';
      } else if (h.id.includes('forex')) {
        expandedContent += '\n\n[DIAGRAM: ORDER_BOOK_DEPTH]';
      } else {
        expandedContent += '\n\n[DIAGRAM: BLOCKCHAIN_NODES]';
      }
    }

    topics.push({
      ...h,
      content: expandedContent,
      quiz: qList,
      videoDuration: h.videoDuration || `${Math.floor(12 + rng() * 15)}:${Math.floor(rng() * 50) + 10}`,
      videoTitle: h.videoTitle || `Robotic Voice & Visualizer - ${h.title}`
    });
  });

  // Generate remaining topics to hit targetCount
  for (let i = topics.length; i < targetCount; i++) {
    const title = titlesList[i] || `${market.toUpperCase()} ${level.toUpperCase()} Topic #${i + 1}`;
    const id = `${market}-${level.substring(0, 3)}-${i + 1}`;
    
    // Day Index spreads topics out nicely over 15+ simulated days
    const dayIndex = Math.floor(i / 2);

    // Dynamic Video Duration: strictly 12 to 32 minutes as requested
    const mins = Math.floor(12 + rng() * 20); // 12 to 31
    const secs = Math.floor(rng() * 60);
    const duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // Construct highly informative Indian-market or domain-relevant content
    let customMarkdown = '';
    if (market === 'stocks') {
      customMarkdown = `### Core Concept: ${title}
This lesson provides a professional evaluation of the Indian Stock Markets. We analyze real equity instruments listed on the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE), governed under the regulatory purview of SEBI.

### 📈 Structural Framework & Market Mechanics
* **Institutional Liquidity Floors:** Large-cap Indian equities (e.g., Reliance Industries [RELIANCE], HDFC Bank [HDFCBANK], Tata Motors [TATAMOTORS]) exhibit highly structural liquidity zones. Institutional participants (FIIs and DIIs) interact daily in these pools, creating solid trading zones.
* **SEBI Volatility Measures:** Price bands and circuit filters (ranging from 2% to 20%) are strictly placed on Indian stocks to guard retail accounts against abrupt volatility.
* **Order book dynamics:** The matching of buy bids and sell asks on Indian exchanges executes on high-frequency Matching Engines with ultra-low latency.

### 🔬 Practical Intraday Checklist
1. **Premarket Setup:** Analyze global cues, SGX Nifty (Gift Nifty), and corporate earnings releases before the 9:15 AM opening bell.
2. **Delivery Percentage Analysis:** High daily delivery percentage indicates long-term institutional accumulation rather than transient speculation.
3. **Open Interest (OI):** Always confirm price breakouts on futures with expanding Open Interest, proving high conviction.

### 🛡️ Professional Risk Guidelines & Trade Sizing
Always implement a strict 1% maximum capital risk rule. Place your stop-losses defensively below institutional order blocks rather than at obvious, exposed horizontal support levels. This preserves your demo money and replicates real-world institutional guardrails.`;
    } else if (market === 'forex') {
      customMarkdown = `### Core Currency Concept: ${title}
This expert lesson covers foreign currency pairs and the global Forex market, utilizing regulatory policy insights of the Reserve Bank of India (RBI).

### 💱 Sovereign Currencies Mechanics & Interbank Trading
* **Interbank Network:** Global forex is a highly decentralized over-the-counter (OTC) market. Sovereign banks dictate cash currency flows and control overnight interest rate spreads.
* **USD/INR Settlement:** Exchange-traded currency derivatives in India are cash-settled in Indian Rupees, minimizing physical conversion fees and preserving retail capital.
* **Monetary Policy Spreads:** Interest rate differentials decided by central banks (such as the Federal Reserve and the RBI) dictate the core direction of currency trends.

### 🔬 Operational Parameters for Retail FX
1. **ECN Spreads:** Trade with ECN (Electronic Communication Network) accounts to ensure tight, close-to-zero bid-ask spreads.
2. **Economic Indicators:** Always cross-reference high-impact releases like Non-Farm Payrolls (NFP), Consumer Price Index (CPI), and central bank rate briefings.
3. **Carry Trade Spreads:** Be mindful of positive or negative overnight swap rates on carry trade exposures.`;
    } else {
      customMarkdown = `### Core Ledger Concept: ${title}
This lesson details cryptocurrency, decentralized finance (DeFi), ledger technology, and the strict Virtual Digital Asset (VDA) rules within India.

### 🪙 Digital Asset Ledger Dynamics & Protocol Rules
* **Decentralized Ledgers:** Public blockchains (like Bitcoin and Ethereum) operate globally, maintaining trust-less ledger records verified by miner/validator consensus nodes.
* **Indian TDS Tracking:** Remember that a flat 30% tax on realized gains, along with a 1% TDS on every sale, is active under Indian VDA regulations. Loss offset is strictly prohibited.
* **Futures Funding Rates:** In perpetual futures trading, funding rates balance long and short leverage, keeping contracts aligned with Spot indices.

### 🔬 Security & Trading Protocols
1. **Custodial Safeguards:** Store long-term holdings in non-custodial hardware wallets. Remember: "Not your keys, not your coins."
2. **Gas Optimization:** Track Gwei and gas rates before initiating mainnet smart contract operations.
3. **Liquidation Audits:** Keep a close eye on liquidation pools. Avoid over-leveraged long positions when funding rates are heavily positive.`;
    }

    // Determine relevant diagram tag based on topic title
    let diagramTag = '';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('support') || lowerTitle.includes('resistance') || lowerTitle.includes('trend') || lowerTitle.includes('line')) {
      diagramTag = '\n\n[DIAGRAM: SUPPORT_RESISTANCE]';
    } else if (lowerTitle.includes('rsi') || lowerTitle.includes('relative strength')) {
      diagramTag = '\n\n[DIAGRAM: RSI_OS_OB]';
    } else if (lowerTitle.includes('moving') || lowerTitle.includes('sma') || lowerTitle.includes('ema') || lowerTitle.includes('average')) {
      diagramTag = '\n\n[DIAGRAM: MOVING_AVERAGE_CROSSOVER]';
    } else if (lowerTitle.includes('order book') || lowerTitle.includes('depth') || lowerTitle.includes('spread') || lowerTitle.includes('ask') || lowerTitle.includes('bid') || lowerTitle.includes('order flow')) {
      diagramTag = '\n\n[DIAGRAM: ORDER_BOOK_DEPTH]';
    } else if (lowerTitle.includes('blockchain') || lowerTitle.includes('crypto') || lowerTitle.includes('ledger') || lowerTitle.includes('network') || lowerTitle.includes('node') || lowerTitle.includes('token') || lowerTitle.includes('chain')) {
      diagramTag = '\n\n[DIAGRAM: BLOCKCHAIN_NODES]';
    } else if (lowerTitle.includes('double') || lowerTitle.includes('head') || lowerTitle.includes('shoulder') || lowerTitle.includes('pattern') || lowerTitle.includes('reversal') || lowerTitle.includes('top') || lowerTitle.includes('bottom')) {
      diagramTag = '\n\n[DIAGRAM: DOUBLE_TOP_BOTTOM]';
    } else if (lowerTitle.includes('wyckoff') || lowerTitle.includes('accumulation') || lowerTitle.includes('distribution')) {
      diagramTag = '\n\n[DIAGRAM: WYCKOFF_PHASES]';
    } else if (lowerTitle.includes('fibonacci') || lowerTitle.includes('retracement') || lowerTitle.includes('pocket') || lowerTitle.includes('order block')) {
      diagramTag = '\n\n[DIAGRAM: FIBONACCI_RETRACEMENT]';
    } else {
      // Default diagrams per market
      if (market === 'stocks') {
        diagramTag = '\n\n[DIAGRAM: SUPPORT_RESISTANCE]';
      } else if (market === 'forex') {
        diagramTag = '\n\n[DIAGRAM: ORDER_BOOK_DEPTH]';
      } else {
        diagramTag = '\n\n[DIAGRAM: BLOCKCHAIN_NODES]';
      }
    }

    customMarkdown += diagramTag;

    // Dynamic Quiz questions
    const q1: QuizQuestion = {
      id: `${id}-q1`,
      question: `When trading or analyzing "${title}", what is considered the primary baseline objective?`,
      options: [
        `To recognize key structured liquidity zones and trade with disciplined institutional rules.`,
        `To chase rapid, daily double-digit profits regardless of market execution drift.`,
        `To place highly leveraged positions on unregulated off-shore broker platforms.`,
        `To only take action during low-volume weekend settlement periods.`
      ],
      correctAnswerIndex: 0,
      explanation: `Diligence, professional risk limits, and structural validation form the ultimate foundation of consistent trading success in "${title}".`
    };

    const q2: QuizQuestion = {
      id: `${id}-q2`,
      question: `Under standard professional risk rules for "${title}", what represents the most disciplined capital protection strategy?`,
      options: [
        `Risking a maximum of 1% to 2% of total capital per trade, using defensive stop-losses.`,
        `Widening your stop-loss indefinitely during heavy margin call alerts to avoid closing.`,
        `Averaging down aggressively on highly volatile options without sizing constraints.`,
        `Trading with maximum 100x leverage during high-impact central bank announcements.`
      ],
      correctAnswerIndex: 0,
      explanation: `Capital preservation is the core metric. Risking 1% to 2% per trade protects your account from deep drawdown streaks.`
    };

    const q3: QuizQuestion = {
      id: `${id}-q3`,
      question: `If market liquidity dry-up or heavy spread widening occurs during "${title}" operations, what is the best tactical response?`,
      options: [
        `Wait for spreads to normalize, avoid placing thin market orders, and utilize limit orders defensively.`,
        `Execute large market orders immediately to secure immediate entry before price jumps.`,
        `Triple your position sizing to quickly make up for the spread transactional drag.`,
        `Switch to highly speculative illiquid contracts to seek faster price reactions.`
      ],
      correctAnswerIndex: 0,
      explanation: `When spreads widen or liquidity is thin, execution slippage increases. Waiting for normalization and using limit orders is the safest choice.`
    };

    const q4: QuizQuestion = {
      id: `${id}-q4`,
      question: `In technical analysis for "${title}", which factor provides the strongest validation of a key support or resistance pivot?`,
      options: [
        `High relative trading volume demonstrating massive interest and buy/sell absorption.`,
        `The price touching the level exactly at 11:30 AM regardless of volume.`,
        `A news article published in a tabloid recommending the asset.`,
        `The asset's price moving below its historical all-time low value.`
      ],
      correctAnswerIndex: 0,
      explanation: `High volume confirms that institutional capital is active at that level, validating support or resistance strength.`
    };

    const q5: QuizQuestion = {
      id: `${id}-q5`,
      question: `Which psychological habit separates elite practitioners of "${title}" from struggling traders?`,
      options: [
        `Executing trades strictly according to pre-written rules, regardless of emotions or short-term results.`,
        `Averaging down on losing positions in anger to show the market who is right.`,
        `Constantly checking price action every 30 seconds and altering strategies during live trades.`,
        `Chasing the biggest daily gainer shares on social media to double capital instantly.`
      ],
      correctAnswerIndex: 0,
      explanation: `Rule-based, emotionless discipline and strict consistency are the cornerstones of institutional-grade trading success.`
    };

    topics.push({
      id,
      title,
      description: `Deep educational study focusing on the mechanics, structure, and trading strategies of ${title}.`,
      dayIndex,
      content: customMarkdown,
      quiz: [q1, q2, q3, q4, q5],
      videoDuration: duration,
      videoTitle: `AI Robotic Voice & Visualizer - ${title}`
    });
  }

  return {
    market,
    level,
    topics
  };
}

export function buildAllCourses(): Course[] {
  return [
    // Stocks (NSE/BSE Indian theme)
    generateDynamicCourse('stocks', 'beginner', HandcraftedStocksBeginner, StocksBeginnerTitles, 14),
    generateDynamicCourse('stocks', 'intermediate', [], StocksIntermediateTitles, 30),
    generateDynamicCourse('stocks', 'advanced', [], StocksAdvancedTitles, 60),

    // Forex
    generateDynamicCourse('forex', 'beginner', HandcraftedForexBeginner, ForexBeginnerTitles, 14),
    generateDynamicCourse('forex', 'intermediate', [], ForexIntermediateTitles, 30),
    generateDynamicCourse('forex', 'advanced', [], ForexAdvancedTitles, 60),

    // Crypto (including 1% TDS Indian tax theme)
    generateDynamicCourse('crypto', 'beginner', HandcraftedCryptoBeginner, CryptoBeginnerTitles, 14),
    generateDynamicCourse('crypto', 'intermediate', [], CryptoIntermediateTitles, 30),
    generateDynamicCourse('crypto', 'advanced', [], CryptoAdvancedTitles, 60),
  ];
}

export const ALL_COURSES: Course[] = buildAllCourses();
