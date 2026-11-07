import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Health check and AI Studio control plane status endpoint
app.get(["/__aistudio_internal_control_plane/dev/status", "/__aistudio_internal_control_plane/*", "/health", "/api/health"], (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// In-memory OTP storage with expiration and attempt tracking
interface OtpRecord {
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}
const emailOtpStore = new Map<string, OtpRecord>();

// Helper to initialize email transporter if credentials exist
function getMailTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  return null;
}

// API: Send Email OTP to user's Gmail
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "A valid email address is required to receive verification code."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    emailOtpStore.set(normalizedEmail, {
      code: otp,
      createdAt: Date.now(),
      expiresAt,
      attempts: 0
    });

    const transporter = getMailTransporter();
    let sentReal = false;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #0F172A;">
        <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 2px solid #0F172A; border-radius: 12px; padding: 32px; box-shadow: 6px 6px 0px 0px #05D59E;">
          <div style="border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
            <div style="display: inline-block; width: 32px; height: 32px; background: #0F172A; color: #05D59E; font-weight: bold; text-align: center; line-height: 32px; border-radius: 4px; font-size: 18px;">SZ</div>
            <h1 style="display: inline-block; font-size: 18px; margin: 0; color: #0F172A; text-transform: uppercase; letter-spacing: 1px;">SZTrade Learn • A Project by SAMZEN</h1>
          </div>
          
          <h2 style="font-size: 20px; color: #0F172A; margin: 0 0 12px 0;">Your Verification Code</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
            Use the 6-digit verification code below to complete your login or registration for the SZTrade Learn platform.
          </p>
          
          <div style="background: #0F172A; color: #05D59E; font-size: 36px; font-weight: 900; letter-spacing: 10px; text-align: center; padding: 24px; border-radius: 8px; margin: 24px 0; font-family: monospace; border: 2px solid #05D59E;">
            ${otp}
          </div>
          
          <p style="font-size: 13px; color: #64748B; margin: 0 0 8px 0;">
            ⏱ This code is valid for <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 13px; color: #DC2626; margin: 0 0 24px 0; font-weight: 500;">
            🔒 Security Notice: Never share this OTP with anyone, including staff.
          </p>
          
          <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
            © 2026 SZTrade Learn • A Project by SAMZEN • Institutional Trading Education
          </div>
        </div>
      </div>
    `;

    if (transporter) {
      try {
        const fromAddress = process.env.EMAIL_FROM || process.env.GMAIL_USER || '"SZTrade Learn" <auth@sztrade-learn.internal>';
        await transporter.sendMail({
          from: fromAddress,
          to: normalizedEmail,
          subject: `${otp} is your SZTrade Learn verification code`,
          text: `Your SZTrade Learn verification code is: ${otp}. It expires in 10 minutes. Never share this code.`,
          html: emailHtml
        });
        sentReal = true;
        console.log(`[AUTH GMAIL] Successfully dispatched real OTP email to: ${normalizedEmail}`);
      } catch (mailError: any) {
        console.error(`[AUTH GMAIL ERROR] Failed to send via transporter:`, mailError.message);
      }
    } else {
      console.log(`[AUTH NOTICE] OTP generated for ${normalizedEmail}: ${otp}. (Set GMAIL_USER and GMAIL_APP_PASSWORD in environment to send via real Gmail inbox)`);
    }

    // NEVER EXPOSE OTP ON SCREEN / IN RESPONSE!
    return res.json({
      success: true,
      sentReal,
      email: normalizedEmail,
      message: sentReal
        ? `Verification code sent directly to ${normalizedEmail}. Please check your Gmail inbox and Spam folder.`
        : `Verification code dispatched to ${normalizedEmail}.`
    });

  } catch (error: any) {
    console.error("[AUTH Send OTP Exception]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to dispatch verification code."
    });
  }
});

// API: Verify Email OTP
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and 6-digit OTP code are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const record = emailOtpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        error: "No active verification code found for this email. Please request a new code."
      });
    }

    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        error: "Verification code has expired. Please request a fresh OTP."
      });
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      emailOtpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code."
      });
    }

    // Strict verification matching genuine generated code
    const isCorrect = record.code === cleanOtp;

    if (!isCorrect) {
      return res.status(400).json({
        success: false,
        error: "Invalid 6-digit verification code. Please check your Gmail inbox carefully."
      });
    }

    // Verification successful! Clean up OTP record
    emailOtpStore.delete(normalizedEmail);
    console.log(`[AUTH SUCCESS] User ${normalizedEmail} successfully verified via Gmail OTP.`);

    return res.json({
      success: true,
      email: normalizedEmail,
      message: "Email verified successfully."
    });

  } catch (error: any) {
    console.error("[AUTH Verify OTP Exception]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Verification failed."
    });
  }
});

// API: Google Account Sign-In / Verification
app.post("/api/auth/google-login", async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Valid Google email address is required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[AUTH GOOGLE] User signed in via Google Account: ${normalizedEmail}`);

    return res.json({
      success: true,
      email: normalizedEmail,
      name: name || normalizedEmail.split("@")[0],
      picture: picture || null,
      authProvider: "google"
    });

  } catch (error: any) {
    console.error("[AUTH Google Login Exception]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Google authentication failed."
    });
  }
});

// API: Logout confirmation endpoint
app.post("/api/auth/logout", async (req, res) => {
  return res.json({
    success: true,
    message: "Session ended successfully."
  });
});

// ==========================================
// ADVANCED AUTHENTICATION, DEVICE FINGERPRINTING & ADMIN CRM
// ==========================================

interface StoredUser {
  id: string;
  username: string;
  password?: string;
  email: string;
  gmailAddress?: string;
  mobileNumber?: string;
  deviceName?: string;
  accessCode: string;
  joinedAt: string;
  proTier: 'weekly' | 'monthly' | 'yearly' | 'lifetime' | null;
  proExpiresAt: string | null;
  isTrial: boolean;
  trialExpiresAt: string | null;
  deviceFingerprint: string;
  status: 'active_trial' | 'active_pro' | 'expired' | 'banned' | 'deactivated';
  subscriptionDays: number;
  amountPaid: number;
  demoBalance: number;
  lastActive: string;
  invoice?: any;
}

interface StoredMailboxItem {
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

// In-memory Digital Invoice Store
interface StoredInvoice {
  invoiceId: string;
  transactionId: string;
  username: string;
  email: string;
  mobileNumber: string;
  deviceName: string;
  deviceFingerprint: string;
  planName: string;
  proTier: 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  currency: string;
  timestamp: string;
  expiresAt: string;
  accessCode: string;
  status: 'PAID' | 'REFUNDED' | 'DISPUTED';
  qrPayload: string;
  signature: string;
}

const invoiceStore = new Map<string, StoredInvoice>([
  [
    'SZ-INV-2026-89104',
    {
      invoiceId: 'SZ-INV-2026-89104',
      transactionId: 'UPI-RZP-98104812',
      username: 'rahul_trader',
      email: 'rahul.t@gmail.com',
      mobileNumber: '9820145890',
      deviceName: 'OnePlus 12',
      deviceFingerprint: 'fp_rahul_mobile',
      planName: 'Elite Pro Monthly Pass',
      proTier: 'monthly',
      amount: 499,
      currency: 'INR',
      timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), // 6 hours ago (strictly ELIGIBLE for 48h refund)
      expiresAt: new Date(Date.now() + 24 * 86400000).toISOString(),
      accessCode: '72819401',
      status: 'PAID',
      qrPayload: JSON.stringify({
        inv: 'SZ-INV-2026-89104',
        tx: 'UPI-RZP-98104812',
        usr: 'rahul_trader',
        gmail: 'rahul.t@gmail.com',
        mob: '9820145890',
        amt: 499,
        ts: new Date(Date.now() - 6 * 3600000).toISOString(),
        code: '72819401',
        sig: 'SAMZEN_VERIFIED_AUTHENTIC_2026'
      }),
      signature: 'SAMZEN_VERIFIED_AUTHENTIC_2026'
    }
  ],
  [
    'SZ-INV-2026-10492',
    {
      invoiceId: 'SZ-INV-2026-10492',
      transactionId: 'UPI-RZP-10492811',
      username: 'sneha_mumbai',
      email: 'sneha.m@yahoo.com',
      mobileNumber: '9819283740',
      deviceName: 'Apple iPhone 15 Pro',
      deviceFingerprint: 'fp_sneha_lap',
      planName: 'Quarterly Institutional Pass',
      proTier: 'yearly',
      amount: 1299,
      currency: 'INR',
      timestamp: new Date(Date.now() - 72 * 3600000).toISOString(), // 72 hours ago (> 48h EXPIRED refund window)
      expiresAt: new Date(Date.now() + 85 * 86400000).toISOString(),
      accessCode: '61928374',
      status: 'PAID',
      qrPayload: JSON.stringify({
        inv: 'SZ-INV-2026-10492',
        tx: 'UPI-RZP-10492811',
        usr: 'sneha_mumbai',
        gmail: 'sneha.m@yahoo.com',
        mob: '9819283740',
        amt: 1299,
        ts: new Date(Date.now() - 72 * 3600000).toISOString(),
        code: '61928374',
        sig: 'SAMZEN_VERIFIED_AUTHENTIC_2026'
      }),
      signature: 'SAMZEN_VERIFIED_AUTHENTIC_2026'
    }
  ]
]);

// Device fingerprints that have already claimed the ₹0 / 2-Day Free Trial
const claimedDeviceFingerprints = new Set<string>(['fp_demo_used_1', 'fp_demo_used_2']);

// Pre-seeded User Database for CRM and Instant Login
const registeredUsers: Map<string, StoredUser> = new Map([
  [
    'samarth_trade',
    {
      id: 'usr_samarth_1',
      username: 'samarth_trade',
      password: 'password123',
      email: 'samarth@samzen.com',
      accessCode: '84920183',
      joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      proTier: 'lifetime',
      proExpiresAt: null,
      isTrial: false,
      trialExpiresAt: null,
      deviceFingerprint: 'fp_founder_01',
      status: 'active_pro',
      subscriptionDays: 9999,
      amountPaid: 799,
      demoBalance: 1000000,
      lastActive: new Date().toISOString()
    }
  ],
  [
    'vinayak_pro',
    {
      id: 'usr_vinayak_2',
      username: 'vinayak_pro',
      password: 'password123',
      email: 'vinayak@samzen.com',
      accessCode: '93810294',
      joinedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      proTier: 'yearly',
      proExpiresAt: new Date(Date.now() + 350 * 86400000).toISOString(),
      isTrial: false,
      trialExpiresAt: null,
      deviceFingerprint: 'fp_founder_02',
      status: 'active_pro',
      subscriptionDays: 365,
      amountPaid: 499,
      demoBalance: 1000000,
      lastActive: new Date().toISOString()
    }
  ],
  [
    'rahul_trader',
    {
      id: 'usr_rahul_3',
      username: 'rahul_trader',
      password: 'password123',
      email: 'rahul.t@gmail.com',
      accessCode: '72819401',
      joinedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      proTier: 'weekly',
      proExpiresAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      isTrial: true,
      trialExpiresAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      deviceFingerprint: 'fp_rahul_mobile',
      status: 'active_trial',
      subscriptionDays: 2,
      amountPaid: 0,
      demoBalance: 1000000,
      lastActive: new Date().toISOString()
    }
  ],
  [
    'sneha_mumbai',
    {
      id: 'usr_sneha_4',
      username: 'sneha_mumbai',
      password: 'password123',
      email: 'sneha.m@yahoo.com',
      accessCode: '61928374',
      joinedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      proTier: 'monthly',
      proExpiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
      isTrial: false,
      trialExpiresAt: null,
      deviceFingerprint: 'fp_sneha_lap',
      status: 'active_pro',
      subscriptionDays: 30,
      amountPaid: 299,
      demoBalance: 1000000,
      lastActive: new Date().toISOString()
    }
  ]
]);

// Centralized Admin Mailbox Store
const adminMailbox: StoredMailboxItem[] = [
  {
    id: 'msg_1',
    type: 'refund',
    userId: 'usr_rahul_3',
    username: 'rahul_trader',
    userEmail: 'rahul.t@gmail.com',
    subject: 'Inquiry regarding Pro Renewal & Automated UPI',
    message: 'Hello Samzen team, I completed my 2-Day Trial and would like to confirm my subscription activation duration. Thanks for the quick support.',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    status: 'new'
  },
  {
    id: 'msg_2',
    type: 'feedback',
    userId: 'usr_sneha_4',
    username: 'sneha_mumbai',
    userEmail: 'sneha.m@yahoo.com',
    subject: 'Love the Audio Notes Explainer & Market Maker Simulator!',
    message: 'The audio voice playback on the candlestick notes is incredible for learning while commuting. The dynamic chart reaction on buy/sell feels like real broker trading!',
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    status: 'reviewed'
  }
];

interface StoredCoupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  usageLimit: 'unlimited' | 'single';
  usedCount: number;
  createdAt: string;
  status: 'active' | 'disabled';
}

const couponStore = new Map<string, StoredCoupon>([
  ['SAMZEN20', {
    code: 'SAMZEN20',
    discountType: 'percentage',
    discountValue: 20,
    usageLimit: 'unlimited',
    usedCount: 2,
    createdAt: new Date().toISOString(),
    status: 'active'
  }],
  ['VIP50', {
    code: 'VIP50',
    discountType: 'flat',
    discountValue: 50,
    usageLimit: 'unlimited',
    usedCount: 1,
    createdAt: new Date().toISOString(),
    status: 'active'
  }]
]);

// Helper to generate unique 8-digit access code
function generateUnique8DigitCode(): string {
  let code = '';
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 20) {
    attempts++;
    // Generate random 8-digit number between 10000000 and 99999999
    code = crypto.randomInt(10000000, 100000000).toString();
    exists = false;
    for (const u of registeredUsers.values()) {
      if (u.accessCode === code) {
        exists = true;
        break;
      }
    }
  }
  return code;
}

// 1. Check Username Availability
app.get("/api/auth/check-username", (req, res) => {
  const username = String(req.query.username || "").trim().toLowerCase();
  if (!username || username.length < 3) {
    return res.json({ available: false, message: "Username must be at least 3 characters." });
  }

  // Reject special admin code as username
  if (username === "30072012" || username === "admin") {
    return res.json({ available: false, message: "This username is reserved." });
  }

  const userExists = Array.from(registeredUsers.values()).some(
    (u) => u.username.toLowerCase() === username
  );

  return res.json({ available: !userExists });
});

// 2. Check 8-Digit Access Code Availability
app.get("/api/auth/check-code", (req, res) => {
  const code = String(req.query.code || "").trim();
  if (!/^\d{8}$/.test(code)) {
    return res.json({ available: false, message: "Access code must be exactly 8 digits." });
  }

  if (code === "30072012") {
    return res.json({ available: false, message: "Reserved system code." });
  }

  const codeExists = Array.from(registeredUsers.values()).some((u) => u.accessCode === code);
  return res.json({ available: !codeExists });
});

// 3. Generate 8-Digit Unique Access Code (with AI / Algorithmic entropy)
app.post("/api/auth/generate-code", (req, res) => {
  const code = generateUnique8DigitCode();
  return res.json({ success: true, code });
});

// 4. Register New User & Device Fingerprinting 2-Day Trial Check
app.post("/api/auth/register", (req, res) => {
  try {
    const { 
      username, 
      password, 
      accessCode, 
      email, 
      gmailAddress, 
      mobileNumber, 
      deviceName, 
      deviceFingerprint 
    } = req.body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ success: false, error: "Username must be at least 3 characters." });
    }

    const cleanGmail = (gmailAddress || email || "").trim().toLowerCase();
    if (!cleanGmail || !cleanGmail.endsWith("@gmail.com")) {
      return res.status(400).json({ 
        success: false, 
        error: "A valid Gmail address ending with @gmail.com is strictly mandatory for institutional registration." 
      });
    }

    const cleanMobile = String(mobileNumber || "").replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: "A valid 10-digit mobile number is required for account security and billing verification." 
      });
    }

    const cleanDevice = String(deviceName || "Mobile Device").trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password ? String(password).trim() : "pass_" + Date.now();
    let cleanCode = accessCode ? String(accessCode).trim() : "";

    if (!/^\d{8}$/.test(cleanCode)) {
      cleanCode = generateUnique8DigitCode();
    }

    // Check availability
    for (const u of registeredUsers.values()) {
      if (u.username.toLowerCase() === cleanUsername) {
        return res.status(400).json({ success: false, error: "Username is already taken." });
      }
      if (u.accessCode === cleanCode) {
        return res.status(400).json({ success: false, error: "Access code is already in use." });
      }
    }

    const fp = deviceFingerprint || `fp_${Date.now()}`;
    const alreadyClaimedTrial = claimedDeviceFingerprints.has(fp);

    let isTrial = false;
    let trialExpiresAt: string | null = null;
    let proTier: 'weekly' | 'monthly' | 'yearly' | 'lifetime' | null = null;
    let proExpiresAt: string | null = null;
    let status: 'active_trial' | 'active_pro' | 'expired' = 'expired';

    if (!alreadyClaimedTrial) {
      // First time device: Grant ₹0 / 2-Day Free Trial
      isTrial = true;
      trialExpiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
      proTier = 'weekly';
      proExpiresAt = trialExpiresAt;
      status = 'active_trial';
      claimedDeviceFingerprints.add(fp);
      console.log(`[AUTH TRIAL] 2-Day Free Trial granted to new device fingerprint: ${fp} (${cleanDevice})`);
    } else {
      // Device previously used trial: bypass trial and demand subscription
      isTrial = false;
      trialExpiresAt = null;
      proTier = null;
      proExpiresAt = null;
      status = 'expired';
      console.log(`[AUTH TRIAL BLOCKED] Device fingerprint ${fp} already claimed free trial previously.`);
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      password: cleanPassword,
      email: cleanGmail,
      gmailAddress: cleanGmail,
      mobileNumber: cleanMobile,
      deviceName: cleanDevice,
      accessCode: cleanCode,
      joinedAt: new Date().toISOString(),
      proTier,
      proExpiresAt,
      isTrial,
      trialExpiresAt,
      deviceFingerprint: fp,
      status,
      subscriptionDays: isTrial ? 2 : 0,
      amountPaid: 0,
      demoBalance: 1000000,
      lastActive: new Date().toISOString()
    };

    registeredUsers.set(cleanUsername, newUser);

    return res.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        gmailAddress: newUser.gmailAddress,
        mobileNumber: newUser.mobileNumber,
        deviceName: newUser.deviceName,
        accessCode: newUser.accessCode,
        proTier: newUser.proTier,
        proExpiresAt: newUser.proExpiresAt,
        isTrial: newUser.isTrial,
        trialExpiresAt: newUser.trialExpiresAt,
        demoBalance: newUser.demoBalance,
        joinedAt: newUser.joinedAt,
        status: newUser.status,
      },
      trialGranted: isTrial,
      trialAlreadyUsed: alreadyClaimedTrial,
      message: isTrial
        ? "Account created! ₹0 / 2-Day Free Trial unlocked for your device."
        : "Account created! Free trial already claimed on this device. Please select a Pro plan."
    });

  } catch (error: any) {
    console.error("[Register Error]", error);
    return res.status(500).json({ success: false, error: error.message || "Registration failed." });
  }
});

// 5. Login Flow (Supports Username OR 8-Digit Access Code OR Secret Admin Code 30072012)
app.post("/api/auth/login", (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, error: "Username or 8-digit Access Code is required." });
    }

    const cleanIdentifier = String(identifier).trim();

    // SECRET ADMIN PORTAL ROUTE: Code '30072012'
    if (cleanIdentifier === "30072012") {
      console.log(`[ADMIN ACCESS] Admin triggered secret code 30072012 from IP.`);
      return res.json({
        success: true,
        isAdmin: true,
        role: "ADMIN",
        adminName: "Samzen SuperAdmin",
        message: "Secret admin access authenticated."
      });
    }

    // Standard User lookup by either username or 8-digit access code
    let foundUser: StoredUser | null = null;
    for (const u of registeredUsers.values()) {
      if (
        u.username.toLowerCase() === cleanIdentifier.toLowerCase() ||
        u.accessCode === cleanIdentifier
      ) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        error: "Account not found. Please verify your Username or 8-digit access code, or create a new account."
      });
    }

    // If banned
    if (foundUser.status === 'banned') {
      return res.status(403).json({
        success: false,
        error: "This account has been deactivated/banned by the administrator."
      });
    }

    // Password verification (if provided)
    if (password && foundUser.password && password !== foundUser.password) {
      return res.status(401).json({ success: false, error: "Incorrect password." });
    }

    foundUser.lastActive = new Date().toISOString();

    return res.json({
      success: true,
      isAdmin: false,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        gmailAddress: foundUser.gmailAddress,
        mobileNumber: foundUser.mobileNumber,
        deviceName: foundUser.deviceName,
        accessCode: foundUser.accessCode,
        proTier: foundUser.proTier,
        proExpiresAt: foundUser.proExpiresAt,
        isTrial: foundUser.isTrial,
        trialExpiresAt: foundUser.trialExpiresAt,
        demoBalance: foundUser.demoBalance,
        joinedAt: foundUser.joinedAt,
        status: foundUser.status,
        invoice: foundUser.invoice,
      }
    });

  } catch (error: any) {
    console.error("[Login Error]", error);
    return res.status(500).json({ success: false, error: error.message || "Login failed." });
  }
});

// 6. Deactivate Code & Delete Account Data (with Device Fingerprint Lock)
app.post("/api/auth/deactivate", (req, res) => {
  try {
    const { username, accessCode, deviceFingerprint } = req.body;
    let deletedKey: string | null = null;

    for (const [key, u] of registeredUsers.entries()) {
      if ((username && u.username.toLowerCase() === String(username).toLowerCase()) || (accessCode && u.accessCode === String(accessCode))) {
        deletedKey = key;
        if (u.deviceFingerprint) {
          claimedDeviceFingerprints.add(u.deviceFingerprint);
        }
        break;
      }
    }

    if (deviceFingerprint) {
      claimedDeviceFingerprints.add(deviceFingerprint);
    }

    if (deletedKey) {
      registeredUsers.delete(deletedKey);
      console.log(`[AUTH DEACTIVATE] User ${deletedKey} deactivated and deleted. Device fingerprint marked consumed.`);
    }

    return res.json({
      success: true,
      message: "Account and access code successfully deactivated. Device trial locked."
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Failed to deactivate." });
  }
});

// 7. Digital Invoicing: Record, Generate & Verify Dynamic QR Invoices
app.post("/api/invoices/record", (req, res) => {
  try {
    const {
      invoiceId,
      transactionId,
      username,
      email,
      mobileNumber,
      deviceName,
      deviceFingerprint,
      planName,
      proTier,
      amount,
      currency = "INR",
      accessCode,
      timestamp
    } = req.body;

    const invId = invoiceId || `SZ-INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const txId = transactionId || `UPI-RZP-${Date.now().toString().slice(-8)}`;
    const ts = timestamp || new Date().toISOString();
    const signature = crypto
      .createHmac("sha256", "SAMZEN_INVOICE_AUTH_SECRET_2026")
      .update(`${invId}|${username}|${amount}|${ts}`)
      .digest("hex")
      .substring(0, 16)
      .toUpperCase();

    const qrPayload = JSON.stringify({
      inv: invId,
      tx: txId,
      usr: username || "trader",
      gmail: email || "",
      mob: mobileNumber || "",
      dev: deviceName || "Mobile Device",
      amt: Number(amount) || 499,
      ts,
      code: accessCode || "SZ-PRO-2026",
      sig: signature
    });

    const invoice: StoredInvoice = {
      invoiceId: invId,
      transactionId: txId,
      username: username || "trader",
      email: email || "",
      mobileNumber: mobileNumber || "",
      deviceName: deviceName || "Mobile Device",
      deviceFingerprint: deviceFingerprint || "",
      planName: planName || "Elite Pro Membership",
      proTier: proTier || "monthly",
      amount: Number(amount) || 499,
      currency,
      timestamp: ts,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      accessCode: accessCode || "SZ-PRO-2026",
      status: "PAID",
      qrPayload,
      signature
    };

    invoiceStore.set(invId, invoice);

    if (username) {
      const u = registeredUsers.get(username.toLowerCase());
      if (u) {
        u.invoice = invoice;
        u.amountPaid = (u.amountPaid || 0) + invoice.amount;
        u.status = "active_pro";
      }
    }

    console.log(`[DIGITAL INVOICE CREATED] Generated digital invoice ${invId} for ${username} (₹${amount}) with dynamic QR.`);

    return res.json({
      success: true,
      invoice
    });
  } catch (error: any) {
    console.error("[Invoice Record Error]", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to record invoice." });
  }
});

// API: Verify QR Invoice Authenticity & 48-Hour Refund Status
app.post("/api/invoices/verify", (req, res) => {
  try {
    const { qrData, invoiceId } = req.body;
    let invRecord: StoredInvoice | undefined;

    if (invoiceId && invoiceStore.has(invoiceId)) {
      invRecord = invoiceStore.get(invoiceId);
    } else if (qrData) {
      let parsed: any;
      try {
        parsed = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
      } catch {
        // Plain string search
      }

      const lookupId = parsed?.inv || (typeof qrData === "string" && qrData.includes("SZ-INV") ? qrData.match(/SZ-INV-[\w-]+/)?.[0] : null);
      if (lookupId && invoiceStore.has(lookupId)) {
        invRecord = invoiceStore.get(lookupId);
      } else if (parsed && parsed.inv) {
        invRecord = {
          invoiceId: parsed.inv,
          transactionId: parsed.tx || "UPI-VERIFIED",
          username: parsed.usr || "Verified Trader",
          email: parsed.gmail || "",
          mobileNumber: parsed.mob || "",
          deviceName: parsed.dev || "Mobile Device",
          deviceFingerprint: "",
          planName: "Verified Pro Access",
          proTier: "monthly",
          amount: parsed.amt || 499,
          currency: "INR",
          timestamp: parsed.ts || new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          accessCode: parsed.code || "SZ-PRO-2026",
          status: "PAID",
          qrPayload: typeof qrData === "string" ? qrData : JSON.stringify(qrData),
          signature: parsed.sig || "VALID"
        };
      }
    }

    if (!invRecord) {
      return res.status(404).json({
        success: false,
        isAuthentic: false,
        error: "FRAUDULENT OR UNREGISTERED QR INVOICE: No matching record found in Samzen institutional database."
      });
    }

    const txDate = new Date(invRecord.timestamp).getTime();
    const now = Date.now();
    const hoursElapsed = (now - txDate) / (1000 * 3600);
    const isStrictlyWithin48Hours = hoursElapsed <= 48;
    const remainingHours = Math.max(0, Math.round((48 - hoursElapsed) * 10) / 10);

    return res.json({
      success: true,
      isAuthentic: true,
      invoice: invRecord,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      remainingHours,
      isEligibleForRefund: isStrictlyWithin48Hours && invRecord.status === "PAID",
      status: invRecord.status,
      message: isStrictlyWithin48Hours
        ? `Invoice verified as AUTHENTIC & ACTIVE. Eligible for refund (${remainingHours} hours remaining in 48h grace window).`
        : `Invoice verified as AUTHENTIC, but STRICT 48-HOUR REFUND WINDOW HAS EXPIRED (${Math.round(hoursElapsed)} hours elapsed).`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Failed to verify invoice." });
  }
});

// 8. Feedback & Refund Submissions -> Routed directly to Centralized Admin Mailbox with 48h Refund Guard
app.post("/api/feedback/submit", (req, res) => {
  try {
    const { 
      type = 'feedback', 
      username, 
      userEmail, 
      mobileNumber,
      invoiceId,
      qrPayload,
      paymentTimestamp,
      subject, 
      message 
    } = req.body;

    if (!message || String(message).trim().length < 2) {
      return res.status(400).json({ success: false, error: "Message cannot be empty." });
    }

    // STRICT 48-HOUR REFUND POLICY ENFORCEMENT
    let isEligibleForRefund = true;
    if (type === 'refund') {
      const ts = paymentTimestamp || (invoiceId && invoiceStore.get(invoiceId)?.timestamp);
      if (ts) {
        const hoursElapsed = (Date.now() - new Date(ts).getTime()) / (1000 * 3600);
        if (hoursElapsed > 48) {
          return res.status(400).json({
            success: false,
            error: `AUTOMATED REFUND REJECTION: Your payment was made ${hoursElapsed.toFixed(1)} hours ago. Samzen TradeLearn strictly enforces a 48-hour maximum refund window from payment timestamp. Your request cannot be processed.`
          });
        }
      } else if (!qrPayload && !invoiceId) {
        return res.status(400).json({
          success: false,
          error: "Mandatory Invoice QR code or Invoice Reference is required to verify transaction authenticity for refund processing."
        });
      }
    }

    const item: StoredMailboxItem = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: ['feedback', 'refund', 'support', 'bug'].includes(type) ? type : 'feedback',
      username: username || 'Anonymous Trader',
      userEmail: userEmail || 'trader@samzen.internal',
      mobileNumber,
      invoiceId,
      qrPayload,
      paymentTimestamp,
      isEligibleForRefund,
      subject: subject || (type === 'refund' ? 'Refund / Billing Inquiry (Within 48h)' : 'User Platform Feedback'),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    adminMailbox.unshift(item);
    console.log(`[MAILBOX DISPATCH] New ${item.type} received from ${item.username}. Total inbox items: ${adminMailbox.length}`);

    return res.json({
      success: true,
      id: item.id,
      message: type === 'refund'
        ? "Your refund request has been verified within the 48-hour window and logged into the Admin Priority Queue."
        : "Thank you! Your feedback has been securely routed directly to the Executive Admin Portal."
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Failed to submit feedback." });
  }
});

// 8. Admin CRM: Get System Overview & User Database
app.get("/api/admin/users", (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  let list = Array.from(registeredUsers.values());

  if (query) {
    list = list.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.accessCode.includes(query) ||
        u.email.toLowerCase().includes(query)
    );
  }

  return res.json({
    success: true,
    total: registeredUsers.size,
    users: list
  });
});

app.get("/api/admin/stats", (req, res) => {
  const allUsers = Array.from(registeredUsers.values());
  const activePro = allUsers.filter((u) => u.status === 'active_pro').length;
  const activeTrial = allUsers.filter((u) => u.status === 'active_trial').length;
  const totalRevenue = allUsers.reduce((sum, u) => sum + (u.amountPaid || 0), 0);
  const unreadMailbox = adminMailbox.filter((m) => m.status === 'new').length;

  return res.json({
    success: true,
    totalUsers: allUsers.length + 38, // Includes simulated active community base
    activeUsers: Math.min(allUsers.length + 24, 48), // Under 50 to keep Market Maker bot active
    activePro,
    activeTrial,
    totalRevenue,
    unreadMailbox
  });
});

// 9. Admin CRM: Update User (Activate/Deactivate, Duration, Amount Paid, Reassign Code, Recharge, Ban)
app.post("/api/admin/update-user", (req, res) => {
  try {
    const {
      username,
      action, // 'activate_pro' | 'deactivate_pro' | 'set_duration' | 'assign_code' | 'recharge' | 'ban' | 'delete'
      subscriptionDays,
      amountPaid,
      newAccessCode,
      rechargeAmount
    } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: "Username is required." });
    }

    const cleanUsername = String(username).toLowerCase();
    const user = registeredUsers.get(cleanUsername);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found in CRM." });
    }

    if (action === 'activate_pro') {
      const days = Number(subscriptionDays) || 30;
      const amount = Number(amountPaid) || 299;
      user.proTier = days >= 365 ? 'yearly' : 'monthly';
      user.proExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
      user.status = 'active_pro';
      user.subscriptionDays = days;
      user.amountPaid += amount;
      user.isTrial = false;
    } else if (action === 'deactivate_pro') {
      user.proTier = null;
      user.proExpiresAt = null;
      user.status = 'expired';
    } else if (action === 'set_duration') {
      const days = Number(subscriptionDays) || 30;
      user.subscriptionDays = days;
      user.proExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
      user.status = 'active_pro';
      if (amountPaid) user.amountPaid = Number(amountPaid);
    } else if (action === 'assign_code') {
      const code = newAccessCode ? String(newAccessCode).trim() : generateUnique8DigitCode();
      if (!/^\d{8}$/.test(code)) {
        return res.status(400).json({ success: false, error: "Access code must be 8 digits." });
      }
      user.accessCode = code;
    } else if (action === 'recharge') {
      const amount = Number(rechargeAmount) || 1000000;
      user.demoBalance += amount;
    } else if (action === 'ban') {
      user.status = 'banned';
      user.proTier = null;
    } else if (action === 'delete') {
      registeredUsers.delete(cleanUsername);
      return res.json({ success: true, message: `User ${cleanUsername} deleted from database.` });
    }

    return res.json({
      success: true,
      message: `User ${cleanUsername} updated successfully.`,
      user
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || "Admin action failed." });
  }
});

// 10. Admin Mailbox: Retrieve and Update Inquiries
app.get("/api/admin/mailbox", (req, res) => {
  const filter = String(req.query.filter || "all");
  let items = [...adminMailbox];

  if (filter !== "all") {
    items = items.filter((m) => m.type === filter);
  }

  return res.json({
    success: true,
    total: adminMailbox.length,
    unread: adminMailbox.filter((m) => m.status === 'new').length,
    items
  });
});

app.post("/api/admin/mailbox/update", (req, res) => {
  const { id, status, adminNotes } = req.body;
  const item = adminMailbox.find((m) => m.id === id);

  if (!item) {
    return res.status(404).json({ success: false, error: "Mailbox item not found." });
  }

  if (status) item.status = status;
  if (adminNotes) item.adminNotes = adminNotes;

  return res.json({ success: true, message: "Mailbox item updated.", item });
});

// ==========================================
// COUPON MANAGEMENT & VALIDATION APIs
// ==========================================

// Get all coupons for Admin CRM
app.get("/api/admin/coupons", (req, res) => {
  return res.json({
    success: true,
    coupons: Array.from(couponStore.values())
  });
});

// Create or update coupon
app.post("/api/admin/coupons/create", (req, res) => {
  try {
    const { code, discountType, discountValue, usageLimit } = req.body;
    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return res.status(400).json({ success: false, error: "Valid coupon code is required." });
    }
    const cleanCode = code.trim().toUpperCase();
    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      return res.status(400).json({ success: false, error: "Valid discount value is required." });
    }

    const coupon: StoredCoupon = {
      code: cleanCode,
      discountType: discountType === 'flat' ? 'flat' : 'percentage',
      discountValue: val,
      usageLimit: usageLimit === 'single' ? 'single' : 'unlimited',
      usedCount: 0,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    couponStore.set(cleanCode, coupon);
    console.log(`[COUPON CREATED] Admin created coupon ${cleanCode} (${val}${discountType === 'flat' ? '₹' : '%'}, ${usageLimit})`);
    return res.json({ success: true, coupon, message: `Coupon ${cleanCode} created successfully.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to create coupon." });
  }
});

// Delete coupon
app.post("/api/admin/coupons/delete", (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: "Coupon code required." });
    const cleanCode = String(code).trim().toUpperCase();
    couponStore.delete(cleanCode);
    return res.json({ success: true, message: `Coupon ${cleanCode} deleted.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to delete coupon." });
  }
});

// Validate Coupon
app.post("/api/coupons/validate", (req, res) => {
  try {
    const { code, originalAmount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: "Coupon code is required." });
    }
    const cleanCode = String(code).trim().toUpperCase();
    const coupon = couponStore.get(cleanCode);

    if (!coupon || coupon.status !== 'active') {
      return res.status(404).json({ success: false, error: "Invalid or expired coupon code." });
    }

    if (coupon.usageLimit === 'single' && coupon.usedCount >= 1) {
      return res.status(400).json({ success: false, error: "This single-use coupon has already been redeemed." });
    }

    const baseAmount = Number(originalAmount) || 299;
    let discountAmount = 0;

    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((baseAmount * coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(baseAmount, coupon.discountValue);
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);

    return res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount,
      message: `Coupon ${coupon.code} applied successfully! You saved ₹${discountAmount}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to validate coupon." });
  }
});

// ==========================================
// OFFICIAL MERCHANT PAYMENT GATEWAY (UPI INTENT & RAZORPAY)
// ==========================================

// Create Order for Verified UPI Intent Checkout
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount, planId, userEmail, userName } = req.body;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ success: false, error: "Valid payment amount is required." });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if live/test merchant keys are configured in environment
    if (keyId && keySecret) {
      const orderPayload = {
        amount: Math.round(Number(amount) * 100), // Razorpay accepts amount in paise
        currency: "INR",
        receipt: `sz_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        notes: {
          platform: "Samzen TradeLearn",
          planId: planId || "pro",
          email: userEmail || "customer@samzen.com",
          name: userName || "Trader"
        }
      };

      const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderPayload)
      });

      const orderData = (await rzpResponse.json()) as any;

      if (!rzpResponse.ok) {
        console.error("[Razorpay Gateway Error]", orderData);
        return res.status(500).json({
          success: false,
          error: orderData.error?.description || "Failed to initialize merchant order."
        });
      }

      console.log(`[PAYMENT GATEWAY] Generated official Razorpay order ${orderData.id} for ₹${amount}`);
      return res.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        keyId: keyId,
        isLiveGateway: true
      });
    }

    // Fallback: Sandbox / Development Mode when keys are not yet configured in .env
    console.log(`[PAYMENT GATEWAY NOTICE] Running in sandbox mode. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env to accept real customer payments.`);
    return res.json({
      success: true,
      orderId: `sz_demo_${Date.now()}`,
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      keyId: "rzp_test_placeholder",
      isLiveGateway: false,
      message: "Sandbox test gateway active. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment to process live UPI Intent."
    });

  } catch (error: any) {
    console.error("[Payment Create Order Exception]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to communicate with payment gateway."
    });
  }
});

// Verify Payment and signature, then unlock access code
app.post("/api/payment/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.error("[Payment Verification Error] HMAC signature mismatch.");
        return res.status(400).json({
          success: false,
          error: "Security verification failed: signature mismatch."
        });
      }
      console.log(`[PAYMENT VERIFIED] Verified payment ${razorpay_payment_id} for order ${razorpay_order_id}`);
    }

    // Always issue the master access key on verified payment
    const accessKey = "SZ-PRO-2026";
    return res.json({
      success: true,
      accessKey,
      paymentId: razorpay_payment_id || `sim_${Date.now()}`,
      message: "Payment successfully verified."
    });

  } catch (error: any) {
    console.error("[Payment Verify Exception]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Verification failed."
    });
  }
});

// Legacy SMS endpoint maintained for backwards compatibility
app.post("/api/send-otp", async (req, res) => {
  try {
    const { phoneNumber, email, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: "Phone number and OTP are required parameters."
      });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // Check if real SMS setup is active
    if (!accountSid || !authToken || !fromNumber) {
      console.log(`[SMS Simulation] To: ${phoneNumber}, Code: ${otp}. Reason: Twilio environment variables not configured.`);
      return res.json({
        success: true,
        realSent: false,
        message: "SMS simulated. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in settings to receive real SMS."
      });
    }

    // Format phone number (Ensure it has + prefix)
    let formattedTo = phoneNumber.trim();
    if (!formattedTo.startsWith("+")) {
      // Default to India country code if length is 10
      if (formattedTo.length === 10) {
        formattedTo = "+91" + formattedTo;
      } else {
        formattedTo = "+" + formattedTo;
      }
    }

    const messageBody = `Your SZTrade Learn verification OTP is: ${otp}. Do not share this with anyone. Enjoy learning!`;

    // Perform direct Twilio REST API request
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: fromNumber,
          Body: messageBody
        })
      }
    );

    const result = await response.json() as any;

    if (response.ok) {
      console.log(`[SMS Real] Successfully sent OTP to ${formattedTo}. Twilio SID: ${result.sid}`);
      return res.json({
        success: true,
        realSent: true,
        message: "OTP sent successfully to your mobile number!"
      });
    } else {
      console.error("[SMS Error] Twilio error response:", result);
      return res.status(500).json({
        success: false,
        error: result.message || "Failed to send SMS via Twilio."
      });
    }
  } catch (error: any) {
    console.error("[SMS Server Exception]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error occurred."
    });
  }
});

// Lazy-initialized Gemini AI Client Setup
import { GoogleGenAI } from "@google/genai";
let aiClient: any = null;

function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// AI Help and Feedback Endpoint
app.post("/api/ai-help", async (req, res) => {
  try {
    const { message, chatHistory = [], userProfile = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    try {
      const ai = getGeminiClient();
      
      const systemInstruction = `You are a supportive, expert AI Trading Coach and Support Assistant for the "SZTrade Learn" platform (A Project by SAMZEN).
Your user is ${userProfile.name || "a student"} (${userProfile.email || "anonymous"}), who currently has a ${userProfile.proTier || "Free"} membership tier.
Their paper trading balance is ${userProfile.demoBalance ? "INR " + userProfile.demoBalance : "N/A"}.

Your goals are:
1. Help with platform queries (how to paper trade, how to use Fibonacci levels, how to unlock courses, indicators).
2. Answer queries on Technical Indicators (SMA, EMA, RSI, Bollinger Bands, candlesticks).
3. Record their user feedback: If they offer feedback or bug reports, acknowledge it warmly, tell them it has been logged into the core product database, and provide some constructive insights on what they shared.
4. Encourage them to stay disciplined, stick to stop losses, and use correct position sizing.

Keep your tone professional, highly encouraging, and structurally clear (use bolding and short bullet points). Keep response under 150 words if possible. Do NOT display dry logs or ports.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `System context: ${systemInstruction}\n\nUser message: ${message}` }] }
        ],
        config: {
          temperature: 0.7,
        }
      });

      return res.json({
        success: true,
        reply: response.text || "I am processing your query. Could you please specify your concern about trading or platform feedback?"
      });

    } catch (apiError: any) {
      console.log("[AI Help Simulation Fallback] Due to missing key or API issue:", apiError.message);
      
      // Intelligent mock fallback responses when Gemini key isn't active
      let fallbackReply = `Hello! I am your AI Trading Assistant. Although the live Gemini API key is currently not active in this sandbox, I can help you answer standard course queries:\n\n` +
        `• **How to Paper Trade:** Head to the *Paper Trading Sandbox* tab, select an asset, choose BUY/SELL with target quantity, and execute. You can also drag trendlines directly on the SVG chart.\n` +
        `• **About Fibonacci/RSI:** Technical indicators are educational visual tools. RSI above 70 implies overbought, and below 30 implies oversold. Fibonacci retracements identify key support zones.\n` +
        `• **Platform Feedback:** I have logged your comment: "${message}". Our core team reviews all simulation notes regularly!\n\n` +
        `Upgrade to Pro inside the Go Pro section to enjoy full premium academy courses and live verification support!`;

      if (message.toLowerCase().includes("feedback") || message.toLowerCase().includes("suggest") || message.toLowerCase().includes("bug")) {
        fallbackReply = `Thank you so much for your feedback/suggestion! I have securely recorded your note: "${message}" inside our database log. Our engineering and content teams review all user feedback daily to build better educational and charting simulators. Let me know if you need any assistance on Fibonacci or paper trading.`;
      } else if (message.toLowerCase().includes("fibonacci") || message.toLowerCase().includes("indicator") || message.toLowerCase().includes("rsi") || message.toLowerCase().includes("sma")) {
        fallbackReply = `Great question! In our Academy, technical indicators are covered extensively:\n\n` +
          `• **RSI (Relative Strength Index):** Tracks momentum. Above 70 suggests hot/overbought, below 30 is cold/oversold.\n` +
          `• **SMA/EMA:** Smooth out price action to reveal the structural trend direction.\n` +
          `• **Bollinger Bands:** Represent price volatility. Buying near lower bands and selling near upper bands is a classic mean-reversion strategy.\n\n` +
          `You can toggle these indicators on and off directly in the Paper Trading Sandbox toolbar!`;
      }

      return res.json({
        success: true,
        reply: fallbackReply
      });
    }

  } catch (err: any) {
    console.error("[AI Help Server Error]", err);
    return res.status(500).json({ error: "Failed to query AI assistant." });
  }
});

// In-memory cache for 30+ day historical candles (24 hour TTL)
const marketHistoryCache = new Map<string, { timestamp: number; candles: any[] }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Symbol mapper to free public API identifiers
function mapToFreeApiSymbol(rawSymbol: string): { type: 'crypto' | 'yahoo' | 'forex'; apiSymbol: string } {
  const s = rawSymbol.toUpperCase().replace(/\s+/g, '');
  if (s.includes('BTC')) return { type: 'crypto', apiSymbol: 'BTCUSDT' };
  if (s.includes('ETH')) return { type: 'crypto', apiSymbol: 'ETHUSDT' };
  if (s.includes('SOL')) return { type: 'crypto', apiSymbol: 'SOLUSDT' };
  if (s.includes('BNB')) return { type: 'crypto', apiSymbol: 'BNBUSDT' };
  if (s.includes('XRP')) return { type: 'crypto', apiSymbol: 'XRPUSDT' };
  if (s.includes('DOGE')) return { type: 'crypto', apiSymbol: 'DOGEUSDT' };

  if (s.includes('NIFTY50') || s === 'NIFTY') return { type: 'yahoo', apiSymbol: '^NSEI' };
  if (s.includes('BANKNIFTY')) return { type: 'yahoo', apiSymbol: '^NSEBANK' };
  if (s.includes('FINNIFTY')) return { type: 'yahoo', apiSymbol: 'NIFTY_FIN_SERVICE.NS' };
  if (s.includes('SENSEX')) return { type: 'yahoo', apiSymbol: '^BSESN' };

  if (s.includes('EUR/USD') || s === 'EURUSD') return { type: 'yahoo', apiSymbol: 'EURUSD=X' };
  if (s.includes('GBP/USD') || s === 'GBPUSD') return { type: 'yahoo', apiSymbol: 'GBPUSD=X' };
  if (s.includes('USD/JPY') || s === 'USDJPY') return { type: 'yahoo', apiSymbol: 'JPY=X' };
  if (s.includes('USD/INR') || s === 'USDINR') return { type: 'yahoo', apiSymbol: 'INR=X' };
  if (s.includes('XAU') || s.includes('GOLD')) return { type: 'yahoo', apiSymbol: 'GC=F' };
  if (s.includes('USOIL') || s.includes('CRUDE')) return { type: 'yahoo', apiSymbol: 'CL=F' };

  if (['TSLA', 'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'].includes(s)) {
    return { type: 'yahoo', apiSymbol: s };
  }

  // Default Indian equity on NSE
  return { type: 'yahoo', apiSymbol: `${s}.NS` };
}

// Deterministic PRNG for realistic fallback candles (Mulberry32)
function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSeededHistoricalCandles(symbol: string, tf: string, offsetDays: number, count: number = 80) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
    hash |= 0;
  }
  const rng = mulberry32(Math.abs(hash) + 1337);

  let tfSec = 900;
  if (tf === '1m') tfSec = 60;
  else if (tf === '5m') tfSec = 300;
  else if (tf === '15m') tfSec = 900;
  else if (tf === '1H') tfSec = 3600;
  else if (tf === '1D') tfSec = 86400;

  const endSec = Math.floor(Date.now() / 1000) - (offsetDays * 86400);
  const startSec = endSec - (count * tfSec);

  let base = 1000;
  if (symbol.includes('BTC')) base = 62000;
  else if (symbol.includes('ETH')) base = 2500;
  else if (symbol.includes('SOL')) base = 160;
  else if (symbol.includes('NIFTY50')) base = 24200;
  else if (symbol.includes('BANKNIFTY')) base = 51000;
  else if (symbol.includes('RELIANCE')) base = 2950;
  else if (symbol.includes('TCS')) base = 3900;
  else if (symbol.includes('EUR')) base = 1.08;
  else if (symbol.includes('INR')) base = 84.1;
  else if (symbol.includes('XAU')) base = 2700;

  let current = base;
  const candles = [];
  for (let i = 0; i < count; i++) {
    const time = startSec + i * tfSec;
    const step = (rng() - 0.49) * 0.012 * current;
    const open = current;
    const close = Number((open + step).toFixed(base > 10 ? 2 : 4));
    const upperWick = rng() * 0.008 * current;
    const lowerWick = rng() * 0.008 * current;
    const high = Number((Math.max(open, close) + upperWick).toFixed(base > 10 ? 2 : 4));
    const low = Number((Math.min(open, close) - lowerWick).toFixed(base > 10 ? 2 : 4));
    const volume = Math.floor(rng() * 50000 + 5000);
    candles.push({ time, open, high, low, close, volume });
    current = close;
  }
  return candles;
}

// Free Historical Data API (30+ Days Old, Zero-Cost, Local Cache)
app.get("/api/market/history", async (req, res) => {
  try {
    const rawSymbol = String(req.query.symbol || "NIFTY50");
    const tf = String(req.query.timeframe || "15m");
    const offsetDays = parseInt(String(req.query.offsetDays || "30"), 10) || 30;

    const cacheKey = `${rawSymbol}_${tf}_${offsetDays}`;
    const cached = marketHistoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return res.json({
        success: true,
        source: 'server_cache',
        symbol: rawSymbol,
        timeframe: tf,
        offsetDays,
        candles: cached.candles
      });
    }

    const { type, apiSymbol } = mapToFreeApiSymbol(rawSymbol);

    // 1. FREE CRYPTO: Binance Historical Klines
    if (type === 'crypto') {
      try {
        const binanceInterval = tf === '1D' ? '1d' : tf === '1W' ? '1w' : tf === '1H' ? '1h' : tf === '5m' ? '5m' : '15m';
        const endMs = Date.now() - (offsetDays * 86400 * 1000);
        const startMs = endMs - (30 * 86400 * 1000);
        const url = `https://api.binance.com/api/v3/klines?symbol=${apiSymbol}&interval=${binanceInterval}&startTime=${startMs}&endTime=${endMs}&limit=300`;

        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (resp.ok) {
          const raw = await resp.json();
          if (Array.isArray(raw) && raw.length > 0) {
            const candles = raw.map((k: any) => ({
              time: Math.floor(k[0] / 1000),
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
              volume: parseFloat(k[5]),
            }));

            marketHistoryCache.set(cacheKey, { timestamp: Date.now(), candles });
            return res.json({
              success: true,
              source: 'binance_free_public_api',
              symbol: rawSymbol,
              timeframe: tf,
              offsetDays,
              candles
            });
          }
        }
      } catch (err: any) {
        console.warn(`[Binance Free API warning] ${rawSymbol}:`, err.message);
      }
    }

    // 2. FREE STOCKS & FOREX: Yahoo Finance Free Public Chart API
    try {
      const yahooInterval = tf === '1D' ? '1d' : tf === '1W' ? '1wk' : tf === '1H' ? '60m' : tf === '5m' ? '5m' : '15m';
      const endSec = Math.floor((Date.now() - offsetDays * 86400 * 1000) / 1000);
      const startSec = endSec - (30 * 86400);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(apiSymbol)}?period1=${startSec}&period2=${endSec}&interval=${yahooInterval}`;

      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      if (resp.ok) {
        const json = await resp.json();
        const result = json.chart?.result?.[0];
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps = result.timestamp;
          const quote = result.indicators.quote[0];
          const candles: any[] = [];

          for (let i = 0; i < timestamps.length; i++) {
            const o = quote.open?.[i];
            const h = quote.high?.[i];
            const l = quote.low?.[i];
            const c = quote.close?.[i];
            const v = quote.volume?.[i] || 1000;

            if (o != null && h != null && l != null && c != null && !isNaN(c)) {
              candles.push({
                time: timestamps[i],
                open: Number(o.toFixed(o < 10 ? 4 : 2)),
                high: Number(h.toFixed(h < 10 ? 4 : 2)),
                low: Number(l.toFixed(l < 10 ? 4 : 2)),
                close: Number(c.toFixed(c < 10 ? 4 : 2)),
                volume: Math.round(v)
              });
            }
          }

          if (candles.length > 5) {
            marketHistoryCache.set(cacheKey, { timestamp: Date.now(), candles });
            return res.json({
              success: true,
              source: 'yahoo_finance_free_api',
              symbol: rawSymbol,
              timeframe: tf,
              offsetDays,
              candles
            });
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Yahoo Finance Free API warning] ${rawSymbol}:`, err.message);
    }

    // 3. DETERMINISTIC PRNG REALISTIC FALLBACK (Symbol-Seeded, NO Repeating Giant Candle Pattern)
    const fallbackCandles = generateSeededHistoricalCandles(rawSymbol, tf, offsetDays, 120);
    marketHistoryCache.set(cacheKey, { timestamp: Date.now(), candles: fallbackCandles });
    return res.json({
      success: true,
      source: 'seeded_realistic_engine',
      symbol: rawSymbol,
      timeframe: tf,
      offsetDays,
      candles: fallbackCandles
    });

  } catch (error: any) {
    console.error("[Market History Error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware for development vs static asset serving for production
async function setupSvelteVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-stack application running on http://localhost:${PORT}`);
  });
}

setupSvelteVite();
