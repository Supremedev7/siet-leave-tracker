import React from "react";
import { LeaveRequest } from "@/types/leave";
import { CheckCircle2, Clock, XCircle, ArrowRight, ShieldCheck } from "lucide-react";

interface Props {
  leave: LeaveRequest;
}

export const LeaveAuditStepper: React.FC<Props> = ({ leave }) => {
  const { totalDays, status, approvalChain, finalAuthority } = leave;

  // Stages required based on duration
  const stages: Array<{
    key: "faculty" | "hod" | "admin";
    label: string;
    subLabel: string;
  }> = [
    { key: "faculty", label: "Class Advisor", subLabel: "Stage 1 (Faculty)" },
  ];

  if (totalDays >= 3) {
    stages.push({ key: "hod", label: "Head of Dept", subLabel: "Stage 2 (HOD)" });
  }

  if (totalDays >= 6) {
    stages.push({ key: "admin", label: "Principal/Admin", subLabel: "Stage 3 (Admin)" });
  }

  return (
    <div className="py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-zinc-200/50 dark:border-zinc-700/50">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-siet-primary dark:text-red-400" />
          Approval Path ({totalDays} Day{totalDays > 1 ? "s" : ""})
        </span>
        <span className="text-[11px] uppercase font-bold text-siet-primary dark:text-red-400">
          Deciding Authority: {finalAuthority || "faculty"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1">
        {stages.map((stage, idx) => {
          const chainEntry = approvalChain?.find((e) => e.stage === stage.key);
          const isCurrent = leave.currentApprover === stage.key && (status?.startsWith("pending") ?? true);
          const isPassed = !!chainEntry && chainEntry.action !== "rejected";
          const isRejected = chainEntry?.action === "rejected";

          return (
            <React.Fragment key={stage.key}>
              <div className="flex items-center gap-2 min-w-fit">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isRejected
                      ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                      : isPassed
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : isCurrent
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 ring-2 ring-amber-400/40 animate-pulse"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {isRejected ? (
                    <XCircle className="h-4 w-4" />
                  ) : isPassed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-foreground">{stage.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {chainEntry
                      ? `${chainEntry.action === "approved" ? "Approved by" : chainEntry.action === "rejected" ? "Rejected by" : "Forwarded by"} ${chainEntry.approverName}`
                      : isCurrent
                      ? "Under Review"
                      : "Pending Prior Stage"}
                  </p>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {approvalChain && approvalChain.length > 0 && (
        <div className="pt-2 text-xs space-y-1.5 text-muted-foreground border-t border-zinc-200/50 dark:border-zinc-700/50">
          <p className="font-semibold text-foreground text-[11px]">Audit History:</p>
          {approvalChain.map((entry, i) => (
            <div key={i} className="text-[11px] bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 space-y-1 shadow-xs">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-foreground text-xs">{entry.approverName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                    {entry.stage === "faculty" ? "Class Advisor" : entry.stage === "hod" ? "HOD" : "Principal"}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                  entry.action === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40" :
                  entry.action === "forwarded" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/40" :
                  "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300/40"
                }`}>
                  {entry.action}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 italic">"{entry.remarks || "No remarks provided"}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveAuditStepper;
