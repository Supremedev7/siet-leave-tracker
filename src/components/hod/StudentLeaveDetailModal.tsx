import React from "react";
import { format } from "date-fns";
import {
  X,
  User,
  Calendar,
  Paperclip,
  TrendingUp,
} from "lucide-react";
import { StatusTag } from "@/components/ui/StatusTag";
import { computeMonthlyAttendance, calculateDefaultWorkingDays } from "@/lib/attendance";

export interface StudentProfileData {
  uid?: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year?: number | string;
  section?: string;
  email?: string;
  phone?: string;
}

interface StudentLeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfileData | null;
  leaves: any[];
  currentMonthWorkingDays?: number;
}

const safeFormatDate = (dateVal: any, pattern = "dd MMM yyyy"): string => {
  if (!dateVal) return "—";
  try {
    if (typeof dateVal.toDate === "function") {
      return format(dateVal.toDate(), pattern);
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return format(d, pattern);
    }
  } catch {
    // fallback
  }
  return "—";
};

const getDaysBetween = (startVal: any, endVal: any): number => {
  try {
    const s = startVal?.toDate ? startVal.toDate() : new Date(startVal);
    const e = endVal?.toDate ? endVal.toDate() : new Date(endVal);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return 1;
  }
};

export const StudentLeaveDetailModal: React.FC<StudentLeaveDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  leaves,
  currentMonthWorkingDays,
}) => {
  if (!isOpen || !student) return null;

  // Filter leaves belonging to this specific student
  const studentLeaves = leaves.filter(
    (l) =>
      (student.rollNumber && l.rollNumber?.toLowerCase() === student.rollNumber.toLowerCase()) ||
      (student.uid && l.studentUid === student.uid)
  );

  // Compute stats
  const totalApplications = studentLeaves.length;
  const approvedLeaves = studentLeaves.filter((l) => l.status === "approved");
  const pendingLeaves = studentLeaves.filter((l) => l.status === "pending");
  const rejectedLeaves = studentLeaves.filter((l) => l.status === "rejected");

  let totalApprovedDays = 0;
  const usedByType: Record<string, number> = {};

  approvedLeaves.forEach((l) => {
    const days = l.totalDays || getDaysBetween(l.startDate, l.endDate);
    totalApprovedDays += days;
    usedByType[l.type] = (usedByType[l.type] || 0) + days;
  });

  // Calculate current month attendance
  const now = new Date();
  const effectiveWorkingDays =
    currentMonthWorkingDays || calculateDefaultWorkingDays(now.getFullYear(), now.getMonth());

  // Count approved days in current month
  let currentMonthApprovedDays = 0;
  approvedLeaves.forEach((l) => {
    const s = l.startDate?.toDate ? l.startDate.toDate() : new Date(l.startDate);
    if (s.getMonth() === now.getMonth() && s.getFullYear() === now.getFullYear()) {
      currentMonthApprovedDays += l.totalDays || getDaysBetween(l.startDate, l.endDate);
    }
  });

  const attendance = computeMonthlyAttendance(
    effectiveWorkingDays,
    currentMonthApprovedDays,
    Boolean(currentMonthWorkingDays)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 flex items-center justify-center font-bold text-lg font-display">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  {student.studentName}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-bold">
                  {student.rollNumber}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 flex items-center gap-2">
                <span>{student.department} Department</span>
                <span>•</span>
                <span>Year {student.year || "—"}</span>
                <span>•</span>
                <span>Section {student.section || "—"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-zinc-400 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Scorecard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-750">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                Total Applications
              </span>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                {totalApplications}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                {rejectedLeaves.length} rejected • {pendingLeaves.length} pending
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide block">
                Approved Days
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                {totalApprovedDays}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 block mt-0.5">
                {approvedLeaves.length} approved leaves
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide block">
                Pending Requests
              </span>
              <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                {pendingLeaves.length}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400/80 block mt-0.5">
                Awaiting your approval
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-750">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                Monthly Attendance
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-2xl font-extrabold font-mono ${
                    attendance.status === "compliant"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : attendance.status === "condonation"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {attendance.percentage}%
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5 font-medium">
                {attendance.attendedDays}/{attendance.workingDays} days (
                {format(now, "MMM")})
              </span>
            </div>
          </div>

          {/* Leave Type Breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-850/60 space-y-3">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-siet-primary dark:text-red-400" />
              Approved Leaves by Category
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Medical", "Personal", "Half-Day", "Emergency"].map((type) => {
                const count = usedByType[type] || 0;
                return (
                  <div
                    key={type}
                    className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-center"
                  >
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block">
                      {type}
                    </span>
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                      {count}{" "}
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                        days
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chronological Leave History Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-siet-primary dark:text-red-400" />
              Chronological Leave Applications History ({studentLeaves.length})
            </h4>

            {studentLeaves.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/40">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  No leave requests found for this student.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Ref ID &amp; Type</th>
                        <th className="p-3">Dates &amp; Duration</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">HOD Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {studentLeaves.map((leave) => {
                        const days =
                          leave.totalDays ||
                          getDaysBetween(leave.startDate, leave.endDate);
                        return (
                          <tr
                            key={leave.id}
                            className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                          >
                            <td className="p-3">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                                {leave.type}
                              </span>
                              <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                #{leave.id.slice(0, 8).toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                                {safeFormatDate(leave.startDate)} →{" "}
                                {safeFormatDate(leave.endDate)}
                              </div>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                                {days} {days === 1 ? "day" : "days"}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs">
                              <p className="text-zinc-700 dark:text-zinc-300 italic truncate" title={leave.reason}>
                                "{leave.reason}"
                              </p>
                              {leave.attachmentUrl && (
                                <a
                                  href={leave.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-siet-primary dark:text-red-400 font-bold hover:underline mt-1"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  Attachment
                                </a>
                              )}
                            </td>
                            <td className="p-3">
                              <StatusTag status={leave.status} />
                            </td>
                            <td className="p-3 text-zinc-600 dark:text-zinc-400">
                              {leave.hodRemarks ? (
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                  {leave.hodRemarks}
                                </span>
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-500 italic">None</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80 flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            JNTUK Norm: Regular Examination requires ≥75% attendance.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white font-bold text-xs transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLeaveDetailModal;
