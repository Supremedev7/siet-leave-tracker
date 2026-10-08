import React, { useState, useEffect } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarDays,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { calculateDefaultWorkingDays } from "@/lib/attendance";
import { toast } from "sonner";

interface WorkingDaysConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
}

export const WorkingDaysConfigModal: React.FC<WorkingDaysConfigModalProps> = ({
  isOpen,
  onClose,
  department,
}) => {
  const { userData } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [workingDays, setWorkingDays] = useState<number>(24);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const year = selectedMonth.getFullYear();
  const monthIndex = selectedMonth.getMonth();
  const yearMonth = format(selectedMonth, "yyyy-MM");
  const defaultCalculated = calculateDefaultWorkingDays(year, monthIndex);

  // Fetch current setting for selected month
  useEffect(() => {
    if (!isOpen || !department) return;

    let isMounted = true;
    setLoading(true);

    const docId = `${department}_${yearMonth}`;
    const docRef = doc(db, "departmentWorkingDays", docId);

    getDoc(docRef)
      .then((snap) => {
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.totalWorkingDays === "number") {
            setWorkingDays(data.totalWorkingDays);
            if (data.updatedAt?.toDate) {
              setLastUpdated(
                `${format(data.updatedAt.toDate(), "dd MMM yyyy, hh:mm a")} by ${
                  data.hodName || "HOD"
                }`
              );
            } else {
              setLastUpdated("Configured previously");
            }
            setLoading(false);
            return;
          }
        }
        // Fallback to default calendar
        setWorkingDays(defaultCalculated);
        setLastUpdated(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error reading department working days:", err);
        if (isMounted) {
          setWorkingDays(defaultCalculated);
          setLastUpdated(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, department, yearMonth, defaultCalculated]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => addMonths(prev, 1));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (workingDays < 1 || workingDays > 31) {
      toast.error("Working days must be between 1 and 31 days.");
      return;
    }

    setSaving(true);
    try {
      const docId = `${department}_${yearMonth}`;
      const docRef = doc(db, "departmentWorkingDays", docId);

      await setDoc(
        docRef,
        {
          department,
          yearMonth,
          totalWorkingDays: Number(workingDays),
          updatedAt: serverTimestamp(),
          updatedBy: userData?.uid || "unknown",
          hodName: userData?.name || "Department HOD",
        },
        { merge: true }
      );

      toast.success(
        `Total working days for ${format(
          selectedMonth,
          "MMMM yyyy"
        )} set to ${workingDays} days.`
      );
      setLastUpdated(
        `${format(new Date(), "dd MMM yyyy, hh:mm a")} by ${
          userData?.name || "HOD"
        }`
      );
      onClose();
    } catch (err: any) {
      console.error("Error saving working days:", err);
      toast.error(err.message || "Failed to update working days.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display">
                Configure Academic Working Days
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {department} Department • JNTUK Autonomous Schedule
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Month Selector Bar */}
          <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Academic Month
              </span>
              <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
                {format(selectedMonth, "MMMM yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonth(new Date())}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors shadow-sm"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Working Days Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
              Official Working Days in Month
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={31}
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                disabled={loading || saving}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-lg font-extrabold font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary transition-all disabled:opacity-50"
                placeholder="e.g. 24"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                Days
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
              <span>
                Standard calendar (Mon–Sat):{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                  {defaultCalculated} days
                </span>
              </span>
              <button
                type="button"
                onClick={() => setWorkingDays(defaultCalculated)}
                className="text-siet-primary dark:text-red-400 font-bold hover:underline"
              >
                Reset to Standard
              </button>
            </div>
          </div>

          {/* Institutional Note */}
          <div className="p-3.5 rounded-xl border border-siet-primary/20 dark:border-red-900/40 bg-siet-primary/5 dark:bg-red-950/20 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-siet-primary dark:text-red-400">
              <Info className="h-4 w-4" />
              <span>JNTUK Attendance Impact</span>
            </div>
            <p className="leading-relaxed text-zinc-600 dark:text-zinc-400 text-[11px]">
              This setting governs the official attendance denominator for all
              students in <span className="font-semibold text-zinc-800 dark:text-zinc-200">{department}</span> for{" "}
              {format(selectedMonth, "MMMM yyyy")}. Monthly attendance % = (Total
              Working Days − Approved Absent Days) ÷ Total Working Days × 100%.
            </p>
          </div>

          {/* Audit Timestamp */}
          {lastUpdated && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono text-center">
              Last saved: {lastUpdated}
            </p>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-siet-primary to-siet-primary-dark text-xs font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Working Days
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkingDaysConfigModal;
