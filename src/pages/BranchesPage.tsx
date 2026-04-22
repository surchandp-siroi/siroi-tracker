import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, Input } from '@/components/ui';
import { User, Mail } from 'lucide-react';
import { useMemo } from 'react';

export default function BranchesPage() {
  const { branches, entries } = useDataStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

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
      <header className="glass px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900">Branch Management</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">Daily Tracking Status</p>
      </header>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {branches.map(branch => {
          const achievement = branchStats[branch.id] || 0;
          const progressPct = branch.monthlyTarget > 0
            ? Math.min(100, (achievement / branch.monthlyTarget) * 100)
            : 0;
          const isAchieved = progressPct >= 100;

          return (
            <Card key={branch.id} className="border-slate-900/10 dark:border-white/10 flex flex-col">
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
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${
                  isAchieved
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
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

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Admin Fields */}
                <div className="space-y-3 mt-auto pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Expected Projection
                      </span>
                      {isAdmin && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider border border-amber-500/20">
                          Admin Only
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-slate-200 dark:border-white/10">
                      <span className="text-sm text-emerald-500 font-medium">₹</span>
                      <span className="text-sm font-mono text-slate-800 dark:text-slate-200">{branch.dailyProjection.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Daily Achievement
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider border border-sky-500/20">
                        Manager Input
                      </span>
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
