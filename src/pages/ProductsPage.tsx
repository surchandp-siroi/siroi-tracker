import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, Input } from '@/components/ui';
import { Calendar } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

export default function ProductsPage() {
  const { products, channels, branches, entries } = useDataStore();
  const { user } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [viewMode, setViewMode] = useState<'achievement' | 'projection'>('achievement');

  const dateObj = new Date(selectedDate);
  const selectedMonth = dateObj.getMonth();
  const selectedYear = dateObj.getFullYear();
  const isNewFY = selectedMonth >= 3;
  const fyStart = isNewFY ? selectedYear : selectedYear - 1;
  const fyEnd = (fyStart + 1).toString().slice(-2);
  const financialYear = `FY ${fyStart}-${fyEnd}`;

  const { 
    ftdAchievement, mtdAchievement, ytdAchievement, productAchievement, categoryAchievement,
    ftdProjection, mtdProjection, ytdProjection, productProjection, categoryProjection,
    productAchievementCount, productProjectionCount, categoryAchievementCount, categoryProjectionCount
  } = useMemo(() => {
    let ftdA = 0, mtdA = 0, ytdA = 0;
    let ftdP = 0, mtdP = 0, ytdP = 0;
    const mapA: Record<string, number> = {};
    const catMapA: Record<string, number> = {};
    const mapP: Record<string, number> = {};
    const catMapP: Record<string, number> = {};
    
    const mapACount: Record<string, number> = {};
    const catMapACount: Record<string, number> = {};
    const mapPCount: Record<string, number> = {};
    const catMapPCount: Record<string, number> = {};

    const sd = new Date(selectedDate);
    const sdYear = sd.getFullYear();
    const sdMonth = sd.getMonth();
    const sdIsNewFY = sdMonth >= 3;
    const sdFyStart = sdIsNewFY ? sdYear : sdYear - 1;

    entries.forEach(entry => {
      const branchMatch = selectedBranch === 'all' || entry.branchId === selectedBranch;
      if (!branchMatch) return;

      const isProj = entry.recordType === 'projection';
      const isAch = !entry.recordType || entry.recordType === 'achievement';

      const entryProj = isProj ? entry.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) : 0;
      const entryAch = isAch ? entry.items.reduce((sum, i) => sum + (Number(i.disbursedAmount) || 0), 0) : 0;

      const ed = new Date(entry.entryDate);
      const edYear = ed.getFullYear();
      const edMonth = ed.getMonth();
      const edIsNewFY = edMonth >= 3;
      const edFyStart = edIsNewFY ? edYear : edYear - 1;

      if (edFyStart === sdFyStart && ed <= sd) {
          ytdA += entryAch;
          ytdP += entryProj;
          
          if (edMonth === sdMonth && edYear === sdYear) {
              mtdA += entryAch;
              mtdP += entryProj;
              
              entry.items.forEach(item => {
                  const projAmt = Number(item.amount) || 0;
                  const achAmt = Number(item.disbursedAmount) || 0;

                  if (item.product && item.product !== 'Grouped') {
                      if (isAch) {
                          mapA[item.product] = (mapA[item.product] || 0) + achAmt;
                          mapACount[item.product] = (mapACount[item.product] || 0) + 1;
                      }
                      if (isProj) {
                          mapP[item.product] = (mapP[item.product] || 0) + projAmt;
                          mapPCount[item.product] = (mapPCount[item.product] || 0) + 1;
                      }
                  }
                  if (item.category) {
                      if (isAch) {
                          catMapA[item.category] = (catMapA[item.category] || 0) + achAmt;
                          catMapACount[item.category] = (catMapACount[item.category] || 0) + 1;
                      }
                      if (isProj) {
                          catMapP[item.category] = (catMapP[item.category] || 0) + projAmt;
                          catMapPCount[item.category] = (catMapPCount[item.category] || 0) + 1;
                      }
                  }
              });

              if (entry.entryDate === selectedDate) {
                  ftdA += entryAch;
                  ftdP += entryProj;
              }
          }
      }
    });
    return { 
        ftdAchievement: ftdA, mtdAchievement: mtdA, ytdAchievement: ytdA, productAchievement: mapA, categoryAchievement: catMapA,
        ftdProjection: ftdP, mtdProjection: mtdP, ytdProjection: ytdP, productProjection: mapP, categoryProjection: catMapP,
        productAchievementCount: mapACount, productProjectionCount: mapPCount, categoryAchievementCount: catMapACount, categoryProjectionCount: catMapPCount
    };
  }, [entries, selectedDate, selectedBranch]);

  let target = ftdProjection;
  if (target === 0) {
      target = branches
        .filter(b => selectedBranch === 'all' || b.id === selectedBranch)
        .filter(b => b.name !== 'Test Branch' && b.name !== 'HO')
        .reduce((acc, b) => acc + b.dailyProjection, 0);
  }
  const achvPct = target > 0 ? ((ftdAchievement / target) * 100).toFixed(1) : '0';

  const ftdGap = ftdAchievement - target;

  const currentFTD = viewMode === 'achievement' ? ftdAchievement : ftdProjection;
  const currentMTD = viewMode === 'achievement' ? mtdAchievement : mtdProjection;
  const currentYTD = viewMode === 'achievement' ? ytdAchievement : ytdProjection;
  const productData = viewMode === 'achievement' ? productAchievement : productProjection;
  const categoryData = viewMode === 'achievement' ? categoryAchievement : categoryProjection;
  const productCountData = viewMode === 'achievement' ? productAchievementCount : productProjectionCount;
  const categoryCountData = viewMode === 'achievement' ? categoryAchievementCount : categoryProjectionCount;

  const getCountLabel = (category: string, count: number) => {
    switch (category) {
        case 'Loan': return `${count} Logins`;
        case 'Insurance': return `${count} Policies`;
        case 'Forex': return `${count} Txns`;
        case 'Investments': return `${count} SIP/MFs`;
        default: return `${count} Records`;
    }
  };

  // Group products by category
  const loanProducts = products.filter(p => p.category === 'Loan');
  const insuranceProducts = products.filter(p => p.category === 'Insurance');
  const forexProducts = products.filter(p => p.category === 'Forex');
  const consultancyProducts = products.filter(p => p.category === 'Consultancy');
  const investmentProducts = products.filter(p => p.category === 'Investments');

  const getCategoryTotal = (catName: string) => categoryData[catName] || 0;

  const categoryCards = [
    {
      id: 'Loan',
      title: 'Loan Portfolio',
      colorClass: 'text-indigo-600 dark:text-indigo-400',
      total: getCategoryTotal('Loan'),
      products: loanProducts,
    },
    {
      id: 'Insurance',
      title: 'Insurance Plans',
      colorClass: 'text-amber-600 dark:text-amber-400',
      total: getCategoryTotal('Insurance'),
      products: insuranceProducts,
    },
    {
      id: 'Forex',
      title: 'Forex Services',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      total: getCategoryTotal('Forex'),
      products: forexProducts,
    },
    {
      id: 'Consultancy',
      title: 'Consultancy Services',
      colorClass: 'text-sky-600 dark:text-sky-400',
      total: getCategoryTotal('Consultancy'),
      products: consultancyProducts,
    },
    {
      id: 'Investments',
      title: 'Investments',
      colorClass: 'text-purple-600 dark:text-purple-400',
      total: getCategoryTotal('Investments'),
      products: investmentProducts,
    }
  ];

  const sortedCategoryCards = [...categoryCards].sort((a, b) => b.total - a.total);

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
            <div className="flex items-center bg-slate-100 dark:bg-black rounded-lg border border-slate-200 dark:border-slate-800 p-1">
              <button
                onClick={() => setViewMode('achievement')}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-colors ${
                  viewMode === 'achievement'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-emerald-600 dark:hover:text-white'
                }`}
              >
                Achieved
              </button>
              <button
                onClick={() => setViewMode('projection')}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-colors ${
                  viewMode === 'projection'
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-indigo-600 dark:hover:text-white'
                }`}
              >
                Projected
              </button>
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
                  className="w-auto h-auto p-0 border-none bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:ring-0 cursor-pointer"
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
            </div>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">FTD {viewMode === 'achievement' ? 'Acquired' : 'Projected'}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold dark:text-white">₹{currentFTD.toLocaleString('en-IN')}</div>
            {viewMode === 'achievement' && <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">vs target ₹{target.toLocaleString('en-IN')}</p>}
          </CardContent>
        </Card>
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">MTD Volume</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold dark:text-white">₹{currentMTD.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Month to date</p>
          </CardContent>
        </Card>
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">YTD Bookings</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold dark:text-white">₹{currentYTD.toLocaleString('en-IN')}</div>
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
        <Card className="border-slate-900/10 dark:border-white/10">
          <CardHeader className="pb-2 border-b-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">FTD Gap</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-mono font-bold ${ftdGap >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {ftdGap > 0 ? '+' : ''}₹{ftdGap.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{ftdGap >= 0 ? 'Over Achieved' : 'Shortfall'}</p>
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
              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
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
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Product Category Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {sortedCategoryCards.map(cat => (
          <Card key={cat.id} className="border-slate-900/10 dark:border-white/10 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-slate-900/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${cat.colorClass}`}>{cat.title}</span>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-emerald-400">₹{cat.total.toLocaleString('en-IN')}</span>
                <span className="text-[9px] text-slate-500 font-medium">{getCountLabel(cat.id, categoryCountData[cat.id] || 0)}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {cat.products.map(p => {
                const pValue = productData[p.name] || 0;
                const pCount = productCountData[p.name] || 0;
                if (pValue === 0 && pCount === 0) return null; // Hide 0 value products for cleaner UI
                return (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2.5 border-b border-slate-900/5 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <span className="text-[10px] uppercase font-bold text-slate-800 dark:text-slate-300 w-1/2 pr-2 leading-tight">{p.name}</span>
                    <div className="flex flex-col items-end justify-center">
                      <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 leading-none">₹{pValue.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{getCountLabel(cat.id, pCount)}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
