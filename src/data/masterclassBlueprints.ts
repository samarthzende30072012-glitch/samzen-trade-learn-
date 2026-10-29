export interface MasterclassModule {
  id: string;
  moduleNumber: number;
  title: string;
  subtitle: string;
  category: string;
  durationMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastery';
  badge: string;
  summary: string;
  illustrationImage?: string;
  diagramTitle?: string;
  diagramType?: 'candlestick' | 'support_resistance' | 'risk_matrix' | 'order_block';
  learningObjectives: string[];
  formula?: {
    name: string;
    expression: string;
    variables: { symbol: string; meaning: string }[];
    example: string;
  };
  sections: {
    title: string;
    content: string[];
    callout?: {
      type: 'rule' | 'warning' | 'insight';
      title: string;
      message: string;
    };
    bulletChecklist?: string[];
  }[];
  keyTakeaways: string[];
  quizQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export const MASTERCLASS_MODULES: MasterclassModule[] = [
  {
    id: 'market-fundamentals-candlestick-anatomy',
    moduleNumber: 1,
    title: 'Market Fundamentals & Candlestick Anatomy',
    subtitle: 'Decoding Price Action, Order Books & The Visual Battlefield of Bulls vs Bears',
    category: 'Core Foundations',
    durationMinutes: 25,
    difficulty: 'Beginner',
    badge: 'Foundation Pillar',
    illustrationImage: '/src/assets/images/samzen_chart_analysis_1793091008638.jpg',
    diagramTitle: 'Interactive Candlestick Architecture & OHLC Price Mechanics',
    diagramType: 'candlestick',
    summary: 'A candlestick is not a colorful drawing—it is an audited visual record of institutional supply and demand. Master the 4 price points (OHLC), wick rejection psychology, and high-probability candlestick formations used by institutional desks.',
    learningObjectives: [
      'Understand how electronic exchanges match bids and asks in the Central Limit Order Book (CLOB)',
      'Analyze the 4 core components of every Japanese candlestick: Open, High, Low, and Close (OHLC)',
      'Interpret wick-to-body ratios to spot institutional liquidity absorption and retail traps',
      'Identify high-conviction reversal setups: Pin Bars, Bullish/Bearish Engulfing, and Morning/Evening Stars',
      'Execute multi-timeframe analysis from Daily structure down to 15-minute entry confirmation'
    ],
    formula: {
      name: 'Wick-to-Body Absorption Ratio',
      expression: 'Rejection Ratio = Wick Length / Total Candle Range',
      variables: [
        { symbol: 'Wick Length', meaning: 'Distance from Candle High/Low to the nearest boundary of the real body' },
        { symbol: 'Total Candle Range', meaning: 'High minus Low of the candle bar (spread)' }
      ],
      example: 'If a candle has a 30-point range (High 25,030, Low 25,000) with a 21-point lower wick, the Rejection Ratio is 21/30 = 0.70 (70%). Ratios above 65% confirm institutional absorption and seller exhaustion.'
    },
    sections: [
      {
        title: '1. The Anatomy of an Exchange & Order Book Matching',
        content: [
          'Financial markets operate as a Continuous Double Auction. At any given second, there are two distinct parties: buyers placing bids (willing to buy at a maximum price) and sellers placing asks (willing to sell at a minimum price).',
          'The difference between the highest bid and lowest ask is the Bid-Ask Spread. Market orders cross this spread immediately by accepting whatever price is currently offered, paying the spread fee. Limit orders rest inside the order book, providing liquidity and waiting for aggressive participants to fill them.',
          'Institutions—including Foreign Institutional Investors (FIIs), Domestic Institutional Investors (DIIs), and hedge funds—cannot trade with market orders because their billions in capital would cause severe price slippage. Instead, they accumulate passively through iceberg limit orders, leaving footprints that candlesticks reveal.'
        ],
        callout: {
          type: 'insight',
          title: 'Institutional Reality',
          message: 'Retail traders trade price. Institutional algorithms trade liquidity. You must learn to trade where institutions are filling their orders, not where retail traders panic.'
        }
      },
      {
        title: '2. The 4 Price Points: Open, High, Low, Close (OHLC)',
        content: [
          'Every Japanese candlestick summarizes the entire price conflict across a designated timeframe (1m, 5m, 15m, 1H, Daily):',
          '• Open: The inaugural price where buyers and sellers first transacted at the start of the interval.',
          '• High: The absolute highest peak reached during the timeframe, demonstrating the maximum extent of bullish pressure.',
          '• Low: The lowest depth reached, showing the maximum reach of bearish pressure.',
          '• Close: The final benchmark price when the timeframe expired. The close is the most critical metric because institutional algorithmic closing runs benchmark end-of-interval allocations.'
        ],
        bulletChecklist: [
          'Green (Bullish) Candle: Close > Open (Bulls won the session)',
          'Crimson (Bearish) Candle: Close < Open (Bears won the session)',
          'Real Body: Distance between Open and Close (measures directional conviction)',
          'Upper Wick: Buying pressure that was aggressively rejected by sellers',
          'Lower Wick: Selling pressure that was aggressively absorbed by buyers'
        ]
      },
      {
        title: '3. Candlestick Rejection Patterns & Institutional Setups',
        content: [
          'Not all candlesticks are created equal. The location where a candle appears dictates its predictive probability. A pin bar floating in the middle of nowhere is meaningless; a pin bar piercing an established weekly support level is an institutional trap setup.',
          'Bullish & Bearish Engulfing: A two-candle pattern where the second candle body completely swallows the prior body. High institutional volume on the engulfing candle confirms momentum expansion.',
          'The Pin Bar (Hammer / Shooting Star): Features a wick at least 2 to 3 times longer than the real body. The wick illustrates a failed breakout where retail stop-losses were harvested before the market reversed violently.',
          'Morning Star & Evening Star: Three-bar reversal patterns consisting of a directional thrust, an indecision doji candle, followed by an aggressive reversal closing past the midpoint of the first candle.'
        ],
        callout: {
          type: 'rule',
          title: 'The Golden Rule of Candlesticks',
          message: 'Never trade a candlestick pattern in isolation. A candlestick pattern is an entry trigger, NOT a trading strategy. Strategy = Market Structure + High Timeframe Level + Candlestick Trigger.'
        }
      }
    ],
    keyTakeaways: [
      'The close of a candle is the only price that institutions respect for structural confirmation.',
      'Long wicks represent aggressive liquidity rejection and order absorption.',
      'Bullish engulfing candles must be accompanied by expanding relative volume to be valid.',
      'Always confirm daily and 4-hour market structure before taking lower timeframe candlestick triggers.'
    ],
    quizQuestions: [
      {
        question: 'What is indicated by a long lower wick on a daily candlestick at major support?',
        options: [
          'Institutional absorption of selling pressure and rejection of lower prices',
          'Sellers have completely dominated the market and price will collapse',
          'The exchange has run out of buy limit orders',
          'Market participants are inactive and awaiting economic news'
        ],
        correctIndex: 0,
        explanation: 'A long lower wick shows that sellers pushed prices down, but institutional buyers absorbed the supply and drove the price back up before the close, forming a rejection tail.'
      },
      {
        question: 'Under institutional analysis, which candle price point holds the greatest benchmark importance?',
        options: [
          'The Close price',
          'The Open price',
          'The midpoint of the wick',
          'The pre-market tick'
        ],
        correctIndex: 0,
        explanation: 'The Close represents the final accepted value where institutions settled their positions at the end of the timeframe.'
      }
    ]
  },
  {
    id: 'support-resistance-trendlines-blueprint',
    moduleNumber: 2,
    title: 'Master Blueprint for Support, Resistance & Trendlines',
    subtitle: 'Institutional Polarity, Liquidity Pools & Dynamic Structural Confluence',
    category: 'Technical Analysis',
    durationMinutes: 30,
    difficulty: 'Intermediate',
    badge: 'Core Blueprint',
    illustrationImage: '/src/assets/images/samzen_chart_navy_gold_1793091871578.jpg',
    diagramTitle: 'Support & Resistance Role Reversal (Polarity) and Liquidity Sweep Setup',
    diagramType: 'support_resistance',
    summary: 'Retail traders draw lines where prices bounced. Institutional operators identify liquidity pools where pending stop-orders are stacked. Master static horizontal floors, the polarity change principle, trendline validation criteria, and false breakout sweeps.',
    learningObjectives: [
      'Distinguish between retail speculative lines and true institutional liquidity levels',
      'Master the Role Reversal Principle (Support becomes Resistance, Resistance becomes Support)',
      'Construct mathematically valid 3-touch trendlines and identify structural breaks',
      'Identify institutional "Turtle Soup" liquidity grab sweeps before the true trend begins',
      'Combine horizontal levels with Fibonacci golden ratios (0.618 / 0.786) for high-confluence entries'
    ],
    formula: {
      name: 'Breakout Volume Expansion Ratio',
      expression: 'Expansion Ratio = Breakout Bar Volume / 20-Period Average Volume',
      variables: [
        { symbol: 'Breakout Bar Volume', meaning: 'The total transacted volume during the breakout candle' },
        { symbol: '20-Period Avg Volume', meaning: 'The simple 20-period moving average of volume on the chart' }
      ],
      example: 'A genuine institutional breakout requires an Expansion Ratio >= 2.0x (double average volume). Breakouts occurring on below-average volume are false breaks (liquidity traps) designed to trap retail breakout buyers.'
    },
    sections: [
      {
        title: '1. What Are Support and Resistance Truly Made Of?',
        content: [
          'Support is not a magic floor; it is a price level where a massive density of buy limit orders exceeds available market sell orders, stopping the decline.',
          'Resistance is a price level where institutional sell orders exceed available buy interest, arresting upward momentum.',
          'Because financial markets are continuous auctions, these levels are NEVER exact razor-thin lines. They are Supply and Demand Zones spanning a price buffer. Drawing them as zones avoids getting prematurely stopped out by market noise.'
        ],
        callout: {
          type: 'insight',
          title: 'Liquidity Pools',
          message: 'Above every swing high sits retail buy-stop liquidity. Below every swing low sits retail sell-stop liquidity. Smart money runs price into these pools to fill their multi-million dollar positions.'
        }
      },
      {
        title: '2. The Polarity Principle (Role Reversal)',
        content: [
          'One of the most reliable phenomena in all technical analysis is the Change of Polarity:',
          '• Resistance Turned Support (RBS): When price breaks decisively above resistance, prior sellers who were trapped in losses look to break even on a pullback, and breakout traders join as buyers. The old ceiling becomes the new floor.',
          '• Support Turned Resistance (SBR): When price breaks below support, buyers trapped at that level desperately wait for a pullback to exit at breakeven. Their selling pressure transforms prior support into strong overhead resistance.'
        ],
        bulletChecklist: [
          'Step 1: Identify a clean horizontal swing high tested at least twice',
          'Step 2: Wait for a high-volume candle to close completely above the zone',
          'Step 3: Do NOT chase the breakout. Patiently wait for a retest of the broken level',
          'Step 4: Confirm retest with a bullish candlestick rejection before executing'
        ]
      },
      {
        title: '3. Mathematically Valid Trendlines & The 3-Touch Rule',
        content: [
          'Retail traders draw trendlines connecting random highs and lows. Institutional algorithms adhere to rigid geometric validation:',
          '• Point 1: The origin swing low/high of the trend.',
          '• Point 2: The second higher-low (in uptrend) or lower-high (in downtrend) confirming initial direction.',
          '• Point 3: The Validation Touch. A trendline is only a tentative ray until price touches it a 3rd time and rejects. Once validated by the 3rd touch, it becomes an institutional trendline.'
        ],
        callout: {
          type: 'warning',
          title: 'Trendline Angle Warning',
          message: 'Never trade trendlines steeper than 60 degrees. Hyper-steep parabolic trendlines are unsustainable speculative bursts that inevitably crash. Sustainable trends climb at a balanced 30 to 45 degree slope.'
        }
      }
    ],
    keyTakeaways: [
      'Draw support and resistance as dynamic zones (buffers), never single precise lines.',
      'Wait for the pullback and retest rather than buying the initial breakout spike.',
      'A trendline requires three structural touches before it can be trusted as validated.',
      'False breakouts that quickly re-enter the range often lead to explosive moves in the opposite direction.'
    ],
    quizQuestions: [
      {
        question: 'When a strong resistance level is broken to the upside with heavy volume, what does it typically become on a subsequent pullback?',
        options: [
          'A strong support level (Role Reversal Principle)',
          'An invalid zone that should be deleted from the chart',
          'A guaranteed short selling zone',
          'An un-tradable price vacuum'
        ],
        correctIndex: 0,
        explanation: 'The Polarity Principle states that broken resistance converts into new support because trapped sellers and waiting buyers provide liquidity on the retest.'
      },
      {
        question: 'How many confirmed touches are required before a trendline is considered structurally validated?',
        options: [
          '3 confirmed touches',
          '1 touch',
          '2 touches',
          '5 touches minimum'
        ],
        correctIndex: 0,
        explanation: 'Two points define a line, but the 3rd touch confirms that the market recognizes and respects the structural trend slope.'
      }
    ]
  },
  {
    id: 'risk-management-capital-preservation-blueprint',
    moduleNumber: 3,
    title: 'Risk Management & Capital Preservation Psychology',
    subtitle: 'The Non-Negotiable 1% Formula, Drawdown Mathematics & Emotional Immunity',
    category: 'Risk & Psychology',
    durationMinutes: 35,
    difficulty: 'Mastery',
    badge: 'Survival Core',
    illustrationImage: '/src/assets/images/samzen_risk_management_1793091007477.jpg',
    diagramTitle: 'The Non-Negotiable 1% Risk Formula & Position Sizing Calculator Matrix',
    diagramType: 'risk_matrix',
    summary: 'The holy grail of trading is not an indicator—it is capital preservation mathematics. Over 90% of retail traders blow up accounts due to position sizing errors and revenge trading. Master the institutional 1% risk formula and asymmetric risk-to-reward ratios.',
    learningObjectives: [
      'Calculate exact position sizing down to the single share using the 1% Capital Risk Formula',
      'Understand the exponential math of drawdowns and why losing 50% requires a 100% gain to recover',
      'Structure asymmetric trades with a minimum 1:2 and 1:3 Risk-to-Reward ratio (R:R)',
      'Eliminate revenge trading, FOMO, and cognitive biases through systematic execution journals',
      'Enforce daily loss limits to protect psychological capital during adverse market cycles'
    ],
    formula: {
      name: 'The Non-Negotiable Institutional Position Sizing Formula',
      expression: 'Position Size (Units) = (Account Capital * Risk%) / |Entry Price - Stop Loss Price|',
      variables: [
        { symbol: 'Account Capital', meaning: 'Your total liquid trading balance (e.g., ₹1,00,000)' },
        { symbol: 'Risk%', meaning: 'Maximum fraction of capital you permit yourself to lose (strictly 0.01 for 1%)' },
        { symbol: '|Entry - Stop|', meaning: 'Absolute risk distance in price per share' }
      ],
      example: 'On a ₹1,00,000 account, 1% risk = ₹1,000 max risk. You enter Reliance at ₹2,500 with a stop-loss at ₹2,450. Risk per share = ₹50. Position Size = ₹1,000 / ₹50 = exactly 20 shares. If stopped out, you lose precisely ₹1,000 (1%). You never risk more than 1%!'
    },
    sections: [
      {
        title: '1. The Brutal Mathematics of Drawdown Recovery',
        content: [
          'Most beginner traders believe that if they lose 20% of their money, they only need a 20% gain to get back to even. This mathematical fallacy ruins accounts.',
          'Because losses reduce your starting principal base, recovery percentage grows exponentially as drawdown deepens:',
          '• 10% Drawdown requires +11.1% gain to break even',
          '• 20% Drawdown requires +25.0% gain to break even',
          '• 30% Drawdown requires +42.9% gain to break even',
          '• 50% Drawdown requires +100.0% gain to break even (Double your remaining money!)',
          '• 80% Drawdown requires +400.0% gain to break even',
          '• 90% Drawdown requires +900.0% gain to break even'
        ],
        callout: {
          type: 'warning',
          title: 'The Point of No Return',
          message: 'Once your account experiences a 50% drawdown, your statistical probability of ever recovering without adding new capital drops below 3%. Protecting capital at all costs is priority #1.'
        }
      },
      {
        title: '2. The Power of Asymmetric Risk-to-Reward (R:R)',
        content: [
          'Amateur traders focus on finding a 90% win rate strategy. Professional institutional traders operate with win rates between 40% and 55% while generating immense compounding returns.',
          'How? Through Asymmetric Risk-to-Reward. If your average win is 3 times larger than your average loss (1:3 R:R):',
          '• Out of 10 trades, you win only 4 trades and lose 6 trades (40% Win Rate)',
          '• 6 losses of ₹1,000 = -₹6,000',
          '• 4 wins of ₹3,000 = +₹12,000',
          '• Net Profit: +₹6,000 profit despite being wrong more than half the time!'
        ],
        bulletChecklist: [
          'Rule 1: Never enter a trade where the target provides less than 1:2 R:R',
          'Rule 2: Stop-loss must be placed BEFORE entering, never adjusted further away',
          'Rule 3: Enforce a Daily Max Loss Limit (e.g., 3 consecutive losses = stop trading for the day)',
          'Rule 4: Move stop-loss to breakeven once price has traveled 1R in profit'
        ]
      },
      {
        title: '3. Psychological Mastery & The Trader’s Mindset',
        content: [
          'Trading psychology is not about suppressing emotions; it is about having a system so clear and sizing so comfortable that emotions have no reason to trigger.',
          'Revenge Trading occurs when a trader takes an unexpected loss, feels personal insult, and immediately increases position size on the next trade to win it back. This is how accounts blow up in a single afternoon.',
          'To cultivate institutional discipline, treat trading like an airline pilot: operate strictly with a pre-flight checklist. If all conditions are not met, you stay grounded.'
        ],
        callout: {
          type: 'rule',
          title: 'The 30-Minute Cooling Rule',
          message: 'If you suffer two consecutive stop-outs in a session, step away from your screens for 30 minutes. Take a walk, breathe, and let cortisol clear before reviewing your journal.'
        }
      }
    ],
    keyTakeaways: [
      'Risk a maximum of 1% to 2% of total capital on any single trade setup.',
      'Position size must be calculated backward from your stop-loss, never picked arbitrarily.',
      'A 40% win rate with 1:3 R:R creates consistent, high compounding equity curves.',
      'Your trading journal is your mirror: record entry reason, screenshot, R:R, and emotional state.'
    ],
    quizQuestions: [
      {
        question: 'If you have an account balance of ₹2,00,000 and adhere strictly to a 1% risk rule, what is your maximum allowed loss on a trade?',
        options: [
          '₹2,000',
          '₹20,000',
          '₹5,000',
          '₹500'
        ],
        correctIndex: 0,
        explanation: '1% of ₹2,00,000 is ₹2,000. Your position sizing must ensure that if your stop-loss is hit, your loss does not exceed ₹2,000.'
      },
      {
        question: 'If a trader loses 50% of their trading capital, what percentage gain must they achieve on their remaining capital just to break even?',
        options: [
          '100% gain',
          '50% gain',
          '75% gain',
          '200% gain'
        ],
        correctIndex: 0,
        explanation: 'If a ₹1,00,000 account drops 50% to ₹50,000, you must make a ₹50,000 profit on the remaining ₹50,000, which is a 100% gain.'
      }
    ]
  },
  {
    id: 'advanced-options-forex-crypto-blueprint',
    moduleNumber: 4,
    title: 'Advanced Options, Forex, & Crypto Strategies',
    subtitle: 'Option Greeks, Interbank Currency Mechanics, Funding Rates & Tax Governance',
    category: 'Derivatives & Multi-Asset',
    durationMinutes: 40,
    difficulty: 'Mastery',
    badge: 'Mastery Apex',
    illustrationImage: '/src/assets/images/sztrade_course_institutional_1793088621049.jpg',
    diagramTitle: 'Derivatives Greeks Matrix & Multi-Asset Order Flow Structure',
    diagramType: 'order_block',
    summary: 'Step beyond spot equities into the multi-trillion dollar world of derivatives. Master Options Greeks (Delta, Theta time decay, Gamma), interbank Forex pip calculations, and cryptocurrency funding rates with institutional risk rules.',
    learningObjectives: [
      'Deconstruct the 4 core Option Greeks: Delta, Gamma, Theta, and Vega',
      'Understand why 80% of out-of-the-money option buyer contracts expire worthless due to Theta decay',
      'Structure spread strategies (Bull Call Spreads, Bear Put Spreads, Iron Condors) to define risk',
      'Calculate Forex pips, lot sizing (Standard, Mini, Micro), and understand central bank rate spreads',
      'Navigate cryptocurrency perpetual futures funding rates, liquidation cascades, and Indian 1% TDS rules'
    ],
    formula: {
      name: 'Option Price Delta Sensitivity',
      expression: 'Option Price Change = Delta * (Underlying Stock Price Change)',
      variables: [
        { symbol: 'Delta', meaning: 'Rate of change of option premium with respect to a ₹1 move in the underlying' },
        { symbol: 'Underlying Change', meaning: 'The rupee price movement of the underlying index/stock' }
      ],
      example: 'If Nifty 25,000 Call has a Delta of 0.50, and Nifty rises by 100 points, the Call option premium will increase by approximately 0.50 * 100 = ₹50 per share (₹1,250 for a 25-lot).'
    },
    sections: [
      {
        title: '1. The Options Matrix & The Four Greeks',
        content: [
          'Options are financial contracts granting the buyer the right, but not the obligation, to buy (Call) or sell (Put) an underlying asset at an agreed strike price before expiration.',
          'To trade options professionally, you must understand the invisible forces pricing the contracts:',
          '• Delta (Δ): Measures the rate of change of option price per ₹1 move in the underlying. Also represents the approximate probability of expiring In-The-Money (ITM).',
          '• Gamma (Γ): The acceleration of Delta. High Gamma near expiration causes extreme volatility on zero-to-hero expiry days.',
          '• Theta (Θ): The enemy of option buyers and best friend of option sellers. Measures daily time decay. Options lose value every second that passes, even if the underlying price remains flat.',
          '• Vega (ν): Sensitivity to Implied Volatility (IV). Buying options before major corporate earnings or budget events means paying inflated Vega premiums that collapse instantly after the announcement (IV Crush).'
        ],
        callout: {
          type: 'insight',
          title: 'Institutional Edge',
          message: 'Institutions predominantly sell options (theta collection) or trade spreads with defined risk. Avoid buying cheap far Out-Of-The-Money (OTM) options—they have a statistical loss probability exceeding 85%.'
        }
      },
      {
        title: '2. Interbank Forex Mechanics: Pips, Lots & Macro Cues',
        content: [
          'The global Foreign Exchange (Forex) market transacts over $7.5 trillion daily, dwarfing all stock exchanges combined.',
          'Forex contracts are priced in currency pairs (e.g., EUR/USD, GBP/USD, USD/INR):',
          '• Pip (Percentage in Point): The standard unit of measurement. For most pairs, 1 pip = 0.0001. For JPY pairs, 1 pip = 0.01.',
          '• Lot Sizing: A Standard Lot represents 100,000 units of base currency (worth ~$10 per pip in EUR/USD). A Mini Lot is 10,000 units (~$1/pip). A Micro Lot is 1,000 units (~$0.10/pip).',
          '• Macroeconomic Catalysts: Central bank interest rate decisions (US Federal Reserve, ECB, RBI), Non-Farm Payrolls (NFP), and CPI inflation metrics drive directional currency trends.'
        ],
        bulletChecklist: [
          'Always verify economic calendar releases before taking intraday forex positions',
          'Account for overnight rollover interest (Swap/Carry rates) if holding trades past 5 PM NY',
          'In India, trade only approved exchange-traded currency pairs (USDINR, EURINR, GBPINR, JPYINR) on registered exchanges'
        ]
      },
      {
        title: '3. Cryptocurrency Derivatives & Indian Regulatory Framework',
        content: [
          'Cryptocurrency perpetual futures trade 24/7 with no expiration date. To anchor perpetual contracts to the spot market index, exchanges utilize the Funding Rate mechanism:',
          '• Positive Funding Rate: Longs pay shorts every 8 hours. Indicates heavy bullish leverage. Often precedes a long squeeze cascade.',
          '• Negative Funding Rate: Shorts pay longs. Indicates extreme bearish sentiment. Often precedes a violent short squeeze rally.',
          'Indian Regulatory Compliance (VDA): Under Indian law, Virtual Digital Assets are subject to a flat 30% tax on realized gains with zero offset against losses, plus a mandatory 1% TDS on every transfer/sell transaction.'
        ],
        callout: {
          type: 'rule',
          title: 'Capital Security Rule',
          message: 'Never keep large investment capital on unregulated off-shore exchanges. Always withdraw long-term holdings to secure hardware cold wallets. Not your keys, not your coins.'
        }
      }
    ],
    keyTakeaways: [
      'Theta decay relentlessly erodes out-of-the-money option buyer contracts every single day.',
      'Avoid buying high-IV options immediately prior to earnings announcements to prevent IV crush.',
      'In Forex, calculate lot sizing backward from pip risk to keep loss within the 1% threshold.',
      'In Crypto perpetuals, monitor funding rates and open interest to avoid getting caught in liquidation cascades.'
    ],
    quizQuestions: [
      {
        question: 'Which Option Greek measures the daily erosion of an option premium due to the passage of time?',
        options: [
          'Theta (Θ)',
          'Delta (Δ)',
          'Gamma (Γ)',
          'Vega (ν)'
        ],
        correctIndex: 0,
        explanation: 'Theta measures time decay. As expiration approaches, Theta accelerates, reducing the premium of the option even if the underlying asset price does not change.'
      },
      {
        question: 'In perpetual cryptocurrency futures, what occurs when the funding rate is heavily positive?',
        options: [
          'Long position holders pay fees to short position holders, signaling excessive bullish leverage',
          'The exchange halts all trading due to volatility',
          'Short sellers must pay double margin to the exchange',
          'The price of Bitcoin is guaranteed to double within 24 hours'
        ],
        correctIndex: 0,
        explanation: 'A positive funding rate means perpetual prices are trading above spot prices; long traders pay short traders to incentivize price parity with the spot market.'
      }
    ]
  }
];
