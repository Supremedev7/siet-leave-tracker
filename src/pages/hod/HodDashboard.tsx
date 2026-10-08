import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  CalendarCheck,
  UserCheck,
  CalendarDays,
  Search,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import StatsCard from "@/components/ui/StatsCard";
import { toast } from "sonner";
import { WorkingDaysConfigModal } from "@/components/hod/WorkingDaysConfigModal";
import {
  StudentLeaveDetailModal,
  StudentProfileData,
} from "@/components/hod/StudentLeaveDetailModal";
import {
  calculateDefaultWorkingDays,
  computeMonthlyAttendance,
} from "@/lib/attendance";

interface LeaveData {
  id: string;
  studentUid?: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year: number | string;
  section: string;
  type: string;
  startDate: any;
  endDate: any;
  totalDays?: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string;
  createdAt: any;
  hodRemarks?: string;
}

const safeToDate = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  try {
    if (typeof dateVal.toDate === "function") return dateVal.toDate();
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d;
  } catch {
    // fallback
  }
  return null;
};

const getDaysBetween = (startVal: any, endVal: any): number => {
  try {
    const s = safeToDate(startVal);
    const e = safeToDate(endVal);
    if (!s || !e) return 1;
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  } catch {
    return 1;
  }
};

// Official SIET harmonious chart colors
const SIET_CHART_COLORS = [
  "#8B1A1A", // Primary Maroon
  "#F7941D", // Gold
  "#16A34A", // Emerald
  "#0284C7", // Sky Blue
  "#7C3AED", // Purple
  "#E11D48", // Rose
];

export default function HodDashboard() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [workingDaysModalOpen, setWorkingDaysModalOpen] = useState(false);
  const [selectedStudentForDossier, setSelectedStudentForDossier] =
    useState<StudentProfileData | null>(null);

  // Department Working Days state for current month
  const now = new Date();
  const currentYearMonth = format(now, "yyyy-MM");
  const [currentMonthWorkingDays, setCurrentMonthWorkingDays] = useState<number>(
    calculateDefaultWorkingDays(now.getFullYear(), now.getMonth())
  );
  const [isCustomDaysConfigured, setIsCustomDaysConfigured] = useState(false);

  // Filter States for Student Roster
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Real-time listener for current month working days
  useEffect(() => {
    if (!userData?.department) return;

    const docId = `${userData.department}_${currentYearMonth}`;
    const docRef = doc(db, "departmentWorkingDays", docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.totalWorkingDays === "number") {
          setCurrentMonthWorkingDays(data.totalWorkingDays);
          setIsCustomDaysConfigured(true);
          return;
        }
      }
      setCurrentMonthWorkingDays(
        calculateDefaultWorkingDays(now.getFullYear(), now.getMonth())
      );
      setIsCustomDaysConfigured(false);
    });

    return () => unsubscribe();
  }, [userData?.department, currentYearMonth]);

  // Real-time listener for all department leaves
  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: LeaveData[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setLeaves(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching HOD stats:", error);
        toast.error("Failed to sync department data in real-time");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData]);

  // Compute metrics
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const onLeaveTodayList: LeaveData[] = [];

    leaves.forEach((l) => {
      if (l.status === "pending") pending++;
      if (l.status === "approved") {
        approved++;
        const s = safeToDate(l.startDate);
        const e = safeToDate(l.endDate);
        if (s && e) {
          if (
            (s <= todayEnd && e >= todayStart) ||
            isWithinInterval(today, { start: startOfDay(s), end: endOfDay(e) })
          ) {
            onLeaveTodayList.push(l);
          }
        }
      }
      if (l.status === "rejected") rejected++;
    });

    return {
      pending,
      approved,
      rejected,
      total: leaves.length,
      onLeaveToday: onLeaveTodayList,
    };
  }, [leaves]);

  // Chart: Type distribution
  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    leaves.forEach((l) => {
      counts[l.type] = (counts[l.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leaves]);

  // Chart: Monthly Trends (last 4 months)
  const monthlyTrends = useMemo(() => {
    const monthsMap: Record<
      string,
      { month: string; approved: number; rejected: number; pending: number }
    > = {};

    const currentDate = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = format(d, "MMM yyyy");
      monthsMap[key] = { month: format(d, "MMM"), approved: 0, rejected: 0, pending: 0 };
    }

    leaves.forEach((l) => {
      const created = safeToDate(l.createdAt);
      if (created) {
        const key = format(created, "MMM yyyy");
        if (monthsMap[key]) {
          if (l.status === "approved") monthsMap[key].approved++;
          else if (l.status === "rejected") monthsMap[key].rejected++;
          else if (l.status === "pending") monthsMap[key].pending++;
        }
      }
    });

    return Object.values(monthsMap);
  }, [leaves]);

  // Aggregate unique students in the department with leave summaries
  const departmentStudents = useMemo(() => {
    const studentMap = new Map<
      string,
      {
        uid?: string;
        studentName: string;
        rollNumber: string;
        department: string;
        year: number | string;
        section: string;
        studentLeaves: LeaveData[];
      }
    >();

    leaves.forEach((l) => {
      const key = (l.rollNumber || l.studentUid || l.studentName || "").toLowerCase().trim();
      if (!key) return;

      if (!studentMap.has(key)) {
        studentMap.set(key, {
          uid: l.studentUid,
          studentName: l.studentName || "Student",
          rollNumber: l.rollNumber || "—",
          department: l.department || userData?.department || "",
          year: l.year || "—",
          section: l.section || "—",
          studentLeaves: [],
        });
      }
      studentMap.get(key)!.studentLeaves.push(l);
    });

    return Array.from(studentMap.values()).map((student) => {
      const totalLeaves = student.studentLeaves.length;
      const approved = student.studentLeaves.filter((l) => l.status === "approved");
      const pending = student.studentLeaves.filter((l) => l.status === "pending");
      const rejected = student.studentLeaves.filter((l) => l.status === "rejected");

      let totalApprovedDays = 0;
      let currentMonthApprovedDays = 0;

      approved.forEach((l) => {
        const days = l.totalDays || getDaysBetween(l.startDate, l.endDate);
        totalApprovedDays += days;

        const s = safeToDate(l.startDate);
        if (s && s.getMonth() === now.getMonth() && s.getFullYear() === now.getFullYear()) {
          currentMonthApprovedDays += days;
        }
      });

      const attendance = computeMonthlyAttendance(
        currentMonthWorkingDays,
        currentMonthApprovedDays,
        isCustomDaysConfigured
      );

      return {
        ...student,
        totalLeaves,
        approvedCount: approved.length,
        approvedDays: totalApprovedDays,
        pendingCount: pending.length,
        rejectedCount: rejected.length,
        attendance,
      };
    });
  }, [leaves, userData?.department, currentMonthWorkingDays, isCustomDaysConfigured]);

  // Apply Multi-Facet Filters to Department Students
  const filteredStudents = useMemo(() => {
    return departmentStudents.filter((student) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim();
        const matchesName = student.studentName.toLowerCase().includes(queryLower);
        const matchesRoll = student.rollNumber.toLowerCase().includes(queryLower);
        if (!matchesName && !matchesRoll) return false;
      }

      // 2. Year Filter
      if (yearFilter !== "all") {
        if (String(student.year) !== yearFilter) return false;
      }

      // 3. Section Filter
      if (sectionFilter !== "all") {
        if (student.section.toUpperCase() !== sectionFilter.toUpperCase()) return false;
      }

      // 4. Status Filter
      if (statusFilter !== "all") {
        const hasStatus = student.studentLeaves.some((l) => l.status === statusFilter);
        if (!hasStatus) return false;
      }

      // 5. Leave Type Filter
      if (typeFilter !== "all") {
        const hasType = student.studentLeaves.some((l) => l.type === typeFilter);
        if (!hasType) return false;
      }

      return true;
    });
  }, [departmentStudents, searchQuery, yearFilter, sectionFilter, statusFilter, typeFilter]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setYearFilter("all");
    setSectionFilter("all");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (leaves.length === 0) {
      toast.error("No leave records to export");
      return;
    }

    const headers = [
      "Application ID",
      "Student Name",
      "Roll Number",
      "Department",
      "Year",
      "Section",
      "Leave Type",
      "Start Date",
      "End Date",
      "Status",
      "Reason",
    ];

    const rows = leaves.map((l) => [
      `"${l.id}"`,
      `"${l.studentName || ""}"`,
      `"${l.rollNumber || ""}"`,
      `"${l.department || ""}"`,
      `"${l.year || ""}"`,
      `"${l.section || ""}"`,
      `"${l.type || ""}"`,
      `"${l.startDate?.toDate ? format(l.startDate.toDate(), "yyyy-MM-dd") : ""}"`,
      `"${l.endDate?.toDate ? format(l.endDate.toDate(), "yyyy-MM-dd") : ""}"`,
      `"${l.status || ""}"`,
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
      `SIET_${userData?.department}_Leaves_${format(new Date(), "yyyyMMdd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV report exported successfully!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 text-xs font-bold tracking-wide uppercase mb-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              Executive Department Overview
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
              {userData?.department} Department Analytics
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live statistics, attendance governance, and student leaves tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Working Days Config Button */}
            <Button
              onClick={() => setWorkingDaysModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs font-bold flex items-center gap-1.5 rounded-xl border-border dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 shadow-sm hover:border-siet-primary dark:hover:border-red-400"
            >
              <CalendarDays className="h-4 w-4 text-siet-primary dark:text-red-400" />
              <span>Working Days ({currentMonthWorkingDays}d)</span>
              {isCustomDaysConfigured && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="text-xs font-bold flex items-center gap-1.5 rounded-xl border-border dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>

            <Link
              to="/hod/approvals"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{
                background: "linear-gradient(135deg, #8B1A1A, #6B1414)",
              }}
            >
              <Clock className="h-4 w-4" />
              Pending Desk ({stats.pending})
            </Link>
          </div>
        </div>

        {/* KPI Stats Cards Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 rounded-2xl bg-white border border-border/60 p-5 space-y-2 animate-pulse"
              >
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-7 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Applications"
              value={stats.total}
              subtitle="Department history"
              icon={FileText}
              variant="primary"
            />

            <StatsCard
              title="Pending Reviews"
              value={stats.pending}
              subtitle={stats.pending > 0 ? "Requires your attention" : "All cleared"}
              icon={Clock}
              variant="warning"
            />

            <StatsCard
              title="Approved Passes"
              value={stats.approved}
              subtitle="Passes authorized"
              icon={CheckCircle2}
              variant="success"
            />

            <StatsCard
              title="On Leave Today"
              value={stats.onLeaveToday.length}
              subtitle="Current campus absentees"
              icon={UserCheck}
              variant="neutral"
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart 1: Distribution */}
          <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">
                Leave Classification Breakdown
              </CardTitle>
              <CardDescription className="text-xs">
                Distribution of leave types applied across {userData?.department}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {typeChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SIET_CHART_COLORS[index % SIET_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val} requests`, "Count"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #71717a",
                        backgroundColor: "rgba(24, 24, 27, 0.95)",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs text-foreground font-medium">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No leave data recorded yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Monthly Trends */}
          <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">
                Monthly Request Volume
              </CardTitle>
              <CardDescription className="text-xs">
                Monthly volume breakdown by status
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#52525b" strokeOpacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #71717a",
                        backgroundColor: "rgba(24, 24, 27, 0.95)",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => (
                        <span className="text-xs text-foreground font-medium capitalize">
                          {val}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="approved"
                      name="Approved"
                      fill="#16A34A"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="rejected"
                      name="Rejected"
                      fill="#DC2626"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      name="Pending"
                      fill="#F7941D"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No monthly trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Department Student Leave & Attendance Register (Roster) ─── */}
        <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
                  <Users className="h-5 w-5 text-siet-primary dark:text-red-400" />
                  Department Student Leave &amp; Attendance Register
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Inspect any student's total leaves, category breakdown, and monthly attendance percentage
                  ({currentMonthWorkingDays} working days configured for {format(now, "MMMM yyyy")}).
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {filteredStudents.length} Students Listed
                </span>
              </div>
            </div>

            {/* ─── Data Filters Bar (Year, Section, Status, Type, Search) ─── */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search Box */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or roll number..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary transition-all"
                />
              </div>

              {/* Year Filter */}
              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  aria-label="Filter by Academic Year"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary transition-all"
                >
                  <option value="all">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {/* Section Filter */}
              <div>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  aria-label="Filter by Section"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary transition-all"
                >
                  <option value="all">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by Leave Status"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Type Filter & Reset */}
              <div className="flex items-center gap-1.5">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by Leave Type"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary transition-all"
                >
                  <option value="all">All Types</option>
                  <option value="Medical">Medical</option>
                  <option value="Personal">Personal</option>
                  <option value="Half-Day">Half-Day</option>
                  <option value="Emergency">Emergency</option>
                </select>

                {(searchQuery ||
                  yearFilter !== "all" ||
                  sectionFilter !== "all" ||
                  statusFilter !== "all" ||
                  typeFilter !== "all") && (
                  <button
                    onClick={handleResetFilters}
                    title="Reset Filters"
                    aria-label="Reset all filters"
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors flex-shrink-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <SlidersHorizontal className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  No students match the current filters
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Try adjusting the year, section, search term, or reset the filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-bold text-siet-primary dark:text-red-400 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/70 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3.5 pl-6">Student Information</th>
                      <th className="p-3.5">Academic Cohort</th>
                      <th className="p-3.5 text-center">Applications</th>
                      <th className="p-3.5 text-center">Approved Days</th>
                      <th className="p-3.5 text-center">Pending Desk</th>
                      <th className="p-3.5">Monthly Attendance</th>
                      <th className="p-3.5 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredStudents.map((st) => (
                      <tr
                        key={st.rollNumber}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* Student Name & Roll */}
                        <td className="p-3.5 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 flex items-center justify-center font-bold text-xs font-display flex-shrink-0">
                              {st.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">
                                {st.studentName}
                              </span>
                              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                {st.rollNumber}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Year & Section */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                            Yr {st.year} • Sec {st.section}
                          </span>
                        </td>

                        {/* Total Leaves Applied */}
                        <td className="p-3.5 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {st.totalLeaves}
                        </td>

                        {/* Total Approved Days */}
                        <td className="p-3.5 text-center">
                          <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                            {st.approvedDays} d
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                            ({st.approvedCount} passes)
                          </span>
                        </td>

                        {/* Pending Desk */}
                        <td className="p-3.5 text-center">
                          {st.pendingCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                              {st.pendingCount} pending
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* Monthly Attendance */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-extrabold text-sm ${
                                st.attendance.status === "compliant"
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : st.attendance.status === "condonation"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-rose-700 dark:text-rose-400"
                              }`}
                            >
                              {st.attendance.percentage}%
                            </span>
                            {st.attendance.status === "compliant" && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[9px]">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Norm Met
                              </span>
                            )}
                            {st.attendance.status === "condonation" && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-[9px]">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Condonation
                              </span>
                            )}
                            {st.attendance.status === "detention" && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-[9px]">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Detention
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-medium">
                            {st.attendance.attendedDays}/{st.attendance.workingDays} days
                          </span>
                        </td>

                        {/* Inspect Action */}
                        <td className="p-3.5 pr-6 text-right">
                          <button
                            onClick={() =>
                              setSelectedStudentForDossier({
                                uid: st.uid,
                                studentName: st.studentName,
                                rollNumber: st.rollNumber,
                                department: st.department,
                                year: st.year,
                                section: st.section,
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-siet-primary dark:hover:border-red-400 text-zinc-700 dark:text-zinc-200 hover:text-siet-primary dark:hover:text-red-400 transition-all font-bold text-xs shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect Leaves</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Students On Leave Roll */}
        <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-siet-primary dark:text-red-400" />
                Students on Leave Today ({format(new Date(), "dd MMMM yyyy")})
              </CardTitle>
              <CardDescription className="text-xs">
                Authorized students excused from classes today
              </CardDescription>
            </div>
            <Link
              to="/hod/all-requests"
              className="text-xs text-siet-primary dark:text-red-400 hover:underline font-bold flex items-center gap-1"
            >
              View Full History <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats.onLeaveToday.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No students from {userData?.department} are scheduled on leave today.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.onLeaveToday.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-3.5 rounded-xl border border-border/80 dark:border-zinc-800 bg-muted/20 dark:bg-zinc-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">
                        {leave.studentName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 font-bold">
                        {leave.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {leave.rollNumber} • Yr {leave.year} Sec {leave.section}
                    </p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate italic">
                      "{leave.reason}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── HOD Working Days Configuration Modal ─── */}
      <WorkingDaysConfigModal
        isOpen={workingDaysModalOpen}
        onClose={() => setWorkingDaysModalOpen(false)}
        department={userData?.department || ""}
      />

      {/* ─── Student Leave Inspector Dossier Modal ─── */}
      <StudentLeaveDetailModal
        isOpen={Boolean(selectedStudentForDossier)}
        onClose={() => setSelectedStudentForDossier(null)}
        student={selectedStudentForDossier}
        leaves={leaves}
        currentMonthWorkingDays={currentMonthWorkingDays}
      />
    </DashboardLayout>
  );
}
