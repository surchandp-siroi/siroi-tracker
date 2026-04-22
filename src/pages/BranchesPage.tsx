import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent } from '@/components/ui';
import { User, Mail, Clock } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

/* ── Unique accent colour palette per branch ── */
const BRANCH_ACCENTS: Record<string, { border: string; badge: string; badgeText: string; bar: string; glow: string; dot: string }> = {
  'Guwahati':            { border: 'border-l-rose-500',    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',       bar: 'bg-rose-500',    glow: 'shadow-rose-500/10',    badgeText: 'text-rose-400', dot: 'bg-rose-500' },
  'Manipur':             { border: 'border-l-violet-500',  badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30', bar: 'bg-violet-500',  glow: 'shadow-violet-500/10',  badgeText: 'text-violet-400', dot: 'bg-violet-500' },
  'Itanagar':            { border: 'border-l-cyan-500',    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',       bar: 'bg-cyan-500',    glow: 'shadow-cyan-500/10',    badgeText: 'text-cyan-400', dot: 'bg-cyan-500' },
  'Nagaland & Mizoram':  { border: 'border-l-amber-500',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',   bar: 'bg-amber-500',   glow: 'shadow-amber-500/10',   badgeText: 'text-amber-400', dot: 'bg-amber-500' },
  'HO':                  { border: 'border-l-teal-500',    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30',       bar: 'bg-teal-500',    glow: 'shadow-teal-500/10',    badgeText: 'text-teal-400', dot: 'bg-teal-500' },
  'Test Branch':         { border: 'border-l-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500', glow: 'shadow-emerald-500/10', badgeText: 'text-emerald-400', dot: 'bg-emerald-500' },
};

const DEFAULT_ACCENT = { border: 'border-l-indigo-500', badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', bar: 'bg-indigo-500', glow: 'shadow-indigo-500/10', badgeText: 'text-indigo-400', dot: 'bg-indigo-500' };

/* ── IST Time Helpers ── */
function getISTDate(): Date {
  // Build IST from UTC offset +5:30
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5.5 * 3600000);
}

function getISTHoursMinutes(): { h: number; m: number } {
  const ist = getISTDate();
  return { h: ist.getHours(), m: ist.getMinutes() };
}

/** Projection window: before 11:00 AM IST */
function isProjectionWindowOpen(): boolean {
  const { h } = getISTHoursMinutes();
  return h < 11;
}

/** Achievement window: 4:30 PM – 6:00 PM IST (16:30 – 18:00) */
function isAchievementWindowOpen(): boolean {
  const { h, m } = getISTHoursMinutes();
  const minutesSinceMidnight = h * 60 + m;
  return minutesSinceMidnight >= 990 && minutesSinceMidnight < 1080; // 16:30=990, 18:00=1080
}

function formatTimeWindow(h1: number, m1: number, h2: number, m2: number): string {
  const fmt = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(h1, m1)} – ${fmt(h2, m2)} IST`;
}

export default function BranchesPage() {
  const { branches, entries } = useDataStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Live clock tick — re-check window every 30 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const projOpen = isProjectionWindowOpen();
  const achvOpen = isAchievementWindowOpen();

  // Compute daily achievement per branch from today's entries
  const branchStats = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(entry => {
      map[entry.branchId] = (map[entry.branchId] || 0) + entry.totalAmount;
    });
    return map;
  }, [entries]);

  return (
    <>
      {/* Header */}
      <header className="glass px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900">Branch Management</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">Daily Tracking Status</p>
        </div>
        {/* IST time-window indicators */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${projOpen ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
            <Clock size={11} />
            <span>Projection {projOpen ? 'Open' : 'Closed'}</span>
            <span className="opacity-60 normal-case tracking-normal font-medium">(Before 11:00 AM IST)</span>
          </div>
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${achvOpen ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
            <Clock size={11} />
            <span>Achievement {achvOpen ? 'Open' : 'Closed'}</span>
            <span className="opacity-60 normal-case tracking-normal font-medium">(4:30 – 6:00 PM IST)</span>
          </div>
        </div>
      </header>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {branches.map(branch => {
          const accent = BRANCH_ACCENTS[branch.name] || DEFAULT_ACCENT;
          const achievement = branchStats[branch.id] || 0;
          const progressPct = branch.monthlyTarget > 0
            ? Math.min(100, (achievement / branch.monthlyTarget) * 100)
            : 0;
          const isAchieved = progressPct >= 100;

          return (
            <Card key={branch.id} className={`border-slate-900/10 dark:border-white/10 flex flex-col border-l-[3px] ${accent.border} ${accent.glow} shadow-lg`}>
              {/* Branch Header */}
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{branch.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <User size={12} className="shrink-0" />
                    <span className="truncate">{branch.managerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate">{branch.managerEmail}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 border ${
                  isAchieved
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                    : accent.badge
                }`}>
                  {isAchieved ? 'Achieved' : 'In Progress'}
                </span>
              </div>

              <CardContent className="flex-1 flex flex-col gap-4 px-5 pb-5">
                {/* Revenue Stats */}
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                    ₹{achievement.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Proj: ₹{branch.dailyProjection.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Progress Bar — uses branch accent colour */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isAchieved ? 'bg-emerald-500' : accent.bar}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Admin Fields */}
                <div className="space-y-3 mt-auto pt-2">
                  {/* Expected Projection — editable before 11 AM IST */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${accent.badgeText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                        Expected Projection
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!projOpen && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold uppercase tracking-wider border border-red-500/20">
                            Locked after 11 AM
                          </span>
                        )}
                        {isAdmin && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${accent.badge}`}>
                            Admin Only
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-slate-200 dark:border-white/10">
                      <span className={`text-sm font-medium ${accent.badgeText}`}>₹</span>
                      <span className="text-sm font-mono text-slate-800 dark:text-slate-200">{branch.dailyProjection.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Daily Achievement — editable 4:30–6 PM IST */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Daily Achievement
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!achvOpen && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold uppercase tracking-wider border border-red-500/20">
                            4:30 – 6 PM only
                          </span>
                        )}
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider border border-sky-500/20">
                          Manager Input
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-slate-200 dark:border-white/10">
                      <span className="text-sm text-emerald-500 font-medium">₹</span>
                      <span className="text-sm font-mono text-slate-800 dark:text-slate-200">{achievement.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
