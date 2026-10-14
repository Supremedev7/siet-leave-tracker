import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  Clock,
  Info,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  InAppNotification,
} from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";

export const NotificationBell: React.FC = () => {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(user.uid, (list) => {
      setNotifications(list);
      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    setIsOpen(false);

    // Route based on role
    if (userData?.role === "student") {
      navigate("/student/my-leaves");
    } else if (userData?.role === "faculty") {
      navigate("/faculty/my-leaves");
    } else if (userData?.role === "hod") {
      navigate("/hod/dashboard");
    } else {
      navigate("/admin/dashboard");
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "rejection":
        return <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case "forwarded":
        return <ArrowRightCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "submitted":
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Info className="h-4 w-4 text-zinc-500" />;
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "Just now";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="relative p-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary/30"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-siet-primary text-white text-[10px] font-bold font-mono shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-2xl shadow-zinc-900/10 dark:shadow-black/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-siet-primary/10 text-siet-primary dark:bg-red-950 dark:text-red-400">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-zinc-500 hover:text-siet-primary dark:hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  No notifications yet
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Leave approval and status updates will appear here in real-time.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
                    !notif.read
                      ? "bg-siet-primary/5 dark:bg-red-950/20"
                      : "opacity-85"
                  }`}
                >
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>

                    {notif.metadata?.remarks && (
                      <p className="text-[11px] italic text-zinc-500 dark:text-zinc-400 mt-1 pl-2 border-l-2 border-zinc-300 dark:border-zinc-700">
                        "{notif.metadata.remarks}"
                      </p>
                    )}
                  </div>

                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-siet-primary mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
