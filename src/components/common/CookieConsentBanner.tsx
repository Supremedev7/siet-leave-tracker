import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cookie,
  ShieldCheck,
  Bell,
  Sliders,
  Check,
} from "lucide-react";
import {
  hasUserConsented,
  getStoredCookiePreferences,
  saveCookiePreferences,
  acceptAllCookies,
  acceptEssentialOnly,
  CookiePreferences,
} from "@/lib/cookies";

export const CookieConsentBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [preferences, setPreferences] = useState<Partial<CookiePreferences>>({
    essential: true,
    functional: true,
    notifications: true,
    analytics: false,
  });

  useEffect(() => {
    // If user has not consented yet, display after a brief smooth delay
    const consented = hasUserConsented();
    if (!consented) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    } else {
      const stored = getStoredCookiePreferences();
      if (stored) {
        setPreferences(stored);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setIsOpen(false);
  };

  const handleAcceptEssential = () => {
    acceptEssentialOnly();
    setIsOpen(false);
  };

  const handleSavePreferences = () => {
    saveCookiePreferences(preferences);
    setIsOpen(false);
    setShowCustomizer(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-5 pointer-events-none flex justify-center">
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="w-full max-w-4xl pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 overflow-hidden"
        >
          {/* Header Banner Accent */}
          <div className="h-1 bg-gradient-to-r from-siet-primary via-siet-gold to-siet-primary" />

          <div className="p-4 sm:p-6 space-y-4">
            {/* Top Bar: Icon + Explanation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-siet-primary/10 dark:bg-red-950/40 border border-siet-primary/20 dark:border-red-900/30 flex items-center justify-center flex-shrink-0 text-siet-primary dark:text-red-400">
                  <Cookie className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
                    Privacy & Academic Session Cookies
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      GDPR & Campus Safe
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                    We use strictly essential cookies and local session telemetry to protect your account,
                    persist login credentials, and deliver real-time Firebase Push Notifications (FCM) for
                    leave approvals and rejections.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors self-end sm:self-auto"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{showCustomizer ? "Hide Preferences" : "Customize"}</span>
              </button>
            </div>

            {/* Customizer Panel */}
            {showCustomizer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {/* 1. Essential */}
                <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-750/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Essential Auth
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">
                        Required
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Login session, token verification, and security telemetry.
                    </p>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Always Active
                    </span>
                  </div>
                </div>

                {/* 2. Notifications & FCM */}
                <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-750/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-siet-primary dark:text-red-400" />
                        FCM Push Alerts
                      </span>
                      <input
                        type="checkbox"
                        checked={preferences.notifications ?? true}
                        onChange={(e) =>
                          setPreferences((p) => ({
                            ...p,
                            notifications: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded text-siet-primary focus:ring-siet-primary/20 accent-siet-primary cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Push notification tokens for real-time leave status alerts.
                    </p>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-[11px] font-medium text-zinc-500">
                      {preferences.notifications ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* 3. Session Persistence */}
                <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-750/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Cookie className="h-3.5 w-3.5 text-amber-500" />
                        Device Memory
                      </span>
                      <input
                        type="checkbox"
                        checked={preferences.functional ?? true}
                        onChange={(e) =>
                          setPreferences((p) => ({
                            ...p,
                            functional: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded text-siet-primary focus:ring-siet-primary/20 accent-siet-primary cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Keeps your dashboard logged in and stores dark/light mode preference.
                    </p>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-[11px] font-medium text-zinc-500">
                      {preferences.functional ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bottom Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Srinivasa Institute of Engineering & Technology (Autonomous)</span>
                <span>•</span>
                <span className="hover:underline cursor-pointer">Security Protocol v2.5</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {showCustomizer ? (
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-siet-primary text-white hover:bg-siet-primary/90 transition-all shadow-md shadow-siet-primary/20 flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save My Preferences
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAcceptEssential}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Essential Only
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-siet-primary to-red-800 hover:opacity-95 transition-all shadow-md shadow-siet-primary/25 flex items-center justify-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept All & Proceed
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
