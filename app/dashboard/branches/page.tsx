'use client';

import { useDataStore } from '@/store/useDataStore';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { User, ShieldAlert, BadgeCheck } from 'lucide-react';

export default function BranchesPage() {
  const { branches } = useDataStore();

  return (
    <>
      <header className="glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Branch Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Daily tracking status</p>
        </div>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {branches.map((branch, index) => {
              const achievementPercentage = Math.min(100, Math.round((branch.dailyAchievement / (branch.dailyProjection || 1)) * 100)) || 0;
              const isAchieved = achievementPercentage >= 100;

              const bgColors = ['bg-indigo-500 border border-indigo-200 dark:border-none', 'bg-emerald-500 border border-emerald-200 dark:border-none', 'bg-amber-500 border border-amber-200 dark:border-none', 'bg-sky-500 border border-sky-200 dark:border-none'];

              return (
                <Card key={branch.id} className="overflow-visible relative glass border-slate-900/10 dark:border-white/10">
                    <CardHeader className="border-b border-slate-900/10 dark:border-white/5 pb-3">
                        <CardTitle className="text-sm font-semibold flex justify-between items-start w-full">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-slate-900 dark:text-white">{branch.name}</span>
                                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 font-normal mt-1">
                                    <User size={12} className="mr-1.5 opacity-70" />
                                    <span>{branch.managerName}</span>
                                </div>
                                <span className="text-[10px] text-slate-500">{branch.managerEmail}</span>
                            </div>
                            {isAchieved ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider shrink-0 border border-emerald-500/30">Achieved</span>
                            ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider shrink-0 border border-sky-500/30">In Progress</span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-mono text-slate-900 dark:text-white">₹{branch.dailyAchievement.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Proj: ₹{branch.dailyProjection.toLocaleString()}</span>
                        </div>

                        <div className="w-full bg-slate-900/5 dark:bg-white/5 h-2 mt-3 rounded-full overflow-hidden">
                            <div className={`${bgColors[index % 4]} h-2 rounded-full`} style={{ width: `${achievementPercentage}%` }}></div>
                        </div>

                        <div className="pt-4 border-t border-slate-900/10 dark:border-white/5 space-y-5">
                            {/* Admin Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
                                       <ShieldAlert size={12} className="mr-1 text-amber-600 dark:text-amber-500" />
                                       Expected Projection
                                    </label>
                                    <span className="text-[9px] text-amber-600 dark:text-amber-500/80 uppercase tracking-widest border border-amber-500/30 px-1.5 rounded bg-amber-500/10 dark:bg-transparent">Admin Only</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-500 font-medium">₹</span>
                                    <Input 
                                        className="pl-8 bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20 focus:ring-amber-500/50 text-slate-900 dark:text-white" 
                                        type="number" 
                                        readOnly
                                        value={branch.dailyProjection === 0 ? '' : branch.dailyProjection} 
                                    />
                                </div>
                            </div>

                            {/* Manager Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
                                       <BadgeCheck size={12} className="mr-1 text-emerald-600 dark:text-emerald-500" />
                                       Daily Achievement
                                    </label>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest border border-emerald-500/30 px-1.5 rounded bg-emerald-500/10 dark:bg-transparent">Manager Input</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-500 font-medium">₹</span>
                                    <Input 
                                        className="pl-8 bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 focus:ring-emerald-500/50 text-slate-900 dark:text-white" 
                                        type="number" 
                                        readOnly
                                        value={branch.dailyAchievement === 0 ? '' : branch.dailyAchievement} 
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              )
          })}
      </div>
    </>
  );
}
