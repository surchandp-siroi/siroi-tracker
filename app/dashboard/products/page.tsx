'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDataStore, ProductCategory } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableRow } from '@/components/ui';
import { Plus, Trash2, Calendar, Filter } from 'lucide-react';

export default function ProductsPage() {
  const { products, branches } = useDataStore();
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Loan' as ProductCategory, revenue: 0 });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
     if (isInitialized) {
         if (!user) router.push('/login');
         else if (user.role !== 'admin') router.push('/entry');
     }
  }, [user, isInitialized, router]);

  // Financial Year Logic
  const dateObj = new Date(selectedDate);
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const isNewFY = month >= 3;
  const fyStart = isNewFY ? year : year - 1;
  const fyEnd = (fyStart + 1).toString().slice(-2);
  const financialYear = `FY ${fyStart}-${fyEnd}`;

  // Total calculations
  const totalRevenue = useMemo(() => products.reduce((acc, p) => acc + p.revenue, 0), [products]);
  const totalDailyTarget = branches.reduce((acc, b) => acc + b.dailyProjection, 0);

  // Dynamic Multipliers
  const branchRatio = selectedBranchId
    ? ((branches.find(b => b.id === selectedBranchId)?.dailyProjection || 0) / (totalDailyTarget || 1))
    : 1;

  // FTD Revenue matches Branch actual achievements to provide accurate Achv %
  const ftdRevenue = selectedBranchId
    ? (branches.find(b => b.id === selectedBranchId)?.dailyAchievement || 0)
    : branches.reduce((acc, b) => acc + b.dailyAchievement, 0);

  const dailyTarget = selectedBranchId
    ? (branches.find(b => b.id === selectedBranchId)?.dailyProjection || 0)
    : totalDailyTarget;

  // Time metrics relative to selected branch's scale and total size
  const ytdRevenue = Math.round(totalRevenue * branchRatio);
  const mtdRevenue = Math.round(totalRevenue * 0.12 * branchRatio);

  // Grouped Products
  const groupedProducts = useMemo(() => {
    const groups: Record<ProductCategory, typeof products> = {
      Loan: [],
      Insurance: [],
      Forex: [],
      Consultancy: [],
    };
    products.forEach(p => {
      groups[p.category].push(p);
    });
    return groups;
  }, [products]);

  const categoryConfig: Record<ProductCategory, { border: string; bg: string; text: string; label: string; tableBorder: string }> = {
    Loan: { border: 'border-indigo-200 dark:border-indigo-500/30', bg: 'bg-indigo-100 dark:bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', label: 'Loan Portfolio', tableBorder: 'border-indigo-100 dark:border-indigo-500/10' },
    Insurance: { border: 'border-emerald-200 dark:border-emerald-500/30', bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', label: 'Insurance Plans', tableBorder: 'border-emerald-100 dark:border-emerald-500/10' },
    Forex: { border: 'border-sky-200 dark:border-sky-500/30', bg: 'bg-sky-100 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', label: 'Forex Services', tableBorder: 'border-sky-100 dark:border-sky-500/10' },
    Consultancy: { border: 'border-amber-200 dark:border-amber-500/30', bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', label: 'Consultancy Services', tableBorder: 'border-amber-100 dark:border-amber-500/10' }
  };

  return (
    <>
      <header className="glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Product Offerings</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider border border-indigo-500/30">
              {financialYear}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <Input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto h-8 text-xs bg-slate-900/5 dark:bg-black/20 border-slate-900/10 dark:border-white/10"
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:inline-block ml-2">Product Tracker Mode</span>
          </div>
        </div>
      </header>

      {/* KPI Timeline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">FTD Acquired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{ftdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">vs Target ₹{dailyTarget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">MTD Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{mtdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Month to date</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">YTD Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{ytdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Year to date</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Achv. %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {dailyTarget > 0 ? ((ftdRevenue / dailyTarget) * 100).toFixed(1) : 0}%
            </div>
             <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">FTD vs Daily Target</p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-white/50 dark:bg-white/5 p-2 rounded-lg border border-slate-900/10 dark:border-white/10 shadow-sm">
        <Filter size={14} className="text-slate-500 ml-2 mr-1" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Filter Data:</span>
        <button
            onClick={() => setSelectedBranchId(null)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedBranchId === null ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent text-slate-500 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'}`}
        >
            Consolidated
        </button>
        <div className="w-px h-4 bg-slate-900/10 dark:bg-white/10 mx-1"></div>
        {branches.map(branch => (
             <button
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedBranchId === branch.id ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent text-slate-500 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'}`}
            >
                {branch.name}
             </button>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="grid lg:grid-cols-2 gap-6 pb-8">
        {(Object.keys(groupedProducts) as ProductCategory[]).map((category) => {
           const conf = categoryConfig[category];
           const categoryProducts = groupedProducts[category];
           const catRevenue = categoryProducts.reduce((sum, p) => sum + p.revenue, 0);

           return (
             <Card key={category} className={`border ${conf.border} bg-white/60 dark:bg-white/5 overflow-hidden flex flex-col`}>
               <div className={`px-4 py-3 border-b flex justify-between items-center ${conf.bg} ${conf.border}`}>
                  <span className={`text-xs font-bold uppercase tracking-widest ${conf.text}`}>{conf.label}</span>
                  <span className={`font-mono text-sm font-semibold ${conf.text}`}>₹{Math.round(catRevenue * branchRatio).toLocaleString()}</span>
               </div>
               <div className="p-0 flex-1 bg-white/40 dark:bg-black/10">
                  {categoryProducts.length > 0 ? (
                    <Table>
                      <TableBody>
                        {categoryProducts.map((p) => (
                           <TableRow key={p.id} className={`border-b ${conf.tableBorder} hover:bg-slate-100/50 dark:hover:bg-white/5`}>
                             <TableCell className="font-medium text-slate-800 dark:text-slate-300 pl-4 py-3">{p.name}</TableCell>
                             <TableCell className="text-right font-mono text-slate-700 dark:text-slate-400 py-3">₹{Math.round(p.revenue * branchRatio).toLocaleString()}</TableCell>
                           </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs uppercase tracking-widest">No products active</div>
                  )}
               </div>
             </Card>
           )
        })}
      </div>
    </>
  );
}
