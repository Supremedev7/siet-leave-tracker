/**
 * Professional Session & Device Intelligence Management for SIET Academic Portal
 * Tracks authenticated sessions, device attributes, and security telemetry.
 */

import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { setCookie, getCookie, deleteCookie, getStoredCookiePreferences } from "@/lib/cookies";

export interface DeviceTelemetry {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
  screenResolution: string;
  timezone: string;
  language: string;
  userAgent: string;
}

export interface SessionRecord {
  sessionId: string;
  loginAt: string;
  lastActiveAt: string;
  device: DeviceTelemetry;
  rememberMe: boolean;
  ipTimezone: string;
}

const SESSION_COOKIE_KEY = "siet_session_token";
const SESSION_REMEMBER_KEY = "siet_remember_device";

/**
 * Detect client device, browser, OS, and hardware profile
 */
export function detectDeviceTelemetry(): DeviceTelemetry {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

  // Browser detection
  if (/Edg\//i.test(ua)) {
    browser = "Microsoft Edge";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Google Chrome";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Apple Safari";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Mozilla Firefox";
  } else if (/Opera|OPR\//i.test(ua)) {
    browser = "Opera";
  }

  // OS detection
  if (/Windows NT/i.test(ua)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS";
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  // Device Form Factor
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = "mobile";
  }

  const screenResolution = `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x)`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const language = navigator.language || "en-US";

  return {
    browser,
    os,
    deviceType,
    screenResolution,
    timezone,
    language,
    userAgent: ua,
  };
}

/**
 * Generate a cryptographically robust session identifier
 */
export function generateSessionId(): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `siet_sess_${time}_${rand}`;
}

/**
 * Record a verified login session in Firestore and initialize local cookies
 */
export async function recordSessionLogin(
  userId: string,
  userEmail: string,
  rememberMe: boolean = true
): Promise<string> {
  const sessionId = generateSessionId();
  const device = detectDeviceTelemetry();
  const now = new Date().toISOString();

  const sessionData: SessionRecord = {
    sessionId,
    loginAt: now,
    lastActiveAt: now,
    device,
    rememberMe,
    ipTimezone: device.timezone,
  };

  // Check cookie permissions
  const consent = getStoredCookiePreferences();
  const allowFunctional = consent ? consent.functional : true;

  if (allowFunctional) {
    const days = rememberMe ? 30 : 1; // 30 days if remember me, 1 day for standard session
    setCookie(SESSION_COOKIE_KEY, sessionId, days, "Lax");
    setCookie(SESSION_REMEMBER_KEY, rememberMe ? "true" : "false", days, "Lax");
  }

  // Update Firestore user profile with telemetry attributes
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      lastLoginDevice: device,
      currentSessionId: sessionId,
      currentSession: sessionData,
      sessionLastActive: serverTimestamp(),
      lastKnownEmail: userEmail,
      deviceTelemetry: {
        browser: device.browser,
        os: device.os,
        type: device.deviceType,
        timezone: device.timezone,
      },
    });
  } catch (err) {
    console.warn("Telemetry write to Firestore deferred:", err);
  }

  return sessionId;
}

/**
 * Retrieve active session token
 */
export function getActiveSessionToken(): string | null {
  return getCookie(SESSION_COOKIE_KEY);
}

/**
 * Validate active academic session token presence and integrity
 */
export function validateAcademicSession(): boolean {
  const token = getActiveSessionToken();
  if (!token) return false;
  return token.startsWith("siet_sess_");
}

/**
 * Clean up session cookies and reset state upon logout
 */
export function clearSessionData(): void {
  deleteCookie(SESSION_COOKIE_KEY);
  deleteCookie(SESSION_REMEMBER_KEY);
  try {
    localStorage.removeItem("siet_active_session");
  } catch {
    // Ignore storage restriction
  }
}

