export interface MarketStatusInfo {
  isOpen: boolean;
  sessionName: string;
  nextEvent: string;
  countdown: string;
  badgeColor: string;
  exchangeName: string;
  timezone: string;
  currentTimeString: string;
}

export interface ExchangeClock {
  id: string;
  city: string;
  exchange: string;
  timezone: string;
  isOpen: boolean;
  timeString: string;
  openHours: string;
}

/**
 * Checks if Indian Stock Market (NSE/BSE) is open.
 * Trading hours: Monday - Friday, 09:15 to 15:30 IST.
 * Pre-market: 09:00 to 09:15 IST.
 */
export function getIndianMarketStatus(now = new Date()): MarketStatusInfo {
  // Convert current time to IST (UTC + 5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 3600000 * 5.5);

  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentMinuteOfDay = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;
  const openMinute = 9 * 60 + 15; // 09:15 IST
  const closeMinute = 15 * 60 + 30; // 15:30 IST
  const preMarketMinute = 9 * 60; // 09:00 IST

  const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const currentTimeString = timeFormatter.format(now);

  if (isWeekend) {
    const daysUntilMonday = day === 0 ? 1 : 2;
    return {
      isOpen: false,
      sessionName: 'Weekend Closure',
      nextEvent: `Opens Monday at 09:15 IST`,
      countdown: `${daysUntilMonday}d to open`,
      badgeColor: '#FF3366',
      exchangeName: 'NSE / BSE India',
      timezone: 'IST (UTC+5:30)',
      currentTimeString,
    };
  }

  if (currentMinuteOfDay >= preMarketMinute && currentMinuteOfDay < openMinute) {
    const minsLeft = openMinute - currentMinuteOfDay;
    return {
      isOpen: false,
      sessionName: 'Pre-Market Session',
      nextEvent: `Market opens in ${minsLeft}m`,
      countdown: `${minsLeft}m to open`,
      badgeColor: '#FFB800',
      exchangeName: 'NSE / BSE India',
      timezone: 'IST (UTC+5:30)',
      currentTimeString,
    };
  }

  if (currentMinuteOfDay >= openMinute && currentMinuteOfDay < closeMinute) {
    const minsLeft = closeMinute - currentMinuteOfDay;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      isOpen: true,
      sessionName: 'Regular Trading Hours',
      nextEvent: `Closes in ${h}h ${m}m`,
      countdown: `${h}h ${m}m left`,
      badgeColor: '#00FF87',
      exchangeName: 'NSE / BSE India',
      timezone: 'IST (UTC+5:30)',
      currentTimeString,
    };
  }

  // After-hours on weekday
  return {
    isOpen: false,
    sessionName: 'Post-Market / Closed',
    nextEvent: day === 5 ? 'Opens Monday 09:15 IST' : 'Opens Tomorrow 09:15 IST',
    countdown: 'Closed',
    badgeColor: '#FF3366',
    exchangeName: 'NSE / BSE India',
    timezone: 'IST (UTC+5:30)',
    currentTimeString,
  };
}

/**
 * Checks if US Equities (NYSE / NASDAQ) is open.
 * Trading hours: Monday - Friday, 09:30 to 16:00 EST/EDT.
 */
export function getUSMarketStatus(now = new Date()): MarketStatusInfo {
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const estDateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekdayPart = estDateStr.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hourPart = parseInt(estDateStr.find((p) => p.type === 'hour')?.value || '0', 10);
  const minutePart = parseInt(estDateStr.find((p) => p.type === 'minute')?.value || '0', 10);

  const isWeekend = weekdayPart === 'Sat' || weekdayPart === 'Sun';
  const currentMinuteOfDay = hourPart * 60 + minutePart;
  const openMinute = 9 * 60 + 30; // 09:30 EST
  const closeMinute = 16 * 60; // 16:00 EST

  const currentTimeString = timeFormatter.format(now);

  if (isWeekend) {
    return {
      isOpen: false,
      sessionName: 'Weekend Closure',
      nextEvent: 'Opens Monday 09:30 EST',
      countdown: 'Weekend',
      badgeColor: '#FF3366',
      exchangeName: 'NYSE / NASDAQ',
      timezone: 'EST/EDT (New York)',
      currentTimeString,
    };
  }

  if (currentMinuteOfDay >= openMinute && currentMinuteOfDay < closeMinute) {
    const minsLeft = closeMinute - currentMinuteOfDay;
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      isOpen: true,
      sessionName: 'Regular Session',
      nextEvent: `Closes in ${h}h ${m}m`,
      countdown: `${h}h ${m}m left`,
      badgeColor: '#00FF87',
      exchangeName: 'NYSE / NASDAQ',
      timezone: 'EST/EDT (New York)',
      currentTimeString,
    };
  }

  return {
    isOpen: false,
    sessionName: 'After-Hours / Closed',
    nextEvent: weekdayPart === 'Fri' ? 'Opens Monday 09:30 EST' : 'Opens Tomorrow 09:30 EST',
    countdown: 'Closed',
    badgeColor: '#FF3366',
    exchangeName: 'NYSE / NASDAQ',
    timezone: 'EST/EDT (New York)',
    currentTimeString,
  };
}

/**
 * Checks Forex Market status.
 * Opens Sunday 5:00 PM EST, Closes Friday 5:00 PM EST.
 */
export function getForexMarketStatus(now = new Date()): MarketStatusInfo {
  const estDateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekday = estDateStr.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hour = parseInt(estDateStr.find((p) => p.type === 'hour')?.value || '0', 10);

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const currentTimeString = timeFormatter.format(now);

  // Closed between Friday 5:00 PM EST and Sunday 5:00 PM EST
  const isClosed =
    (weekday === 'Fri' && hour >= 17) ||
    weekday === 'Sat' ||
    (weekday === 'Sun' && hour < 17);

  if (isClosed) {
    return {
      isOpen: false,
      sessionName: 'Weekend Pause',
      nextEvent: 'Opens Sunday 17:00 EST',
      countdown: 'Weekend',
      badgeColor: '#FF3366',
      exchangeName: 'Global Interbank Forex',
      timezone: '24/5 Global',
      currentTimeString,
    };
  }

  return {
    isOpen: true,
    sessionName: 'Active Session',
    nextEvent: 'Open 24 Hours (Mon-Fri)',
    countdown: 'LIVE 24/5',
    badgeColor: '#00FF87',
    exchangeName: 'Global Interbank Forex',
    timezone: '24/5 Global',
    currentTimeString,
  };
}

/**
 * Crypto is 24/7/365 without closures.
 */
export function getCryptoMarketStatus(now = new Date()): MarketStatusInfo {
  const currentTimeString = now.toLocaleTimeString();
  return {
    isOpen: true,
    sessionName: 'Continuous Decentralized Trading',
    nextEvent: 'Never Closes',
    countdown: 'LIVE 24/7/365',
    badgeColor: '#00FF87',
    exchangeName: 'Global Crypto Ledger',
    timezone: 'UTC Universal',
    currentTimeString,
  };
}

/**
 * Returns current status for an asset type or symbol.
 */
export function getAssetMarketStatus(assetType: 'stock' | 'forex' | 'crypto', symbol?: string, now = new Date()): MarketStatusInfo {
  if (assetType === 'crypto') return getCryptoMarketStatus(now);
  if (assetType === 'forex') return getForexMarketStatus(now);

  // Distinguish Indian vs US Equities
  const indianEquities = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'TATASTEEL', 'NIFTY50', 'BANKNIFTY', 'TATAMOTORS', 'ADANIENT'];
  if (symbol && indianEquities.includes(symbol)) {
    return getIndianMarketStatus(now);
  }
  return getUSMarketStatus(now);
}

/**
 * Returns live world clocks for key trading hubs.
 */
export function getWorldExchangeClocks(now = new Date()): ExchangeClock[] {
  const getCityInfo = (city: string, exchange: string, timezone: string, openH: number, openM: number, closeH: number, closeM: number, is24h = false) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).formatToParts(now);

    const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const s = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);

    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const currentM = h * 60 + m;
    const startM = openH * 60 + openM;
    const endM = closeH * 60 + closeM;

    const isOpen = !isWeekend && currentM >= startM && currentM < endM;
    const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    return {
      id: city.toLowerCase(),
      city,
      exchange,
      timezone,
      isOpen,
      timeString,
      openHours: `${String(openH).padStart(2, '0')}:${String(openM).padStart(2, '0')} - ${String(closeH).padStart(2, '0')}:${String(closeM).padStart(2, '0')}`,
    };
  };

  return [
    getCityInfo('Mumbai', 'NSE / BSE', 'Asia/Kolkata', 9, 15, 15, 30),
    getCityInfo('New York', 'NYSE / NASDAQ', 'America/New_York', 9, 30, 16, 0),
    getCityInfo('London', 'LSE', 'Europe/London', 8, 0, 16, 30),
    getCityInfo('Tokyo', 'TSE', 'Asia/Tokyo', 9, 0, 15, 0),
  ];
}
