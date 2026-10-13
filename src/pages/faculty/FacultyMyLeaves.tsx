import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FacultyLeaveRequest } from "@/types/leave";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  pending_hod: {
    label: "Pending HOD Approval",
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200/50 dark:border-zinc-700/50",
    icon: Ban,
  },
};

export default function FacultyMyLeaves() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<FacultyLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, "facultyLeaveRequests"),
      where("facultyUid", "==", userData.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as FacultyLeaveRequest))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
          return bTime - aTime;
        });
      setLeaves(all);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  const handleCancel = async (leaveId: string) => {
    try {
      const ref = doc(db, "facultyLeaveRequests", leaveId);
      await updateDoc(ref, {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
      toast.success("Leave request cancelled");
    } catch (err: any) {
      toast.error("Failed to cancel", { description: err.message });
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd MMM yyyy");
  };

  const pendingCount = leaves.filter((l) => l.status === "pending_hod").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const rejectedCount = leaves.filter((l) => l.status === "rejected").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Briefcase className="h-3.5 w-3.5" />
            My Leave Records
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            My Leave Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your leave application status and history.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Pending</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {loading ? "..." : pendingCount}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Approved</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {loading ? "..." : approvedCount}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Rejected</p>
              <p className="text-2xl font-black text-red-600 dark:text-red-400">
                {loading ? "..." : rejectedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Cards */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading leave records...</div>
        ) : leaves.length === 0 ? (
          <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800">
            <CardContent className="p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No leave applications yet</p>
              <p className="text-xs text-muted-foreground mt-1">Apply for leave from the Apply Leave page.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave) => {
              const config = statusConfig[leave.status] || statusConfig.pending_hod;
              const StatusIcon = config.icon;

              return (
                <Card
                  key={leave.id}
                  className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{leave.type} Leave</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(leave.startDate)} — {formatDate(leave.endDate)} • {leave.totalDays}{" "}
                          {leave.totalDays === 1 ? "day" : "days"}
                        </p>
                        <p className="text-xs text-foreground/90 line-clamp-2">{leave.reason}</p>
                        {leave.hodRemarks && (
                          <div className="p-2.5 rounded-lg bg-muted/40 dark:bg-zinc-800/40 border border-border/40 text-xs text-muted-foreground mt-2">
                            <span className="font-semibold text-foreground">HOD Remarks:</span>{" "}
                            {leave.hodRemarks}
                          </div>
                        )}
                      </div>

                      {leave.status === "pending_hod" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(leave.id)}
                          className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 self-start sm:self-center"
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
