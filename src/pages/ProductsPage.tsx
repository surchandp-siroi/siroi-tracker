import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, Input } from '@/components/ui';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function ProductsPage() {
  const { products, channels, branches, entries } = useDataStore();
  const { user } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('all');

  const dateObj = new Date(selectedDate);
  const selectedMonth = dateObj.getMonth();
  const selectedYear = dateObj.getFullYear();
  const isNewFY = selectedMonth >= 3;
  const fyStart = isNewFY ? selectedYear : selectedYear - 1;
  const fyEnd = (fyStart + 1).toString().slice(-2);
  const financialYear = `FY ${fyStart}-${fyEnd}`;

  // Filter entries by branch + current month
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.entryDate);
      const monthMatch = entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
      const branchMatch = selectedBranch === 'all' || entry.branchId === selectedBranch;
      return monthMatch && branchMatch;
    });
  }, [entries, selectedDate, selectedBranch, selectedMonth, selectedYear]);

  // Compute product revenues
  const productRevenues = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entry.items.forEach(item => {
        map[item.product] = (map[item.product] || 0) + item.amount;
      });
    });
    return map;
  }, [filteredEntries]);

  const totalRevenue = filteredEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const ytdRevenue = totalRevenue;
  const mtdRevenue = totalRevenue;
  const ftdRevenue = Math.round(totalRevenue * 0.008);
  
  const target = branches
    .filter(b => selectedBranch === 'all' || b.id === selectedBranch)
    .filter(b => b.name !== 'Test Branch' && b.name !== 'HO')
    .reduce((acc, b) => acc + b.dailyProjection, 0);
  const achvPct = target > 0 ? ((ftdRevenue / target) * 100).toFixed(1) : '0';

  // Group products by category
  const loanProducts = products.filter(p => p.category === 'Loan');
  const insuranceProducts = products.filter(p => p.category === 'Insurance');
  const forexProducts = products.filter(p => p.category === 'Forex');
  const consultancyProducts = products.filter(p => p.category === 'Consultancy');

  const getCategoryTotal = (prods: typeof products) =>
    prods.reduce((sum, p) => sum + (productRevenues[p.name] || 0), 0);

  const displayBranches = branches.filter(b => b.name !== 'Test Branch' && b.name !== 'HO');

  return (
    <>
      {/* Header */}
      <header className="glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900">Product Offerings</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider border border-indigo-500/30">
              {financialYear}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900 dark:bg-black text-white px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto h-auto p-0 border-none bg-transparent text-xs text-white focus:ring-0 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline-block ml-2">Product Tracker Mode</span>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">FTD Acquired</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold dark:text-white">₹{ftdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">vs target ₹{target.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">MTD Volume</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold dark:text-white">₹{mtdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Month to date</p>
          </CardContent>
        </Card>
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">YTD Bookings</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold dark:text-white">₹{ytdRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Year to date</p>
          </CardContent>
        </Card>
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Achv. %</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold dark:text-white">{achvPct}%</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">FTD vs daily target</p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold shrink-0">Filter By:</span>
        <button
          onClick={() => setSelectedBranch('all')}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${
            selectedBranch === 'all'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Consolidated
        </button>
        {branches.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBranch(b.id)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${
              selectedBranch === b.id
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Product Category Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Loan Portfolio */}
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between py-3 border-slate-900/10 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Loan Portfolio</span>
            <span className="text-xs font-mono font-bold text-emerald-400">₹{getCategoryTotal(loanProducts).toLocaleString()}</span>
          </CardHeader>
          <CardContent className="p-0">
            {loanProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 border-t border-slate-900/5 dark:border-white/5">
                <span className="text-sm text-slate-800 dark:text-slate-200">{p.name}</span>
                <span className="text-sm font-mono text-emerald-500 dark:text-emerald-400">₹{(productRevenues[p.name] || 0).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Insurance Plans */}
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between py-3 border-slate-900/10 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Insurance Plans</span>
            <span className="text-xs font-mono font-bold text-emerald-400">₹{getCategoryTotal(insuranceProducts).toLocaleString()}</span>
          </CardHeader>
          <CardContent className="p-0">
            {insuranceProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 border-t border-slate-900/5 dark:border-white/5">
                <span className="text-sm text-slate-800 dark:text-slate-200">{p.name}</span>
                <span className="text-sm font-mono text-emerald-500 dark:text-emerald-400">₹{(productRevenues[p.name] || 0).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Forex Services */}
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between py-3 border-slate-900/10 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Forex Services</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">{forexProducts.length}</span>
          </CardHeader>
          <CardContent className="p-0">
            {forexProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 border-t border-slate-900/5 dark:border-white/5">
                <span className="text-sm text-slate-800 dark:text-slate-200">{p.name}</span>
                <span className="text-sm font-mono text-emerald-500 dark:text-emerald-400">₹{(productRevenues[p.name] || 0).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Consultancy Services */}
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between py-3 border-slate-900/10 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Consultancy Services</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">{consultancyProducts.length}</span>
          </CardHeader>
          <CardContent className="p-0">
            {consultancyProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 border-t border-slate-900/5 dark:border-white/5">
                <span className="text-sm text-slate-800 dark:text-slate-200">{p.name}</span>
                <span className="text-sm font-mono text-emerald-500 dark:text-emerald-400">₹{(productRevenues[p.name] || 0).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
