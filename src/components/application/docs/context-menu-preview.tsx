"use client";

import { RiArrowRightSLine, RiCursorFill, RiDeleteBinLine, RiFileCopyLine, RiFilePdf2Line, RiFolderTransferLine } from "@remixicon/react";
import { cx } from "@/utils/cx";

const ROWS = [
  { icon: RiFileCopyLine, label: "Duplicate", shortcut: "⌘D" },
  { icon: RiFolderTransferLine, label: "Move to", submenu: true },
];

/**
 * The gallery tile: a file with the pointer on it and its menu open at the
 * pointer, drawn statically. Panel and rows mirror components/base/context-menu.
 */
export function ContextMenuPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative h-[174px] w-[300px] shrink-0 scale-[0.82]">
        <div className="absolute start-0 top-0 flex w-32 flex-col gap-3 rounded-2xl border border-accent-500 bg-background-full p-3 shadow-xs ring-2 ring-accent-500/20">
          <span className="flex size-10 items-center justify-center rounded-xl bg-background-secondary-default">
            <RiFilePdf2Line aria-hidden className="size-5 text-foreground-icon-secondary" />
          </span>
          <span className="flex flex-col">
            <span className="truncate text-body-medium text-text-primary">Q3 report.pdf</span>
            <span className="text-body-regular text-text-tertiary">2.4 MB</span>
          </span>
        </div>
        <div className="absolute start-[92px] top-[50px] flex w-52 flex-col gap-1 rounded-[14px] border border-border-button-default bg-background-primary-default p-1 shadow-dropdown">
          {ROWS.map((row, index) => (
            <div
              key={row.label}
              className={cx("flex items-center gap-2 rounded-2lg px-2 py-1.5", index === 0 && "bg-dropdown-item-hover-background")}
            >
              <row.icon aria-hidden className="size-5 shrink-0 text-foreground-icon-secondary" />
              <span className="flex-1 text-body-medium text-text-primary">{row.label}</span>
              {row.shortcut ? <span className="text-body-regular text-text-tertiary">{row.shortcut}</span> : null}
              {row.submenu ? <RiArrowRightSLine aria-hidden className="-me-1 size-5 text-foreground-icon-secondary rtl:-scale-x-100" /> : null}
            </div>
          ))}
          <div className="-mx-1 my-0.5 h-px bg-border-button-default" />
          <div className="flex items-center gap-2 rounded-2lg px-2 py-1.5 text-text-destructive">
            <RiDeleteBinLine aria-hidden className="size-5 shrink-0" />
            <span className="flex-1 text-body-medium">Delete</span>
          </div>
        </div>
        <RiCursorFill
          aria-hidden
          className="absolute start-[84px] top-[42px] size-5 stroke-white text-black [paint-order:stroke] [stroke-width:2] drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)] rtl:-scale-x-100"
        />
      </div>
    </div>
  );
}
