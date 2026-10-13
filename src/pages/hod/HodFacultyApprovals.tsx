import { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Shield,
  Phone,
} from "lucide-react";
import { format } from "date-fns";

export default function HodFacultyApprovals() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<FacultyLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "facultyLeaveRequests"),
      where("department", "==", userData.department),
      where("status", "==", "pending_hod")
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
  }, [userData?.department]);

  const handleAction = async (leaveId: string, action: "approved" | "rejected") => {
    if (!userData) return;
    setProcessing(leaveId);
    try {
      const ref = doc(db, "facultyLeaveRequests", leaveId);
      await updateDoc(ref, {
        status: action,
        hodRemarks: remarks[leaveId] || "",
        approvedByUid: userData.uid,
        approvedByName: userData.name,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Leave request ${action}`, {
        description: `Faculty leave has been ${action} successfully.`,
      });
    } catch (err: any) {
      toast.error(`Failed to ${action} leave`, { description: err.message });
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "dd MMM yyyy");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Shield className="h-3.5 w-3.5" />
            Faculty Leave Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Faculty Leave Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve faculty leave requests for the {userData?.department} Department.
          </p>
        </div>

        {/* Pending Count */}
        <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-bold">
              {loading ? "Loading..." : `${leaves.length} pending faculty leave request(s)`}
            </span>
          </CardContent>
        </Card>

        {/* Leave Cards */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading faculty leave requests...</div>
        ) : leaves.length === 0 ? (
          <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No pending faculty leave requests.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => (
              <Card
                key={leave.id}
                className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-siet-primary dark:text-red-400" />
                        {leave.facultyName}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Employee ID: {leave.employeeId} • {leave.department} Department
                      </CardDescription>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
                      <Clock className="h-3 w-3" />
                      Pending Approval
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 rounded-xl bg-muted/20 dark:bg-zinc-800/40 border border-border/40">
                    <div>
                      <p className="text-muted-foreground font-semibold uppercase text-[10px]">Type</p>
                      <p className="font-bold text-foreground">{leave.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold uppercase text-[10px]">Duration</p>
                      <p className="font-bold text-foreground">
                        {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold uppercase text-[10px]">From</p>
                      <p className="font-bold text-foreground">{formatDate(leave.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-semibold uppercase text-[10px]">To</p>
                      <p className="font-bold text-foreground">{formatDate(leave.endDate)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Reason</p>
                    <p className="text-xs text-foreground bg-muted/30 dark:bg-zinc-800/50 p-3 rounded-xl border border-border/50">
                      {leave.reason}
                    </p>
                  </div>

                  {leave.emergencyPhone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        Emergency Contact: <strong className="text-foreground">{leave.emergencyPhone}</strong>
                      </span>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      HOD Remarks (Optional)
                    </p>
                    <Textarea
                      placeholder="Add remarks or instructions..."
                      value={remarks[leave.id] || ""}
                      onChange={(e) => setRemarks({ ...remarks, [leave.id]: e.target.value })}
                      className="min-h-[60px] text-xs bg-muted/20 dark:bg-zinc-800/60 border-border resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleAction(leave.id, "approved")}
                      disabled={processing === leave.id}
                      className="flex-1 h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Approve Leave
                    </Button>
                    <Button
                      onClick={() => handleAction(leave.id, "rejected")}
                      disabled={processing === leave.id}
                      variant="outline"
                      className="flex-1 h-10 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 rounded-xl"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject Leave
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
