"use client";

import { ColorPicker } from "@/components/base/color-picker/color-picker";

const PRESETS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#d946ef"];

/**
 * The gallery tile: the editor itself, with presets, on a fixed colour,
 * scaled to fit.
 */
export function ColorPickerPreviewCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="shrink-0 scale-[0.7]">
        <ColorPicker defaultValue="#6366f1" swatches={PRESETS} />
      </div>
    </div>
  );
}
