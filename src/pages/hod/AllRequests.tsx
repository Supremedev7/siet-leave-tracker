import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Search,
  Download,
  Eye,
  FileSpreadsheet,
  X,
  Paperclip,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { toast } from "sonner";

interface HistoricalLeave {
  id: string;
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
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: any;
  updatedAt?: any;
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

export default function AllRequests() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<HistoricalLeave[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedLeave, setSelectedLeave] = useState<HistoricalLeave | null>(null);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: HistoricalLeave[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        data.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });

        setLeaves(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching historical leaves:", error);
        toast.error("Failed to fetch department history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesSearch =
        searchQuery === "" ||
        leave.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.reason?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || leave.status === statusFilter;
      const matchesType =
        typeFilter === "all" || leave.type === typeFilter;
      const matchesYear =
        yearFilter === "all" || String(leave.year) === yearFilter;

      return matchesSearch && matchesStatus && matchesType && matchesYear;
    });
  }, [leaves, searchQuery, statusFilter, typeFilter, yearFilter]);

  const handleExportCSV = () => {
    if (filteredLeaves.length === 0) {
      toast.error("No records matching the filter to export");
      return;
    }

    const headers = [
      "ID",
      "Student Name",
      "Roll No",
      "Department",
      "Year",
      "Section",
      "Type",
      "From Date",
      "To Date",
      "Total Days",
      "Status",
      "Remarks",
      "Reason",
    ];

    const rows = filteredLeaves.map((l) => [
      `"${l.id}"`,
      `"${l.studentName || ""}"`,
      `"${l.rollNumber || ""}"`,
      `"${l.department || ""}"`,
      `"${l.year || ""}"`,
      `"${l.section || ""}"`,
      `"${l.type || ""}"`,
      `"${l.startDate?.toDate ? format(l.startDate.toDate(), "yyyy-MM-dd") : ""}"`,
      `"${l.endDate?.toDate ? format(l.endDate.toDate(), "yyyy-MM-dd") : ""}"`,
      `"${l.totalDays || 1}"`,
      `"${l.status || ""}"`,
      `"${(l.hodRemarks || "").replace(/"/g, '""')}"`,
      `"${(l.reason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SIET_Filtered_Leaves_${format(new Date(), "yyyyMMdd_HHmm")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredLeaves.length} records to CSV!`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Department Archive
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
              All Leave Records &amp; History
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comprehensive registry of all submitted, approved, and rejected leaves for {userData?.department}.
            </p>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="text-xs font-bold flex items-center gap-1.5 rounded-xl border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm self-start sm:self-auto hover:bg-zinc-50 dark:hover:bg-zinc-750"
          >
            <Download className="h-3.5 w-3.5" />
            Export Filtered CSV ({filteredLeaves.length})
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-border dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll number, reason..."
                className="pl-9 h-9 text-xs bg-muted/20 dark:bg-zinc-800/80 border-border dark:border-zinc-700 text-foreground placeholder:text-muted-foreground rounded-xl"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-xs bg-muted/20 dark:bg-zinc-800/80 border border-border dark:border-zinc-700 rounded-xl px-3 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-siet-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 text-xs bg-muted/20 dark:bg-zinc-800/80 border border-border dark:border-zinc-700 rounded-xl px-3 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-siet-primary"
              >
                <option value="all">All Types</option>
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

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40 dark:border-zinc-800">
            <span>Showing {filteredLeaves.length} of {leaves.length} total records</span>
            {(searchQuery || statusFilter !== "all" || typeFilter !== "all" || yearFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setYearFilter("all");
                }}
                className="text-siet-primary dark:text-red-400 font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-14 rounded-xl bg-muted/40 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <p className="font-bold text-foreground text-sm">No Records Found</p>
                <p>No leave requests match your search or filter combination.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 dark:bg-zinc-800/60">
                    <TableRow>
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
                        Date Range
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground">
                        Reason
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">
                        View
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border dark:divide-zinc-800">
                    {filteredLeaves.map((leave) => (
                      <TableRow key={leave.id} className="hover:bg-muted/30 dark:hover:bg-zinc-800/40 transition-colors">
                        <TableCell>
                          <div className="font-bold text-xs text-foreground">
                            {leave.studentName}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {leave.rollNumber}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          Yr {leave.year} • Sec {leave.section}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted dark:bg-zinc-800 text-foreground">
                            {leave.type}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs font-medium text-foreground whitespace-nowrap">
                            {safeFormatDate(leave.startDate)} → {safeFormatDate(leave.endDate)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {leave.totalDays || 1} {(leave.totalDays || 1) === 1 ? "day" : "days"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={leave.status} />
                        </TableCell>

                        <TableCell className="max-w-[200px]">
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate" title={leave.reason}>
                            {leave.reason}
                          </p>
                          {leave.hodRemarks && leave.status === "rejected" && (
                            <p className="text-[11px] text-red-600 dark:text-red-400 truncate mt-0.5">
                              Remarks: {leave.hodRemarks}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedLeave(leave)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-border dark:border-zinc-800 animate-fade-up">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Application Record</h3>
                <p className="text-xs text-muted-foreground">ID: #{selectedLeave.id.slice(0, 10)}</p>
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

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-zinc-800/60 rounded-xl">
                <div>
                  <span className="font-bold text-sm text-foreground block">{selectedLeave.studentName}</span>
                  <span className="font-mono text-muted-foreground">{selectedLeave.rollNumber}</span>
                </div>
                <StatusBadge status={selectedLeave.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300">
                <div className="p-2.5 bg-muted/20 dark:bg-zinc-800/40 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Class</span>
                  <span>Dept of {selectedLeave.department} • Year {selectedLeave.year} ({selectedLeave.section})</span>
                </div>
                <div className="p-2.5 bg-muted/20 dark:bg-zinc-800/40 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Type &amp; Duration</span>
                  <span>{selectedLeave.type} • {selectedLeave.totalDays || 1} day(s)</span>
                </div>
              </div>

              <div className="p-2.5 bg-muted/20 dark:bg-zinc-800/40 rounded-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Authorized Period</span>
                <span>{safeFormatDate(selectedLeave.startDate, "dd MMMM yyyy")} to {safeFormatDate(selectedLeave.endDate, "dd MMMM yyyy")}</span>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Student's Reason</span>
                <p className="italic text-zinc-800 dark:text-zinc-200 leading-relaxed">"{selectedLeave.reason}"</p>
              </div>

              {selectedLeave.hodRemarks && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1 text-rose-800 dark:text-rose-300">
                  <span className="text-[10px] uppercase font-bold block">HOD Remarks</span>
                  <p className="leading-relaxed">{selectedLeave.hodRemarks}</p>
                </div>
              )}

              {selectedLeave.attachmentUrl && (
                <a
                  href={selectedLeave.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 p-2 bg-siet-primary/5 dark:bg-red-500/10 border border-siet-primary/20 dark:border-red-500/30 rounded-lg text-siet-primary dark:text-red-400 font-bold hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  View Document Attachment
                </a>
              )}
            </div>

            <div className="pt-2 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLeave(null)}
                className="text-xs border-border dark:border-zinc-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
