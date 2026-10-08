import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "warning" | "success" | "danger" | "neutral";
  trend?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
  trend,
  onClick,
}) => {
  const variantStyles = {
    primary: {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-zinc-200/80 dark:border-zinc-800 hover:border-siet-primary/40 dark:hover:border-red-500/40",
      iconBg: "bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400",
      ring: "group-hover:ring-siet-primary/20",
    },
    warning: {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-zinc-200/80 dark:border-zinc-800 hover:border-amber-400/60",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
      ring: "group-hover:ring-amber-500/20",
    },
    success: {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-400/60",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      ring: "group-hover:ring-emerald-500/20",
    },
    danger: {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-zinc-200/80 dark:border-zinc-800 hover:border-rose-400/60",
      iconBg: "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400",
      ring: "group-hover:ring-rose-500/20",
    },
    neutral: {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400/40",
      iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
      ring: "group-hover:ring-zinc-400/20",
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
        variantStyles.bg
      } ${variantStyles.border} ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground font-display">
              {value}
            </span>
            {trend && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${variantStyles.iconBg} group-hover:scale-110 shadow-sm`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
