import React from "react";
import { motion } from "framer-motion";
import { SIETLogo } from "@/components/branding/SIETLogo";

export const MinimalTopProgressBar: React.FC = () => {
  return null;
};

export const SIETLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FAFAF9] dark:bg-zinc-950 z-50 p-6 select-none transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center max-w-sm"
      >
        <SIETLogo variant="full" size={54} />
        <div className="w-48 h-[2px] bg-zinc-200 dark:bg-zinc-800 overflow-hidden rounded-full mt-2">
          <motion.div
            className="h-full bg-siet-primary dark:bg-red-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            style={{ width: "60%" }}
          />
        </div>
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
          Authenticating Academic Session...
        </p>
      </motion.div>
    </div>
  );
};

export default SIETLoadingScreen;
