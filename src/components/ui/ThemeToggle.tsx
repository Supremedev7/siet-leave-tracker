import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center justify-center h-9 w-9 rounded-xl border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        isDark
          ? "bg-zinc-800/80 border-zinc-700/80 text-amber-400 hover:bg-zinc-700/80 hover:text-amber-300"
          : "bg-white/90 border-zinc-200/90 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm"
      } ${className}`}
    >
      <motion.div
        key={isDark ? "dark" : "light"}
        initial={{ rotate: -45, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 45, scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 15 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </motion.div>
    </motion.button>
  );
};
