import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { requestNotificationPermission } from "@/lib/notifications";
import { getCookie, setCookie, getStoredCookiePreferences } from "@/lib/cookies";
import { toast } from "sonner";

const SNOOZE_COOKIE_KEY = "siet_notif_prompt_snoozed";

export const NotificationPromptBanner: React.FC = () => {
  const { user, userData } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Only prompt authenticated users
    if (!user) {
      setIsVisible(false);
      return;
    }

    // Check if browser supports notifications
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    // If already granted or denied at the browser level, do not prompt
    if (Notification.permission === "granted" || Notification.permission === "denied") {
      return;
    }

    // Check if user has snoozed recently
    const snoozed = getCookie(SNOOZE_COOKIE_KEY);
    if (snoozed) {
      return;
    }

    // Check cookie preferences (must allow notifications)
    const consent = getStoredCookiePreferences();
    if (consent && !consent.notifications) {
      return;
    }

    // Show after slight delay to avoid initial page load clutter
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;
    setIsSubscribing(true);
    try {
      const res = await requestNotificationPermission(user.uid);
      if (res.success) {
        toast.success("Push notifications enabled!", {
          description: "You will now receive instant alerts on approvals and rejections.",
        });
        setIsVisible(false);
      } else {
        toast.error("Could not activate notifications", {
          description: res.error || "Please allow permissions in browser address bar.",
        });
        setIsVisible(false);
      }
    } catch (err: any) {
      toast.error("Notification registration failed", { description: err.message });
      setIsVisible(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSnooze = () => {
    // Snooze for 7 days
    setCookie(SNOOZE_COOKIE_KEY, "snoozed", 7, "Lax");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="fixed top-24 right-4 sm:right-6 z-50 max-w-md w-full p-0.5 rounded-2xl bg-gradient-to-r from-siet-primary via-siet-gold to-red-800 shadow-2xl shadow-siet-primary/20 pointer-events-auto select-none"
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-siet-primary/10 dark:bg-red-950/40 border border-siet-primary/20 flex items-center justify-center flex-shrink-0 text-siet-primary dark:text-red-400">
                <BellRing className="h-5 w-5 animate-bounce" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-siet-gold">
                    Instant Updates
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {userData?.role === "faculty" ? "HOD & Principal Alerts" : "Advisor & HOD Alerts"}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-display mt-0.5">
                  Enable Real-Time Leave Push Notifications?
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Get notified instantly on this device as soon as your leave request is{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Approved</strong> or{" "}
                  <strong className="text-rose-600 dark:text-rose-400 font-semibold">Rejected</strong>, even when the browser tab is closed.
                </p>
              </div>
            </div>

            <button
              onClick={handleSnooze}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              onClick={handleSnooze}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleEnable}
              disabled={isSubscribing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-siet-primary to-red-800 hover:opacity-95 shadow-md shadow-siet-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubscribing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Activating…
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Enable Push Notifications
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
