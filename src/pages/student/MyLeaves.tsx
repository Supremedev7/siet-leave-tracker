import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  FilePlus2,
  Search,
  Printer,
  Ban,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/StatusTag";
import LeaveCertificate from "@/components/student/LeaveCertificate";
import { toast } from "sonner";

interface LeaveRecord {
  id: string;
  type: string;
  reason: string;
  startDate: any;
  endDate: any;
  totalDays?: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: any;
  updatedAt?: any;
  hodRemarks?: string;
  emergencyPhone?: string;
  attachmentUrl?: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year: number;
  section: string;
}

const safeFormatDate = (dateVal: any, pattern = "MMM dd, yyyy"): string => {
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

export default function MyLeaves() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPass, setSelectedPass] = useState<LeaveRecord | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.uid) return;

    // Real-time listener for the student's leave requests
    const q = query(
      collection(db, "leaveRequests"),
      where("studentUid", "==", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records: LeaveRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setLeaves(records);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error loading student leaves:", error);
        // Fallback without orderBy if index is still building
        const fallbackQ = query(
          collection(db, "leaveRequests"),
          where("studentUid", "==", userData.uid)
        );
        onSnapshot(fallbackQ, (fallbackSnap) => {
          const recs: LeaveRecord[] = fallbackSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          recs.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });
          setLeaves(recs);
          setLoading(false);
        });
      }
    );

    return () => unsubscribe();
  }, [userData]);

  const handleCancelLeave = async (leaveId: string) => {
    if (!confirm("Are you sure you want to withdraw this pending leave request?")) {
      return;
    }

    setCancellingId(leaveId);
    try {
      const leaveRef = doc(db, "leaveRequests", leaveId);
      await updateDoc(leaveRef, {
        status: "cancelled",
        updatedAt: new Date(),
      });
      toast.success("Leave request has been withdrawn");
    } catch (err: any) {
      console.error("Error withdrawing leave:", err);
      toast.error("Failed to cancel leave", { description: err.message });
    } finally {
      setCancellingId(null);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      statusFilter === "all" || leave.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      leave.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const countByStatus = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
              <CalendarDays className="h-3.5 w-3.5" />
              History &amp; Approvals
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
              My Leave Records
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track status, review HOD remarks, and download approved campus gate passes.
            </p>
          </div>

          <Link
            to="/student/apply"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all self-start sm:self-auto"
            style={{
              background: "linear-gradient(135deg, #8B1A1A, #6B1414)",
            }}
          >
            <FilePlus2 className="h-4 w-4" />
            Apply New Leave
          </Link>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-border dark:border-zinc-800 shadow-sm transition-colors">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Requests", count: countByStatus.all },
              { id: "pending", label: "Pending", count: countByStatus.pending },
              { id: "approved", label: "Approved", count: countByStatus.approved },
              { id: "rejected", label: "Rejected", count: countByStatus.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-siet-primary dark:bg-red-600 text-white shadow-sm"
                    : "text-muted-foreground dark:text-zinc-400 hover:bg-muted/60 dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-muted dark:bg-zinc-800 text-muted-foreground dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reason, type..."
              className="pl-9 h-9 text-xs bg-muted/20 dark:bg-zinc-800 border-border dark:border-zinc-700 rounded-xl"
            />
          </div>
        </div>

        {/* Leaves Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl bg-white dark:bg-zinc-900 border border-border/60 dark:border-zinc-800 p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 bg-muted dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-6 bg-muted dark:bg-zinc-800 rounded w-2/3" />
                <div className="h-10 bg-muted dark:bg-zinc-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredLeaves.length === 0 ? (
          <Card className="border-border dark:border-zinc-800 text-center py-16 bg-white dark:bg-zinc-900 shadow-sm transition-colors">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-bold text-foreground dark:text-zinc-100 text-base">
                  No Leave Records Found
                </h3>
                <p className="text-xs text-muted-foreground dark:text-zinc-400">
                  {searchQuery || statusFilter !== "all"
                    ? "No leave applications match the selected filter criteria."
                    : "You haven't submitted any leave applications yet."}
                </p>
              </div>
              {statusFilter === "all" && !searchQuery && (
                <Link
                  to="/student/apply"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-siet-primary hover:bg-siet-primary-dark transition-all"
                >
                  <FilePlus2 className="h-4 w-4" />
                  Apply for Leave
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredLeaves.map((leave) => (
              <Card
                key={leave.id}
                className="overflow-hidden border-border/80 dark:border-zinc-800 hover:border-siet-primary/30 dark:hover:border-red-500/30 transition-all shadow-sm hover:shadow-md bg-white dark:bg-zinc-900 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="p-5 pb-3 border-b border-border/60 dark:border-zinc-800 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground dark:text-zinc-100">
                          {leave.type} Leave
                        </span>
                        {leave.totalDays && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                            {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Applied on {safeFormatDate(leave.createdAt, "dd MMM yyyy")}
                      </p>
                    </div>
                    <StatusTag status={leave.status} />
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    {/* Date Span */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground dark:text-zinc-100 bg-muted/30 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-border/40 dark:border-zinc-750">
                      <CalendarDays className="h-4 w-4 text-siet-primary dark:text-red-400" />
                      <span>{safeFormatDate(leave.startDate)}</span>
                      <span className="text-muted-foreground dark:text-zinc-500">→</span>
                      <span>{safeFormatDate(leave.endDate)}</span>
                    </div>

                    {/* Reason */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 mb-0.5">
                        Reason
                      </p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3 italic">
                        "{leave.reason}"
                      </p>
                    </div>

                    {/* Rejection Remarks from HOD */}
                    {leave.status === "rejected" && leave.hodRemarks && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-red-300">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          HOD Rejection Remarks
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                          {leave.hodRemarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3 bg-muted/20 dark:bg-zinc-850/40 border-t border-border/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground dark:text-zinc-500 font-mono">
                    #{leave.id.slice(0, 8)}
                  </span>

                  <div className="flex items-center gap-2">
                    {leave.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelLeave(leave.id)}
                        disabled={cancellingId === leave.id}
                        className="h-8 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 border-zinc-200"
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        Withdraw
                      </Button>
                    )}

                    {leave.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedPass(leave)}
                        className="h-8 text-xs bg-siet-primary hover:bg-siet-primary-dark text-white flex items-center gap-1 rounded-lg shadow-sm"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print Pass
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Printable Certificate Modal */}
      {selectedPass && (
        <LeaveCertificate
          leave={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </DashboardLayout>
  );
}
