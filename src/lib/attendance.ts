import { format, isSunday, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

export interface DepartmentWorkingDays {
  id: string;
  department: string;
  yearMonth: string; // Format: "YYYY-MM"
  totalWorkingDays: number;
  updatedAt?: any;
  updatedBy?: string;
  hodName?: string;
}

export interface AttendanceSummary {
  workingDays: number;
  attendedDays: number;
  absentDays: number;
  percentage: number;
  status: "compliant" | "condonation" | "detention";
  isCustomConfigured: boolean;
}

/**
 * Calculates default working days for a month (excluding Sundays).
 * SIET operates on a 6-day academic schedule (Mon–Sat).
 */
export function calculateDefaultWorkingDays(year: number, monthIndex: number): number {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(new Date(year, monthIndex, 1));
  const allDays = eachDayOfInterval({ start, end });

  // Exclude Sundays
  const workingDays = allDays.filter((d) => !isSunday(d)).length;
  return Math.max(1, workingDays);
}

/**
 * Calculates monthly attendance percentage based on total working days and approved leave days.
 * JNTUK Autonomous Attendance Norms:
 * - >= 75%: Compliant (Eligible for regular examination)
 * - 65% - 74.9%: Condonation range (Medical/Principal approval required)
 * - < 65%: Detention risk (Not eligible for semester end exams)
 */
export function computeMonthlyAttendance(
  totalWorkingDays: number,
  approvedLeaveDaysInMonth: number,
  isCustom = false
): AttendanceSummary {
  const safeWorkingDays = Math.max(1, totalWorkingDays);
  const safeAbsent = Math.min(safeWorkingDays, Math.max(0, approvedLeaveDaysInMonth));
  const attendedDays = Math.max(0, safeWorkingDays - safeAbsent);
  const percentage = Math.round((attendedDays / safeWorkingDays) * 1000) / 10;

  let status: "compliant" | "condonation" | "detention" = "compliant";
  if (percentage < 65) {
    status = "detention";
  } else if (percentage < 75) {
    status = "condonation";
  }

  return {
    workingDays: safeWorkingDays,
    attendedDays,
    absentDays: safeAbsent,
    percentage,
    status,
    isCustomConfigured: isCustom,
  };
}

/**
 * Maps a list of leave requests into a Date Map for quick calendar lookup.
 */
export function buildLeaveCalendarMap(leaves: any[]) {
  const map = new Map<string, any[]>();

  leaves.forEach((leave) => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    try {
      if (leave.startDate?.toDate) {
        startDate = leave.startDate.toDate();
      } else if (typeof leave.startDate === "string") {
        startDate = parseISO(leave.startDate);
      } else if (leave.startDate instanceof Date) {
        startDate = leave.startDate;
      }

      if (leave.endDate?.toDate) {
        endDate = leave.endDate.toDate();
      } else if (typeof leave.endDate === "string") {
        endDate = parseISO(leave.endDate);
      } else if (leave.endDate instanceof Date) {
        endDate = leave.endDate;
      }
    } catch {
      // ignore parsing error
    }

    if (!startDate || !endDate) return;

    // Normalize start and end
    const dStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const dEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    const rangeDays = eachDayOfInterval({
      start: dStart <= dEnd ? dStart : dEnd,
      end: dStart <= dEnd ? dEnd : dStart,
    });

    rangeDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      const existing = map.get(key) || [];
      existing.push({
        ...leave,
        activeDate: day,
      });
      map.set(key, existing);
    });
  });

  return map;
}

/**
 * Counts how many approved leave days for a student fall strictly within the given month (excluding Sundays).
 */
export function getApprovedLeaveDaysInMonth(
  leaves: any[],
  year: number,
  monthIndex: number
): number {
  const monthStart = startOfMonth(new Date(year, monthIndex, 1));
  const monthEnd = endOfMonth(new Date(year, monthIndex, 1));
  const leaveMap = buildLeaveCalendarMap(leaves.filter((l) => l.status === "approved"));

  let count = 0;
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  days.forEach((day) => {
    if (isSunday(day)) return; // Exclude non-working Sunday
    const key = format(day, "yyyy-MM-dd");
    if (leaveMap.has(key)) {
      count++;
    }
  });

  return count;
}

/**
 * Given the current date, determines the academic semester start date (June for Odd semester, December for Even semester).
 */
export function getSemesterStartMonth(date: Date): { year: number; monthIndex: number } {
  const currentMonth = date.getMonth(); // 0-indexed (0 = Jan, 5 = Jun, 11 = Dec)
  const currentYear = date.getFullYear();

  // If month is June (5) through November (10), semester starts in June of currentYear
  if (currentMonth >= 5 && currentMonth <= 10) {
    return { year: currentYear, monthIndex: 5 };
  }
  // If month is December (11), semester starts in December of currentYear
  if (currentMonth === 11) {
    return { year: currentYear, monthIndex: 11 };
  }
  // If month is January (0) through May (4), semester started in December of previous year
  return { year: currentYear - 1, monthIndex: 11 };
}

/**
 * Computes cumulative attendance from the start of the semester up to the target month,
 * incorporating custom HOD working days when configured.
 */
export function computeCumulativeAttendance(
  leaves: any[],
  targetDate: Date,
  customWorkingDaysMap: Record<string, number> = {}
): AttendanceSummary {
  const semStart = getSemesterStartMonth(targetDate);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  let totalWorkingDays = 0;
  let totalAbsentDays = 0;
  let hasAnyCustom = false;

  const currentIter = new Date(semStart.year, semStart.monthIndex, 1);
  const targetLimit = new Date(targetYear, targetMonth, 1);

  while (currentIter <= targetLimit) {
    const iterYear = currentIter.getFullYear();
    const iterMonth = currentIter.getMonth();
    const key = format(currentIter, "yyyy-MM");

    const customDays = customWorkingDaysMap[key];
    if (typeof customDays === "number" && customDays > 0) {
      totalWorkingDays += customDays;
      hasAnyCustom = true;
    } else {
      totalWorkingDays += calculateDefaultWorkingDays(iterYear, iterMonth);
    }

    const absents = getApprovedLeaveDaysInMonth(leaves, iterYear, iterMonth);
    totalAbsentDays += absents;

    currentIter.setMonth(currentIter.getMonth() + 1);
  }

  const safeWorkingDays = Math.max(1, totalWorkingDays);
  const safeAbsent = Math.min(safeWorkingDays, Math.max(0, totalAbsentDays));
  const attendedDays = Math.max(0, safeWorkingDays - safeAbsent);
  const percentage = Math.round((attendedDays / safeWorkingDays) * 1000) / 10;

  let status: "compliant" | "condonation" | "detention" = "compliant";
  if (percentage < 65) {
    status = "detention";
  } else if (percentage < 75) {
    status = "condonation";
  }

  return {
    workingDays: safeWorkingDays,
    attendedDays,
    absentDays: safeAbsent,
    percentage,
    status,
    isCustomConfigured: hasAnyCustom,
  };
}

