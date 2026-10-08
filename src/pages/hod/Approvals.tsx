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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Check,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  CheckCheck,
  Phone,
  Paperclip,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  studentUid: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year: number | string;
  section: string;
  type: string;
  startDate: any;
  endDate: any;
  totalDays?: number;
  reason: string;
  emergencyPhone?: string;
  attachmentUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  hodRemarks?: string;
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

export default function Approvals() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Modals & Action States
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userData?.department) return;

    // Real-time listener for pending leaves in this department
    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: LeaveRequest[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        }));

        // Sort descending by creation date
        data.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });

        setLeaves(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to pending leaves:", error);
        toast.error("Failed to load live pending leaves");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData]);

  const handleApprove = async (leave: LeaveRequest) => {
    setIsProcessing(true);
    try {
      const leaveRef = doc(db, "leaveRequests", leave.id);
      await updateDoc(leaveRef, {
        status: "approved",
        updatedAt: serverTimestamp(),
        approvedBy: userData?.uid,
        approverName: userData?.name,
      });

      toast.success(`Leave approved for ${leave.studentName}`, {
        description: `${leave.type} leave (${safeFormatDate(leave.startDate)} to ${safeFormatDate(leave.endDate)}) is authorized.`,
      });

      setSelectedIds((prev) => prev.filter((id) => id !== leave.id));
      if (selectedLeave?.id === leave.id) setSelectedLeave(null);
    } catch (error: any) {
      console.error("Error approving leave:", error);
      toast.error("Failed to approve leave request", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLeave) return;

    if (!rejectionRemark.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const leaveRef = doc(db, "leaveRequests", rejectingLeave.id);
      await updateDoc(leaveRef, {
        status: "rejected",
        hodRemarks: rejectionRemark.trim(),
        updatedAt: serverTimestamp(),
        rejectedBy: userData?.uid,
        approverName: userData?.name,
      });

      toast.error(`Leave rejected for ${rejectingLeave.studentName}`, {
        description: `Student notified with reason: "${rejectionRemark.trim()}"`,
      });

      setSelectedIds((prev) => prev.filter((id) => id !== rejectingLeave.id));
      if (selectedLeave?.id === rejectingLeave.id) setSelectedLeave(null);
      setRejectingLeave(null);
      setRejectionRemark("");
    } catch (error: any) {
      console.error("Error rejecting leave:", error);
      toast.error("Failed to reject leave request", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to approve all ${selectedIds.length} selected leave requests?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      for (const id of selectedIds) {
        const leaveRef = doc(db, "leaveRequests", id);
        await updateDoc(leaveRef, {
          status: "approved",
          updatedAt: serverTimestamp(),
          approvedBy: userData?.uid,
          approverName: userData?.name,
        });
      }

      toast.success(`Successfully approved ${selectedIds.length} leave requests!`);
      setSelectedIds([]);
    } catch (error: any) {
      console.error("Error bulk approving:", error);
      toast.error("Bulk approval error", { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeaves.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeaves.map((l) => l.id));
    }
  };

  // Filtered dataset
  const filteredLeaves = leaves.filter((leave) => {
    const matchesSearch =
      searchQuery === "" ||
      leave.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || leave.type === typeFilter;
    const matchesYear = yearFilter === "all" || String(leave.year) === yearFilter;

    return matchesSearch && matchesType && matchesYear;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold tracking-wide uppercase mb-2">
              <Clock className="h-3.5 w-3.5" />
              Live Approvals Desk
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
                Pending Leave Requests
              </h2>
              <span className="px-3 py-0.5 rounded-full bg-siet-primary text-white text-xs font-bold">
                {leaves.length} Pending
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and authorize student leave applications for Department of {userData?.department}.
            </p>
          </div>

          {selectedIds.length > 0 && (
            <Button
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 rounded-xl shadow-md self-start sm:self-auto text-xs font-bold h-10 px-4"
            >
              <CheckCheck className="h-4 w-4" />
              Bulk Approve ({selectedIds.length})
            </Button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-border dark:border-zinc-800 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, reason..."
              className="pl-9 h-9 text-xs bg-muted/20 dark:bg-zinc-800/80 border-border dark:border-zinc-700 text-foreground placeholder:text-muted-foreground rounded-xl"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 text-xs bg-muted/20 dark:bg-zinc-800/80 border border-border dark:border-zinc-700 rounded-xl px-3 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-siet-primary"
            >
              <option value="all">All Leave Types</option>
              <option value="Personal">Personal</option>
              <option value="Medical">Medical</option>
              <option value="OD">On Duty (OD)</option>
              <option value="Half-Day">Half-Day</option>
              <option value="Emergency">Emergency</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-9 text-xs bg-muted/20 dark:bg-zinc-800/80 border border-border dark:border-zinc-700 rounded-xl px-3 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-siet-primary"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>

        {/* Table / Card Container */}
        <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-muted/40 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-foreground text-base">
                  All Clear! No Pending Requests
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery || typeFilter !== "all" || yearFilter !== "all"
                    ? "No pending leaves match the current filter criteria."
                    : "All student leave applications for your department have been reviewed."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 dark:bg-zinc-800/60">
                    <TableRow>
                      <TableHead className="w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredLeaves.length > 0 &&
                            selectedIds.length === filteredLeaves.length
                          }
                          onChange={toggleSelectAll}
                          aria-label="Select all leave requests"
                          className="rounded border-zinc-300 dark:border-zinc-600 text-siet-primary focus:ring-siet-primary"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                        Student
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                        Year &amp; Sec
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                        Leave Type
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                        Duration
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                        Reason
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                        Decision
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border dark:divide-zinc-800">
                    {filteredLeaves.map((leave) => {
                      const isSelected = selectedIds.includes(leave.id);
                      return (
                        <TableRow
                          key={leave.id}
                          className={`hover:bg-muted/30 dark:hover:bg-zinc-800/40 transition-colors ${
                            isSelected ? "bg-siet-primary/5 dark:bg-red-500/10" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(leave.id)}
                              aria-label={`Select leave for ${leave.studentName}`}
                              className="rounded border-zinc-300 dark:border-zinc-600 text-siet-primary focus:ring-siet-primary"
                            />
                          </TableCell>

                          {/* Student Info */}
                          <TableCell>
                            <div className="font-bold text-xs text-foreground">
                              {leave.studentName}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              {leave.rollNumber}
                            </div>
                          </TableCell>

                          {/* Year / Section */}
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            Year {leave.year} • Sec {leave.section}
                          </TableCell>

                          {/* Leave Type */}
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400">
                              {leave.type}
                            </span>
                          </TableCell>

                          {/* Dates & Duration */}
                          <TableCell>
                            <div className="text-xs font-semibold text-foreground whitespace-nowrap">
                              {safeFormatDate(leave.startDate)} → {safeFormatDate(leave.endDate)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {leave.totalDays || 1} {(leave.totalDays || 1) === 1 ? "day" : "days"}
                            </div>
                          </TableCell>

                          {/* Reason */}
                          <TableCell className="max-w-[240px]">
                            <p
                              className="text-xs text-zinc-700 dark:text-zinc-300 truncate cursor-pointer hover:text-siet-primary dark:hover:text-red-400"
                              title={leave.reason}
                              onClick={() => setSelectedLeave(leave)}
                            >
                              {leave.reason}
                            </p>
                            {leave.attachmentUrl && (
                              <a
                                href={leave.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-siet-primary dark:text-red-400 font-semibold hover:underline mt-0.5"
                              >
                                <Paperclip className="h-3 w-3" />
                                View Document
                              </a>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedLeave(leave)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Inspect Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleApprove(leave)}
                                disabled={isProcessing}
                                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectingLeave(leave);
                                  setRejectionRemark("");
                                }}
                                disabled={isProcessing}
                                className="h-8 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-900 rounded-lg"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inspect Leave Details Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-border dark:border-zinc-800 animate-fade-up">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-foreground">Leave Application Details</h3>
                <p className="text-xs text-muted-foreground">Ref: #{selectedLeave.id.slice(0, 10)}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedLeave(null)}
                className="h-8 w-8 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 dark:bg-zinc-800/60 rounded-xl">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Student</span>
                  <span className="font-bold text-sm text-foreground">{selectedLeave.studentName}</span>
                  <span className="text-muted-foreground block font-mono">{selectedLeave.rollNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Class Details</span>
                  <span className="font-semibold text-foreground">
                    Dept of {selectedLeave.department}
                  </span>
                  <span className="text-muted-foreground block">
                    Year {selectedLeave.year} • Sec {selectedLeave.section}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 dark:bg-zinc-800/60 rounded-xl">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Duration</span>
                  <span className="font-semibold text-foreground">
                    {safeFormatDate(selectedLeave.startDate)} to {safeFormatDate(selectedLeave.endDate)}
                  </span>
                  <span className="text-siet-primary dark:text-red-400 font-bold block">
                    {selectedLeave.totalDays || 1} day(s) requested
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Classification</span>
                  <span className="font-bold text-foreground">{selectedLeave.type} Leave</span>
                  {selectedLeave.emergencyPhone && (
                    <span className="text-muted-foreground block flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" /> {selectedLeave.emergencyPhone}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">
                  Stated Reason
                </span>
                <p className="p-3 bg-muted/20 dark:bg-zinc-800/40 border border-border/80 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                  "{selectedLeave.reason}"
                </p>
              </div>

              {selectedLeave.attachmentUrl && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">
                    Attached Document
                  </span>
                  <a
                    href={selectedLeave.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-siet-primary/5 dark:bg-red-500/10 border border-siet-primary/20 dark:border-red-500/30 rounded-xl text-siet-primary dark:text-red-400 font-bold hover:underline"
                  >
                    <Paperclip className="h-4 w-4" />
                    Open Attachment / Medical Proof
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingLeave(selectedLeave);
                  setSelectedLeave(null);
                }}
                className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-900"
              >
                Reject Request
              </Button>
              <Button
                onClick={() => handleApprove(selectedLeave)}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Authorize &amp; Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Remarks Modal */}
      {rejectingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-border dark:border-zinc-800 animate-fade-up">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Reject Leave Application</h3>
                <p className="text-xs text-muted-foreground">For {rejectingLeave.studentName} ({rejectingLeave.rollNumber})</p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Reason for Rejection (Mandatory)
                </label>
                <Textarea
                  value={rejectionRemark}
                  onChange={(e) => setRejectionRemark(e.target.value)}
                  placeholder="e.g., Upcoming Mid Examinations, insufficient attendance (under 75%), or missing medical certificate..."
                  rows={3}
                  className="text-xs bg-muted/20 dark:bg-zinc-800/60 border-border dark:border-zinc-700 text-foreground"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  This note will be directly shown on the student's dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRejectingLeave(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing || !rejectionRemark.trim()}
                  className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
