"use client";

import { RiCornerDownLeftLine, RiFileAddLine, RiHome5Line, RiSearchLine, RiUserAddLine } from "@remixicon/react";
import { Kbd } from "@/components/base/kbd/kbd";
import { cx } from "@/utils/cx";

const ROWS = [
  { icon: RiFileAddLine, label: "Create project", shortcut: "⌘N" },
  { icon: RiUserAddLine, label: "Invite teammates" },
  { icon: RiHome5Line, label: "Dashboard" },
];

/**
 * The gallery tile: the palette's panel at rest, drawn statically (a live
 * one is a modal). Surface, rows and footer mirror components/base/command-palette.
 */
export function CommandPalettePreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex w-[360px] shrink-0 scale-[0.72] flex-col overflow-clip rounded-3xl border border-border-button-default bg-background-primary-default shadow-sidebar">
        <div className="flex items-center gap-2 border-b border-separator-border p-3">
          <RiSearchLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
          <span className="truncate text-body-medium text-text-tertiary">Type a command or search…</span>
        </div>
        <div className="flex flex-col gap-0.5 p-2">
          {ROWS.map((row, index) => (
            <div key={row.label} className={cx("flex items-center gap-2 rounded-xl px-3 py-2.5", index === 0 && "bg-background-secondary-default")}>
              <row.icon className="size-4 shrink-0 text-foreground-icon-secondary" aria-hidden />
              <span className="flex-1 text-body-medium text-text-primary">{row.label}</span>
              {row.shortcut ? <Kbd>{row.shortcut}</Kbd> : null}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-separator-border px-3 py-2 text-body-regular text-text-tertiary">
          <span>Navigate with ↑ ↓</span>
          <span className="flex items-center gap-1.5">
            Select
            <Kbd aria-label="Enter">
              <RiCornerDownLeftLine className="size-3" aria-hidden />
            </Kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
