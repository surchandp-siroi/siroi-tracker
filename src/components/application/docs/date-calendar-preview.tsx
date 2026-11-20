"use client";

import { parseDate } from "@internationalized/date";
import { DateRangeCalendar } from "@/components/base/date-picker/date-calendar";

/**
 * The gallery tile: one month with a five-night range, scaled to fit. The
 * dates are fixed so the static gallery renders the same month everywhere.
 */
export function DateCalendarPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="shrink-0 scale-[0.58]">
        <DateRangeCalendar
          aria-label="Stay"
          visibleMonths={1}
          showToday={false}
          defaultValue={{ start: parseDate("2026-11-10"), end: parseDate("2026-11-14") }}
        />
      </div>
    </div>
  );
}
