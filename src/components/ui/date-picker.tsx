import React, { useState, useEffect } from "react";
import {
  format,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isSunday,
  isToday,
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string; // Stored as "yyyy-MM-dd"
  onChange: (value: string) => void;
  min?: string; // "yyyy-MM-dd"
  max?: string; // "yyyy-MM-dd"
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder = "DD/MM/YYYY",
  disabled = false,
  className,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      try {
        const parsed = parseISO(value);
        if (isValid(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return new Date();
  });

  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    try {
      const d = parseISO(value);
      return isValid(d) ? d : null;
    } catch {
      return null;
    }
  }, [value]);

  const minDate = React.useMemo(() => {
    if (!min) return null;
    try {
      const d = parseISO(min);
      return isValid(d) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
    } catch {
      return null;
    }
  }, [min]);

  const maxDate = React.useMemo(() => {
    if (!max) return null;
    try {
      const d = parseISO(max);
      return isValid(d) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
    } catch {
      return null;
    }
  }, [max]);

  // Sync internal display when external value changes
  useEffect(() => {
    if (parsedDate) {
      setInputValue(format(parsedDate, "dd/MM/yyyy"));
      setCurrentMonth(parsedDate);
    } else {
      setInputValue("");
    }
  }, [value, parsedDate]);

  // Calendar day cells generation
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const handleDaySelect = (day: Date) => {
    const normalized = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    if (minDate && isBefore(normalized, minDate)) return;
    if (maxDate && isAfter(normalized, maxDate)) return;

    const formattedIso = format(day, "yyyy-MM-dd");
    onChange(formattedIso);
    setInputValue(format(day, "dd/MM/yyyy"));
    setIsOpen(false);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9/]/g, "");

    // Auto-insert slash for convenience (dd/mm/yyyy)
    if (raw.length === 2 && !raw.includes("/")) {
      raw = raw + "/";
    } else if (raw.length === 5 && raw.split("/").length === 2) {
      raw = raw + "/";
    }

    setInputValue(raw);

    // If matches complete dd/MM/yyyy
    const parts = raw.split("/");
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      const candidate = new Date(year, month, day);
      if (
        isValid(candidate) &&
        candidate.getDate() === day &&
        candidate.getMonth() === month &&
        candidate.getFullYear() === year
      ) {
        if (minDate && isBefore(candidate, minDate)) return;
        if (maxDate && isAfter(candidate, maxDate)) return;

        const isoStr = format(candidate, "yyyy-MM-dd");
        onChange(isoStr);
        setCurrentMonth(candidate);
      }
    } else if (raw === "") {
      onChange("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setInputValue("");
  };

  const isDayDisabled = (day: Date) => {
    const normalized = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    if (minDate && isBefore(normalized, minDate)) return true;
    if (maxDate && isAfter(normalized, maxDate)) return true;
    return false;
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative flex items-center">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleManualInput}
            disabled={disabled}
            className={cn(
              "w-full h-11 pl-10 pr-10 rounded-xl text-xs sm:text-sm font-medium",
              "bg-muted/20 dark:bg-zinc-800/50 border border-border",
              "focus:outline-none focus:ring-2 focus:ring-siet-primary/40 focus:border-siet-primary",
              "hover:border-siet-primary/50 transition-all",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />

          {/* Left Calendar Trigger Icon */}
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute left-3 p-1 rounded-md text-muted-foreground hover:text-siet-primary focus:outline-none transition-colors"
              title="Open Calendar (dd/mm/yyyy)"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>

          {/* Right Action: Clear or Indicator */}
          {inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-3 p-1 rounded-md text-muted-foreground hover:text-destructive focus:outline-none transition-colors"
              title="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                className="absolute right-3 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase hover:text-foreground"
              >
                DD/MM
              </button>
            </PopoverTrigger>
          )}
        </div>

        {/* Selected Date Hint */}
        {parsedDate && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Selected:</span>
            <span className="font-semibold text-foreground">
              {format(parsedDate, "dd/MM/yyyy")} ({format(parsedDate, "EEEE")})
            </span>
            {isSunday(parsedDate) && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                Sunday (Natural Holiday)
              </span>
            )}
          </div>
        )}

        {/* Popover Calendar Grid */}
        <PopoverContent
          className="w-auto p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 select-none animate-in fade-in-50 zoom-in-95"
          align="start"
        >
          <div className="space-y-3">
            {/* Calendar Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-bold text-sm text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Weekday Labels (Monday to Sunday) */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, idx) => (
                <div
                  key={day}
                  className={cn(
                    "h-7 flex items-center justify-center text-[11px] font-bold uppercase",
                    idx === 6
                      ? "text-red-500 dark:text-red-400 font-extrabold"
                      : "text-muted-foreground"
                  )}
                  title={idx === 6 ? "Sunday (Natural Holiday)" : undefined}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isSelected = parsedDate ? isSameDay(day, parsedDate) : false;
                const isCurrentMonthDay = isSameMonth(day, currentMonth);
                const disabledDay = isDayDisabled(day);
                const isSun = isSunday(day);
                const isTodayDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => handleDaySelect(day)}
                    title={
                      isSun
                        ? `${format(day, "dd/MM/yyyy")} (Sunday - Natural Holiday)`
                        : format(day, "dd/MM/yyyy")
                    }
                    className={cn(
                      "h-8 w-8 text-xs rounded-lg flex flex-col items-center justify-center relative transition-all",
                      isSelected &&
                        "bg-siet-primary text-white font-bold shadow-md hover:bg-siet-primary/90",
                      !isSelected && isCurrentMonthDay && !disabledDay && "hover:bg-muted text-foreground",
                      !isSelected && !isCurrentMonthDay && "text-muted-foreground/30 opacity-40",
                      isSun && !isSelected && isCurrentMonthDay && "text-red-600 dark:text-red-400 font-semibold",
                      disabledDay && "opacity-25 cursor-not-allowed hover:bg-transparent text-muted-foreground",
                      isTodayDay && !isSelected && "ring-1 ring-siet-primary/40 font-bold"
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {isSun && isCurrentMonthDay && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-red-500 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer with Legend & Quick Today Button */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <span className="text-[10px]">Sun: Natural Holiday</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  if (!isDayDisabled(today)) {
                    handleDaySelect(today);
                  } else {
                    setCurrentMonth(today);
                  }
                }}
                className="text-[10px] font-bold text-siet-primary hover:underline uppercase tracking-wide"
              >
                Today
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
