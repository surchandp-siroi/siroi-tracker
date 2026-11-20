"use client";

import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { DrawerFooter, DrawerHeader } from "@/components/base/drawer/drawer";

/**
 * The gallery tile: a filters drawer docked at the end edge of the card over
 * a dimmed page, drawn without the overlay (a live Drawer would cover the
 * index page). The panel is laid out at its real 320px width and scaled to
 * the card's height, like a full-height drawer on screen; its surface
 * classes mirror the dialog in components/base/modal/modal.tsx.
 */
export function DrawerPreviewCard() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div aria-hidden className="absolute inset-0 flex flex-col gap-3 p-5">
        <span className="h-3 w-24 rounded-full bg-background-tertiary-default" />
        <span className="h-2.5 w-36 rounded-full bg-background-tertiary-default" />
        <span className="mt-2 h-16 w-28 rounded-2xl bg-background-tertiary-default" />
        <span className="h-2.5 w-20 rounded-full bg-background-tertiary-default" />
      </div>
      <div aria-hidden className="absolute inset-0 bg-black/5 dark:bg-black/30" />
      <div className="absolute end-3 top-3 flex h-[346px] w-[320px] origin-top-right scale-50 flex-col gap-4 rounded-3xl border border-separator-border bg-background-full py-6 shadow-xs rtl:origin-top-left">
        <DrawerHeader title="Filters" description="Narrow the customer list." />
        <div className="flex flex-1 flex-col gap-3 px-6">
          <span className="text-body-medium text-text-primary">Status</span>
          <Checkbox defaultSelected>Active</Checkbox>
          <Checkbox defaultSelected>Trialing</Checkbox>
          <Checkbox>Past due</Checkbox>
          <Checkbox>Canceled</Checkbox>
        </div>
        <DrawerFooter className="flex-row justify-end">
          <Button variant="secondary">Reset</Button>
          <Button>Apply</Button>
        </DrawerFooter>
      </div>
    </div>
  );
}
