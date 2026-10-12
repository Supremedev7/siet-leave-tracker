import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Forward, 
  ArrowRight, 
  AlertCircle 
} from "lucide-react";

export default function FacultyDashboard() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as LeaveRequest[];

      // Filter in-memory for assigned class
      const classLeaves = all.filter(
        (l) => l.year === userData.assignedYear && l.section === userData.assignedSection
      );

      setLeaves(classLeaves);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const pendingLeaves = leaves.filter((l) => l.status === "pending_faculty");
  const forwardedLeaves = leaves.filter((l) => 
    l.approvalChain?.some((e) => e.stage === "faculty" && e.action === "forwarded")
  );
  const approvedLeaves = leaves.filter((l) => l.status === "approved");
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected");

  return (
    <DashboardLayout pendingCount={pendingLeaves.length}>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Users className="h-3.5 w-3.5" />
            Class Advisor Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            {userData?.department} — Year {userData?.assignedYear || 1} Section {userData?.assignedSection || "A"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official class leave management, direct approvals (1-2 days), and HOD escalation portal.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {loading ? "..." : pendingLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Forward className="h-3.5 w-3.5 text-blue-500" />
                Forwarded to HOD
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {loading ? "..." : forwardedLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Class Approved
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {loading ? "..." : approvedLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {loading ? "..." : rejectedLeaves.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Link Card */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base">You have {pendingLeaves.length} leave application(s) awaiting review</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review requests from your class students and approve 1-2 day leaves or forward longer requests to the Head of Department.
            </p>
          </div>
          <Button asChild className="bg-siet-primary hover:bg-siet-primary-dark text-white font-bold">
            <Link to="/faculty/approvals" className="flex items-center gap-2">
              Go to Pending Queue <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
