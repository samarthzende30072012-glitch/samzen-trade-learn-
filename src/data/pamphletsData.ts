export interface StrategyPamphlet {
  id: string;
  title: string;
  subtitle: string;
  category: 'Technical Analysis' | 'Smart Money (SMC)' | 'Risk Management' | 'Options & F&O' | 'Psychology';
  readTime: string;
  badge: string;
  summary: string;
  sections: {
    heading: string;
    points: string[];
    highlight?: string;
    rules?: string[];
  }[];
  keyTakeaways: string[];
  formula?: string;
}

export const STRATEGY_PAMPHLETS: StrategyPamphlet[] = [
  {
    id: 'candlestick-bible',
    title: 'The Ultimate Candlestick Bible',
    subtitle: 'High-Probability Price Action Reversal & Continuation Patterns',
    category: 'Technical Analysis',
    readTime: '4 min read',
    badge: 'Core Foundation',
    summary: 'A candlestick is not just a shape—it is a visual battlefield between institutional buyers and aggressive sellers. Learn the top 6 patterns that institutional algorithms exploit.',
    sections: [
      {
        heading: '1. Bullish & Bearish Engulfing Formations',
        points: [
          'Occurs after an extended directional trend when momentum exhausts.',
          'Bullish Engulfing: The second green candle body completely swallows the previous red candle body.',
          'Bearish Engulfing: The second crimson candle completely engulfs the prior green candle.',
          'Win Rate Boost: Only trade at key daily support/resistance levels or Fibonacci 61.8% retracements.'
        ],
        highlight: 'Golden Rule: Volume on the engulfing candle must be at least 1.5x higher than the previous 5 bars.',
        rules: [
          'Entry: Break of the engulfing candle high (for Long) or low (for Short).',
          'Stop-Loss: 2-3 ticks beyond the wick extreme of the engulfing candle.',
          'Target: Minimum 1:2 Risk-to-Reward ratio to the next structural swing.'
        ]
      },
      {
        heading: '2. The Pin Bar / Hammer & Shooting Star',
        points: [
          'Characterized by a long tail/shadow at least 2 to 3 times the size of the real body.',
          'Indicates aggressive liquidity rejection where sellers or buyers failed to sustain price.',
          'Hammer at support indicates seller trap; Shooting star at resistance indicates buyer exhaustion.'
        ],
        highlight: 'The wick tells you who got trapped: long lower wick = sellers trapped; long upper wick = buyers trapped.'
      },
      {
        heading: '3. Morning Star & Evening Star Triple Formations',
        points: [
          'Bar 1: Strong trending candle in the dominant direction.',
          'Bar 2: Small body indecision doji or spinning top with a gap or tight range.',
          'Bar 3: Forceful reversal candle closing deeper than 50% of Bar 1 body.'
        ]
      }
    ],
    keyTakeaways: [
      'Never trade a candlestick in isolation—context, location, and trend determine edge.',
      'Always wait for candle CLOSE before executing; unclosed candles lie.',
      'Combine candlestick signals with confluence from EMA 20 or VWAP.'
    ]
  },
  {
    id: 'smc-order-blocks',
    title: 'Smart Money Concepts (SMC) Blueprint',
    subtitle: 'Institutional Order Blocks, Liquidity Pools & Fair Value Gaps (FVG)',
    category: 'Smart Money (SMC)',
    readTime: '6 min read',
    badge: 'Institutional Edge',
    summary: 'Retail traders follow support/resistance lines; institutional algorithms hunt retail stop-losses. SMC decodes how big banks accumulate and distribute liquidity.',
    sections: [
      {
        heading: '1. Anatomy of an Institutional Order Block (OB)',
        points: [
          'A Bullish Order Block is the LAST bearish candle before a violent upward displacement that breaks market structure (BOS).',
          'Institutions placed massive buy orders, leaving residual unmitigated orders waiting for a price retest.',
          'Mitigation: When price returns to the OB 50% equilibrium level, institutional orders fill, triggering explosive rallies.'
        ],
        highlight: 'Valid OB requirement: Must cause an imbalance (FVG) and a Break of Structure (BOS).'
      },
      {
        heading: '2. Fair Value Gap (FVG) & Imbalance',
        points: [
          'Occurs in a 3-candle sequence where Candle 1 wick and Candle 3 wick do not overlap.',
          'The vacuum of liquidity between them represents one-sided market aggression.',
          'The market behaves like a magnet, returning to fill 50% to 100% of the FVG before continuing.'
        ]
      },
      {
        heading: '3. Liquidity Sweeps & Stop Hunts',
        points: [
          'Equal Highs (EQH) and Equal Lows (EQL) contain massive clusters of retail stop orders.',
          'Smart money pushes price just above EQH to trigger buy stops, using that liquidity to enter short positions at discount.'
        ],
        rules: [
          'Identify liquidity resting above double tops or below double bottoms.',
          'Wait for the sweep candle to wick beyond the level and close aggressively back inside the range.',
          'Enter on the 1m or 5m Change of Character (CHoCH).'
        ]
      }
    ],
    keyTakeaways: [
      'Stop thinking "Where will price bounce?" and start asking "Where are retail stops trapped?"',
      'Look for displacement: rapid, high-momentum candles leave valid order blocks.',
      'Always align lower-timeframe entries (1m/5m) with higher-timeframe order blocks (1H/4H).'
    ]
  },
  {
    id: 'risk-management-1-percent',
    title: 'The 1% Rule & Capital Preservation Matrix',
    subtitle: 'Mathematical Survival Framework to Never Blow a Trading Account',
    category: 'Risk Management',
    readTime: '5 min read',
    badge: 'Non-Negotiable',
    summary: 'Professional traders do not focus on how much they can make; they obsess over how much they can lose. Master position sizing, drawdown recovery, and asymmetric risk-to-reward.',
    sections: [
      {
        heading: '1. The Golden 1% Risk Formula',
        points: [
          'Never risk more than 1% of your total account capital on any single trade.',
          'If your capital is ₹1,00,000, your maximum stop-loss dollar risk is strictly ₹1,000.',
          'Position Size (Quantity) = Maximum Risk Amount / (Entry Price - Stop Loss Price).'
        ],
        highlight: 'Position size adjusts to the chart, NOT your ego. Tighter stop = larger quantity; wider stop = smaller quantity.'
      },
      {
        heading: '2. The Mathematics of Drawdown Recovery',
        points: [
          'A 10% account loss requires an 11.1% gain to break even.',
          'A 20% loss requires a 25% gain.',
          'A 50% loss requires a 100% gain—statistically near-impossible for most retail traders.',
          'Enforcing the 1% risk rule ensures that even 10 consecutive losses reduce capital by less than 9.6%.'
        ]
      },
      {
        heading: '3. Asymmetric Risk-to-Reward (R:R)',
        points: [
          'At 1:1 R:R, you need a 51%+ win rate to be marginally profitable.',
          'At 1:2 R:R, you only need a 33.3% win rate to break even.',
          'At 1:3 R:R, a modest 40% win rate yields substantial long-term wealth compounding.'
        ],
        rules: [
          'Rule 1: Maximum 3 losing trades allowed per day (Daily Circuit Breaker).',
          'Rule 2: Never widen your Stop Loss once an order is active.',
          'Rule 3: Move Stop Loss to Breakeven once price reaches +1R in profit.'
        ]
      }
    ],
    formula: 'Position Qty = (Account Balance × 0.01) / |Entry - StopLoss|',
    keyTakeaways: [
      'Risk management is the only thing a trader has 100% control over.',
      'Amateurs predict the future; professionals manage probabilities and risk.',
      'One bad trade without a stop-loss can wipe out 20 winning trades.'
    ]
  },
  {
    id: 'indian-fo-option-chain',
    title: 'Indian F&O & Option Chain Masterclass',
    subtitle: 'Decode NSE Nifty & Bank Nifty Options, Open Interest & PCR',
    category: 'Options & F&O',
    readTime: '7 min read',
    badge: 'NSE / BSE Specialist',
    summary: 'Master the mechanics of Indian derivatives: strike price selection, Open Interest (OI) buildup, Put-Call Ratio (PCR), and option seller traps.',
    sections: [
      {
        heading: '1. Open Interest (OI) Interpretation Matrix',
        points: [
          'Price UP + OI UP = Long Buildup (Extremely Bullish sentiment).',
          'Price DOWN + OI UP = Short Buildup (Aggressive institutional selling).',
          'Price UP + OI DOWN = Short Covering (Sharp short-squeeze rally, watch for reversal).',
          'Price DOWN + OI DOWN = Long Unwinding (Buyers cutting positions in panic).'
        ],
        highlight: 'Option sellers write the highest OI strikes. Max Call OI acts as fierce resistance; Max Put OI acts as major support.'
      },
      {
        heading: '2. The Put-Call Ratio (PCR) Contrarian Indicator',
        points: [
          'PCR = Total Put Open Interest / Total Call Open Interest.',
          'PCR > 1.3 to 1.5: Market is extremely overbought; high risk of a sharp dip.',
          'PCR < 0.65 to 0.70: Market is deeply oversold; ripe for an aggressive intraday bounce.',
          'PCR near 1.0 represents a neutral, balanced market.'
        ]
      },
      {
        heading: '3. The Option Greeks in Plain English',
        points: [
          'Delta (Δ): How much option price moves per 1 point change in underlying index.',
          'Theta (θ): The daily time-decay enemy of option buyers. Accelerates drastically on expiry Thursday.',
          'Gamma (Γ): Speed of Delta change. Causes massive 0-hero spikes on expiry day afternoon.',
          'Vega (ν): Sensitivity to India VIX (volatility). If VIX crashes, option premiums drop.'
        ]
      }
    ],
    formula: 'PCR = Σ Put Open Interest / Σ Call Open Interest',
    keyTakeaways: [
      'Option buyers must trade fast with momentum; Theta decay eats stagnant positions.',
      'Always check India VIX: VIX < 12 favors option selling; VIX > 16 offers massive trending option buyer moves.',
      'Never trade Far Out-Of-The-Money (OTM) lottery tickets—stick to In-The-Money (ITM) or At-The-Money (ATM).'
    ]
  },
  {
    id: 'chart-patterns-cheat-sheet',
    title: 'Chart Patterns & Price Action Blueprint',
    subtitle: 'High-Probability Geometric Formations & Breakout Validation',
    category: 'Technical Analysis',
    readTime: '5 min read',
    badge: 'Pattern Mastery',
    summary: 'Recognize classical chart patterns like Head & Shoulders, Double Bottoms, Bull Flags, and Ascending Triangles with institutional verification filters.',
    sections: [
      {
        heading: '1. Reversal Patterns: Head & Shoulders & Double Bottoms',
        points: [
          'Head and Shoulders signals the transition from higher highs/higher lows to lower lows.',
          'Neckline breakout must be accompanied by expanding volume.',
          'Retest Entry: 70% of high-quality patterns retest the broken neckline before running.'
        ],
        highlight: 'Measured Move Target: The vertical distance from Head to Neckline projected downwards from the breakout point.'
      },
      {
        heading: '2. Continuation Patterns: Bull Flags & Ascending Triangles',
        points: [
          'Bull Flag: Sharp pole followed by a low-volume downward-sloping consolidation channel.',
          'Ascending Triangle: Flat horizontal resistance with progressively higher swing lows pressing into resistance.',
          'Indicates that buyers are willing to absorb all selling pressure at progressively higher prices.'
        ]
      }
    ],
    keyTakeaways: [
      'Wait for the candle to CLOSE beyond the trendline or neckline—wicks are traps.',
      'Volume must drop during consolidation and explode on the breakout.',
      'False breakouts often lead to the most explosive moves in the opposite direction.'
    ]
  },
  {
    id: 'trading-psychology-discipline',
    title: 'Trading Psychology & Emotional Iron Clad',
    subtitle: 'Conquer Revenge Trading, FOMO & The 5 Mental Biases',
    category: 'Psychology',
    readTime: '4 min read',
    badge: 'Mental Edge',
    summary: 'Trading is 20% mechanics and 80% psychology. Even the best technical strategy fails if your nervous system cannot handle uncertainty.',
    sections: [
      {
        heading: '1. The Revenge Trading Trap',
        points: [
          'After taking a loss, the brain perceives an emotional injury and seeks immediate validation.',
          'Traders double position size or enter random setups without confirmation, triggering catastrophic drawdowns.',
          'Antidote: Mandatory 15-minute screen-away rule after any stop-loss hit.'
        ],
        highlight: 'Accept that losses are simply the business cost of acquiring trading probabilities.'
      },
      {
        heading: '2. Overcoming Fear of Missing Out (FOMO)',
        points: [
          'Watching a green candle pump triggers irrational anxiety that you are being left behind.',
          'Buying the top of a parabolic green candle turns you into institutional exit liquidity.',
          'Rule: If you missed the initial entry trigger, the trade is dead. Wait for the retest or look for the next setup.'
        ]
      }
    ],
    keyTakeaways: [
      'The market does not know you exist—never take a loss personally.',
      'Consistency is born from executing boring, identical rules hundreds of times.',
      'Your trading journal is your mirror: if you do not track your trades, you are just gambling.'
    ]
  }
];
