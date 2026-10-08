import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FilePlus2,
  History,
  CheckSquare,
  FileSpreadsheet,
  User,
} from "lucide-react";

interface MenubarItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

interface MenubarProps {
  pendingCount?: number;
}

export const Menubar: React.FC<MenubarProps> = ({ pendingCount }) => {
  const { userData } = useAuth();
  const location = useLocation();

  const studentNavItems: MenubarItem[] = [
    { name: "Overview", path: "/student/dashboard", icon: LayoutDashboard },
    { name: "Apply for Leave", path: "/student/apply", icon: FilePlus2 },
    { name: "My Leave Records", path: "/student/leaves", icon: History },
    { name: "Student Profile", path: "/student/profile", icon: User },
  ];

  const hodNavItems: MenubarItem[] = [
    { name: "Department Analytics", path: "/hod/dashboard", icon: LayoutDashboard },
    {
      name: "Pending Approvals",
      path: "/hod/approvals",
      icon: CheckSquare,
      badge: pendingCount,
    },
    { name: "Leave Archive", path: "/hod/all-requests", icon: FileSpreadsheet },
    { name: "Faculty Profile", path: "/hod/profile", icon: User },
  ];

  const navItems = userData?.role === "hod" ? hodNavItems : studentNavItems;

  return (
    <nav className="sticky top-0 z-30 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap select-none ${
                  isActive
                    ? "text-siet-primary dark:text-red-400 font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                }`}
              >
                {/* Active Sliding Background Pill (Framer Motion) */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-xl bg-siet-primary/10 dark:bg-red-500/15 border border-siet-primary/25 dark:border-red-500/30 z-0"
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-siet-primary dark:text-red-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </span>

                {/* Clean Integer Notification Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-siet-primary dark:bg-red-600 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Menubar;
