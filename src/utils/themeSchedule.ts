export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "boardui:theme";
export const THEME_CHANGE_EVENT = "boardui:theme-change";
export const MANUAL_OVERRIDE_KEY = "theme_manual_override";
export const MANUAL_OVERRIDE_TIME_KEY = "theme_manual_override_time";

/**
 * Returns a Date object adjusted to Indian Standard Time (IST: UTC + 5:30).
 */
export function getISTDate(date: Date = new Date()): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utcMs + 330 * 60000);
}

/**
 * Determines scheduled theme according to IST hours:
 * 17:00 (5:00 PM) to 06:00 (6:00 AM) IST => "dark"
 * 06:00 (6:00 AM) to 17:00 (5:00 PM) IST => "light"
 */
export function getScheduledTheme(date: Date = new Date()): ThemeMode {
  const ist = getISTDate(date);
  const hours = ist.getHours();
  return hours >= 17 || hours < 6 ? "dark" : "light";
}

/**
 * Converts IST date components to UTC epoch milliseconds.
 */
function istComponentsToEpoch(year: number, month: number, day: number, hour: number): number {
  return Date.UTC(year, month, day, hour, 0, 0, 0) - 330 * 60000;
}

/**
 * Returns UTC epoch milliseconds of the most recent transition (06:00 or 17:00 IST).
 */
export function getLastTransitionTimestamp(now: Date = new Date()): { timestamp: number; theme: ThemeMode } {
  const ist = getISTDate(now);
  const y = ist.getFullYear();
  const m = ist.getMonth();
  const d = ist.getDate();
  const h = ist.getHours();

  if (h >= 17) {
    return { timestamp: istComponentsToEpoch(y, m, d, 17), theme: "dark" };
  } else if (h >= 6) {
    return { timestamp: istComponentsToEpoch(y, m, d, 6), theme: "light" };
  } else {
    // Before 06:00 AM today, the last transition was yesterday at 17:00 IST
    const yesterday = new Date(ist.getTime() - 24 * 3600 * 1000);
    return {
      timestamp: istComponentsToEpoch(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 17),
      theme: "dark",
    };
  }
}

/**
 * Returns UTC epoch milliseconds and delay of the next upcoming transition (06:00 or 17:00 IST).
 */
export function getNextTransitionTimestamp(now: Date = new Date()): {
  timestamp: number;
  theme: ThemeMode;
  msUntilNext: number;
} {
  const ist = getISTDate(now);
  const y = ist.getFullYear();
  const m = ist.getMonth();
  const d = ist.getDate();
  const h = ist.getHours();

  let targetTimestamp = 0;
  let nextTheme: ThemeMode = "light";

  if (h < 6) {
    // Today at 06:00 IST
    targetTimestamp = istComponentsToEpoch(y, m, d, 6);
    nextTheme = "light";
  } else if (h < 17) {
    // Today at 17:00 IST
    targetTimestamp = istComponentsToEpoch(y, m, d, 17);
    nextTheme = "dark";
  } else {
    // Tomorrow at 06:00 IST
    const tomorrow = new Date(ist.getTime() + 24 * 3600 * 1000);
    targetTimestamp = istComponentsToEpoch(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 6);
    nextTheme = "light";
  }

  const msUntilNext = Math.max(1000, targetTimestamp - now.getTime());
  return { timestamp: targetTimestamp, theme: nextTheme, msUntilNext };
}

/**
 * Evaluates the effective theme:
 * Checks whether user has an active manual override created after the last transition.
 * If yes, honors the manual override.
 * Otherwise, returns the scheduled theme.
 */
export function getEffectiveTheme(now: Date = new Date()): ThemeMode {
  if (typeof window === "undefined") return "light";

  try {
    const manual = window.localStorage.getItem(MANUAL_OVERRIDE_KEY);
    const manualTimeStr = window.localStorage.getItem(MANUAL_OVERRIDE_TIME_KEY);

    if (manual === "light" || manual === "dark") {
      const manualTime = parseInt(manualTimeStr || "0", 10);
      const lastTransition = getLastTransitionTimestamp(now);

      // If manual choice happened after the last scheduled transition, honor it
      if (manualTime > lastTransition.timestamp) {
        return manual;
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }

  return getScheduledTheme(now);
}

/**
 * Records a manual theme override.
 */
export function recordManualOverride(theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MANUAL_OVERRIDE_KEY, theme);
    window.localStorage.setItem(MANUAL_OVERRIDE_TIME_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clears manual theme override (used when auto-transition occurs).
 */
export function clearManualOverride(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MANUAL_OVERRIDE_KEY);
    window.localStorage.removeItem(MANUAL_OVERRIDE_TIME_KEY);
  } catch {
    // Ignore storage errors
  }
}
