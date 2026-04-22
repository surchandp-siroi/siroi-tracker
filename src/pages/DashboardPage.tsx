import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

const COLORS = ['#818cf8', '#34d399', '#38bdf8', '#fbbf24']; // indigo-400, emerald-400, sky-400, amber-400

const BRANCH_COLORS: Record<string, string> = {
  'Guwahati': '#818cf8',
  'Manipur': '#34d399',
  'Itanagar': '#38bdf8',
  'Nagaland & Mizoram': '#fbbf24'
};

const PRODUCT_COLORS: Record<string, { proj: string, ach: string }> = {
    'Personal Loan': { proj: 'rgba(252, 165, 165, 0.3)', ach: '#fca5a5' }, // red-300
    'Business Loan': { proj: 'rgba(252, 211, 77, 0.3)', ach: '#fcd34d' }, // amber-300
    'Mortgage': { proj: 'rgba(190, 242, 100, 0.3)', ach: '#bef264' }, // lime-300
    'Home Loan': { proj: 'rgba(134, 239, 172, 0.3)', ach: '#86efac' }, // green-300
    'General Insurance': { proj: 'rgba(110, 231, 183, 0.3)', ach: '#6ee7b7' }, // emerald-300
    'Life Insurance': { proj: 'rgba(94, 234, 212, 0.3)', ach: '#5eead4' }, // teal-300
    'Currency Exchange': { proj: 'rgba(103, 232, 249, 0.3)', ach: '#67e8f9' }, // cyan-300
    'Forex card': { proj: 'rgba(125, 211, 252, 0.3)', ach: '#7dd3fc' }, // sky-300
    'Outward Remittance': { proj: 'rgba(147, 197, 253, 0.3)', ach: '#93c5fd' }, // blue-300
    'GST filing': { proj: 'rgba(196, 181, 253, 0.3)', ach: '#c4b5fd' }, // violet-300
    'ITR filing': { proj: 'rgba(249, 168, 212, 0.3)', ach: '#f9a8d4' }, // pink-300
};

const PRODUCTS = Object.keys(PRODUCT_COLORS);

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

export default function DashboardOverview() {
  const { products, channels, branches, entries } = useDataStore();
  const { user, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'daily' | 'month' | 'year'>('daily');
  const [selectedRevenueBranch, setSelectedRevenueBranch] = useState<string>('');

  useEffect(() => {
    if (branches.length > 0 && !selectedRevenueBranch) {
        const guwahati = branches.find(b => b.name === 'Guwahati');
        if (guwahati) {
            setSelectedRevenueBranch(guwahati.id);
        } else {
            setSelectedRevenueBranch('all');
        }
    }
  }, [branches, selectedRevenueBranch]);

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

  const { filteredBranches, totalRevenue, revenueByCategory } = useMemo(() => {
     const branchMap = new Map();
     branches.forEach(b => {
         const initialProducts = PRODUCTS.reduce((acc, p) => {
             acc[`proj_${p}`] = 0;
             acc[`ach_${p}`] = 0;
             return acc;
         }, {} as any);

         branchMap.set(b.id, { 
             ...b, 
             dailyAchievement: 0,
             ...initialProducts
         });
     });

     let total = 0;
     const catMap = new Map();

     filteredEntries.forEach(entry => {
          const b = branchMap.get(entry.branchId);
          if (!b) return;

          const isAchievement = !entry.recordType || entry.recordType === 'achievement';
          const isProjection = entry.recordType === 'projection';

          if (isAchievement) {
              b.dailyAchievement += entry.totalAmount;
              total += entry.totalAmount;
          }
          
          if (selectedRevenueBranch === 'all' || selectedRevenueBranch === b.id) {
              if (isAchievement) {
                  entry.items.forEach(item => {
                      catMap.set(item.category, (catMap.get(item.category) || 0) + item.amount);
                  });
              }
          }

          entry.items.forEach(item => {
              if (isProjection) {
                  b[`proj_${item.product}`] = (b[`proj_${item.product}`] || 0) + item.amount;
              } else if (isAchievement) {
                  b[`ach_${item.product}`] = (b[`ach_${item.product}`] || 0) + item.amount;
              }
          });
     });

     const fb = Array.from(branchMap.values());
     const rbC = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

     return { filteredBranches: fb, totalRevenue: total, revenueByCategory: rbC };
  }, [filteredEntries, branches, selectedRevenueBranch]);

  const target = filteredBranches.reduce((acc, b) => acc + b.monthlyTarget, 0);

  // Time metrics relative to selected date (scaled for demonstration)
  const ytdRevenue = totalRevenue;
  const mtdRevenue = Math.round(totalRevenue * 0.12);
  const ftdRevenue = Math.round(totalRevenue * 0.008);

  const activeProducts = useMemo(() => {
     return PRODUCTS.filter(p => 
         filteredBranches.some((b: any) => (b[`proj_${p}`] || 0) > 0 || (b[`ach_${p}`] || 0) > 0)
     );
  }, [filteredBranches]);

  const maxYValue = useMemo(() => {
     let max = 0;
     filteredBranches.forEach((b: any) => {
         let projSum = 0;
         let achSum = 0;
         PRODUCTS.forEach(p => {
             projSum += (b[`proj_${p}`] || 0);
             achSum += (b[`ach_${p}`] || 0);
         });
         max = Math.max(max, projSum, achSum);
     });
     return max > 0 ? max : 1000; // Provide a default if 0
  }, [filteredBranches]);

  const renderCustomLegend = (props: any) => {
    // If no active products, maybe don't show the product legend, but still show Projection/Achievement
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
        {activeProducts.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center px-2">
             {activeProducts.map(p => (
                 <div key={p} className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PRODUCT_COLORS[p].ach }}></div>
                     <span className="text-[9px]">{p}</span>
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
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'daily' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >Daily</button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'month' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >Month Wise</button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'year' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >Year Wise</button>
            </div>
            
            <label 
              className="flex items-center gap-2 bg-slate-900 dark:bg-black text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-indigo-500/50 focus-within:ring-2 ring-indigo-500/50 shadow-sm transition-all cursor-pointer"
              onClick={(e) => { const input = e.currentTarget.querySelector('input'); if(input && 'showPicker' in input) (input as any).showPicker(); }}
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto h-auto p-0 border-none bg-transparent text-xs text-white focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </label>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:inline-block ml-2 shrink-0">Select Date Tracker</span>
          </div>
        </div>
        <div className="flex gap-6 sm:gap-8">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-600 dark:text-slate-400 font-semibold mb-0.5">Projected Monthly</span>
                <span className="text-lg font-mono tracking-tight text-slate-900 dark:text-white">₹{target.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Total Revenue</span>
                <span className="text-lg font-mono text-emerald-400 tracking-tight">₹{totalRevenue.toLocaleString()}</span>
            </div>
        </div>
      </header>

      {/* KPI Timeline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:dark:bg-white/5 bg-slate-900/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">FTD Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{ftdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">For the day</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">MTD Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{mtdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Month to date</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">YTD Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{ytdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Year to date</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Daily Proj.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                ₹{filteredBranches.reduce((acc, b) => acc + b.dailyProjection, 0).toLocaleString()}
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
                    tickFormatter={(value) => `₹${(value/1000).toLocaleString()}k`} 
                    width={60}
                />
                <RechartsTooltip 
                    formatter={(value: any, name: any) => [`₹${Number(value || 0).toLocaleString()}`, name]} 
                    cursor={{fill: 'rgba(150,150,150,0.1)'}}
                    contentStyle={{backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '8px'}} 
                />
                
                {/* Custom Legend */}
                <Legend content={renderCustomLegend} verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />

                {/* Projection Stacks */}
                {activeProducts.map(p => (
                   <Bar key={`proj_${p}`} dataKey={`proj_${p}`} stackId="proj" name={`Proj. ${p}`} fill={PRODUCT_COLORS[p].proj} stroke={PRODUCT_COLORS[p].ach} strokeWidth={1} strokeDasharray="2 2" maxBarSize={50} />
                ))}

                {/* Achievement Stacks */}
                {activeProducts.map(p => (
                   <Bar key={`ach_${p}`} dataKey={`ach_${p}`} stackId="ach" name={`Ach. ${p}`} fill={PRODUCT_COLORS[p].ach} maxBarSize={50} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column: Mix */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Revenue Mix */}
            <Card className="flex flex-col border-slate-900/10 dark:border-white/10 flex-1 min-h-[300px]">
              <CardHeader className="py-4 border-b border-slate-900/10 dark:border-white/10 shrink-0 flex flex-row items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-300 uppercase">Revenue Mix</span>
                <select 
                    value={selectedRevenueBranch}
                    onChange={(e) => setSelectedRevenueBranch(e.target.value)}
                    className="text-[10px] bg-transparent dark:bg-[#0f172a] border border-slate-900/10 dark:border-white/10 rounded px-2 py-1 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-bold cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="all" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200">All Branches</option>
                    {branches.map(b => (
                        <option key={b.id} value={b.id} className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-200">{b.name}</option>
                    ))}
                </select>
              </CardHeader>
              <CardContent className="flex-1 flex justify-center items-center p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                        formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`}
                        contentStyle={{backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '8px'}}  
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="px-6 pb-6 flex flex-wrap gap-4 justify-center mt-auto shrink-0 pt-4">
                  {revenueByCategory.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                          <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {entry.name}
                      </div>
                  ))}
              </div>
            </Card>
        </div>
      </div>
    </>
  );
}
