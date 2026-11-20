"use client";

import { RiTimeLine } from "@remixicon/react";
import { inputFieldClassName } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

const FIELDS = [
  { label: "Opens", hour: "9", minute: "00", period: "AM", focused: true },
  { label: "Closes", hour: "6", minute: "00", period: "PM", focused: false },
];

const SEGMENT = "rounded-md px-0.5 text-body-regular text-text-primary tabular-nums";

/**
 * The gallery tile: two time fields, the first with its hour segment
 * focused, drawn statically with Input's shell and Time Field's segments.
 */
export function TimeFieldPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5">
      <div className="flex w-full max-w-[236px] flex-col gap-3">
        {FIELDS.map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            <span className="text-body-medium text-text-primary">{field.label}</span>
            <div className="relative">
              <div
                className={cx(
                  inputFieldClassName({ isFocusWithin: field.focused, isHovered: false, isDisabled: false, isInvalid: false }),
                  "ps-[34px]",
                )}
              >
                <span className={cx(SEGMENT, field.focused && "bg-accent-500 text-white")}>{field.hour}</span>
                <span className="text-body-regular text-text-tertiary">:</span>
                <span className={SEGMENT}>{field.minute}</span>
                <span className="text-body-regular text-text-tertiary"> </span>
                <span className={SEGMENT}>{field.period}</span>
              </div>
              <RiTimeLine aria-hidden className="pointer-events-none absolute start-2 top-1/2 size-5 -translate-y-1/2 text-foreground-icon-tertiary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
