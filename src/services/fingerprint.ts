/**
 * Advanced Device Fingerprinting Utility
 * Generates a stable device & location fingerprint hash based on browser attributes,
 * screen resolution, hardware concurrency, language, timezone, and canvas 2D rendering.
 * Used to securely enforce the ₹0 / 2-Day Free Trial limit per device.
 */

export interface DeviceFingerprintData {
  hash: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  hardwareConcurrency: number;
}

export function getDeviceFingerprint(): DeviceFingerprintData {
  if (typeof window === 'undefined') {
    return {
      hash: 'server_env_fallback',
      userAgent: 'server',
      platform: 'unknown',
      language: 'en',
      timezone: 'UTC',
      screenResolution: '1920x1080',
      hardwareConcurrency: 4,
    };
  }

  const nav = window.navigator;
  const screen = window.screen;

  const userAgent = nav.userAgent || 'unknown';
  const platform = nav.platform || 'unknown';
  const language = nav.language || 'en';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const screenResolution = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const hardwareConcurrency = nav.hardwareConcurrency || 4;

  // Generate lightweight canvas 2D signature
  let canvasSig = 'canvas_0';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#00FF87';
      ctx.fillRect(0, 0, 160, 40);
      ctx.fillStyle = '#0A0E17';
      ctx.fillText('SZ-DEVICE-2026', 10, 10);
      canvasSig = canvas.toDataURL().slice(-32);
    }
  } catch {
    // Ignore canvas fallback
  }

  // Generate deterministic 32-bit hash
  const rawString = `${userAgent}|${platform}|${language}|${timezone}|${screenResolution}|${hardwareConcurrency}|${canvasSig}`;
  let hashNum = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hashNum = ((hashNum << 5) - hashNum) + char;
    hashNum |= 0; // Convert to 32bit integer
  }

  const hash = `fp_${Math.abs(hashNum).toString(16)}`;

  return {
    hash,
    userAgent,
    platform,
    language,
    timezone,
    screenResolution,
    hardwareConcurrency,
  };
}

const STORAGE_KEY_TRIAL = 'samzen_device_trial_claimed';

export function isDeviceTrialClaimed(fingerprintHash: string): boolean {
  try {
    const claimedFp = localStorage.getItem(STORAGE_KEY_TRIAL);
    if (claimedFp === fingerprintHash) return true;
    const history = JSON.parse(localStorage.getItem('samzen_claimed_fingerprints') || '[]');
    return history.includes(fingerprintHash);
  } catch {
    return false;
  }
}

export function markDeviceTrialClaimed(fingerprintHash: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRIAL, fingerprintHash);
    const history = JSON.parse(localStorage.getItem('samzen_claimed_fingerprints') || '[]');
    if (!history.includes(fingerprintHash)) {
      history.push(fingerprintHash);
      localStorage.setItem('samzen_claimed_fingerprints', JSON.stringify(history));
    }
  } catch {
    // Ignore localStorage write error
  }
}

export function detectDeviceModel(): string {
  if (typeof window === 'undefined') return 'Desktop Device';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'Apple iPhone';
  if (/iPad/i.test(ua)) return 'Apple iPad';
  if (/Macintosh/i.test(ua)) return 'Apple Mac';
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android.*?; (.*?)(?:;|\)| Build)/);
    if (match && match[1]) return `Android (${match[1].trim()})`;
    return 'Android Smartphone';
  }
  if (/Windows NT/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux Workstation';
  return 'Mobile Device';
}
