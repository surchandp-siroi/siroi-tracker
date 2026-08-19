import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from "lucide-react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (monthStr: string) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}

export function MonthPicker({
  value,
  onChange,
  className,
  buttonClassName,
  placeholder = "Select month",
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);

  const initialYear = value ? parseInt(value.split("-")[0], 10) : new Date().getFullYear();
  const initialMonth = value ? parseInt(value.split("-")[1], 10) : new Date().getMonth() + 1;

  const [viewYear, setViewYear] = React.useState<number>(initialYear);

  React.useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 2) {
        setViewYear(parseInt(parts[0], 10));
      }
    }
  }, [value]);

  const selectedYear = value ? parseInt(value.split("-")[0], 10) : null;
  const selectedMonth = value ? parseInt(value.split("-")[1], 10) : null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const formattedDisplay = value
    ? `${MONTH_NAMES[initialMonth - 1]}, ${initialYear}`
    : placeholder;

  const handleSelectMonth = (monthIndex: number) => {
    const monthNum = String(monthIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${monthNum}`);
    setOpen(false);
  };

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen} className={className}>
      <button
        type="button"
        className={cn(
          "flex items-center justify-between gap-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 px-3.5 py-1.5 text-xs font-bold rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-indigo-500/30 shadow-sm transition-all duration-200 cursor-pointer select-none whitespace-nowrap",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="tracking-wide uppercase text-[11px]">{formattedDisplay}</span>
        </div>
      </button>

      <Popover className="w-[280px] p-4 bg-white dark:bg-[#0b1120] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-2xl z-[9999]" placement="bottom start">
        {/* Year Navigation Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-3">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Previous year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
            {viewYear}
          </span>

          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Next year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Months Grid (3 columns x 4 rows) */}
        <div className="grid grid-cols-3 gap-2">
          {SHORT_MONTHS.map((month, idx) => {
            const isSelected = selectedYear === viewYear && selectedMonth === idx + 1;
            const isCurrent = currentYear === viewYear && currentMonth === idx + 1;

            return (
              <button
                key={month}
                type="button"
                onClick={() => handleSelectMonth(idx)}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none text-center",
                  isSelected
                    ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30 scale-100"
                    : isCurrent
                    ? "border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {month}
              </button>
            );
          })}
        </div>

        {/* Footer: This Month Shortcut */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const mStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              onChange(mStr);
              setOpen(false);
            }}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
          >
            This Month
          </button>
          <span className="text-[10px] text-slate-400 font-mono">
            {value || "None"}
          </span>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}
