import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore using provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Test Firestore Connection on boot (silent check)
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'status'));
  } catch {
    // Silent catch for offline or uninitialized backend
  }
}
testFirestoreConnection();

// Configure Google Auth Provider with Google Docs & Drive scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/documents');
googleProvider.addScope('https://www.googleapis.com/auth/documents.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');

// In-memory token cache (DO NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup and obtain Google Docs OAuth access token
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Firebase Auth] Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get in-memory access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Set token in memory
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Sign out of Firebase
export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[Firebase Auth] SignOut error:', err);
  } finally {
    cachedAccessToken = null;
    clearPhoneRecaptcha();
  }
};

// --- Firebase Phone Authentication & reCAPTCHA Infrastructure ---

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

// Clean up existing reCAPTCHA instance to avoid "reCAPTCHA already rendered" conflicts
export const clearPhoneRecaptcha = () => {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch (e) {
      console.warn('[Firebase Auth] Error clearing recaptcha verifier:', e);
    }
    activeRecaptchaVerifier = null;
  }
  if (typeof window !== 'undefined' && (window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    (window as any).recaptchaVerifier = null;
  }
};

// Initialize RecaptchaVerifier for Phone OTP verification
export const setupPhoneRecaptcha = (
  containerId: string = 'recaptcha-container',
  size: 'invisible' | 'normal' = 'invisible',
  onSolved?: () => void,
  onExpired?: () => void
): RecaptchaVerifier => {
  clearPhoneRecaptcha();

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size,
    callback: () => {
      console.log('[Firebase Auth] reCAPTCHA solved successfully.');
      if (onSolved) onSolved();
    },
    'expired-callback': () => {
      console.warn('[Firebase Auth] reCAPTCHA expired, reset required.');
      if (onExpired) onExpired();
    }
  });

  activeRecaptchaVerifier = verifier;
  if (typeof window !== 'undefined') {
    (window as any).recaptchaVerifier = verifier;
  }
  return verifier;
};

// Send OTP code via Firebase Phone Authentication
export const sendFirebasePhoneOtp = async (
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

// Verify OTP code entered by the user
export const verifyFirebasePhoneOtp = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<User> => {
  const userCredential = await confirmationResult.confirm(otpCode);
  return userCredential.user;
};

// Standard E.164 International Phone Number Formatter
export function formatE164PhoneNumber(rawNumber: string, countryCode: string = '+91'): string {
  if (!rawNumber) return '';
  let cleaned = rawNumber.trim().replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Strip leading zeros common in local dialing
  cleaned = cleaned.replace(/^0+/, '');
  const prefix = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return `${prefix}${cleaned}`;
}

// Validate E.164 phone number
export function validatePhoneNumber(formattedE164: string): { isValid: boolean; error?: string } {
  if (!formattedE164 || !formattedE164.startsWith('+')) {
    return { isValid: false, error: 'Phone number must include an international country code (e.g. +91).' };
  }
  const digits = formattedE164.substring(1);
  if (!/^\d+$/.test(digits)) {
    return { isValid: false, error: 'Phone number must contain only numeric digits.' };
  }
  if (digits.length < 8 || digits.length > 15) {
    return { isValid: false, error: 'Phone number must be between 8 and 15 digits according to international E.164 standards.' };
  }
  return { isValid: true };
}

// Comprehensive Firebase Authentication Error Message Translator
export interface FormattedFirebaseError {
  title: string;
  message: string;
  code: string;
  isConfigIssue: boolean;
  manualConfigStep?: string;
}

export function getFirebaseErrorMessage(error: any): FormattedFirebaseError {
  const code = error?.code || 'auth/unknown';
  const rawMsg = error?.message || 'An unexpected error occurred during authentication.';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';

  switch (code) {
    case 'auth/operation-not-allowed':
      return {
        title: 'Phone Authentication Not Enabled',
        message: 'Phone sign-in is currently disabled in your Firebase project. You must enable it in the Firebase Console.',
        code,
        isConfigIssue: true,
        manualConfigStep: 'Go to Firebase Console > Authentication > Sign-in method > Phone > Click Enable and Save.'
      };
    case 'auth/unauthorized-domain':
      return {
        title: 'Domain Not Authorized',
        message: `This domain (${currentHost}) is not authorized for Firebase Authentication operations.`,
        code,
        isConfigIssue: true,
        manualConfigStep: `Go to Firebase Console > Authentication > Settings > Authorized domains > Add "${currentHost}".`
      };
    case 'auth/invalid-phone-number':
      return {
        title: 'Invalid Phone Number',
        message: 'The phone number format is invalid. Please check your country code and enter a valid mobile number in E.164 format (e.g. +91 9876543210).',
        code,
        isConfigIssue: false
      };
    case 'auth/missing-phone-number':
      return {
        title: 'Phone Number Required',
        message: 'Please enter your mobile phone number before requesting an OTP code.',
        code,
        isConfigIssue: false
      };
    case 'auth/quota-exceeded':
      return {
        title: 'Firebase SMS Quota Exceeded',
        message: 'The SMS quota for this Firebase project has been reached. For development and testing, you can add free test phone numbers in the Firebase Console.',
        code,
        isConfigIssue: true,
        manualConfigStep: 'Go to Firebase Console > Authentication > Sign-in method > Phone > "Phone numbers for testing" and add a test number (e.g., +91 99999 99999 with code 123456).'
      };
    case 'auth/billing-not-enabled':
      return {
        title: 'Blaze Plan Required for Real SMS',
        message: 'Sending SMS to real phone numbers requires a Firebase Blaze (pay-as-you-go) plan, or you can register test phone numbers in the Firebase Console for free.',
        code,
        isConfigIssue: true,
        manualConfigStep: 'Upgrade to Blaze plan or configure free test phone numbers under Authentication > Sign-in method > Phone.'
      };
    case 'auth/captcha-check-failed':
      return {
        title: 'reCAPTCHA Verification Failed',
        message: 'The reCAPTCHA security verification failed or timed out. Please try sending the OTP code again.',
        code,
        isConfigIssue: false
      };
    case 'auth/invalid-app-credential':
      return {
        title: 'reCAPTCHA App Credential Issue',
        message: 'Firebase reCAPTCHA validation failed. Ensure Phone Authentication is enabled and your domain is in Authorized Domains.',
        code,
        isConfigIssue: true,
        manualConfigStep: 'Check Authorized Domains in Firebase Console > Authentication > Settings.'
      };
    case 'auth/invalid-verification-code':
      return {
        title: 'Incorrect OTP Code',
        message: 'The 6-digit verification code you entered is invalid. Please double check the SMS you received and enter the correct code.',
        code,
        isConfigIssue: false
      };
    case 'auth/code-expired':
      return {
        title: 'OTP Expired',
        message: 'This verification code has expired. Please click "Resend Code" to receive a fresh OTP.',
        code,
        isConfigIssue: false
      };
    case 'auth/too-many-requests':
      return {
        title: 'Too Many Requests',
        message: 'Access temporarily blocked due to unusual activity or too many failed attempts. Please wait a few moments before trying again.',
        code,
        isConfigIssue: false
      };
    case 'auth/popup-closed-by-user':
      return {
        title: 'Sign-in Cancelled',
        message: 'The authentication popup was closed before completing sign-in.',
        code,
        isConfigIssue: false
      };
    default:
      return {
        title: 'Authentication Notice',
        message: rawMsg,
        code,
        isConfigIssue: false
      };
  }
}

// Firestore helper: Save user profile
export async function syncUserProfileToFirestore(userId: string, profile: UserProfile) {
  try {
    const effectiveUid = auth.currentUser?.uid || userId;
    const userRef = doc(db, 'users', effectiveUid);
    await setDoc(userRef, {
      uid: effectiveUid,
      email: profile.email,
      name: profile.name || '',
      authProvider: profile.authProvider || 'google',
      phoneNumber: profile.phoneNumber || null,
      joinedAt: profile.joinedAt,
      proTier: profile.proTier || null,
      proExpiresAt: profile.proExpiresAt || null,
      demoBalance: profile.demoBalance,
      progress: profile.progress || [],
      quizScores: profile.quizScores || {},
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e: any) {
    console.warn('[Firestore] Could not sync user profile:', e.message);
  }
}

// Firestore helper: Load user profile
export async function loadUserProfileFromFirestore(userId: string): Promise<Partial<UserProfile> | null> {
  try {
    const effectiveUid = auth.currentUser?.uid || userId;
    const userRef = doc(db, 'users', effectiveUid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as Partial<UserProfile>;
    }
    return null;
  } catch (e: any) {
    console.warn('[Firestore] Could not load user profile:', e.message);
    return null;
  }
}

export interface FirestoreTradeNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags?: string[];
  googleDocId?: string;
  googleDocUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Firestore helper: Save Trade Note
export async function saveNoteToFirestore(userId: string, note: FirestoreTradeNote) {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', note.id);
    await setDoc(noteRef, note, { merge: true });
  } catch (e: any) {
    console.warn('[Firestore] Could not save note:', e.message);
  }
}

// Firestore helper: List Trade Notes
export async function listNotesFromFirestore(userId: string): Promise<FirestoreTradeNote[]> {
  try {
    const notesCol = collection(db, 'users', userId, 'notes');
    const snap = await getDocs(notesCol);
    return snap.docs.map(d => d.data() as FirestoreTradeNote);
  } catch (e: any) {
    console.warn('[Firestore] Could not list notes:', e.message);
    return [];
  }
}

// Firestore helper: Delete Trade Note
export async function deleteNoteFromFirestore(userId: string, noteId: string) {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
  } catch (e: any) {
    console.warn('[Firestore] Could not delete note:', e.message);
  }
}
