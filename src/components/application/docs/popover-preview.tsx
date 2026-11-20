"use client";

import { RiInformationLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { TOOLTIP_CARETS } from "@/components/base/tooltip/tooltip";

/**
 * The gallery tile: a popover open above its trigger, drawn without the
 * overlay machinery. Surface and caret mirror components/base/popover.
 */
export function PopoverPreviewCard() {
  const caret = TOOLTIP_CARETS.top;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[9px]">
      <div className="relative w-[264px] shrink-0 rounded-[20px] border border-border-button-default bg-background-primary-default p-4 shadow-dropdown">
        <p className="text-body-medium text-text-primary">Net revenue retention</p>
        <p className="mt-0.5 text-body-2-regular text-text-secondary">
          Revenue kept from existing customers over 12 months, upgrades included and churn taken out.
        </p>
        <svg
          aria-hidden
          width={caret.width}
          height={caret.height}
          viewBox={`0 0 ${caret.width} ${caret.height}`}
          className="absolute top-full left-1/2 -translate-x-1/2 overflow-visible fill-background-primary-default stroke-border-button-default"
          style={{ filter: `drop-shadow(${caret.shadow} rgb(0 0 0 / 0.05))` }}
        >
          <path d={caret.path} />
        </svg>
      </div>
      <Button variant="secondary" size="small" leadingIcon={RiInformationLine} className="shrink-0">Details</Button>
    </div>
  );
}
