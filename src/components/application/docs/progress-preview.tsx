"use client";

import { ProgressBar, ProgressCircle } from "@/components/base/progress/progress";

/** The gallery tile: a determinate bar, an indeterminate sweep, and rings. */
export function ProgressPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="flex w-full max-w-[240px] flex-col gap-5">
        <ProgressBar label="Uploading" value={64} />
        <ProgressBar aria-label="Preparing export" isIndeterminate />
        <div className="flex items-center gap-4">
          <ProgressCircle aria-label="Upload" value={25} />
          <ProgressCircle aria-label="Upload" value={70} />
          <ProgressCircle aria-label="Syncing" isIndeterminate />
        </div>
      </div>
    </div>
  );
}
