import * as React from "react";
import {
  CalendarDate,
  today,
  getLocalTimeZone,
  parseDate,
  getDayOfWeek,
} from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_HEADER = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// National / Banking Holidays (Month is 1-indexed, day)
const HOLIDAYS: Record<string, string> = {
  "1-26": "Republic Day",
  "8-15": "Independence Day",
  "10-2": "Gandhi Jayanti",
};

export interface CalendarProps {
  value?: CalendarDate | string | Date | null;
  onChange?: (date: CalendarDate) => void;
  className?: string;
  captionLayout?: "dropdown" | "buttons" | "label";
  showShortcuts?: boolean;
  minDate?: CalendarDate;
  maxDate?: CalendarDate;
}

export function Calendar({
  value,
  onChange,
  className,
  captionLayout = "dropdown",
  showShortcuts = true,
}: CalendarProps) {
  // Normalize value to CalendarDate
  const parseValue = (val: any): CalendarDate => {
    if (!val) return today(getLocalTimeZone());
    if (val instanceof CalendarDate) return val;
    if (typeof val === "object" && "year" in val && "month" in val && "day" in val) {
      return new CalendarDate(val.year, val.month, val.day);
    }
    if (typeof val === "string") {
      try {
        const parts = val.split("T")[0].split("-");
        if (parts.length === 3) {
          return new CalendarDate(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10),
            parseInt(parts[2], 10)
          );
        }
        return parseDate(val);
      } catch {
        return today(getLocalTimeZone());
      }
    }
    if (val instanceof Date) {
      return new CalendarDate(
        val.getFullYear(),
        val.getMonth() + 1,
        val.getDate()
      );
    }
    return today(getLocalTimeZone());
  };

  const currentDate = React.useMemo(() => (value ? parseValue(value) : null), [value]);
  const defaultDate = React.useMemo(() => parseValue(value), [value]);

  const [viewYear, setViewYear] = React.useState<number>(defaultDate.year);
  const [viewMonth, setViewMonth] = React.useState<number>(defaultDate.month);

  React.useEffect(() => {
    if (currentDate) {
      setViewYear(currentDate.year);
      setViewMonth(currentDate.month);
    }
  }, [currentDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Compute days for calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sun, 1 = Mon...
  const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

  const todayDate = today(getLocalTimeZone());

  interface DayCellInfo {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isSunday: boolean;
    isHoliday: boolean;
    isToday: boolean;
    isSelected: boolean;
  }

  const calendarDays: DayCellInfo[] = [];

  // Previous month overflow days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 1 ? 12 : viewMonth - 1;
    const y = viewMonth === 1 ? viewYear - 1 : viewYear;
    calendarDays.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isSunday: false,
      isHoliday: false,
      isToday: false,
      isSelected: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isSunday = new Date(viewYear, viewMonth - 1, d).getDay() === 0;
    const holidayKey = `${viewMonth}-${d}`;
    const isHoliday = Boolean(HOLIDAYS[holidayKey]);
    const isToday =
      todayDate.year === viewYear &&
      todayDate.month === viewMonth &&
      todayDate.day === d;
    const isSelected =
      Boolean(currentDate) &&
      currentDate?.year === viewYear &&
      currentDate?.month === viewMonth &&
      currentDate?.day === d;

    calendarDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      isSunday,
      isHoliday,
      isToday,
      isSelected,
    });
  }

  // Next month overflow days
  const totalSlots = calendarDays.length > 35 ? 42 : 35;
  const remaining = totalSlots - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 12 ? 1 : viewMonth + 1;
    const y = viewMonth === 12 ? viewYear + 1 : viewYear;
    calendarDays.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isSunday: false,
      isHoliday: false,
      isToday: false,
      isSelected: false,
    });
  }

  const handleSelect = (y: number, m: number, d: number) => {
    const selected = new CalendarDate(y, m, d);
    onChange?.(selected);
  };

  const currentYearNum = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYearNum - 30; y <= currentYearNum + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div
      className={cn(
        "p-5 sm:p-6 bg-white dark:bg-[#0b1120] rounded-2xl border border-slate-200 dark:border-white/15 shadow-2xl select-none w-[clamp(340px,92vw,420px)] max-w-full",
        className
      )}
    >
      {/* Header with Navigation & Dropdowns */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/5 mb-3.5 gap-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {captionLayout === "dropdown" ? (
          <div className="flex items-center gap-2 font-bold text-sm">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/10 outline-none cursor-pointer hover:border-indigo-500/40 text-xs sm:text-sm transition-colors shadow-sm"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/10 outline-none cursor-pointer hover:border-indigo-500/40 text-xs sm:text-sm transition-colors shadow-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
            {MONTHS[viewMonth - 1]} {viewYear}
          </span>
        )}

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
        {DAYS_HEADER.map((day) => (
          <div
            key={day}
            className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((item, idx) => {
          const isSpecial = item.isSunday || item.isHoliday;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item.year, item.month, item.day)}
              className={cn(
                "h-10 sm:h-11 w-full flex flex-col items-center justify-center rounded-xl text-xs sm:text-sm transition-all duration-150 relative cursor-pointer font-medium",
                !item.isCurrentMonth && "opacity-25 text-slate-400 dark:text-slate-600",
                item.isCurrentMonth &&
                  !item.isSelected &&
                  "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200",
                item.isCurrentMonth &&
                  !item.isSelected &&
                  isSpecial &&
                  "text-rose-500 font-bold",
                item.isToday &&
                  !item.isSelected &&
                  "border border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm",
                item.isSelected &&
                  "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30 scale-100"
              )}
            >
              <span className="font-mono">{item.day}</span>
              {isSpecial && !item.isSelected && item.isCurrentMonth && (
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full absolute bottom-1" />
              )}
              {isSpecial && item.isSelected && (
                <span className="w-1.5 h-1.5 bg-white rounded-full absolute bottom-1 opacity-80" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Shortcuts */}
      {showShortcuts && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const t = today(getLocalTimeZone());
              setViewYear(t.year);
              setViewMonth(t.month);
              onChange?.(t);
            }}
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
          >
            Today
          </button>
          <span className="text-xs text-slate-400 font-mono font-bold">
            {currentDate
              ? `${currentDate.year}-${String(currentDate.month).padStart(2, "0")}-${String(currentDate.day).padStart(2, "0")}`
              : "No date selected"}
          </span>
        </div>
      )}
    </div>
  );
}
