"use client";

import { RiErrorWarningLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { ModalFooter, ModalHeader } from "@/components/base/modal/modal";

/**
 * The gallery tile: an alert dialog's panel at rest, drawn without the overlay
 * (a live Modal would cover the whole index page). The surface classes mirror
 * the dialog in components/base/modal/modal.tsx.
 */
export function ModalPreviewCard() {
  return (
    <div className="flex w-[400px] flex-col gap-4 rounded-3xl border border-separator-border bg-background-full py-6 shadow-xs">
      <ModalHeader
        title="Delete project?"
        description="Acme Dashboard and its 24 files will be deleted for everyone. You can't undo this."
        icon={RiErrorWarningLine}
        tone="danger"
        showCloseButton={false}
      />
      <ModalFooter className="flex-row justify-end">
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">Delete project</Button>
      </ModalFooter>
    </div>
  );
}
