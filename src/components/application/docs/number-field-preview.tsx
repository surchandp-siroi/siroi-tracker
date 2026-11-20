"use client";

import { RiAddLine, RiSubtractLine } from "@remixicon/react";
import { InputBase } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

const FIELDS = [
  { label: "Seats", value: "5", focused: true },
  { label: "Discount", value: "10%", focused: false },
];

/**
 * The gallery tile: two number fields with their steppers, drawn statically
 * from InputBase. The steppers mirror components/base/number-field.
 */
export function NumberFieldPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5">
      <div className="flex w-full max-w-[236px] flex-col gap-3">
        {FIELDS.map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            <span className="text-body-medium text-text-primary">{field.label}</span>
            <InputBase
              aria-label={field.label}
              defaultValue={field.value}
              readOnly
              className="tabular-nums"
              fieldClassName={cx(field.focused && "ring-border-button-active")}
              trailingAddon={
                <span aria-hidden className="-my-1 -me-1 flex shrink-0 items-center gap-0.5">
                  {[RiSubtractLine, RiAddLine].map((Icon, index) => (
                    <span
                      key={index}
                      className={cx(
                        "flex size-6 items-center justify-center rounded-md text-foreground-icon-secondary",
                        field.focused && index === 1 && "bg-background-tertiary-hover text-text-primary",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                  ))}
                </span>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
