"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Chip } from "@/components/base/badges/chip";
import { useCountUp } from "@/hooks/use-count-up";
import { cx } from "@/utils/cx";
import type { ReactNode } from "react";

export interface RadialMixItem {
  label: string;
  value: number;
  pct?: number;
  color?: string;
}

/**
 * Siroi Brand Executive Color Map
 * Grounded in Petrol Teal + Warm Logo Gold + Deep Corporate Executive Tones
 */
const SIROI_EXECUTIVE_COLORS: Record<string, string> = {
  "Personal Loan": "#20535a", // Deepest Petrol Teal (Brand Core)
  "Business Loan": "#f2c94c", // Warm Brand Gold (Brand Secondary)
  "Retail forex sales": "#4fa8b2", // Luminous Teal
  "Housing Loan/LAP": "#10b981", // Forest Emerald
  "Retail forex purchase": "#d97706", // Bronze Amber
  "Private Forex Card": "#1d4ed8", // Sapphire Navy
  "General Insurance": "#9333ea", // Royal Amethyst
  "Life Insurance": "#be123c", // Cherry Rose
  "Mutual Fund/SIP": "#ca8a04", // Ochre Gold
  "GST filing": "#0f766e", // Pine Teal
  "ITR filing": "#0d9488", // Deep Teal
  "MSME Working Capital": "#3b82f6", // Azure Blue
  "MSME Term Loan": "#f59e0b", // Amber Gold
  "Student Forex Card": "#ec4899", // Rose Pink
  "Remittance": "#0284c7", // Sky Blue
  "Livlong Loan Protector": "#0891b2", // Cyan Teal
};

const FALLBACK_PALETTE = [
  "#20535a",
  "#f2c94c",
  "#4fa8b2",
  "#10b981",
  "#d97706",
  "#1d4ed8",
  "#9333ea",
  "#be123c",
];

const formatCompact = (val: number): string => {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return `${val}`;
};

export interface BusinessMixRadialCardProps {
  data: RadialMixItem[];
  totalValue?: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  branchSelect?: ReactNode;
}

export function BusinessMixRadialCard({
  data = [],
  totalValue,
  title = "Business Mix",
  className,
  style,
  branchSelect,
}: BusinessMixRadialCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const calculatedTotal = totalValue ?? data.reduce((sum, item) => sum + item.value, 0);
  const hovering = activeIndex !== null && activeIndex < data.length;
  const activeItem = hovering ? data[activeIndex] : (data[0] ?? null);

  const headlineValue = hovering && activeItem ? activeItem.value : calculatedTotal;
  const display = useCountUp(headlineValue);

  // Center readout: percentage of hovered slice or dominant slice
  const activePct = activeItem ? activeItem.pct : 0;
  const activeLabel = activeItem ? activeItem.label : "No Sales";

  return (
    <section
      style={style}
      className={cx(
        "flex h-[329px] min-w-0 flex-col justify-between rounded-2xl bg-background-secondary-default p-4 border border-border-button-default shadow-xs",
        className
      )}
    >
      {/* Header: Title + Big figure + Switcher / Dropdown */}
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="w-full text-body-medium text-text-secondary truncate">{title}</p>
          <div className="flex items-center gap-2">
            <p
              key={activeIndex ?? "total"}
              className="animate-number-fade text-title-1-medium whitespace-nowrap text-text-primary font-mono tabular-nums"
            >
              ₹{display.toLocaleString("en-IN")}
            </p>
            {activeItem && hovering && (
              <Chip variant="bold" color="lime">
                {activeItem.pct}%
              </Chip>
            )}
          </div>
          <p className="text-body-2-medium text-text-tertiary font-mono tabular-nums">
            {hovering && activeItem ? `${activeItem.label} Volume` : "All Products Consolidated"}
          </p>
        </div>

        {branchSelect && <div className="shrink-0">{branchSelect}</div>}
      </div>

      {/* Half-Gauge Radial Arc Area */}
      <div className="relative my-auto w-full h-[180px] flex items-center justify-center">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <p className="text-body-medium text-text-tertiary">No sales entries recorded</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                {/* Grey Background Track (BoardUI 180° Half Arc with Capsule Ends) */}
                <Pie
                  data={[{ value: 100 }]}
                  dataKey="value"
                  cx="50%"
                  cy="78%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={96}
                  outerRadius={128}
                  cornerRadius={99}
                  fill="var(--color-chart-track)"
                  stroke="none"
                  isAnimationActive={false}
                />
                {/* Segmented Slices (Half Gauge Stacked with Capsule Ends) */}
                <Pie
                  data={data}
                  dataKey="value"
                  cx="50%"
                  cy="78%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={96}
                  outerRadius={128}
                  cornerRadius={99}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive
                  animationDuration={450}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => {
                    const color = entry.color || SIROI_EXECUTIVE_COLORS[entry.label] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
                    const isTarget = index === activeIndex;
                    return (
                      <Cell
                        key={`cell-${entry.label}-${index}`}
                        fill={color}
                        opacity={hovering ? (isTarget ? 1 : 0.45) : 1}
                        style={{
                          transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          cursor: "pointer",
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Readout (Percentage + Active Label) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-7 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-display-4-medium font-bold text-text-primary tracking-tight tabular-nums">
                {activePct}%
              </span>
              <span className="text-caption-1-semibold text-text-secondary truncate max-w-[140px] font-medium -mt-0.5">
                {activeLabel}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend on Bottom with Color Dots and Compact Values */}
      <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 pt-2 border-t border-separator-border text-caption-1-semibold">
        {data.slice(0, 5).map((item, idx) => {
          const isTarget = idx === activeIndex;
          const itemColor = item.color || SIROI_EXECUTIVE_COLORS[item.label] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
          return (
            <div
              key={item.label}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={cx(
                "flex items-center gap-1.5 cursor-pointer transition-opacity select-none",
                hovering && !isTarget && "opacity-45"
              )}
            >
              <span
                className="size-2 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: itemColor }}
                aria-hidden
              />
              <span className="text-text-secondary truncate max-w-[110px]" title={item.label}>
                {item.label}
              </span>
              <span className="font-mono font-bold text-text-primary shrink-0">
                ₹{formatCompact(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
