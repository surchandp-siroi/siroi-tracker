import React, { useState, useMemo } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';

interface ExecutivePerformanceWidgetProps {
    dateStr?: string;
    branchId?: string | null;
    mode?: 'daily' | 'monthly';
}

export function ExecutivePerformanceWidget({ dateStr, branchId, mode }: ExecutivePerformanceWidgetProps) {
    const { entries, branchTargets, branches } = useDataStore();
    const [timeContext, setTimeContext] = useState<'MTD' | 'YTD'>('MTD');

    const { target, logged, achieved, gap, percentage, displayMonth, branchLabel } = useMemo(() => {
        const selectedMonth = dateStr ? dateStr.substring(0, 7) : new Date().toISOString().substring(0, 7);
        const selectedYear = selectedMonth.substring(0, 4);

        // Compute display label
        const dateObj = new Date(selectedMonth + '-01T00:00:00');
        const monthName = dateObj.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        
        const branch = branchId ? branches.find(b => b.id === branchId) : null;
        const branchLabel = branch ? branch.name : 'Global';

        let targetAmt = 0;
        branchTargets.forEach(bt => {
            if (branchId && bt.branchId !== branchId) return;
            
            if (timeContext === 'MTD') {
                if (bt.monthYear === selectedMonth) {
                    targetAmt += bt.targetAmount || 0;
                }
            } else {
                if (bt.monthYear.startsWith(selectedYear) && bt.monthYear <= selectedMonth) {
                    targetAmt += bt.targetAmount || 0;
                }
            }
        });

        let loggedAmt = 0;
        let achievedAmt = 0;

        entries.forEach(entry => {
            if (branchId && entry.branchId !== branchId) return;

            // We only want achievements for the metrics
            const isAch = !entry.recordType || entry.recordType === 'achievement';
            if (!isAch) return;

            // Filter by mode if provided
            if (mode && entry.mode !== mode) return;

            let includeEntry = false;
            if (timeContext === 'MTD') {
                includeEntry = entry.entryDate.startsWith(selectedMonth);
            } else {
                const entryMonth = entry.entryDate.substring(0, 7);
                includeEntry = entryMonth.startsWith(selectedYear) && entryMonth <= selectedMonth;
            }

            if (includeEntry) {
                entry.items.forEach(item => {
                    const amt = Number(item.amount) || 0;
                    const disb = Number(item.disbursedAmount) || 0;
                    
                    if (item.category === 'Loan') {
                        loggedAmt += amt;
                        achievedAmt += disb;
                    } else if (item.category === 'Insurance') {
                        if (item.fileStatus === 'Issued') {
                            achievedAmt += amt;
                        } else {
                            loggedAmt += amt;
                        }
                    } else if (item.category === 'Investments' || item.category === 'Forex' || item.category === 'Consultancy') {
                        loggedAmt += amt;
                        achievedAmt += amt; // For these, login amount is taken as achievement
                    } else {
                        loggedAmt += amt;
                        achievedAmt += disb > 0 ? disb : amt;
                    }
                });
            }
        });

        const targetGap = Math.max(0, targetAmt - achievedAmt);

        let pct = 0;
        if (targetAmt > 0) {
            pct = (achievedAmt / targetAmt) * 100;
        } else if (loggedAmt > 0) {
             // Fallback if no target set
            pct = (achievedAmt / loggedAmt) * 100;
        }

        return { 
            target: targetAmt, 
            logged: loggedAmt, 
            achieved: achievedAmt, 
            gap: targetGap, 
            percentage: pct,
            displayMonth: monthName,
            branchLabel
        };
    }, [entries, branchTargets, branches, dateStr, timeContext, branchId, mode]);

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    return (
        <div className="w-full mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-xl p-6 group">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                
                {/* Left section: Title and overall progress */}
                <div className="flex-1 w-full lg:min-w-[320px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{branchLabel} • {displayMonth} Overview</h2>
                        </div>
                        {/* MTD / YTD Toggle */}
                        <div className="flex bg-slate-900/50 backdrop-blur-sm rounded-lg p-0.5 border border-slate-700/50 shadow-inner">
                            <button 
                                className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest transition-colors ${timeContext === 'MTD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                onClick={() => setTimeContext('MTD')}
                            >
                                MTD
                            </button>
                            <button 
                                className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest transition-colors ${timeContext === 'YTD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                onClick={() => setTimeContext('YTD')}
                            >
                                YTD
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-3 mb-4">
                        <span className="text-3xl font-black text-white tracking-tight font-mono">{percentage.toFixed(1)}%</span>
                        <span className="text-[10px] font-semibold text-emerald-400 mb-1.5 uppercase tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{target > 0 ? 'Achieved vs Target' : 'Achieved vs Logged'}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-950/50 rounded-full overflow-hidden border border-slate-800/50 relative shadow-inner">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                        </div>
                    </div>
                </div>

                {/* Right section: Metric cards */}
                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto shrink-0 justify-end">
                    
                    {/* Target Card */}
                    <div className="flex-1 lg:w-36 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800/80 transition-colors shadow-inner">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1 rounded bg-indigo-500/20 border border-indigo-500/30">
                                <Target className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Target</span>
                        </div>
                        <div className="text-xl font-bold text-white font-mono tracking-tight">{formatCurrency(target)}</div>
                    </div>

                    {/* Achieved Card */}
                    <div className="flex-1 lg:w-36 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800/80 transition-colors shadow-inner">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1 rounded bg-emerald-500/20 border border-emerald-500/30">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Achieved</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-400 font-mono tracking-tight">{formatCurrency(achieved)}</div>
                    </div>
                    
                    {/* Gap Card */}
                    <div className="flex-1 lg:w-36 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800/80 transition-colors shadow-inner">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1 rounded bg-amber-500/20 border border-amber-500/30">
                                <Target className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Target Gap</span>
                        </div>
                        <div className="text-xl font-bold text-amber-400 font-mono tracking-tight">{formatCurrency(gap)}</div>
                    </div>

                    {/* Logged/Pipeline Card */}
                    <div className="flex-1 lg:w-36 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800/80 transition-colors shadow-inner">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1 rounded bg-sky-500/20 border border-sky-500/30">
                                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logged Pipeline</span>
                        </div>
                        <div className="text-xl font-bold text-white font-mono tracking-tight">{formatCurrency(logged)}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
