"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Chip } from "@/components/base/badges/chip";
import { useCountUp } from "@/hooks/use-count-up";
import { useThemeMode } from "@/components/application/theme/theme-toggle";
import { cx } from "@/utils/cx";

export interface BranchDataPoint {
  label: string;
  projected: number;
  achieved: number;
  productMix: { name: string; amount: number }[];
}

const formatK = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
};

function describeDelta(current: number, previous: number) {
  if (previous === 0 && current === 0) return { label: "0%", color: "neutral" as const };
  if (previous === 0) return { label: "New", color: "neutral" as const };
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) return { label: "0%", color: "neutral" as const };
  return {
    label: `${rounded > 0 ? "+" : ""}${rounded}%`,
    color: rounded > 0 ? ("lime" as const) : ("rose" as const),
  };
}

export function BranchPerformanceOrdersCard({
  data = [],
  title = "Branch Performance (Daily)",
  className,
}: {
  data: BranchDataPoint[];
  title?: string;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const theme = useThemeMode();
  const isDark = theme === "dark";

  const totalCurrent = data.reduce((sum, point) => sum + point.achieved, 0);
  const totalPrevious = data.reduce((sum, point) => sum + point.projected, 0);
  const hovering = activeIndex !== null && activeIndex < data.length;
  const point = hovering ? data[activeIndex] : null;

  const headlineValue = point ? point.achieved : totalCurrent;
  const comparison = point ? point.projected : totalPrevious;
  const delta = describeDelta(headlineValue, comparison);
  const label = point ? point.label : title;
  const display = useCountUp(headlineValue);

  const yMax = Math.max(1000, ...data.map((d) => Math.max(Number(d.achieved) || 0, Number(d.projected) || 0)));

  return (
    <section
      className={cx(
        "flex h-[400px] min-w-0 flex-col justify-between rounded-2xl bg-background-secondary-default p-4 border border-border-button-default shadow-xs",
        className
      )}
    >
      {/* Header: label over the count-up figure and its delta */}
      <div className="flex w-full items-start justify-between">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="w-full text-body-medium text-text-secondary truncate">{label}</p>
          <div className="flex items-center gap-2">
            <p
              key={activeIndex ?? "total"}
              className="animate-number-fade text-title-1-medium whitespace-nowrap text-text-primary font-mono tabular-nums"
            >
              ₹{display.toLocaleString("en-IN")}
            </p>
            <Chip variant="bold" color={delta.color}>
              {delta.label}
            </Chip>
          </div>
          <p className="text-body-2-medium text-text-tertiary font-mono tabular-nums">
            ₹{comparison.toLocaleString("en-IN")} {point ? "projected" : "total projected"}
          </p>
        </div>
      </div>

      {/* Recharts Chart Area - concrete pixel height ensures ResponsiveContainer calculates SVG dimensions immediately */}
      <div className="relative w-full h-[250px] my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 6, bottom: 0, left: -10 }}
            barCategoryGap="28%"
            barGap={4}
            onMouseMove={(state) => {
              const index = Number(state?.activeTooltipIndex);
              if (state?.isTooltipActive && Number.isFinite(index)) setActiveIndex(index);
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <YAxis
              width={55}
              domain={[0, yMax * 1.15]}
              tickCount={4}
              tickFormatter={formatK}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 12, fill: "var(--color-text-secondary)", fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: "var(--color-chart-track)", opacity: 0.35 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const pt = payload[0]?.payload as BranchDataPoint;
                if (!pt) return null;
                const mix = (pt.productMix || []).filter((item) => item.amount > 0);
                return (
                  <div className="rounded-xl bg-background-primary-default p-3 shadow-popup border border-border-button-default min-w-[210px] z-50">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-separator-border">
                      <span className="text-body-medium font-bold text-text-primary">{pt.label}</span>
                      <span className="text-caption-1-semibold text-text-tertiary">Product Mix</span>
                    </div>
                    {mix.length === 0 ? (
                      <p className="text-caption-1-semibold text-text-tertiary py-1">No sales recorded</p>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1">
                        {mix.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-caption-1-semibold gap-3">
                            <span className="text-text-secondary truncate max-w-[130px]" title={item.name}>
                              {item.name}
                            </span>
                            <span className="font-mono font-bold text-text-primary shrink-0">
                              ₹{item.amount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="projected"
              fill={isDark ? "#64748b" : "var(--color-chart-neutral)"}
              radius={[8, 8, 0, 0]}
              isAnimationActive
              animationDuration={450}
            />
            <Bar
              dataKey="achieved"
              fill={isDark ? "var(--color-accent-400)" : "var(--color-accent-600)"}
              radius={[8, 8, 0, 0]}
              isAnimationActive
              animationDuration={450}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend on Bottom Left as Projected and Achieved */}
      <div className="flex items-center justify-between pt-1">
        <dl className="flex items-center gap-4 text-caption-1-semibold text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-neutral dark:bg-[#64748b]" aria-hidden />
            <dt>Projected</dt>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent-600 dark:bg-accent-400" aria-hidden />
            <dt>Achieved</dt>
          </div>
        </dl>
      </div>
    </section>
  );
}
