'use client';

import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Loader2, Calendar } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const COLORS = ['#818cf8', '#34d399', '#38bdf8', '#fbbf24']; // indigo-400, emerald-400, sky-400, amber-400

export default function DashboardOverview() {
  const { products, channels, branches, entries } = useDataStore();
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(true);

  // Secure routing
  useEffect(() => {
     if (isInitialized) {
         if (!user) router.push('/login');
         else if (user.role !== 'admin') router.push('/entry');
     }
  }, [user, isInitialized, router]);

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
         const entryDate = new Date(entry.entryDate);
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
     });
  }, [entries, selectedDate, viewMode, selectedMonth, selectedYear, fyStart]);

  const { filteredBranches, totalRevenue, revenueByCategory } = useMemo(() => {
     const branchMap = new Map();
     branches.forEach(b => branchMap.set(b.id, { ...b, dailyAchievement: 0 }));

     let total = 0;
     const catMap = new Map();

     filteredEntries.forEach(entry => {
          const b = branchMap.get(entry.branchId);
          if (b) b.dailyAchievement += entry.totalAmount;
          total += entry.totalAmount;
          
          entry.items.forEach(item => {
              catMap.set(item.category, (catMap.get(item.category) || 0) + item.amount);
          });
     });

     // Filter Test Branch and HO
     const fb = Array.from(branchMap.values()).filter(b => b.name !== 'Test Branch' && b.name !== 'HO');
     const rbC = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

     return { filteredBranches: fb, totalRevenue: total, revenueByCategory: rbC };
  }, [filteredEntries, branches]);

  const target = filteredBranches.reduce((acc, b) => acc + b.monthlyTarget, 0);

  // Financial Year Logic


  // Time metrics relative to selected date (scaled for demonstration)
  const ytdRevenue = totalRevenue;
  const mtdRevenue = Math.round(totalRevenue * 0.12);
  const ftdRevenue = Math.round(totalRevenue * 0.008);

  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        if (isMounted) {
          setAiSummary("Configure NEXT_PUBLIC_GEMINI_API_KEY in Secrets to generate the AI Monthly Outlook.");
          setIsAiLoading(false);
        }
        return;
      }
      setIsAiLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        const prompt = `Act as a senior financial analyst for Siroi Forex. Generate a 2-3 sentence professional outlook for the previous month's performance. The FTD revenue is ₹${ftdRevenue.toLocaleString()}, MTD is ₹${mtdRevenue.toLocaleString()}, and YTD is ₹${ytdRevenue.toLocaleString()}. Keep it concise, encouraging, and focused on growth in loans, insurance, and forex. Avoid markdown.`;
        
        const r = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        if (isMounted) setAiSummary(r.text || 'Unable to generate summary.');
      } catch (e) {
        if (isMounted) setAiSummary("AI Summary currently unavailable. Please check configuration.");
      } finally {
        if (isMounted) setIsAiLoading(false);
      }
    }
    fetchSummary();
    return () => { isMounted = false; };
  }, [ftdRevenue, mtdRevenue, ytdRevenue]);

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
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'month' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >Month Wise</button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${viewMode === 'year' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >Year Wise</button>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900 dark:bg-black text-white px-3 py-1.5 rounded-lg border border-slate-800 focus-within:ring-2 ring-indigo-500/50 shadow-sm transition-all cursor-pointer">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto h-auto p-0 border-none bg-transparent text-xs text-white focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
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
        <Card className="lg:col-span-4 flex flex-col border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex justify-between items-center py-4 border-slate-900/10 dark:border-white/10 uppercase">
            <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-300">Branch Performance (Daily)</span>
          </CardHeader>
          <CardContent className="min-h-[300px] flex-1 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBranches} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <RechartsTooltip 
                    formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`} 
                    cursor={{fill: 'rgba(150,150,150,0.1)'}}
                    contentStyle={{backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '8px'}} 
                />
                <Bar dataKey="dailyProjection" name="Projection" fill="rgba(148,163,184,0.2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dailyAchievement" name="Achievement" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column: Mix & AI Summary */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Revenue Mix */}
            <Card className="flex flex-col border-slate-900/10 dark:border-white/10 shrink-0">
              <CardHeader className="py-4 border-slate-900/10 dark:border-white/10 shrink-0">
                <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-300 uppercase">Revenue Mix</span>
              </CardHeader>
              <CardContent className="h-[180px] flex justify-center items-center p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
              <div className="px-6 pb-6 flex flex-wrap gap-3 justify-center mt-auto shrink-0 border-t border-slate-900/10 dark:border-white/5 pt-4">
                  {revenueByCategory.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {entry.name}
                      </div>
                  ))}
              </div>
            </Card>

            {/* AI Summary */}
            <Card className="flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-100/80 to-emerald-50/50 dark:from-indigo-900/40 dark:to-emerald-900/10 border-indigo-500/20">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles size={64} className="text-indigo-900 dark:text-white" />
              </div>
              <CardHeader className="py-4 border-indigo-500/10 shrink-0 flex flex-row items-center gap-2">
                <Sparkles className="text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                <span className="text-[10px] font-bold tracking-widest text-indigo-800 dark:text-indigo-300 uppercase">AI Monthly Outlook</span>
              </CardHeader>
              <CardContent className="p-6 relative z-10 flex-1 flex flex-col justify-center">
                 {isAiLoading ? (
                     <div className="flex flex-col gap-3 justify-center items-center h-full text-indigo-400/50">
                         <Loader2 className="animate-spin w-8 h-8" />
                         <span className="text-[10px] uppercase tracking-widest">Analyzing Portfolio...</span>
                     </div>
                 ) : (
                     <p className="text-sm text-indigo-950 dark:text-indigo-50 leading-relaxed font-medium bg-white/40 dark:bg-black/20 p-4 rounded-lg border border-indigo-500/20 shadow-inner">
                         {aiSummary}
                     </p>
                 )}
              </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
