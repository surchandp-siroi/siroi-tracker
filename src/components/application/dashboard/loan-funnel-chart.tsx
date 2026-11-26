"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

export interface LoanFunnelChartProps {
  logged: { value: number; count: number };
  sanctioned: { value: number; count: number; conversion: number | string };
  disbursed: { value: number; count: number; conversion: number | string };
  netConversionPct: number | string;
  className?: string;
}

/** Gap between funnel columns, px. */
const COL_GAP = 4;
/** Share of a curved column that stays flat before the S-curve taper. */
const FLAT = 0.42;
/** The two translucent edge layers behind a curved band: bleed px + opacity. */
const LAYERS: { pad: number; opacity: number }[] = [
  { pad: 10, opacity: 0.12 },
  { pad: 5, opacity: 0.24 },
];
/** Opacity of other columns while one stage is hovered. */
const DIM = 0.35;
const DIM_CLASS = "transition-opacity duration-200 ease-out";
/** Percentage pill metrics. */
const PILL_H = 22;
const PILL_PAD = 10;
const PILL_CHAR = 7.5;

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, ...size };
}

/**
 * Generates an SVG path for a curved funnel band from height hL at x0 to hR at x1.
 * Flat for FLAT of the width, then an S-curve easing into the right edge.
 */
function bandPath(x0: number, x1: number, cy: number, hL: number, hR: number) {
  const topL = cy - hL / 2;
  const botL = cy + hL / 2;
  const topR = cy - hR / 2;
  const botR = cy + hR / 2;

  const xf = x0 + (x1 - x0) * FLAT;
  const c = (xf + x1) / 2;
  return [
    `M${x0},${topL}`,
    `L${xf},${topL}`,
    `C${c},${topL} ${c},${topR} ${x1},${topR}`,
    `L${x1},${botR}`,
    `C${c},${botR} ${c},${botL} ${xf},${botL}`,
    `L${x0},${botL}`,
    "Z",
  ].join(" ");
}

export function LoanFunnelChart({
  logged,
  sanctioned,
  disbursed,
  netConversionPct,
  className,
}: LoanFunnelChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { ref, width, height } = useElementSize<HTMLDivElement>();

  // Colors aligned with the Executive Business Mix Chart palette:
  // 1. Luminous Teal (#4fa8b2) - Brand Core
  // 2. Warm Brand Gold (#f2c94c) - Brand Secondary / Sanctions
  // 3. Forest Emerald (#10b981) - Realized / Disbursed
  const stages = [
    {
      id: "logged",
      label: "Logged Pipeline",
      shortLabel: "Logged",
      value: logged.value,
      count: logged.count,
      countUnit: "Applications",
      pillLabel: "100%",
      color: "#4fa8b2",
      activeColor: "#38bdf8",
      accentBg: "bg-teal-500/10 dark:bg-teal-500/15",
      accentText: "text-teal-700 dark:text-teal-300",
    },
    {
      id: "sanctioned",
      label: "Sanctioned",
      shortLabel: "Sanctioned",
      value: sanctioned.value,
      count: sanctioned.count,
      countUnit: "Approvals",
      pillLabel: `${sanctioned.conversion}%`,
      color: "#f2c94c",
      activeColor: "#fbbf24",
      accentBg: "bg-amber-500/10 dark:bg-amber-500/15",
      accentText: "text-amber-700 dark:text-amber-300",
    },
    {
      id: "disbursed",
      label: "Disbursed",
      shortLabel: "Disbursed",
      value: disbursed.value,
      count: disbursed.count,
      countUnit: "Funded",
      pillLabel: `${netConversionPct}%`,
      color: "#10b981",
      activeColor: "#34d399",
      accentBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      accentText: "text-emerald-700 dark:text-emerald-300",
    },
  ];

  const top = Math.max(1, logged.value);
  const n = stages.length;
  const bleed = LAYERS[0].pad;
  const colW = Math.max(0, (width - COL_GAP * (n - 1)) / n);
  const usable = Math.max(0, height - bleed * 2);
  const cy = height / 2;

  // Height proportional to volume share with a min height so tiny stages remain legible
  const heightOf = (v: number) => Math.max(18, Math.min(usable, (v / top) * usable));

  const columnX = (i: number) => {
    const x0 = i * (colW + COL_GAP);
    return { x0, x1: x0 + colW };
  };

  const hovering = activeIndex !== null;
  const dimOf = (i: number) => (hovering && activeIndex !== i ? DIM : 1);

  return (
    <div className={cx("flex flex-col w-full gap-5", className)}>
      {/* 1. Horizontal Flow Funnel SVG Area */}
      <div ref={ref} className="relative w-full h-[130px] min-h-[130px]">
        {width > 0 && height > 0 && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 overflow-visible select-none"
            onMouseLeave={() => setActiveIndex(null)}
          >
            {/* Translucent pipe-like edge layers behind each curved band */}
            {LAYERS.map((layer) =>
              stages.map((stage, i) => {
                const { x0, x1 } = columnX(i);
                const hL = heightOf(stage.value);
                const hR = i < n - 1 ? heightOf(stages[i + 1].value) : hL;
                return (
                  <path
                    key={`layer-${layer.pad}-${stage.id}`}
                    d={bandPath(x0, x1, cy, hL + layer.pad * 2, hR + layer.pad * 2)}
                    fill={stage.color}
                    fillOpacity={layer.opacity}
                    opacity={dimOf(i)}
                    className={cx("pointer-events-none", DIM_CLASS)}
                  />
                );
              })
            )}

            {/* Primary Curved Flow Bands */}
            {stages.map((stage, i) => {
              const { x0, x1 } = columnX(i);
              const hL = heightOf(stage.value);
              const hR = i < n - 1 ? heightOf(stages[i + 1].value) : hL;
              const active = activeIndex === i;
              return (
                <path
                  key={`band-${stage.id}`}
                  d={bandPath(x0, x1, cy, hL, hR)}
                  fill={active ? stage.activeColor : stage.color}
                  opacity={dimOf(i)}
                  className="cursor-pointer transition-[fill,opacity] duration-200 ease-out"
                  onMouseEnter={() => setActiveIndex(i)}
                />
              );
            })}

            {/* Centred Conversion / Share Pills */}
            {stages.map((stage, i) => {
              const { x0, x1 } = columnX(i);
              const label = stage.pillLabel;
              const w = Math.max(46, label.length * PILL_CHAR + PILL_PAD * 2);
              const midX = (x0 + x1) / 2;
              if (w > colW + COL_GAP) return null;
              return (
                <g
                  key={`pill-${stage.id}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  opacity={dimOf(i)}
                  className={cx("cursor-pointer", DIM_CLASS)}
                >
                  <rect
                    x={midX - w / 2}
                    y={cy - PILL_H / 2}
                    width={w}
                    height={PILL_H}
                    rx={PILL_H / 2}
                    fill="var(--color-background-secondary-default)"
                    stroke="var(--color-border-button-default)"
                    strokeWidth={1}
                    className="shadow-xs"
                  />
                  <text
                    x={midX}
                    y={cy}
                    dy={4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--color-text-primary)"
                    className="pointer-events-none tabular-nums font-mono"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* 2. Stat Tiles Underneath (One under each stage) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stages.map((stage, i) => {
          const active = activeIndex === i;
          const dim = hovering && !active;
          return (
            <div
              key={stage.id}
              className={cx(
                "flex min-w-0 flex-col justify-between rounded-2xl p-4 bg-background-primary-default border transition-all duration-200 ease-out cursor-pointer shadow-xs gap-3",
                active
                  ? "border-text-primary/40 ring-1 ring-border-focus-ring/20 scale-[1.01]"
                  : "border-border-button-default hover:border-border-button-hover"
              )}
              style={{ opacity: dim ? 0.5 : 1 }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Header: Rounded corner square + Stage label */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-2.5 shrink-0 rounded-[4px] transition-colors duration-150 ease-out"
                  style={{ backgroundColor: active ? stage.activeColor : stage.color }}
                />
                <span className="text-body-medium text-text-secondary truncate">
                  {stage.label}
                </span>
              </div>

              {/* Value: BoardUI typography (clean, not thick/bold) */}
              <div className="py-0.5">
                <span className="text-title-1-medium whitespace-nowrap text-text-primary tabular-nums">
                  ₹{stage.value.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Footer: Application/Approval tag moved down here */}
              <div className="flex items-center pt-2.5 border-t border-separator-border">
                <span className={cx("inline-flex items-center text-caption-2-medium font-medium px-2 py-0.5 rounded-full", stage.accentBg, stage.accentText)}>
                  {stage.count} {stage.countUnit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
