"use client";

import { Spinner } from "@/components/base/spinner/spinner";

/** The gallery tile: the three middle sizes, accent, muted, and on a primary surface. */
export function SpinnerPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-5">
      <Spinner size="md" />
      <Spinner size="xl" />
      <span className="flex size-12 items-center justify-center rounded-2xl bg-button-primary shadow-xs">
        <Spinner size="lg" className="text-white" />
      </span>
    </div>
  );
}
