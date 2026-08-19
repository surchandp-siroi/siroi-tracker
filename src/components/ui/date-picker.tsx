import * as React from "react";
import {
  getLocalTimeZone,
  CalendarDate,
  parseDate,
  today,
} from "@internationalized/date";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseToCalendarDate(val: any): CalendarDate | null {
  if (!val) return null;
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
      return null;
    }
  }
  if (val instanceof Date) {
    return new CalendarDate(
      val.getFullYear(),
      val.getMonth() + 1,
      val.getDate()
    );
  }
  return null;
}

export interface DatePickerProps {
  label?: string;
  value?: CalendarDate | string | Date | null;
  onChange?: (date: CalendarDate | null, dateString: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  captionLayout?: "dropdown" | "buttons" | "label";
  id?: string;
  disabled?: boolean;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  className,
  buttonClassName,
  captionLayout = "dropdown",
  id,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const calendarDate = parseToCalendarDate(value);

  const formattedDate = calendarDate
    ? `${calendarDate.day.toString().padStart(2, "0")} ${[
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][calendarDate.month - 1]} ${calendarDate.year}`
    : placeholder;

  const content = (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen} className="w-full">
      <Button
        variant="outline"
        id={id}
        disabled={disabled}
        className={cn(
          "w-full justify-between font-normal text-xs h-9.5 px-3 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm hover:border-indigo-500/40 transition-all",
          !calendarDate && "text-slate-400 dark:text-slate-500",
          buttonClassName
        )}
      >
        <span className="flex items-center gap-2 font-medium truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className={calendarDate ? "text-slate-800 dark:text-slate-100 font-bold" : ""}>
            {formattedDate}
          </span>
        </span>
      </Button>
      <Popover className="w-auto overflow-hidden p-0" placement="bottom start">
        <Calendar
          value={calendarDate}
          captionLayout={captionLayout}
          onChange={(newDate) => {
            const dateStr = `${newDate.year}-${String(newDate.month).padStart(2, "0")}-${String(newDate.day).padStart(2, "0")}`;
            onChange?.(newDate, dateStr);
            setOpen(false);
          }}
        />
      </Popover>
    </PopoverTrigger>
  );

  if (label) {
    return (
      <Field className={cn("w-full", className)}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {content}
      </Field>
    );
  }

  return <div className={cn("w-full", className)}>{content}</div>;
}
