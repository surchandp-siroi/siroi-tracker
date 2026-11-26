"use client";

import { useTemplateCopy } from "@/components/foundations/template-copy/template-copy";

import { useEffect, useState, type ReactNode } from "react";
import {
  RiBuilding2Line,
  RiEyeLine,
  RiFlashlightLine,
  RiGroupLine,
  RiUserAddLine,
  RiVipCrownLine,
} from "@remixicon/react";
import {
  ChartCard,
  ChartHeader,
  MONO_TONE,
  describeDelta,
  formatNumber,
  resolveTone,
  useChartRange,
  type ChartRange,
} from "@/components/application/charts/chart-card";
import { cx } from "@/utils/cx";

/**
 * Stage bars card - the funnel as a list: one rounded horizontal pill per
 * stage over the chart track, name on the left, value and share of the top
 * stage on the right, and a 3-up grid of stat tiles underneath (swatch · name
 * over value - the activity rings tile recipe) so every stage reads at a
 * glance. The card is content-sized, so more stages make it taller.
 * Widths animate in on mount; hovering a stage or its tile darkens the pill
 * (400 → 500), fades the other rows and tiles, and swaps the headline to its
 * value.
 *
 * `stages` is the same flat `{ label, value, color? }` list the flow funnel
 * takes - add a stage and it gets a row; colours cycle the chart palette
 * unless overridden, and `mono` paints every pill in a single ink (mid grey
 * on light, near-white on dark) for the reference's mono look.
 */

export type StageBar = {
  label: string;
  /** Short abbreviation or code on the left (e.g. AS, MN, AP, NL&MZ) */
  shortLabel?: string;
  value: number;
  /** Target quantum (amount) */
  target?: number;
  /** Achieved quantum (amount) */
  achieved?: number;
  /** Percentage achieved against target (e.g. 99 for 99%) */
  progress?: number;
  /** Any CSS colour; defaults to the chart palette by index. */
  color?: string;
  activeColor?: string;
  /** 14px glyph drawn at the left end, inside the bar. Omit for none. */
  icon?: ReactNode;
};

/** A selectable period: pill label + the props it overrides. */
export type StageBarsRange = ChartRange<{ stages: StageBar[]; delta: number; headline: number }>;

export interface StageBarsCardProps {
  /** Header label; swaps to the hovered stage's name while hovering. */
  title?: string;
  stages?: StageBar[];
  /** Single-ink look: every pill in one grey, no per-stage hues. */
  mono?: boolean;
  /** Draw each stage's `icon` inside its bar (default). Set false to hide
   *  them without stripping the icons from your data. */
  showIcons?: boolean;
  /** Whether to render bottom stat tiles. Defaults to true unless minimal is true. */
  showTiles?: boolean;
  /** Minimal aesthetic: shows short labels on the left, only percentage on the right at rest, and quantum on hover. */
  minimal?: boolean;
  /** Headline number at rest; defaults to the first stage's value. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". */
  delta?: number;
  /** Static period pill ("Last 30 days"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods - the pill becomes a dropdown and the selected
   *  range's fields override the top-level props. */
  ranges?: StageBarsRange[];
  /** Initially selected range id (defaults to the first). */
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  format?: (n: number) => string;
  className?: string;
  /** Click handler when a stage row or stat tile is clicked. */
  onStageClick?: (stage: StageBar, index: number) => void;
}

/** The bars are the bright 400 chart tones in both themes, so a glyph sitting
 *  on one always wants the same near-black ink. */
const BAR_ICON = "size-3.5 shrink-0 text-neutral-950";

const DEFAULT_STAGES: StageBar[] = [
  { label: "Visits", value: 4820, icon: <RiEyeLine className={BAR_ICON} aria-hidden /> },
  { label: "Sign-up", value: 3260, icon: <RiUserAddLine className={BAR_ICON} aria-hidden /> },
  { label: "Active", value: 2010, icon: <RiFlashlightLine className={BAR_ICON} aria-hidden /> },
  { label: "Pro", value: 1160, icon: <RiVipCrownLine className={BAR_ICON} aria-hidden /> },
  { label: "Team", value: 540, icon: <RiGroupLine className={BAR_ICON} aria-hidden /> },
  { label: "Enterprise", value: 180, icon: <RiBuilding2Line className={BAR_ICON} aria-hidden /> },
];

const stagesOf = (values: number[]): StageBar[] =>
  DEFAULT_STAGES.map((s, i) => ({ ...s, value: values[i] }));

/** Demo periods used when no stages / range are given at all. */
const DEFAULT_RANGES: StageBarsRange[] = [
  { id: "7d", label: "Last 7 days", stages: stagesOf([1180, 790, 460, 250, 120, 40]), delta: 0.024 },
  { id: "30d", label: "Last 30 days", stages: DEFAULT_STAGES, delta: 0.061 },
  { id: "90d", label: "Last 90 days", stages: stagesOf([13900, 9410, 5720, 3300, 1520, 510]), delta: -0.012 },
];

/** Opacity of the other rows while one stage is hovered. */
const DIM = 0.35;

/** Rows mount at 0 width and grow. A short timeout (not rAF) so the 0-width
 *  frame is painted first and the grow still runs if the tab was hidden. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);
  return mounted;
}

export function StageBarsCard({
  title = "Pipeline",
  stages: stagesProp,
  mono = false,
  showIcons = true,
  showTiles,
  minimal = false,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  className,
  onStageClick,
}: StageBarsCardProps = {}) {
  const localize = useTemplateCopy();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const mounted = useMounted();

  // Built-in demo periods when the host supplies neither ranges nor stages.
  const demo = ranges === undefined && range === undefined && stagesProp === undefined;
  const rangeList = ranges ?? (demo ? DEFAULT_RANGES : undefined);
  const { selected, selectedId, select } = useChartRange(rangeList, defaultRange, onRangeChange);
  const selectRange = (id: string) => {
    setActiveIndex(null);
    select(id);
  };
  const stages = selected?.stages ?? stagesProp ?? DEFAULT_STAGES;
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  const tones = stages.map((s, i) => (mono ? MONO_TONE : resolveTone(i, s.color, s.activeColor)));
  const top = Math.max(1, ...stages.map((s) => s.value));
  const n = Math.max(1, stages.length);
  const hovering = activeIndex !== null && activeIndex < stages.length;
  const activeStage = hovering ? stages[activeIndex] : null;

  const headerLabel = activeStage ? activeStage.label : title;
  const headlineValue = activeStage
    ? (activeStage.achieved ?? activeStage.value)
    : (headline ?? top);

  // When hovering in minimal mode, show the target quantum in delta chip
  const headerDelta = activeStage && activeStage.target !== undefined
    ? {
        label: `Target: ${format(activeStage.target)}`,
        color: (activeStage.progress ?? 0) >= 100 ? ("lime" as const) : ("neutral" as const),
      }
    : delta !== undefined
    ? describeDelta(delta)
    : undefined;

  const shouldShowTiles = showTiles ?? !minimal;

  return localize((
    // Content-sized when tiles are shown, or fixed h-[329px] when minimal to match Business Mix card.
    <ChartCard className={cx(minimal ? "h-[329px]" : "h-auto min-h-[329px]", className)}>
      <ChartHeader
        label={headerLabel}
        value={headlineValue}
        format={format}
        delta={headerDelta}
        hovering={hovering}
        fadeKey={`${selectedId ?? ""}:${activeIndex}`}
        range={range}
        ranges={rangeList}
        rangeId={selectedId}
        onRangeChange={selectRange}
      />

      {/* Grid so the label column sizes to the longest stage name instead of
          truncating; each row is a `contents` wrapper carrying the hover. Rows
          are content-sized with a fixed 12px gap and the block sits centred,
          rather than stretching to fill the card. */}
      <div
        className="grid min-h-0 w-full flex-1 content-center items-center gap-x-3 gap-y-3 py-2"
        style={{
          gridTemplateColumns: "auto minmax(0, 1fr) auto",
          gridTemplateRows: `repeat(${n}, auto)`,
        }}
      >
        {stages.map((stage, i) => {
          const active = activeIndex === i;
          const share = Math.round((stage.value / top) * 100);
          const progressVal = stage.progress !== undefined ? stage.progress : share;
          const dim = hovering && !active;
          const fade = "transition-opacity duration-200 ease-out";
          const displayLabel = minimal && stage.shortLabel ? stage.shortLabel : stage.label;

          return (
            <div
              key={stage.label}
              className={cx("contents", onStageClick && "cursor-pointer")}
              onClick={onStageClick ? () => onStageClick(stage, i) : undefined}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className={cx("text-end font-semibold text-body-medium whitespace-nowrap text-text-secondary", fade)}
                style={{ opacity: dim ? DIM : 1 }}
                title={stage.label}
              >
                {displayLabel}
              </span>
              <div className="relative min-w-0 w-full flex items-center">
                <div
                  className={cx("relative h-5 min-w-0 w-full overflow-hidden rounded-full bg-chart-track", fade)}
                  style={{ opacity: dim ? DIM : 1 }}
                >
                  <div
                    className="absolute inset-y-0 start-0 rounded-full transition-[width,background-color] duration-500 ease-out"
                    style={{
                      width: mounted ? `${Math.min(100, Math.max(2, progressVal))}%` : 0,
                      backgroundColor: active ? tones[i].activeColor : tones[i].color,
                    }}
                  />
                  {showIcons && stage.icon && (
                    <span className="pointer-events-none absolute inset-y-0 start-1 flex items-center">
                      {stage.icon}
                    </span>
                  )}
                </div>

                {/* On-hover popup showing branch name, target, and achieved quantum */}
                {active && (
                  <div
                    className={cx(
                      "pointer-events-none absolute z-50 min-w-[210px] rounded-xl bg-background-primary-default p-3 border border-border-button-default shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col gap-2",
                      i === 0
                        ? "top-full mt-2.5 left-1/2 -translate-x-1/2"
                        : "bottom-full mb-2.5 left-1/2 -translate-x-1/2"
                    )}
                    style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.12))" }}
                  >
                    {/* Header: Branch Name + Color Dot + Short Code */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-border-button-default">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: tones[i].color }}
                        />
                        <span className="text-body-medium font-bold text-text-primary">
                          {stage.label}
                        </span>
                      </div>
                      {stage.shortLabel && (
                        <span className="text-caption-1-semibold px-1.5 py-0.5 rounded-md bg-background-secondary-default text-text-secondary border border-border-button-default">
                          {stage.shortLabel}
                        </span>
                      )}
                    </div>

                    {/* Target & Achieved Metrics */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-caption-1-medium text-text-secondary">
                        <span>Monthly Target:</span>
                        <span className="font-mono font-bold text-text-primary">
                          {stage.target !== undefined && stage.target > 0
                            ? format(stage.target)
                            : "No Target Set"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-caption-1-medium text-text-secondary">
                        <span>Achieved:</span>
                        <span className="font-mono font-bold text-status-lime-text">
                          {format(stage.achieved ?? stage.value)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="pt-1.5 border-t border-border-button-default flex items-center justify-between">
                      <span className="text-caption-2-medium text-text-tertiary uppercase tracking-wider font-semibold">
                        Achievement:
                      </span>
                      <span
                        className={cx(
                          "text-caption-1-semibold font-mono font-bold px-1.5 py-0.5 rounded",
                          progressVal >= 100
                            ? "bg-status-lime-surface text-status-lime-text border border-status-lime-border/40"
                            : "bg-background-secondary-default text-text-primary"
                        )}
                      >
                        {progressVal}%
                      </span>
                    </div>

                    {/* Arrow Indicator */}
                    {i === 0 ? (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-background-primary-default" />
                    ) : (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-background-primary-default" />
                    )}
                  </div>
                )}
              </div>
              <div
                className={cx("flex items-baseline justify-end gap-1.5 whitespace-nowrap min-w-[42px]", fade)}
                style={{ opacity: dim ? DIM : 1 }}
              >
                {minimal ? (
                  <span className="text-body-medium text-text-primary tabular-nums font-semibold">
                    {progressVal}%
                  </span>
                ) : (
                  <>
                    <span className="text-body-medium text-text-primary tabular-nums">{format(stage.value)}</span>
                    <span className="text-caption-1-medium text-text-tertiary tabular-nums">{progressVal}%</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stat tiles: swatch + name over value */}
      {shouldShowTiles && (
        <div className={cx("-mx-2 -mb-1 grid gap-2", stages.length === 4 ? "grid-cols-2" : stages.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {stages.map((stage, i) => {
            const active = activeIndex === i;
            const dim = hovering && !active;
            return (
              <div
                key={stage.label}
                className={cx(
                  "flex min-w-0 flex-col items-start gap-px rounded-2lg bg-background-inner-default px-2.5 py-2 transition-all duration-200 ease-out",
                  onStageClick && "cursor-pointer hover:bg-background-inner-hover"
                )}
                onClick={onStageClick ? () => onStageClick(stage, i) : undefined}
                style={{ opacity: dim ? 0.5 : 1 }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex min-w-0 max-w-full items-center gap-1.5">
                  {!mono && (
                    <span
                      className="size-3 shrink-0 rounded-[4px] transition-colors duration-150 ease-out"
                      style={{ backgroundColor: active ? tones[i].activeColor : tones[i].color }}
                    />
                  )}
                  <span className="truncate text-body-regular text-text-secondary">{stage.label}</span>
                </div>
                <span className="text-body-medium whitespace-nowrap text-text-primary tabular-nums">
                  {format(stage.value)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  ));
}
