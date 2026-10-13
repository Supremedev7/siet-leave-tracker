/**
 * Professional Cookie & Consent Management Utility for SIET Academic Portal
 * Conforms to modern GDPR/institutional privacy & SameSite security guidelines.
 */

export interface CookiePreferences {
  essential: boolean; // Authentication, security, session integrity (Always true)
  functional: boolean; // UI preferences, session persistence, device recognition
  notifications: boolean; // Push notifications, FCM tokens, desktop alerts
  analytics: boolean; // Performance monitoring, operational telemetry
  consentedAt: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: true,
  notifications: true,
  analytics: false,
  consentedAt: new Date().toISOString(),
};

const CONSENT_COOKIE_KEY = "siet_cookie_consent_v1";

/**
 * Set a cookie with standard security attributes
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 30,
  sameSite: "Lax" | "Strict" | "None" = "Lax"
): void {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const isSecure = window.location.protocol === "https:";
    const secureFlag = isSecure ? "; Secure" : "";
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; expires=${expires.toUTCString()}; path=/; SameSite=${sameSite}${secureFlag}`;
  } catch (err) {
    console.warn("Failed to set cookie:", err);
  }
}

/**
 * Retrieve a cookie value by name
 */
export function getCookie(name: string): string | null {
  try {
    const encodedName = encodeURIComponent(name) + "=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let c = cookies[i].trim();
      if (c.indexOf(encodedName) === 0) {
        return decodeURIComponent(c.substring(encodedName.length));
      }
    }
  } catch (err) {
    console.warn("Failed to read cookie:", err);
  }
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string): void {
  try {
    document.cookie = `${encodeURIComponent(
      name
    )}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn("Failed to delete cookie:", err);
  }
}

/**
 * Check if the user has completed the cookie consent prompt
 */
export function hasUserConsented(): boolean {
  return getCookie(CONSENT_COOKIE_KEY) !== null;
}

/**
 * Get current stored cookie preferences
 */
export function getStoredCookiePreferences(): CookiePreferences | null {
  const raw = getCookie(CONSENT_COOKIE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

/**
 * Save user cookie preferences
 */
export function saveCookiePreferences(prefs: Partial<CookiePreferences>): CookiePreferences {
  const completePrefs: CookiePreferences = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    essential: true, // Essential is always locked to true
    consentedAt: new Date().toISOString(),
  };

  setCookie(CONSENT_COOKIE_KEY, JSON.stringify(completePrefs), 365, "Lax");
  
  // Fire storage event for reactive listeners across tabs
  window.dispatchEvent(new CustomEvent("siet_cookie_consent_updated", { detail: completePrefs }));
  
  return completePrefs;
}

/**
 * Accepts all cookies (Essential, Functional, Notifications, Analytics)
 */
export function acceptAllCookies(): CookiePreferences {
  return saveCookiePreferences({
    essential: true,
    functional: true,
    notifications: true,
    analytics: true,
  });
}

/**
 * Accepts only strictly essential cookies
 */
export function acceptEssentialOnly(): CookiePreferences {
  return saveCookiePreferences({
    essential: true,
    functional: false,
    notifications: false,
    analytics: false,
  });
}
