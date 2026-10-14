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
  Users,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

interface MenubarItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

interface MenubarProps {
  pendingCount?: number;
  facultyPendingCount?: number;
}

export const Menubar: React.FC<MenubarProps> = ({ pendingCount, facultyPendingCount }) => {
  const { userData } = useAuth();
  const location = useLocation();

  const studentNavItems: MenubarItem[] = [
    { name: "Overview", path: "/student/dashboard", icon: LayoutDashboard },
    { name: "Apply for Leave", path: "/student/apply", icon: FilePlus2 },
    { name: "My Leave Records", path: "/student/leaves", icon: History },
    { name: "Student Profile", path: "/student/profile", icon: User },
  ];

  const facultyNavItems: MenubarItem[] = [
    { name: "Class Overview", path: "/faculty/dashboard", icon: LayoutDashboard },
    {
      name: "Student Pending Approvals",
      path: "/faculty/approvals",
      icon: CheckSquare,
      badge: pendingCount,
    },
    { name: "Review Archive", path: "/faculty/history", icon: FileSpreadsheet },
    { name: "Apply Leave", path: "/faculty/apply-leave", icon: FilePlus2 },
    { name: "My Leaves", path: "/faculty/my-leaves", icon: Briefcase },
    { name: "Faculty Profile", path: "/faculty/profile", icon: User },
  ];

  const hodNavItems: MenubarItem[] = [
    { name: "Department Analytics", path: "/hod/dashboard", icon: LayoutDashboard },
    {
      name: "Student Leave Approvals",
      path: "/hod/approvals",
      icon: CheckSquare,
      badge: pendingCount,
    },
    {
      name: "Faculty Leave Approvals",
      path: "/hod/faculty-approvals",
      icon: Briefcase,
      badge: facultyPendingCount,
    },
    { name: "Leave Archive", path: "/hod/all-requests", icon: FileSpreadsheet },
    { name: "Faculty Allocation", path: "/hod/faculty", icon: Users },
    { name: "HOD Profile", path: "/hod/profile", icon: User },
  ];

  const adminNavItems: MenubarItem[] = [
    { name: "Institution Overview", path: "/admin/dashboard", icon: LayoutDashboard },
    {
      name: "Staff Approvals",
      path: "/admin/staff-approvals",
      icon: ShieldCheck,
      badge: facultyPendingCount,
    },
    {
      name: "Executive Approvals",
      path: "/admin/approvals",
      icon: ShieldAlert,
      badge: pendingCount,
    },
    { name: "College Archive", path: "/admin/all-requests", icon: FileSpreadsheet },
    { name: "User Management", path: "/admin/manage-users", icon: Users },
    { name: "Admin Profile", path: "/admin/profile", icon: User },
  ];

  let navItems = studentNavItems;
  if (userData?.role === "faculty") navItems = facultyNavItems;
  else if (userData?.role === "hod") navItems = hodNavItems;
  else if (userData?.role === "admin") navItems = adminNavItems;

  return (
    <nav
      data-ui="true"
      className="sticky top-0 z-30 w-full bg-white dark:bg-zinc-900 border-b border-zinc-200/90 dark:border-zinc-800 transition-colors" /* taste-skill-ignore */
    >
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
                    : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80"
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
                  <span className="relative z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-siet-primary dark:bg-red-600 text-white shadow-xs">
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
