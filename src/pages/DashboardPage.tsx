import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { BranchSelect } from '@/components/BranchSelect';

const COLORS = ['#818cf8', '#34d399', '#38bdf8', '#fbbf24', '#f472b6']; // indigo-400, emerald-400, sky-400, amber-400, pink-400

const BRANCH_COLORS: Record<string, string> = {
  'Guwahati': '#818cf8',
  'Manipur': '#34d399',
  'Itanagar': '#38bdf8',
  'Nagaland & Mizoram': '#fbbf24'
};

const CATEGORY_COLORS: Record<string, { proj: string, ach: string, textDark: string }> = {
    'Loan': { proj: 'rgba(252, 165, 165, 0.3)', ach: '#fca5a5', textDark: '#991b1b' }, // red-300 / red-800
    'Insurance': { proj: 'rgba(110, 231, 183, 0.3)', ach: '#6ee7b7', textDark: '#065f46' }, // emerald-300 / emerald-800
    'Forex': { proj: 'rgba(125, 211, 252, 0.3)', ach: '#7dd3fc', textDark: '#075985' }, // sky-300 / sky-800
    'Consultancy': { proj: 'rgba(196, 181, 253, 0.3)', ach: '#c4b5fd', textDark: '#5b21b6' }, // violet-300 / violet-800
    'Investments': { proj: 'rgba(253, 224, 71, 0.3)', ach: '#fde047', textDark: '#854d0e' }, // yellow-300 / yellow-800
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const CustomizedAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const branchName = payload.value;
  const color = BRANCH_COLORS[branchName] || '#94a3b8';
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={12} r={4} fill={color} />
      <text x={0} y={16} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={500}>
        {branchName}
      </text>
    </g>
  );
};

const formatYAxis = (value: number) => {
    if (value === 0) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
    return `₹${value}`;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const validPayloads = payload.filter((p: any) => p.value > 0);
        if (validPayloads.length === 0) return null;
        return (
            <div className="bg-[#1e293b] border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-white font-bold mb-2 border-b border-white/10 pb-1">{label}</p>
                <div className="flex flex-col gap-1">
                    {validPayloads.map((p: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                            <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                                {p.name.replace('Proj.', 'Projection').replace('Ach.', 'Achievement')}:
                            </span>
                            <span className="text-white font-mono font-semibold">₹{Number(p.value).toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }: any) => {
  if (!percent) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  if (percent * 100 < 3) return null;
  
  const fontColor = CATEGORY_COLORS[name]?.textDark || '#0f172a';
  
  return (
    <text x={x} y={y} fill={fontColor} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="900">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardOverview() {
  const { products, channels, branches, entries, branchTargets, setBranchTarget } = useDataStore();
  const { user, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [viewMode, setViewMode] = useState<'daily' | 'month' | 'year'>('daily');
  const [selectedBusinessBranch, setSelectedBusinessBranch] = useState<string>('all');
  const [targetInputs, setTargetInputs] = useState<Record<string, string>>({});
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetMonthStr, setTargetMonthStr] = useState<string>(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showTargetLeaders, setShowTargetLeaders] = useState(false);
  const [overrideModal, setOverrideModal] = useState<{ isOpen: boolean, branchId: string, branchName: string, currentTarget: number } | null>(null);
  const [overrideAmount, setOverrideAmount] = useState<string>('');

  // Granular Tracking State
  const [granularLocation, setGranularLocation] = useState<string>('all');
  const [granularDate, setGranularDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Secure routing
  useEffect(() => {
     if (isInitialized) {
         if (!user) navigate('/login');
         else if (user.role !== 'admin') navigate('/entry');
     }
  }, [user, isInitialized, navigate]);

  // Financial Year Logic
  const dateObj = new Date(selectedDate);
  const selectedMonth = dateObj.getMonth();
  const selectedYear = dateObj.getFullYear();
  const isNewFY = selectedMonth >= 3;
  const fyStart = isNewFY ? selectedYear : selectedYear - 1;
  const fyEnd = (fyStart + 1).toString().slice(-2);
  const financialYear = `FY ${fyStart}-${fyEnd}`;
  
  const currentMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  
  const handleSaveTargets = async () => {
      setSavingTargets(true);
      const promises = Object.entries(targetInputs).map(([branchId, amountStr]) => {
          const amount = Number(amountStr);
          if (amount >= 0) {
              return setBranchTarget(branchId, targetMonthStr, amount, user?.id || '');
          }
          return Promise.resolve(false);
      });
      await Promise.all(promises);
      setSavingTargets(false);
      setTargetInputs({});
      
      // Let the user know the save was completed.
      if (promises.length > 0) {
          alert('Targets successfully lodged!');
      }
  };

  const handleOverrideTarget = async () => {
      if (!overrideModal) return;
      const amount = Number(overrideAmount.replace(/,/g, ''));
      if (amount >= 0) {
          setSavingTargets(true);
          const success = await setBranchTarget(overrideModal.branchId, targetMonthStr, amount, user?.id || '');
          setSavingTargets(false);
          if (success) {
              setOverrideModal(null);
              setOverrideAmount('');
              alert('Target successfully overridden!');
          } else {
              alert('Failed to override target. Please try again.');
          }
      }
  };

  // Filter entries based on the viewMode
  const filteredEntries = useMemo(() => {
     return entries.filter(entry => {
         const entryDateStr = entry.entryDate;
         if (viewMode === 'daily') {
             return entryDateStr === selectedDate;
         } else {
             const entryDate = new Date(entryDateStr);
             if (viewMode === 'month') {
                 return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
             } else {
                 // FY logic
                 const em = entryDate.getMonth();
                 const ey = entryDate.getFullYear();
                 const eIsNewFY = em >= 3;
                 const eFyStart = eIsNewFY ? ey : ey - 1;
                 return eFyStart === fyStart;
             }
         }
     });
  }, [entries, selectedDate, viewMode, selectedMonth, selectedYear, fyStart]);

  const { ftdBusiness, mtdBusiness, ytdBusiness, projectedTotalBusinessToday } = useMemo(() => {
     let ftd = 0, mtd = 0, ytd = 0, projToday = 0;
     const sd = new Date(selectedDate);
     const sdYear = sd.getFullYear();
     const sdMonth = sd.getMonth();
     
     const sdIsNewFY = sdMonth >= 3;
     const sdFyStart = sdIsNewFY ? sdYear : sdYear - 1;
     
     entries.forEach(entry => {
         const isProj = entry.recordType === 'projection';
         const isAch = !entry.recordType || entry.recordType === 'achievement';
         
         const entryProj = isProj ? entry.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) : 0;
         const entryAch = isAch ? entry.items.reduce((sum, i) => sum + (Number(i.disbursedAmount) || 0), 0) : 0;

         if (isProj && entry.entryDate === selectedDate) {
             projToday += entryProj;
         }

         const ed = new Date(entry.entryDate);
         const edYear = ed.getFullYear();
         const edMonth = ed.getMonth();
         const edIsNewFY = edMonth >= 3;
         const edFyStart = edIsNewFY ? edYear : edYear - 1;

         if (edFyStart === sdFyStart && ed <= sd) {
             ytd += entryAch;
             if (edMonth === sdMonth && edYear === sdYear) {
                 mtd += entryAch;
                 if (entry.entryDate === selectedDate) {
                     ftd += entryAch;
                 }
             }
         }
     });
     return { ftdBusiness: ftd, mtdBusiness: mtd, ytdBusiness: ytd, projectedTotalBusinessToday: projToday };
  }, [entries, selectedDate]);

  const { filteredBranches, totalBusiness, businessByCategory } = useMemo(() => {
     const branchMap = new Map();
     branches.forEach(b => {
         const initialCategories = CATEGORIES.reduce((acc, c) => {
             acc[`proj_${c}`] = 0;
             acc[`ach_${c}`] = 0;
             return acc;
         }, {} as any);

         branchMap.set(b.id, { 
             ...b, 
             dailyAchievement: 0,
             dailyProjection: 0,
             ...initialCategories
         });
     });

     let total = 0;
     const catMap = new Map();

     filteredEntries.forEach(entry => {
          const b = branchMap.get(entry.branchId);
          if (!b) return;

          const isProj = entry.recordType === 'projection';
          const isAch = !entry.recordType || entry.recordType === 'achievement';

          const entryProj = isProj ? entry.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) : 0;
          const entryAch = isAch ? entry.items.reduce((sum, i) => sum + (Number(i.disbursedAmount) || 0), 0) : 0;

          b.dailyAchievement += entryAch;
          b.dailyProjection += entryProj;
          total += entryAch;
          
          if (selectedBusinessBranch === 'all' || selectedBusinessBranch === b.id) {
              entry.items.forEach(item => {
                  if (isAch) {
                      catMap.set(item.category, (catMap.get(item.category) || 0) + (Number(item.disbursedAmount) || 0));
                      b[`ach_${item.category}`] = (b[`ach_${item.category}`] || 0) + (Number(item.disbursedAmount) || 0);
                  }
                  if (isProj) {
                      b[`proj_${item.category}`] = (b[`proj_${item.category}`] || 0) + (Number(item.amount) || 0);
                  }
              });
          }
     });

     const fb = Array.from(branchMap.values());
     const rbC = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

     return { filteredBranches: fb, totalBusiness: total, businessByCategory: rbC };
  }, [filteredEntries, branches, selectedBusinessBranch]);

  const loanFunnelData = useMemo(() => {
     let loggedCount = 0, loggedVal = 0;
     let sanctionedCount = 0, sanctionedVal = 0;
     let disbursedCount = 0, disbursedVal = 0;

     filteredEntries.forEach(entry => {
         if (selectedBusinessBranch !== 'all' && entry.branchId !== selectedBusinessBranch) return;

         const isAch = !entry.recordType || entry.recordType === 'achievement';
         if (!isAch) return;

         entry.items.forEach(item => {
             if (item.category === 'Loan') {
                 const amt = Number(item.amount) || 0;
                 const sanc = Number(item.sanctionedAmount) || 0;
                 const disb = Number(item.disbursedAmount) || 0;
                 const status = item.fileStatus || '';

                 loggedCount++;
                 loggedVal += amt;

                 if (sanc > 0 || disb > 0 || ['Sanctioned', 'Disbursed'].includes(status)) {
                     sanctionedCount++;
                     sanctionedVal += sanc > 0 ? sanc : amt;
                 }

                 if (disb > 0 || status === 'Disbursed') {
                     disbursedCount++;
                     disbursedVal += disb > 0 ? disb : (sanc > 0 ? sanc : amt);
                 }
             }
         });
     });

     const sancPct = loggedCount > 0 ? ((sanctionedCount / loggedCount) * 100).toFixed(1) : '0.0';
     const disbPct = sanctionedCount > 0 ? ((disbursedCount / sanctionedCount) * 100).toFixed(1) : '0.0';

     return {
         logged: { count: loggedCount, value: loggedVal },
         sanctioned: { count: sanctionedCount, value: sanctionedVal, conversion: sancPct },
         disbursed: { count: disbursedCount, value: disbursedVal, conversion: disbPct }
     };
  }, [filteredEntries, selectedBusinessBranch]);

  const activeCategories = useMemo(() => {
     return CATEGORIES.filter(c => 
         filteredBranches.some((b: any) => (b[`proj_${c}`] || 0) > 0 || (b[`ach_${c}`] || 0) > 0)
     );
  }, [filteredBranches]);

  const maxYValue = useMemo(() => {
     let max = 0;
     filteredBranches.forEach((b: any) => {
         let projSum = 0;
         let achSum = 0;
         CATEGORIES.forEach(c => {
             projSum += (b[`proj_${c}`] || 0);
             achSum += (b[`ach_${c}`] || 0);
         });
         max = Math.max(max, projSum, achSum);
     });
     return max > 0 ? max : 1000;
  }, [filteredBranches]);

  const renderCustomLegend = (props: any) => {
    return (
      <div className="flex flex-col gap-3 mt-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
        <div className="flex items-center gap-6 justify-center border-b border-slate-800/50 pb-2">
           <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-slate-700/50 border border-slate-500 border-dashed rounded-[2px]"></div>
              <span>Projection</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-slate-500 rounded-[2px]"></div>
              <span>Achievement</span>
           </div>
        </div>
        {activeCategories.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center px-2">
             {activeCategories.map(c => (
                 <div key={c} className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: CATEGORY_COLORS[c].ach }}></div>
                     <span className="text-[9px]">{c}</span>
                 </div>
             ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900">Financial Portal</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider border border-indigo-500/30">
              {financialYear}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-900/10 dark:bg-black/40 rounded-lg p-1 border border-slate-900/10 dark:border-white/10 shrink-0">
                <button 
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'daily' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >Daily</button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'month' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >Month Wise</button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'year' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >Year Wise</button>
            </div>
            
            <div className="flex items-center gap-3">
              <label 
                className="flex items-center gap-2 bg-white dark:bg-black text-slate-900 dark:text-white px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 focus-within:ring-2 ring-indigo-500/50 shadow-sm transition-all cursor-pointer"
                onClick={(e) => { const input = e.currentTarget.querySelector('input'); if(input && 'showPicker' in input) (input as any).showPicker(); }}
              >
                <Calendar className="w-5 h-5 text-indigo-400" />
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto h-auto p-0 border-none bg-transparent text-sm font-bold text-slate-900 dark:text-white dark:[color-scheme:dark] focus:ring-0 cursor-pointer"
                />
                <div className="hidden sm:flex flex-col items-start ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden lg:inline-block shrink-0">Select Date Tracker</span>
            </div>
          </div>
        </div>
        <div className="flex gap-6 sm:gap-8">
            <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase text-slate-600 dark:text-slate-400 font-semibold mb-0.5">Projected Total Business Today</span>
                <span className="text-lg font-mono tracking-tight text-slate-900 dark:text-white">₹{projectedTotalBusinessToday.toLocaleString('en-IN')}</span>
                <span className="text-[9px] text-slate-500 mt-0.5 font-mono">{selectedDate.split('-').reverse().join('-')}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Total Achievement Today</span>
                <span className="text-lg font-mono text-emerald-400 tracking-tight">₹{ftdBusiness.toLocaleString('en-IN')}</span>
                <span className="text-[9px] text-slate-500 mt-0.5 font-mono">{selectedDate.split('-').reverse().join('-')}</span>
            </div>
        </div>
      </header>

      {/* KPI Timeline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:dark:bg-white/5 bg-slate-900/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">FTD Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{ftdBusiness.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">For the day</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">MTD Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{mtdBusiness.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Month to date</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">YTD Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{ytdBusiness.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Year to date</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Daily Proj.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                ₹{filteredBranches.reduce((acc, b) => acc + b.dailyProjection, 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">All branches</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7 mb-6">
        {/* Branches Performance */}
        <Card className="lg:col-span-4 flex flex-col border-slate-900/10 dark:border-white/10 min-h-[450px]">
          <CardHeader className="flex justify-between items-center py-4 border-slate-900/10 dark:border-white/10 uppercase">
            <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-300">Branch Performance ({viewMode === 'daily' ? 'Daily' : viewMode === 'month' ? 'Monthly' : 'Yearly'})</span>
          </CardHeader>
          <CardContent className="flex-1 p-4 pb-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBranches} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barGap={4} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="name" tick={<CustomizedAxisTick />} axisLine={false} tickLine={false} />
                <YAxis 
                    domain={[0, Math.ceil(maxYValue * 1.1)]} 
                    tick={{fill: '#94a3b8', fontSize: 11}} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={formatYAxis} 
                    width={60}
                />
                <RechartsTooltip 
                    cursor={{fill: 'rgba(150,150,150,0.1)'}}
                    content={<CustomBarTooltip />}
                />
                
                {/* Custom Legend */}
                <Legend content={renderCustomLegend} verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />

                {/* Projection Stacks */}
                {activeCategories.map(c => (
                   <Bar key={`proj_${c}`} dataKey={`proj_${c}`} stackId="proj" name={`Proj. ${c}`} fill={CATEGORY_COLORS[c].proj} stroke={CATEGORY_COLORS[c].ach} strokeWidth={1} strokeDasharray="2 2" maxBarSize={50} />
                ))}

                {/* Achievement Stacks */}
                {activeCategories.map(c => (
                   <Bar key={`ach_${c}`} dataKey={`ach_${c}`} stackId="ach" name={`Ach. ${c}`} fill={CATEGORY_COLORS[c].ach} maxBarSize={50} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column: Mix */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Business Mix */}
            <Card className="flex flex-col border-slate-900/10 dark:border-white/10 flex-1 min-h-[300px]">
              <CardHeader className="py-4 border-b border-slate-900/10 dark:border-white/10 shrink-0 flex flex-row items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-300 uppercase">Business Mix</span>
                <div className="flex items-center gap-3">
                    <BranchSelect 
                        value={selectedBusinessBranch}
                        onChange={setSelectedBusinessBranch}
                        branches={branches}
                        includeAllOption={true}
                        allOptionText="All Branches"
                        className="w-[140px]"
                    />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex justify-center items-center p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={businessByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      labelLine={false}
                      isAnimationActive={false}
                      label={renderCustomizedPieLabel}
                    >
                      {businessByCategory.map((entry, index) => {
                        const color = CATEGORY_COLORS[entry.name]?.ach || '#94a3b8';
                        return <Cell key={`cell-${index}`} fill={color} />
                      })}
                    </Pie>
                    <RechartsTooltip 
                        formatter={(value: any) => `₹${Number(value || 0).toLocaleString('en-IN')}`}
                        contentStyle={{backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '8px'}}  
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 flex flex-wrap gap-4 justify-center mt-auto shrink-0 pt-4">
                  {businessByCategory.map((entry) => {
                      const color = CATEGORY_COLORS[entry.name]?.ach || '#94a3b8';
                      return (
                          <div key={entry.name} className="flex items-center text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                              <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: color }}></span>
                              {entry.name}
                          </div>
                      )
                  })}
              </div>
            </Card>
        </div>
      </div>

      {/* Funnel and Targets Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 w-full items-stretch">
        
        {/* Loan Conversion Pipeline */}
        <Card className="border-slate-900/10 dark:border-white/10 flex flex-col w-full lg:w-[68%]">
          <CardHeader className="py-4 border-b border-slate-900/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex flex-col gap-1.5">
                 <CardTitle className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-widest">Loan Conversion Pipeline</CardTitle>
                 <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                    <span className="flex items-center gap-1.5">
                        Timeframe: 
                        <div className="relative flex items-center ml-1">
                           <Input 
                             type="date" 
                             value={selectedDate}
                             onChange={(e) => setSelectedDate(e.target.value)}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           />
                           <span className="text-slate-700 dark:text-slate-300 pointer-events-none hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                              {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/(\d+)/, (match, p1) => {
                                 const d = parseInt(p1);
                                 const suffix = ["th", "st", "nd", "rd"][((d % 100) - 20) % 10] || ["th", "st", "nd", "rd"][d % 100] || "th";
                                 return p1 + suffix;
                              })}
                           </span>
                        </div>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
                    <span className="flex items-center gap-1.5">
                        Branch:
                        <BranchSelect 
                            value={selectedBusinessBranch}
                            onChange={setSelectedBusinessBranch}
                            branches={branches}
                            includeAllOption={true}
                            allOptionText="Consolidated"
                            className="w-[140px] ml-1"
                        />
                    </span>
                 </div>
             </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 overflow-x-auto flex items-center justify-center">
             <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-2">
                 
                 {/* Stage 1: Logged */}
                 <div className="w-full relative h-36 bg-amber-100 dark:bg-amber-500/20 flex flex-col items-center justify-center text-orange-700 dark:text-orange-400 shadow-lg transition-transform hover:scale-[1.01] rounded-[2.5rem] border border-amber-200 dark:border-amber-500/30">
                     <span className="text-[11px] font-bold uppercase tracking-widest text-orange-700/80 dark:text-orange-400/80 mb-1">Logged</span>
                     <span className="text-4xl font-mono font-bold tracking-tight">₹{loanFunnelData.logged.value.toLocaleString('en-IN')}</span>
                     <span className="text-[10px] font-semibold bg-orange-600/10 dark:bg-orange-400/20 px-3 py-1 rounded-full mt-2 backdrop-blur-sm text-orange-800 dark:text-orange-300">{loanFunnelData.logged.count} Applications</span>
                 </div>

                 {/* Conversion Arrow 1 */}
                 <div className="h-12 flex items-center justify-center relative w-full my-1">
                     <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800"></div>
                     <div className="absolute top-1/2 -translate-y-1/2 bg-white dark:bg-[#1e293b] px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Conversion</span>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{loanFunnelData.sanctioned.conversion}%</span>
                     </div>
                 </div>

                 {/* Stage 2: Sanctioned */}
                 <div className="w-[80%] relative h-36 bg-blue-100 dark:bg-blue-500/20 flex flex-col items-center justify-center text-blue-800 dark:text-blue-400 shadow-lg transition-transform hover:scale-[1.01] rounded-[2.5rem] border border-blue-200 dark:border-blue-500/30">
                     <span className="text-[11px] font-bold uppercase tracking-widest text-blue-800/80 dark:text-blue-400/80 mb-1">Sanctioned</span>
                     <span className="text-4xl font-mono font-bold tracking-tight">₹{loanFunnelData.sanctioned.value.toLocaleString('en-IN')}</span>
                     <span className="text-[10px] font-semibold bg-blue-600/10 dark:bg-blue-400/20 px-3 py-1 rounded-full mt-2 backdrop-blur-sm text-blue-900 dark:text-blue-300">{loanFunnelData.sanctioned.count} Approvals</span>
                 </div>

                 {/* Conversion Arrow 2 */}
                 <div className="h-12 flex items-center justify-center relative w-full my-1">
                     <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800"></div>
                     <div className="absolute top-1/2 -translate-y-1/2 bg-white dark:bg-[#1e293b] px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Conversion</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{loanFunnelData.disbursed.conversion}%</span>
                     </div>
                 </div>

                 {/* Stage 3: Disbursed */}
                 <div className="w-[60%] relative h-36 bg-emerald-100 dark:bg-emerald-500/20 flex flex-col items-center justify-center text-emerald-800 dark:text-emerald-400 shadow-lg transition-transform hover:scale-[1.01] rounded-[2.5rem] border border-emerald-200 dark:border-emerald-500/30">
                     <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800/80 dark:text-emerald-400/80 mb-1">Disbursed</span>
                     <span className="text-4xl font-mono font-bold tracking-tight">₹{loanFunnelData.disbursed.value.toLocaleString('en-IN')}</span>
                     <span className="text-[10px] font-semibold bg-emerald-600/10 dark:bg-emerald-400/20 px-3 py-1 rounded-full mt-2 backdrop-blur-sm text-emerald-900 dark:text-emerald-300">{loanFunnelData.disbursed.count} Funded</span>
                 </div>
             </div>
          </CardContent>
        </Card>

        {/* Monthly Targets */}
        <Card className="border-slate-900/10 dark:border-white/10 flex flex-col w-full lg:w-[32%] bg-slate-50 dark:bg-white/5 shadow-inner">
            <CardHeader className="py-4 border-b border-slate-900/10 dark:border-white/10 bg-white dark:bg-transparent">
                <div className="flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                       <CardTitle className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-widest">Branch Targets</CardTitle>
                       <button onClick={() => setShowTargetLeaders(!showTargetLeaders)} className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${showTargetLeaders ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                           {showTargetLeaders ? 'Show Targets' : 'Show Leaders'}
                       </button>
                   </div>
                   <div className="flex items-center">
                       <input 
                           type="month" 
                           value={targetMonthStr}
                           onChange={(e) => setTargetMonthStr(e.target.value)}
                           className="text-[11px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                       />
                   </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
                {(() => {
                    const [tYearStr, tMonthStr] = targetMonthStr.split('-');
                    const tYear = parseInt(tYearStr);
                    const tMonth = parseInt(tMonthStr) - 1;

                    let branchData = branches.filter(b => user?.role === 'admin' || b.id === user?.branchId).map(b => {
                        const targetAmt = branchTargets.find(t => t.branchId === b.id && t.monthYear === targetMonthStr)?.targetAmount || 0;
                        let achSum = 0;
                        entries.forEach(e => {
                            if (e.branchId !== b.id) return;
                            const isAch = !e.recordType || e.recordType === 'achievement';
                            if (!isAch) return;
                            const ed = new Date(e.entryDate);
                            if (ed.getMonth() === tMonth && ed.getFullYear() === tYear) {
                                e.items.forEach(i => { achSum += (Number(i.disbursedAmount) || 0) });
                            }
                        });
                        const progress = targetAmt > 0 ? (achSum / targetAmt) * 100 : (achSum > 0 ? 100 : 0);
                        const isAchieved = progress >= 100 && targetAmt > 0;
                        return { ...b, targetAmt, achSum, progress, isAchieved };
                    });

                    if (showTargetLeaders) {
                        branchData = branchData.sort((a, b) => b.achSum - a.achSum);
                    }

                    return branchData.map((b, index) => {
                        const branchColors: Record<string, {text: string, bg: string, bar: string}> = {
                            'Guwahati': { text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20', bar: 'bg-purple-500' },
                            'Manipur': { text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20', bar: 'bg-rose-500' },
                            'Itanagar': { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', bar: 'bg-amber-500' },
                            'Nagaland & Mizoram': { text: 'text-cyan-700 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20', bar: 'bg-cyan-500' }
                        };
                        const colorObj = branchColors[b.name] || { text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20', bar: 'bg-indigo-500' };

                        return (
                            <div key={b.id} className={`flex flex-col justify-center gap-2 p-5 rounded-xl border shadow-sm relative overflow-hidden min-h-[110px] ${colorObj.bg}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {showTargetLeaders && (
                                            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
                                                #{index + 1}
                                            </div>
                                        )}
                                        <span className={`text-[13px] md:text-sm font-bold uppercase tracking-wider ${colorObj.text}`}>{b.name}</span>
                                    </div>
                                    {!showTargetLeaders && user?.role === 'admin' ? (
                                        <div className="flex items-center gap-1.5 z-10">
                                            <span className="text-xs text-slate-500 font-bold">₹</span>
                                            <Input 
                                                type="text" 
                                                value={targetInputs[b.id] !== undefined ? (targetInputs[b.id] ? Number(targetInputs[b.id]).toLocaleString('en-IN') : '') : (b.targetAmt ? b.targetAmt.toLocaleString('en-IN') : '')}
                                                readOnly={b.targetAmt > 0}
                                                onClick={() => {
                                                    if (b.targetAmt > 0) {
                                                        setOverrideModal({ isOpen: true, branchId: b.id, branchName: b.name, currentTarget: b.targetAmt });
                                                        setOverrideAmount(b.targetAmt.toString());
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    if (b.targetAmt > 0) return;
                                                    const rawValue = e.target.value.replace(/,/g, '');
                                                    if (rawValue === '') {
                                                        setTargetInputs(prev => ({...prev, [b.id]: ''}));
                                                    } else if (!isNaN(Number(rawValue))) {
                                                        setTargetInputs(prev => ({...prev, [b.id]: rawValue}));
                                                    }
                                                }}
                                                className={`h-8 w-28 px-2 py-1 text-xs text-right font-mono font-bold border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 ${b.targetAmt > 0 ? 'bg-slate-100 dark:bg-slate-800/50 cursor-pointer text-emerald-600 dark:text-emerald-400' : 'bg-white/50 dark:bg-black/20'}`}
                                                placeholder="Target"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{b.targetAmt.toLocaleString('en-IN')}</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs mt-2 relative z-10">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">Achieved: <span className="font-mono text-slate-900 dark:text-white font-bold ml-1">₹{b.achSum.toLocaleString('en-IN')}</span></span>
                                    <div className="flex items-center gap-2">
                                        {b.targetAmt > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${b.progress >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                                {Math.abs(b.progress - 100) < 0.1 ? 'On Target' : b.progress > 100 ? `+${(b.progress - 100).toFixed(1)}%` : `-${(100 - b.progress).toFixed(1)}%`}
                                            </span>
                                        )}
                                        <span className={`font-bold ${colorObj.text}`}>{b.progress.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden mt-1.5 relative z-10">
                                    <div className={`h-full rounded-full transition-all duration-500 ${b.isAchieved ? 'bg-emerald-500' : colorObj.bar}`} style={{ width: `${Math.min(100, b.progress)}%` }}></div>
                                </div>
                            </div>
                        );
                    });
                })()}
            </CardContent>
            {user?.role === 'admin' && (
                <div className="p-4 border-t border-slate-900/10 dark:border-white/10 bg-white dark:bg-transparent">
                    <button 
                        onClick={handleSaveTargets}
                        disabled={savingTargets}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] uppercase tracking-widest font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        {savingTargets ? 'Saving...' : 'Lodge Targets'}
                    </button>
                </div>
            )}
        </Card>
      </div>

      <hr className="my-10 border-slate-900/10 dark:border-white/10" />

      <div className="flex flex-col gap-6">
      <Card className="p-6 border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">Granular Tracking</h2>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Deeper insights</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                  <BranchSelect 
                      value={granularLocation}
                      onChange={setGranularLocation}
                      branches={branches}
                      includeAllOption={true}
                      allOptionText="All Locations"
                      className="w-[160px]"
                  />
                  <label 
                      className="flex items-center gap-2 bg-white dark:bg-black text-slate-900 dark:text-white px-3 h-10 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 focus-within:ring-2 ring-indigo-500/50 shadow-sm transition-all cursor-pointer"
                      onClick={(e) => { const input = e.currentTarget.querySelector('input'); if(input && 'showPicker' in input) (input as any).showPicker(); }}
                  >
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <Input 
                          type="date" 
                          value={granularDate}
                          onChange={(e) => setGranularDate(e.target.value)}
                          className="w-auto h-auto p-0 border-none bg-transparent text-sm font-bold text-slate-900 dark:text-white dark:[color-scheme:dark] focus:ring-0 cursor-pointer"
                      />
                  </label>
              </div>
          </div>
      </Card>
      
      {/* Placeholder for Granular Tracking content */}
      <Card className="border-slate-900/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 shadow-inner min-h-[300px] flex items-center justify-center">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase">Select parameters to view granular data</span>
      </Card>
      </div>

      {overrideModal && overrideModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Override Target</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Targets for <span className="font-bold text-slate-700 dark:text-slate-300">{overrideModal.branchName}</span> are already set for <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(targetMonthStr + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</span> at <span className="font-mono font-bold">₹{overrideModal.currentTarget.toLocaleString('en-IN')}</span>.
                  </p>
                  <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">New Target Figure</label>
                      <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                          <Input 
                              type="text"
                              value={overrideAmount ? Number(overrideAmount.replace(/,/g, '')).toLocaleString('en-IN') : ''}
                              onChange={(e) => {
                                  const raw = e.target.value.replace(/,/g, '');
                                  if (raw === '' || !isNaN(Number(raw))) {
                                      setOverrideAmount(raw);
                                  }
                              }}
                              className="pl-7 font-mono font-bold h-10 w-full"
                              placeholder="Enter new target"
                          />
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setOverrideModal(null)}
                          className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleOverrideTarget}
                          disabled={savingTargets || !overrideAmount || Number(overrideAmount) <= 0}
                          className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                          {savingTargets ? 'Saving...' : 'Override Target'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}
