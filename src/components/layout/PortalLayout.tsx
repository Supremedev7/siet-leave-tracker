import React from "react";
import TopMasthead from "./TopMasthead";
import Menubar from "./Menubar";
import { MinimalTopProgressBar } from "@/components/ui/MinimalLoader";
import { motion } from "framer-motion";

interface PortalLayoutProps {
  children: React.ReactNode;
  pendingCount?: number;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  pendingCount,
}) => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-zinc-950 flex flex-col text-zinc-900 dark:text-zinc-100 font-sans selection:bg-siet-primary/10 selection:text-siet-primary transition-colors">
      {/* Sleek top indeterminate progress line during async actions */}
      <MinimalTopProgressBar />

      {/* Tier 1: Top Institutional Masthead */}
      <TopMasthead />

      {/* Tier 2: Sticky Command Menubar */}
      <Menubar pendingCount={pendingCount} />

      {/* Main Academic Portal Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Institutional Footer */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 mt-auto select-none transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-zinc-700 dark:text-zinc-200">
            Srinivasa Institute of Engineering &amp; Technology (Autonomous)
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Approved by AICTE, New Delhi &amp; Permanently Affiliated to JNTUK, Kakinada • NH-216, Cheyyeru, AP
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 font-mono">
            Official Academic Leave Authorization &amp; Attendance Audit System
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PortalLayout;
