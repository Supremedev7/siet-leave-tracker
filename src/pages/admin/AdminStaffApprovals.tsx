import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldCheck,
  Check,
  X,
  Search,
  Users,
  Briefcase,
  Building2,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants/academic";

interface StaffAccount {
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
  updatedAt?: any;
}

export default function AdminStaffApprovals() {
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    // Listen to all faculty and HOD user records
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "in", ["faculty", "hod"]));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const accounts: StaffAccount[] = snapshot.docs.map((d) => {
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
            approvalStatus: data.approvalStatus || "approved", // legacy defaults to approved
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });

        setStaffAccounts(accounts);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch staff accounts:", error);
        toast.error("Failed to sync staff registrations in real time.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDecision = async (
    account: StaffAccount,
    decision: "approved" | "rejected"
  ) => {
    setActionLoadingUid(account.uid);
    try {
      // 1. Update User Profile in users collection
      const userRef = doc(db, "users", account.uid);
      await updateDoc(userRef, {
        approvalStatus: decision,
        updatedAt: serverTimestamp(),
      });

      // 2. Update staffLookups document if employeeId exists
      if (account.employeeId && account.employeeId !== "—") {
        const lookupRef = doc(db, "staffLookups", account.employeeId.toUpperCase());
        await updateDoc(lookupRef, {
          approvalStatus: decision,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          console.warn("Could not update staffLookups doc:", err);
        });
      }

      const actionText = decision === "approved" ? "accepted and activated" : "rejected";
      toast.success(
        `Staff registration for ${account.name} (${account.employeeId}) has been ${actionText}.`
      );
    } catch (err: any) {
      console.error("Error updating approval status:", err);
      toast.error(`Failed to update status: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoadingUid(null);
    }
  };

  const filteredStaff = useMemo(() => {
    return staffAccounts.filter((staff) => {
      // Status filter
      if (statusFilter !== "all" && staff.approvalStatus !== statusFilter) return false;

      // Department filter
      if (deptFilter !== "all" && staff.department !== deptFilter) return false;

      // Role filter
      if (roleFilter !== "all" && staff.role !== roleFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = staff.name.toLowerCase().includes(q);
        const matchesId = (staff.employeeId || "").toLowerCase().includes(q);
        const matchesEmail = staff.email.toLowerCase().includes(q);
        const matchesDept = staff.department.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesEmail && !matchesDept) return false;
      }

      return true;
    });
  }, [staffAccounts, statusFilter, deptFilter, roleFilter, searchQuery]);

  const pendingCount = staffAccounts.filter((s) => s.approvalStatus === "pending").length;
  const approvedCount = staffAccounts.filter((s) => s.approvalStatus === "approved").length;
  const rejectedCount = staffAccounts.filter((s) => s.approvalStatus === "rejected").length;

  return (
    <DashboardLayout facultyPendingCount={pendingCount}>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-siet-primary/10 text-siet-primary dark:text-red-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-display">
                  Staff Registration Approvals
                </h1>
                <p className="text-xs text-muted-foreground dark:text-zinc-400">
                  Verify and grant institutional clearance for newly registered Faculty and Department Heads
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{pendingCount} Pending Clearance</span>
            </span>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            onClick={() => setStatusFilter("pending")}
            className={`cursor-pointer transition-all border-zinc-200/80 dark:border-zinc-800 ${
              statusFilter === "pending"
                ? "ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20"
                : "bg-white dark:bg-zinc-900 hover:border-amber-500/50"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Pending Clearance</p>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {pendingCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setStatusFilter("approved")}
            className={`cursor-pointer transition-all border-zinc-200/80 dark:border-zinc-800 ${
              statusFilter === "approved"
                ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                : "bg-white dark:bg-zinc-900 hover:border-emerald-500/50"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Active Approved Staff</p>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {approvedCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setStatusFilter("rejected")}
            className={`cursor-pointer transition-all border-zinc-200/80 dark:border-zinc-800 ${
              statusFilter === "rejected"
                ? "ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
                : "bg-white dark:bg-zinc-900 hover:border-rose-500/50"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Declined Registrations</p>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {rejectedCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <XCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff, ID, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-muted/20 border-border"
              />
            </div>

            {/* Status Select */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs bg-muted/20 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Review Only</SelectItem>
                <SelectItem value="approved">Approved Accounts</SelectItem>
                <SelectItem value="rejected">Declined Accounts</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Select */}
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-9 text-xs bg-muted/20 border-border">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Select */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 text-xs bg-muted/20 border-border">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="faculty">Faculty (Class Advisors)</SelectItem>
                <SelectItem value="hod">Head of Department (HOD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Staff Clearance Roster Table */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-siet-primary dark:text-red-400" />
                Staff Registration Applications ({filteredStaff.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Click Accept to grant login access, or Reject to decline institutional credentials
              </CardDescription>
            </div>
            {(statusFilter !== "all" || deptFilter !== "all" || roleFilter !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setDeptFilter("all");
                  setRoleFilter("all");
                  setSearchQuery("");
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset Filters
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <div className="w-6 h-6 border-2 border-siet-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading staff applications...
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">No staff registration records found</p>
                <p className="text-[11px]">No applications match the current filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/80">
                    <tr>
                      <th className="py-3 px-4 text-left">Staff Member</th>
                      <th className="py-3 px-4 text-left">Assigned Employee ID</th>
                      <th className="py-3 px-4 text-left">Role &amp; Department</th>
                      <th className="py-3 px-4 text-left">Assignment / Qualifications</th>
                      <th className="py-3 px-4 text-left">Contact</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredStaff.map((staff) => {
                      const isProcessing = actionLoadingUid === staff.uid;

                      return (
                        <tr
                          key={staff.uid}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          {/* Name */}
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-siet-primary/10 text-siet-primary dark:text-red-400 font-bold flex items-center justify-center uppercase text-xs shrink-0">
                                {staff.name.slice(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold text-foreground block">{staff.name}</span>
                                <span className="text-[11px] text-muted-foreground block">{staff.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Generated Employee ID */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-siet-primary dark:text-red-400 border border-zinc-200 dark:border-zinc-700 tracking-wider inline-block">
                              {staff.employeeId || "—"}
                            </span>
                          </td>

                          {/* Role & Dept */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  staff.role === "hod"
                                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                                }`}
                              >
                                {staff.role === "hod" ? (
                                  <>
                                    <Building2 className="w-3 h-3" />
                                    Head of Dept
                                  </>
                                ) : (
                                  <>
                                    <Briefcase className="w-3 h-3" />
                                    Faculty Advisor
                                  </>
                                )}
                              </span>
                              <span className="text-zinc-600 dark:text-zinc-400 font-semibold block text-[11px]">
                                {staff.department}
                              </span>
                            </div>
                          </td>

                          {/* Assignment / Qualifications */}
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {staff.role === "faculty" && staff.assignedYear && staff.assignedSection ? (
                              <div>
                                <span className="font-semibold text-foreground">
                                  Year {staff.assignedYear} - Sec {staff.assignedSection}
                                </span>
                                {staff.degrees && (
                                  <span className="text-[10px] block text-muted-foreground">
                                    {staff.degrees}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span>{staff.degrees || "—"}</span>
                            )}
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 text-muted-foreground">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{staff.phone || "—"}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                staff.approvalStatus === "approved"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  : staff.approvalStatus === "rejected"
                                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                              }`}
                            >
                              {staff.approvalStatus === "approved" && <CheckCircle2 className="w-3 h-3" />}
                              {staff.approvalStatus === "rejected" && <XCircle className="w-3 h-3" />}
                              {staff.approvalStatus === "pending" && <Clock className="w-3 h-3" />}
                              <span>{staff.approvalStatus}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {staff.approvalStatus !== "approved" && (
                                <Button
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleDecision(staff, "approved")}
                                  className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Accept
                                </Button>
                              )}

                              {staff.approvalStatus !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isProcessing}
                                  onClick={() => handleDecision(staff, "rejected")}
                                  className="h-8 px-3 text-xs font-bold border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                                >
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  Reject
                                </Button>
                              )}
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
      </div>
    </DashboardLayout>
  );
}
