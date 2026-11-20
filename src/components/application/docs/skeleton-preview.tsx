"use client";

import { Skeleton, SkeletonText } from "@/components/base/skeleton/skeleton";

/** The gallery tile: a card waiting for its content. */
export function SkeletonPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="flex w-full max-w-[240px] flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" className="size-9 shrink-0" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton shape="text" className="h-3 w-28" />
            <Skeleton shape="text" className="h-2.5 w-16" />
          </div>
        </div>
        <SkeletonText lines={2} lineClassName="h-3" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
