import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isSunday,
} from "date-fns";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  Building2,
  X,
  History,
} from "lucide-react";
import {
  calculateDefaultWorkingDays,
  computeMonthlyAttendance,
  computeCumulativeAttendance,
  buildLeaveCalendarMap,
  AttendanceSummary,
} from "@/lib/attendance";
import { StatusTag } from "@/components/ui/StatusTag";

interface AttendanceCalendarProps {
  leaves: any[];
  department?: string;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  leaves,
  department = "Campus",
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateLeaves, setSelectedDateLeaves] = useState<{
    date: Date;
    leaves: any[];
  } | null>(null);
  const [customWorkingDaysMap, setCustomWorkingDaysMap] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<"monthly" | "cumulative">("monthly");

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const yearMonth = format(currentDate, "yyyy-MM");

  // Real-time listener for all HOD-configured working days in this department
  useEffect(() => {
    if (!department) return;
    const q = query(
      collection(db, "departmentWorkingDays"),
      where("department", "==", department)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const daysMap: Record<string, number> = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.yearMonth && typeof data.totalWorkingDays === "number") {
            daysMap[data.yearMonth] = data.totalWorkingDays;
          }
        });
        setCustomWorkingDaysMap(daysMap);
      },
      (err) => {
        console.error("Error loading department working days:", err);
      }
    );

    return () => unsubscribe();
  }, [department]);

  // Determine effective working days for current month
  const customWorkingDays = customWorkingDaysMap[yearMonth] ?? null;
  const isCustomConfigured = customWorkingDays !== null && customWorkingDays > 0;

  const effectiveWorkingDays = useMemo(() => {
    if (isCustomConfigured && customWorkingDays) {
      return customWorkingDays;
    }
    return calculateDefaultWorkingDays(year, monthIndex);
  }, [isCustomConfigured, customWorkingDays, year, monthIndex]);

  // Calendar Leave Mapping
  const leaveMap = useMemo(() => {
    return buildLeaveCalendarMap(leaves);
  }, [leaves]);

  // Count approved leave days in this specific month (excluding Sundays)
  const approvedAbsentCount = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start, end });

    let count = 0;
    daysInMonth.forEach((day) => {
      if (isSunday(day)) return; // Exclude non-working Sunday
      const key = format(day, "yyyy-MM-dd");
      const dayLeaves = leaveMap.get(key) || [];
      if (dayLeaves.some((l) => l.status === "approved")) {
        count++;
      }
    });
    return count;
  }, [currentDate, leaveMap]);

  // Compute monthly attendance summary
  const monthlyAttendance: AttendanceSummary = useMemo(() => {
    return computeMonthlyAttendance(
      effectiveWorkingDays,
      approvedAbsentCount,
      isCustomConfigured
    );
  }, [effectiveWorkingDays, approvedAbsentCount, isCustomConfigured]);

  // Compute cumulative attendance summary (adding from previous semester months)
  const cumulativeAttendance: AttendanceSummary = useMemo(() => {
    return computeCumulativeAttendance(
      leaves,
      currentDate,
      customWorkingDaysMap
    );
  }, [leaves, currentDate, customWorkingDaysMap]);

  // Active scorecard depending on viewMode
  const activeAttendance = viewMode === "monthly" ? monthlyAttendance : cumulativeAttendance;

  // Generate calendar day grid
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const handleToday = () => setCurrentDate(new Date());


  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-sm space-y-6 transition-colors">
      {/* ─── Top Control Bar & Attendance Rate ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        {/* Left: Month Navigator */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
                  {format(currentDate, "MMMM yyyy")}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Monthly Absentee Ledger &amp; JNTUK Attendance Compliance
              </p>
            </div>
          </div>
        </div>

        {/* Right: Monthly & Cumulative Attendance Scorecard */}
        <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-4 bg-zinc-50/80 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-zinc-200/70 dark:bg-zinc-700/70 p-1 text-[11px] font-bold">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "monthly"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Monthly ({format(currentDate, "MMM")})
            </button>
            <button
              onClick={() => setViewMode("cumulative")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === "cumulative"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <History className="h-3 w-3" />
              Cumulative (Term)
            </button>
          </div>

          {/* Rate Display */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                {viewMode === "monthly" ? "Selected Month" : "Term Cumulative"}
              </span>
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-mono leading-none ${
                  activeAttendance.status === "compliant"
                    ? "text-emerald-700"
                    : activeAttendance.status === "condonation"
                    ? "text-amber-600"
                    : "text-rose-700"
                }`}
              >
                {activeAttendance.percentage}%
              </span>
            </div>

            {/* Status Tag */}
            <div className="space-y-1">
              {activeAttendance.status === "compliant" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  JNTUK Norm Met (≥75%)
                </span>
              )}
              {activeAttendance.status === "condonation" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Condonation Zone (65%–74%)
                </span>
              )}
              {activeAttendance.status === "detention" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Detention Risk (&lt;65%)
                </span>
              )}

              <p className="text-[10px] text-zinc-500 font-medium">
                {activeAttendance.attendedDays} attended / {activeAttendance.workingDays} working days
                {viewMode === "monthly" && (
                  <span className="text-zinc-400"> (Cumul: {cumulativeAttendance.percentage}%)</span>
                )}
                {viewMode === "cumulative" && (
                  <span className="text-zinc-400"> (Month: {monthlyAttendance.percentage}%)</span>
                )}
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700 hidden lg:block" />

          {/* Working Days Details */}
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-semibold">
              <Building2 className="h-3.5 w-3.5 text-siet-primary dark:text-red-400" />
              <span>{activeAttendance.workingDays} Working Days</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              {viewMode === "monthly"
                ? isCustomConfigured
                  ? "HOD Official Working Days"
                  : "Standard Schedule (Mon–Sat)"
                : "Adds previous term months"}
            </p>
          </div>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors ml-auto"
          >
            Current Month
          </button>
        </div>
      </div>

      {/* ─── Calendar Grid ─── */}
      <div className="space-y-2">
        {/* Day Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider py-1">
          <div className="text-rose-600 dark:text-rose-400">Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayLeaves = leaveMap.get(key) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDaySunday = isSunday(day);
            const isCurrentDay = isToday(day);

            // Determine day leave state
            const hasApproved = dayLeaves.some((l) => l.status === "approved");
            const hasPending = dayLeaves.some((l) => l.status === "pending");
            const hasRejected = dayLeaves.some((l) => l.status === "rejected");

            const isSelected =
              selectedDateLeaves && isSameDay(selectedDateLeaves.date, day);

            return (
              <div
                key={key}
                onClick={() => {
                  if (dayLeaves.length > 0) {
                    setSelectedDateLeaves({ date: day, leaves: dayLeaves });
                  } else {
                    setSelectedDateLeaves(null);
                  }
                }}
                className={`min-h-[72px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                  !isCurrentMonth
                    ? "bg-zinc-50/40 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-850 text-zinc-300 dark:text-zinc-700 pointer-events-none"
                    : isDaySunday
                    ? "bg-zinc-100/95 dark:bg-zinc-850/80 border-zinc-200/90 dark:border-zinc-750 text-zinc-500 dark:text-zinc-400" // OFF in GREY
                    : hasApproved
                    ? "bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-900/60 text-red-950 dark:text-red-200 shadow-sm cursor-pointer" // LEAVE in RED
                    : isSelected
                    ? "border-siet-primary dark:border-red-500 ring-2 ring-siet-primary/20 dark:ring-red-500/20 bg-white dark:bg-zinc-850 shadow-md cursor-pointer"
                    : dayLeaves.length > 0
                    ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 cursor-pointer"
                    : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-650" // NORMAL in WHITE
                }`}
              >
                {/* Date Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono h-6 w-6 flex items-center justify-center rounded-full ${
                      isCurrentDay
                        ? "bg-siet-primary text-white shadow-sm"
                        : hasApproved
                        ? "bg-red-600 text-white font-extrabold shadow-sm"
                        : isDaySunday
                        ? "text-zinc-500 dark:text-zinc-400 font-bold"
                        : "text-zinc-800 dark:text-zinc-200 font-semibold"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {isDaySunday && isCurrentMonth && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-200/80 dark:bg-zinc-750 px-1.5 py-0.5 rounded">
                      Off
                    </span>
                  )}
                  {hasApproved && isCurrentMonth && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                      Absent
                    </span>
                  )}
                </div>

                {/* Leave Indicator Chips */}
                {isCurrentMonth && dayLeaves.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {hasApproved && (
                      <div className="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold truncate shadow-xs">
                        {dayLeaves.find((l) => l.status === "approved")?.type || "Leave"}
                      </div>
                    )}
                    {!hasApproved && hasPending && (
                      <div className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-[10px] font-bold truncate flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                        <span>Pending</span>
                      </div>
                    )}
                    {!hasApproved && !hasPending && hasRejected && (
                      <div className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-[9px] font-medium line-through truncate">
                        Rejected
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Selected Date Leave Inspector Drawer / Popover ─── */}
      {selectedDateLeaves && (
        <div className="p-4 sm:p-5 rounded-2xl border border-siet-primary/30 dark:border-red-900/40 bg-siet-primary/5 dark:bg-red-950/20 animate-fade-up">
          <div className="flex items-center justify-between pb-3 border-b border-siet-primary/10 dark:border-red-900/30">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-siet-primary dark:text-red-400" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Leave Details for {format(selectedDateLeaves.date, "EEEE, dd MMMM yyyy")}
              </h4>
            </div>
            <button
              onClick={() => setSelectedDateLeaves(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {selectedDateLeaves.leaves.map((leave) => (
              <div
                key={leave.id}
                className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-siet-primary dark:text-red-400">
                      {leave.type} Leave
                    </span>
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                      Ref #{leave.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <StatusTag status={leave.status} />
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">"{leave.reason}"</p>

                {leave.hodRemarks && (
                  <p className="text-xs text-siet-primary dark:text-red-300 font-medium bg-siet-primary/5 dark:bg-red-950/30 p-2 rounded-lg border border-siet-primary/10 dark:border-red-900/40">
                    HOD Remark: {leave.hodRemarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Footer Legend ─── */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
        <span className="font-bold text-zinc-700 dark:text-zinc-300">Calendar Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 shadow-2xs" />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Normal Working Day (White)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600" />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Weekly Off / Sunday (Grey)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-red-600 border border-red-700" />
          <span className="text-red-700 dark:text-red-400 font-bold">Leave / Absent Day (Red)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700" />
          <span className="text-amber-800 dark:text-amber-300 font-medium">Pending Review</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
          <Info className="h-3.5 w-3.5 inline mr-1 text-zinc-400 dark:text-zinc-500" />
          Attendance % excludes approved leave days from total working days
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
