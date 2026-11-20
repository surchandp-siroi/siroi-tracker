"use client";

import { Notification } from "@/components/base/notification/notification";

/**
 * The gallery tile: two toasts stacked in the bottom-end corner, drawn as
 * the Notification cards a Toaster renders, at rest and scaled to the card.
 */
export function ToastPreviewCard() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute end-4 bottom-4 flex w-[380px] origin-bottom-right scale-[0.72] flex-col gap-3 rtl:origin-bottom-left">
        <Notification status="success" title="Changes saved" />
        <Notification
          status="information"
          title="Project archived"
          description="Acme Dashboard moved to the archive."
          actions={[{ label: "Undo" }]}
        />
      </div>
    </div>
  );
}
