import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Clock, CheckCircle2, XCircle, FilePlus2,
  CalendarDays, AlertCircle, ArrowRight, ShieldCheck, Info
} from "lucide-react";
import { StatusTag } from "@/components/ui/StatusTag";
import { StatsCard } from "@/components/ui/StatsCard";
import { AttendanceCalendar } from "@/components/student/AttendanceCalendar";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: Timestamp;
  endDate: Timestamp;
  reason: string;
  status: "pending" | "approved" | "rejected";
  hodRemarks?: string;
  createdAt: Timestamp;
}

function safeDateFormat(ts: Timestamp | undefined, fmt = "MMM dd, yyyy"): string {
  try {
    if (!ts) return "—";
    return format(ts.toDate(), fmt);
  } catch {
    return "—";
  }
}

function getDaysBetween(start: Timestamp, end: Timestamp): number {
  try {
    const diff = end.toDate().getTime() - start.toDate().getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return 1;
  }
}

export default function StudentDashboard() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("studentUid", "==", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LeaveRequest[];
      setLeaves(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaves:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  // Computed stats
  const pending  = leaves.filter(l => l.status === "pending").length;
  const approved = leaves.filter(l => l.status === "approved").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;
  const total    = leaves.length;

  // Monthly permissible leaves (Max 2 days policy)
  const now = new Date();
  const currentMonthApprovedDays = leaves
    .filter((l) => l.status === "approved")
    .reduce((acc, l) => {
      try {
        const start = l.startDate?.toDate ? l.startDate.toDate() : new Date((l.startDate as any));
        if (start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()) {
          return acc + getDaysBetween(l.startDate, l.endDate);
        }
      } catch {
        // fallback
      }
      return acc;
    }, 0);
  const remainingMonthly = Math.max(0, 2 - currentMonthApprovedDays);

  const recentLeaves = leaves.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ─── Institutional Overview Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400 text-xs font-bold tracking-wide uppercase mb-1">
              <span>Academic Session 2025–26</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
              Student Academic Overview
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
              {userData?.name} • Roll: <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{userData?.rollNumber}</span> • {userData?.department} Department
            </p>
          </div>

          <Link
            to="/student/apply"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 self-start sm:self-auto bg-gradient-to-r from-siet-primary to-siet-primary-dark"
          >
            <FilePlus2 className="h-4 w-4" />
            Apply for Leave
          </Link>
        </div>

        {/* ─── Metrics Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Applications"
            value={loading ? "—" : total}
            subtitle="All recorded leaves"
            icon={CalendarDays}
            variant="primary"
          />
          <StatsCard
            title="Under Review"
            value={loading ? "—" : pending}
            subtitle="Pending HOD clearance"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Approved Passes"
            value={loading ? "—" : approved}
            subtitle="Official passes issued"
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Rejected Requests"
            value={loading ? "—" : rejected}
            subtitle="Declined by HOD"
            icon={XCircle}
            variant="danger"
          />
        </div>

        {/* ─── Monthly Permissible Leave Policy (Max 2 Days) ─── */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base font-display">
                  Monthly Leave Policy (Max 2 Days Permissible)
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                SIET Academic Regulations: Standard monthly allowance for students
              </p>
            </div>

            <div>
              {currentMonthApprovedDays <= 2 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Within Monthly Allowance ({currentMonthApprovedDays}/2 Days)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Exceeded Monthly Cap ({currentMonthApprovedDays}/2 Days Used)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60 text-center">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                Monthly Cap
              </span>
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono my-1 block">
                2 <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Days</span>
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Max acceptable leaves/month
              </span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60 text-center">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                Leaves Taken This Month
              </span>
              <span
                className={`text-3xl font-extrabold font-mono my-1 block ${
                  currentMonthApprovedDays > 2 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {currentMonthApprovedDays}{" "}
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Days</span>
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Approved days in {format(new Date(), "MMMM")}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60 text-center">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block">
                Safe Leaves Remaining
              </span>
              <span
                className={`text-3xl font-extrabold font-mono my-1 block ${
                  remainingMonthly === 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {remainingMonthly}{" "}
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Days</span>
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Before attendance impact
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-siet-primary/20 dark:border-red-900/30 bg-siet-primary/5 dark:bg-red-950/20 text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-siet-primary dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Institutional Rule:</strong>{" "}
              Students are strictly permitted a maximum of 2 leaves per month without
              condonation risk. On-Duty (OD) is not available for regular students. Any leaves beyond
              2 days deduct from working attendance and jeopardize the mandatory 75% JNTUK examination threshold.
            </p>
          </div>
        </div>

        {/* ─── Monthly Absentee & Attendance Compliance Calendar ─── */}
        <AttendanceCalendar leaves={leaves} department={userData?.department} />

        {/* ─── Recent Leave Applications Ledger ─── */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-colors">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Recent Leave Applications</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Latest status and administrative remarks</p>
            </div>
            <Link
              to="/student/leaves"
              className="text-xs font-bold text-siet-primary dark:text-red-400 hover:underline flex items-center gap-1"
            >
              View Full History <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : recentLeaves.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No leave records submitted yet</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Submit your first application to initiate tracking.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-850/60 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{leave.type} Leave</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">• Ref #{leave.id.slice(0, 6).toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Duration: {safeDateFormat(leave.startDate)} → {safeDateFormat(leave.endDate)}
                      </p>
                      {leave.hodRemarks && (
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 italic bg-zinc-50 dark:bg-zinc-800/80 p-1.5 rounded border border-zinc-100 dark:border-zinc-700">
                          HOD Note: {leave.hodRemarks}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="self-start sm:self-center flex-shrink-0">
                    <StatusTag status={leave.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
