import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

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
  const { products, channels, branches, entries } = useDataStore();
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
  const [showLoanModal, setShowLoanModal] = useState(false);

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

      <div className="grid gap-6 lg:grid-cols-7 flex-1 pb-8">
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
                    <button onClick={() => setShowLoanModal(true)} className="px-2 py-1 text-[9px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 transition-colors rounded uppercase font-bold tracking-widest">
                      Loan Funnel
                    </button>
                    <select 
                        value={selectedBusinessBranch}
                        onChange={(e) => setSelectedBusinessBranch(e.target.value)}
                        className="text-[10px] bg-transparent dark:bg-[#0f172a] border border-slate-900/10 dark:border-white/10 rounded px-2 py-1 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-bold cursor-pointer"
                    >
                        <option value="all" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200">All Branches</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id} className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200">{b.name}</option>
                        ))}
                    </select>
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

      {/* Loan Deep-Dive Modal */}
      {showLoanModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
               {/* Modal Header */}
               <div className="px-6 py-4 bg-white dark:bg-black/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex flex-col">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-widest">Loan Conversion Pipeline</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Timeframe: {viewMode} • Branch: {selectedBusinessBranch === 'all' ? 'Consolidated' : branches.find(b => b.id === selectedBusinessBranch)?.name}</p>
                  </div>
                  <button onClick={() => setShowLoanModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                  </button>
               </div>
               {/* Modal Body with Funnel */}
               <div className="p-8 overflow-y-auto flex-1 flex items-center justify-center">
                   <div className="flex flex-col items-center w-full max-w-xl mx-auto py-4">
                       
                       {/* Stage 1: Logged */}
                       <div className="w-full relative h-36 bg-gradient-to-b from-indigo-400 to-indigo-600 flex flex-col items-center justify-center text-white shadow-xl transition-all hover:scale-[1.02]" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}>
                           <span className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1">Logged</span>
                           <span className="text-4xl font-mono font-bold tracking-tight">₹{loanFunnelData.logged.value.toLocaleString('en-IN')}</span>
                           <span className="text-xs font-medium bg-black/20 px-2.5 py-1 rounded-md mt-2 shadow-inner">{loanFunnelData.logged.count} Applications</span>
                       </div>

                       {/* Conversion Arrow 1 */}
                       <div className="h-16 flex items-center justify-center relative w-full my-1">
                           <div className="w-0.5 h-full bg-slate-300 dark:bg-slate-700"></div>
                           <div className="absolute top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conversion</span>
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{loanFunnelData.sanctioned.conversion}%</span>
                           </div>
                       </div>

                       {/* Stage 2: Sanctioned */}
                       <div className="w-[60%] relative h-36 bg-gradient-to-b from-emerald-400 to-emerald-600 flex flex-col items-center justify-center text-white shadow-xl transition-all hover:scale-[1.02]" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}>
                           <span className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1">Sanctioned</span>
                           <span className="text-3xl font-mono font-bold tracking-tight">₹{loanFunnelData.sanctioned.value.toLocaleString('en-IN')}</span>
                           <span className="text-[10px] font-medium bg-black/20 px-2.5 py-1 rounded-md mt-2 shadow-inner">{loanFunnelData.sanctioned.count} Approvals</span>
                       </div>

                       {/* Conversion Arrow 2 */}
                       <div className="h-16 flex items-center justify-center relative w-full my-1">
                           <div className="w-0.5 h-full bg-slate-300 dark:bg-slate-700"></div>
                           <div className="absolute top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conversion</span>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{loanFunnelData.disbursed.conversion}%</span>
                           </div>
                       </div>

                       {/* Stage 3: Disbursed */}
                       <div className="w-[36%] relative h-36 bg-gradient-to-b from-sky-400 to-sky-600 flex flex-col items-center justify-center text-white shadow-xl transition-all hover:scale-[1.02]" style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-1">Disbursed</span>
                           <span className="text-2xl font-mono font-bold tracking-tight">₹{loanFunnelData.disbursed.value.toLocaleString('en-IN')}</span>
                           <span className="text-[10px] font-medium bg-black/20 px-2 py-0.5 rounded-md mt-2 shadow-inner">{loanFunnelData.disbursed.count} Funded</span>
                       </div>
                   </div>
               </div>
            </div>
         </div>
      )}
    </>
  );
}
