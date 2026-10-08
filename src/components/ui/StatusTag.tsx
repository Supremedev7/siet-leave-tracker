import React from "react";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

interface StatusTagProps {
  status: LeaveStatus | string;
  className?: string;
  size?: "sm" | "md";
}

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  className = "",
  size = "md",
}) => {
  const norm = (status || "pending").toLowerCase();

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 gap-1.5"
      : "text-[11px] px-2.5 py-0.5 gap-1.5";

  switch (norm) {
    case "approved":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-wide border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-md font-mono select-none ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 flex-shrink-0" />
          Approved
        </span>
      );
    case "rejected":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-wide border border-rose-300/80 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-md font-mono select-none ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400 flex-shrink-0" />
          Rejected
        </span>
      );
    case "cancelled":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-wide border border-zinc-200 dark:border-zinc-700 bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 rounded-md font-mono select-none ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
          Cancelled
        </span>
      );
    case "pending":
    default:
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-wide border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-md font-mono select-none ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0" />
          Pending Review
        </span>
      );
  }
};

export default StatusTag;
