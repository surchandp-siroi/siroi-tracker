"use client";

import { RiBugLine, RiCloseLine, RiSparklingLine } from "@remixicon/react";
import { CHIP_COLORS } from "@/components/base/badges/chip";
import { cx } from "@/utils/cx";

const TOPICS = [
  { name: "Design", selected: true },
  { name: "Engineering", selected: true },
  { name: "Marketing", selected: false },
  { name: "Sales", selected: false },
  { name: "Support", selected: false },
];

const TAG = "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-body-medium";

/**
 * The gallery tile: a group of topics with two selected, and a row of
 * coloured labels with a removable one, drawn statically. Tags mirror
 * components/base/tag-group.
 */
export function TagGroupPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <div className="flex w-full max-w-[260px] flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-body-medium text-text-primary">Topics</span>
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map((topic) => (
              <span key={topic.name} className={cx(TAG, topic.selected ? "bg-accent-500 text-white" : CHIP_COLORS.neutral)}>
                {topic.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={cx(TAG, CHIP_COLORS.rose)}>
            <RiBugLine aria-hidden className="size-4" />
            Bug
          </span>
          <span className={cx(TAG, "pe-1", CHIP_COLORS.lime)}>
            <RiSparklingLine aria-hidden className="size-4" />
            Feature
            <span className="flex size-5 items-center justify-center rounded-md opacity-60">
              <RiCloseLine aria-hidden className="size-3.5" />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
