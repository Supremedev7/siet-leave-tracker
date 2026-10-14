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
          className={`inline-flex items-center font-semibold tracking-normal border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded-full select-none shadow-2xs ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 flex-shrink-0" />
          Approved
        </span>
      );
    case "rejected":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-normal border border-rose-300 dark:border-rose-700/80 bg-rose-50/90 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 rounded-full select-none shadow-2xs ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400 flex-shrink-0" />
          Rejected
        </span>
      );
    case "cancelled":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-normal border border-zinc-300 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full select-none shadow-2xs ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
          Cancelled
        </span>
      );
    case "pending_faculty":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-normal border border-amber-300 dark:border-amber-700/80 bg-amber-50/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 rounded-full select-none shadow-2xs ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0 animate-pulse" />
          Pending Advisor
        </span>
      );
    case "pending_hod":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-normal border border-blue-300 dark:border-blue-700/80 bg-blue-50/90 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 rounded-full select-none shadow-2xs ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0 animate-pulse" />
          Pending HOD
        </span>
      );
    case "pending_admin":
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-normal border border-purple-300 dark:border-purple-700/80 bg-purple-50/90 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 rounded-full select-none shadow-2xs ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-purple-400 flex-shrink-0 animate-pulse" />
          Pending Principal
        </span>
      );
    case "pending":
    default:
      return (
        <span
          className={`inline-flex items-center font-semibold tracking-normal border border-amber-300 dark:border-amber-700/80 bg-amber-50/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 rounded-full select-none shadow-2xs ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0 animate-pulse" />
          Pending Review
        </span>
      );
  }
};

export default StatusTag;
