import { useDataStore } from '@/store/useDataStore';
import { useAuthStore, BRANCH_ACCOUNTS } from '@/store/useAuthStore';
import { Card, CardContent } from '@/components/ui';
import { User, Mail, Clock, MapPin, Target, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

/* ── Unique accent colour palette per branch ── */
const BRANCH_ACCENTS: Record<string, { border: string; badge: string; badgeText: string; bar: string; glow: string; dot: string; bgGradient: string }> = {
  'Guwahati': { 
    border: 'border-rose-500/30', 
    badge: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30', 
    bar: 'bg-rose-500', 
    glow: 'shadow-rose-500/10', 
    badgeText: 'text-rose-500 dark:text-rose-400', 
    dot: 'bg-rose-500',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent'
  },
  'Manipur': { 
    border: 'border-violet-500/30', 
    badge: 'bg-violet-500/15 text-violet-500 dark:text-violet-400 border-violet-500/30', 
    bar: 'bg-violet-500', 
    glow: 'shadow-violet-500/10', 
    badgeText: 'text-violet-500 dark:text-violet-400', 
    dot: 'bg-violet-500',
    bgGradient: 'from-violet-500/10 via-violet-500/5 to-transparent'
  },
  'Itanagar': { 
    border: 'border-cyan-500/30', 
    badge: 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border-cyan-500/30', 
    bar: 'bg-cyan-500', 
    glow: 'shadow-cyan-500/10', 
    badgeText: 'text-cyan-500 dark:text-cyan-400', 
    dot: 'bg-cyan-500',
    bgGradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent'
  },
  'Nagaland & Mizoram': { 
    border: 'border-amber-500/30', 
    badge: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30', 
    bar: 'bg-amber-500', 
    glow: 'shadow-amber-500/10', 
    badgeText: 'text-amber-500 dark:text-amber-400', 
    dot: 'bg-amber-500',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent'
  },
  'HO': { 
    border: 'border-teal-500/30', 
    badge: 'bg-teal-500/15 text-teal-500 dark:text-teal-400 border-teal-500/30', 
    bar: 'bg-teal-500', 
    glow: 'shadow-teal-500/10', 
    badgeText: 'text-teal-500 dark:text-teal-400', 
    dot: 'bg-teal-500',
    bgGradient: 'from-teal-500/10 via-teal-500/5 to-transparent'
  },
  'Test Branch': { 
    border: 'border-emerald-500/30', 
    badge: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30', 
    bar: 'bg-emerald-500', 
    glow: 'shadow-emerald-500/10', 
    badgeText: 'text-emerald-500 dark:text-emerald-400', 
    dot: 'bg-emerald-500',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent'
  },
};

const DEFAULT_ACCENT = { 
  border: 'border-indigo-500/30', 
  badge: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border-indigo-500/30', 
  bar: 'bg-indigo-500', 
  glow: 'shadow-indigo-500/10', 
  badgeText: 'text-indigo-500 dark:text-indigo-400', 
  dot: 'bg-indigo-500',
  bgGradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent'
};

/* ── IST Time Helpers ── */
function getISTDate(): Date {
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
  return minutesSinceMidnight >= 990 && minutesSinceMidnight < 1080;
}

export default function BranchesPage() {
  const { branches, entries } = useDataStore();
  const { user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  
  const managerBranchAccount = user?.email ? BRANCH_ACCOUNTS[user.email.toLowerCase()] : null;
  const managerBranchId = user?.branchId || managerBranchAccount?.branchId || '';

  // Filter branches strictly for branch managers
  const visibleBranches = useMemo(() => {
    if (isManager && managerBranchId) {
      const matched = branches.filter(b => b.id === managerBranchId);
      if (matched.length > 0) return matched;
      if (managerBranchAccount?.branchName) {
        const byName = branches.filter(b => b.name.toLowerCase() === managerBranchAccount.branchName.toLowerCase());
        if (byName.length > 0) return byName;
      }
    }
    return branches;
  }, [branches, isManager, managerBranchId, managerBranchAccount]);

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
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
      {/* Header with Double-Bezel Island Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-[2rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Sparkles className="w-3 h-3" />
              {isManager ? 'Branch Operations Terminal' : 'Global Operations Network'}
            </span>
            {isManager && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-2.5 h-2.5" /> Single-Branch View
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {isManager ? `${visibleBranches[0]?.name || 'Branch'} Management` : 'Branch Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isManager 
              ? `Operational metrics and daily submission tracking for ${visibleBranches[0]?.name || 'your assigned location'}.` 
              : 'Real-time performance metrics and submission windows across all authorized regional branches.'}
          </p>
        </div>

        {/* IST time-window indicators with nested pill styling */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border transition-all ${
            projOpen 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs shadow-emerald-500/10' 
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5'
          }`}>
            <Clock size={12} className={projOpen ? 'text-emerald-500' : 'text-slate-400'} />
            <span>Projection {projOpen ? 'Open' : 'Closed'}</span>
            <span className="opacity-60 normal-case tracking-normal font-medium">(Before 11 AM)</span>
          </div>

          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border transition-all ${
            achvOpen 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs shadow-emerald-500/10' 
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5'
          }`}>
            <Clock size={12} className={achvOpen ? 'text-emerald-500' : 'text-slate-400'} />
            <span>Achievement {achvOpen ? 'Open' : 'Closed'}</span>
            <span className="opacity-60 normal-case tracking-normal font-medium">(4:30 – 6 PM)</span>
          </div>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className={`grid grid-cols-1 ${visibleBranches.length === 1 ? 'md:grid-cols-1 max-w-2xl' : 'md:grid-cols-2 xl:grid-cols-3'} gap-6`}>
        {visibleBranches.map(branch => {
          const accent = BRANCH_ACCENTS[branch.name] || DEFAULT_ACCENT;
          const achievement = branchStats[branch.id] || 0;
          const progressPct = branch.monthlyTarget > 0
            ? Math.min(100, (achievement / branch.monthlyTarget) * 100)
            : 0;
          const isAchieved = progressPct >= 100;

          return (
            <div 
              key={branch.id} 
              className={`p-1 rounded-[2rem] bg-gradient-to-b ${accent.bgGradient} border ${accent.border} ${accent.glow} shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="p-6 rounded-[calc(2rem-0.25rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/60 dark:border-white/5 flex flex-col justify-between h-full">
                
                {/* Branch Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                        <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{branch.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <User size={13} className="shrink-0 text-slate-400" />
                        <span className="font-semibold truncate">{branch.managerName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Mail size={13} className="shrink-0 text-slate-400" />
                        <span className="font-mono truncate">{branch.managerEmail}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shrink-0 border ${
                      isAchieved
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs'
                        : accent.badge
                    }`}>
                      {isAchieved ? 'Target Achieved' : 'In Progress'}
                    </span>
                  </div>

                  {/* Business Stats Shelf */}
                  <div className="py-5 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 block">
                          Current Month Gross
                        </span>
                        <span className="text-3xl font-mono font-black tracking-tight text-slate-900 dark:text-white mt-0.5 block">
                          ₹{achievement.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 block">
                          Monthly Target
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                          ₹{(branch.monthlyTarget || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with Glow */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">Target Completion</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{progressPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isAchieved ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : accent.bar}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Targets & Windows */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  {/* Expected Projection Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${accent.badgeText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                        Expected Daily Projection
                      </span>
                      <div className="flex items-center gap-1">
                        {!projOpen && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider border border-amber-500/20">
                            Locked
                          </span>
                        )}
                        {isAdmin && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${accent.badge}`}>
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-base font-bold ${accent.badgeText}`}>₹</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                        {branch.dailyProjection.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Daily Achievement Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Daily Achievement Input
                      </span>
                      <div className="flex items-center gap-1">
                        {!achvOpen && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider border border-amber-500/20">
                            Window 4:30-6 PM
                          </span>
                        )}
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider border border-sky-500/20">
                          Manager
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-base font-bold text-emerald-500">₹</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                        {achievement.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

