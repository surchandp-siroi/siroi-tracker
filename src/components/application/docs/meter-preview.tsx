"use client";

import { Meter } from "@/components/base/meter/meter";

/** The gallery tile: usage meters filling towards their limits. */
export function MeterPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="flex w-full max-w-[240px] flex-col gap-4">
        <Meter label="Storage" value={72} />
        <Meter label="Seats" value={84} tone="warning" />
        <Meter label="API requests" value={96} tone="error" />
      </div>
    </div>
  );
}
