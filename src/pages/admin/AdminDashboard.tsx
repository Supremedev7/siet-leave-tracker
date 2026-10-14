import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Briefcase,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { DEPARTMENTS } from "@/lib/constants/academic";
import { toast } from "sonner";

const COLORS = ["#8B1A1A", "#2563EB", "#059669", "#D97706", "#7C3AED", "#DB2777", "#F7941D"];

interface PendingStaffItem {
  uid: string;
  name: string;
  email: string;
  role: "faculty" | "hod";
  department: string;
  employeeId?: string;
  phone?: string;
  degrees?: string;
  assignedYear?: number;
  assignedSection?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt?: any;
}

export default function AdminDashboard() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [pendingStaff, setPendingStaff] = useState<PendingStaffItem[]>([]);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  // Real-time listener for leave requests
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as LeaveRequest[];
      setLeaves(data);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for pending faculty & HOD accounts
  useEffect(() => {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("role", "in", ["faculty", "hod"]),
      where("approvalStatus", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const staffList: PendingStaffItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            name: data.name || "Staff Member",
            email: data.email || "",
            role: data.role,
            department: data.department || "General",
            employeeId: data.employeeId || "—",
            phone: data.phone || "—",
            degrees: data.degrees || "",
            assignedYear: data.assignedYear,
            assignedSection: data.assignedSection,
            approvalStatus: data.approvalStatus || "pending",
            createdAt: data.createdAt,
          };
        });
        setPendingStaff(staffList);
      },
      (error) => {
        console.error("Error listening to pending staff:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStaffDecision = async (
    staff: PendingStaffItem,
    decision: "approved" | "rejected"
  ) => {
    setActionLoadingUid(staff.uid);
    try {
      // 1. Update User document
      await updateDoc(doc(db, "users", staff.uid), {
        approvalStatus: decision,
        updatedAt: serverTimestamp(),
      });

      // 2. Update staffLookups document
      if (staff.employeeId && staff.employeeId !== "—") {
        await updateDoc(doc(db, "staffLookups", staff.employeeId.toUpperCase()), {
          approvalStatus: decision,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          console.warn("Could not update staffLookup doc:", err);
        });
      }

      const text = decision === "approved" ? "accepted and activated" : "rejected";
      toast.success(
        `Staff registration for ${staff.name} (${staff.employeeId}) has been ${text}.`
      );
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error(`Failed to update status: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoadingUid(null);
    }
  };

  const pendingAdminLeaves = leaves.filter((l) => l.status === "pending_admin");
  const approvedLeaves = leaves.filter((l) => l.status === "approved");

  // Dept distribution
  const deptData = DEPARTMENTS.map((dept) => ({
    name: dept.code,
    count: leaves.filter((l) => l.department === dept.code).length,
  }));

  return (
    <DashboardLayout
      pendingCount={pendingAdminLeaves.length}
      facultyPendingCount={pendingStaff.length}
    >
      <div className="space-y-6 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-display">
              Central Administration Dashboard
            </h1>
            <p className="text-xs text-muted-foreground dark:text-zinc-400">
              Srinivasa Institute of Engineering &amp; Technology — Institutional Governance &amp; Controls
            </p>
          </div>

          {pendingStaff.length > 0 && (
            <Link to="/admin/staff-approvals">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingStaff.length} Staff Registrations Pending</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </Link>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/staff-approvals">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  Staff Registrations Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {pendingStaff.length}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/approvals">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-red-500/50 transition-all cursor-pointer">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                  Executive Leave Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                  {pendingAdminLeaves.length}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Approved Leaves
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {approvedLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                Active Academic Branches
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {DEPARTMENTS.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ APPROVALS SECTION: Dedicated Staff Registration Approvals Console ═══ */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-siet-primary dark:text-red-400" />
                Staff Registration Approvals Queue
              </CardTitle>
              <CardDescription className="text-xs">
                Newly registered Faculty and HOD accounts require manual clearance before users can sign in
              </CardDescription>
            </div>
            <Link to="/admin/staff-approvals">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-zinc-300 dark:border-zinc-700"
              >
                <span>Full Clearance Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {pendingStaff.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="font-bold text-foreground">All Staff Registrations Cleared</p>
                <p className="text-[11px] text-muted-foreground">
                  There are no pending Faculty or HOD accounts waiting for administrative approval.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border/60">
                    <tr>
                      <th className="py-3 px-4 text-left">Staff Name</th>
                      <th className="py-3 px-4 text-left">Generated Employee ID</th>
                      <th className="py-3 px-4 text-left">Role &amp; Branch</th>
                      <th className="py-3 px-4 text-left">Class / Degrees</th>
                      <th className="py-3 px-4 text-left">Contact Email</th>
                      <th className="py-3 px-4 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {pendingStaff.map((staff) => {
                      const isProcessing = actionLoadingUid === staff.uid;

                      return (
                        <tr key={staff.uid} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 font-medium">
                            <span className="font-bold text-foreground block">{staff.name}</span>
                            <span className="text-[10px] text-muted-foreground block">{staff.phone}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-siet-primary dark:text-red-400 border border-zinc-200 dark:border-zinc-700 tracking-wider inline-block">
                              {staff.employeeId || "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  staff.role === "hod"
                                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                                }`}
                              >
                                {staff.role === "hod" ? <Building2 className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                                {staff.role === "hod" ? "Head of Dept" : "Faculty Advisor"}
                              </span>
                              <span className="text-zinc-600 dark:text-zinc-400 font-semibold block text-[11px]">
                                {staff.department}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {staff.role === "faculty" && staff.assignedYear && staff.assignedSection ? (
                              <span className="font-semibold text-foreground">
                                Year {staff.assignedYear} - Sec {staff.assignedSection}
                              </span>
                            ) : (
                              <span>{staff.degrees || "—"}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                            {staff.email}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleStaffDecision(staff, "approved")}
                                className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => handleStaffDecision(staff, "rejected")}
                                className="h-8 px-3 text-xs font-bold border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-4">
            <h3 className="font-bold text-sm mb-4">Department-wise Leave Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B1A1A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-4">
            <h3 className="font-bold text-sm mb-4">Leave Types Ratio</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Medical", value: leaves.filter(l => l.type === "Medical").length },
                      { name: "Personal", value: leaves.filter(l => l.type === "Personal").length },
                      { name: "Half-Day", value: leaves.filter(l => l.type === "Half-Day").length },
                      { name: "Emergency", value: leaves.filter(l => l.type === "Emergency").length },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
