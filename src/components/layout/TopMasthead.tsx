import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { SIETLogo, sietEmblem } from "@/components/branding/SIETLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogOut, Calendar, ChevronDown, User } from "lucide-react";

export const TopMasthead: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      navigate("/login");
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const dashboardRoute =
    userData?.role === "hod" ? "/hod/dashboard" : "/student/dashboard";

  return (
    <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200/90 dark:border-zinc-800 relative z-40 select-none transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Official SIET Full Brand Logo */}
        <Link
          to={dashboardRoute}
          className="flex items-center gap-3 hover:opacity-95 transition-opacity py-1 flex-shrink-0"
        >
          <SIETLogo variant="full" size={46} className="hidden sm:block" />
          <div className="leading-tight sm:hidden flex items-center gap-2">
            <span className="font-extrabold text-base text-siet-primary dark:text-red-400 tracking-wide font-display block">
              SIET
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider uppercase block border-l border-zinc-200 dark:border-zinc-700 pl-2">
              Leave Portal
            </span>
          </div>
        </Link>

        {/* Center: Academic Session Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <Calendar className="h-3.5 w-3.5 text-siet-primary dark:text-red-400" />
          <span>Academic Year 2025–26</span>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {userData?.department || "Campus"} Portal
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <span className="text-[10px] uppercase font-bold text-siet-gold tracking-wider">
            Autonomous
          </span>
        </div>

        {/* Right: Theme Toggle & User Profile Actions Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-750 transition-all text-left shadow-xs"
            >
              <div className="h-9 w-9 rounded-full bg-white dark:bg-zinc-700 p-0.5 border border-zinc-200 dark:border-zinc-600 shadow-xs flex items-center justify-center flex-shrink-0">
                <img
                  src={sietEmblem}
                  alt="Official Emblem"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>

              <div className="hidden sm:block leading-tight pr-1">
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                  {userData?.name || "Academic User"}
                </p>
                <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
                  {userData?.role === "hod"
                    ? `HOD • ${userData?.department}`
                    : `${userData?.rollNumber || "Student"}`}
                </p>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-40 animate-fade-up">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {userData?.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                      {userData?.email}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400 rounded font-mono">
                      {userData?.role === "hod" ? "Department Head" : "Student"}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to={
                        userData?.role === "hod"
                          ? "/hod/profile"
                          : "/student/profile"
                      }
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                      View Profile &amp; ID
                    </Link>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {isLoggingOut ? "Signing out..." : "Sign Out"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopMasthead;
