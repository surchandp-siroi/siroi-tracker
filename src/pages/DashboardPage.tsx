import { useDataStore } from '@/store/useDataStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { Calendar, X, Info, MapPin, LayoutGrid, User, Briefcase, Home, HeartPulse, Shield, ShieldCheck, TrendingUp, DollarSign, FileText, FileCheck, ArrowDown } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { BranchSelect } from '@/components/BranchSelect';
import { CustomDatePicker } from '@/components/CustomDatePicker';
const COLORS = ['#818cf8', '#34d399', '#38bdf8', '#fbbf24', '#f472b6']; // indigo-400, emerald-400, sky-400, amber-400, pink-400

const BRANCH_COLORS: Record<string, string> = {
  'Guwahati': '#818cf8',
  'Manipur': '#34d399',
  'Itanagar': '#38bdf8',
  'Nagaland & Mizoram': '#fbbf24'
};

const getPatternId = (name: string) => `pattern_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;

const PRODUCT_COLORS: Record<string, { proj: string, ach: string, textDark: string }> = {
    'Personal Loan': { proj: `url(#${getPatternId('Personal Loan')})`, ach: '#2563eb', textDark: '#1e3a8a' }, // Blue
    'Business Loan': { proj: `url(#${getPatternId('Business Loan')})`, ach: '#ea580c', textDark: '#7c2d12' }, // Orange
    'Housing Loan/LAP': { proj: `url(#${getPatternId('Housing Loan/LAP')})`, ach: '#16a34a', textDark: '#14532d' }, // Green
    'Life Insurance': { proj: `url(#${getPatternId('Life Insurance')})`, ach: '#dc2626', textDark: '#7f1d1d' }, // Red
    'General Insurance': { proj: `url(#${getPatternId('General Insurance')})`, ach: '#9333ea', textDark: '#581c87' }, // Purple
    'Livlong Loan Protector': { proj: `url(#${getPatternId('Livlong Loan Protector')})`, ach: '#0891b2', textDark: '#164e63' }, // Cyan
    'Mutual Fund/SIP': { proj: `url(#${getPatternId('Mutual Fund/SIP')})`, ach: '#ca8a04', textDark: '#713f12' }, // Yellow
    'Retail Forex': { proj: `url(#${getPatternId('Retail Forex')})`, ach: '#db2777', textDark: '#831843' }, // Pink
    'GST filing': { proj: `url(#${getPatternId('GST filing')})`, ach: '#0d9488', textDark: '#134e4a' }, // Teal
    'ITR filing': { proj: `url(#${getPatternId('ITR filing')})`, ach: '#65a30d', textDark: '#3f6212' } // Lime
};

const PRODUCTS_LIST = Object.keys(PRODUCT_COLORS);

const PRODUCT_ICONS: Record<string, any> = {
  'All Products': LayoutGrid,
  'Personal Loan': User,
  'Business Loan': Briefcase,
  'Housing Loan/LAP': Home,
  'Life Insurance': HeartPulse,
  'General Insurance': Shield,
  'Livlong Loan Protector': ShieldCheck,
  'Mutual Fund/SIP': TrendingUp,
  'Retail Forex': DollarSign,
  'GST filing': FileText,
  'ITR filing': FileCheck
};

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
  
  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="900">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const BranchFlipCard = ({ branch, productsList, productColors, branchColor }: any) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const proj = branch.dailyProjection || 0;
    const ach = branch.dailyAchievement || 0;
    const pct = proj > 0 ? Math.min(Math.round((ach / proj) * 100), 100) : 0;
    
    // Filter active products for this branch
    const activeProducts = productsList.filter((p: string) => (branch[`proj_${p}`] || 0) > 0 || (branch[`ach_${p}`] || 0) > 0);

    return (
        <div 
            className="relative w-full h-[320px] cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div 
                className="w-full h-full transition-transform duration-500 ease-in-out relative"
                style={{ 
                    transformStyle: 'preserve-3d', 
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                }}
            >
                {/* Front Side */}
                <div 
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-slate-900 dark:text-white">{branch.name}</span>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center border-4" style={{ borderColor: branchColor, color: branchColor }}>
                            <span className="text-xs font-bold">{pct}%</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Daily Target</span>
                            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{proj.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Daily Achievement</span>
                            <span className="text-2xl font-mono font-bold" style={{ color: branchColor }}>₹{ach.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <div className="text-center mt-2">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">Tap for details</span>
                    </div>
                </div>

                {/* Back Side */}
                <div 
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col shadow-sm overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <span className="font-bold text-base" style={{ color: branchColor }}>{branch.name}</span>
                        <span className="text-xs font-semibold text-slate-500">Details</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {activeProducts.length === 0 ? (
                             <div className="text-center text-xs text-slate-500 mt-4">No product data for today.</div>
                        ) : activeProducts.map((p: string) => (
                             <div key={p} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                 <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">{p}</span>
                                 <div className="flex justify-between items-center text-[11px] font-mono">
                                     <span className="text-slate-500 dark:text-slate-400">Proj: ₹{(branch[`proj_${p}`] || 0).toLocaleString('en-IN')}</span>
                                     <span className="font-bold" style={{ color: productColors[p]?.ach || branchColor }}>Ach: ₹{(branch[`ach_${p}`] || 0).toLocaleString('en-IN')}</span>
                                 </div>
                             </div>
                        ))}
                    </div>
                     <div className="text-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tap to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function DashboardOverview() {
  const { products, channels, branches, entries, branchTargets, setBranchTarget } = useDataStore();
  const { user, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [viewMode, setViewMode] = useState<'daily' | 'month' | 'year'>('daily');
  const [selectedBusinessBranch, setSelectedBusinessBranch] = useState<string>('all');
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetMonthStr, setTargetMonthStr] = useState<string>(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showTargetLeaders, setShowTargetLeaders] = useState(false);
  const [productTargetModal, setProductTargetModal] = useState<{
      isOpen: boolean;
      branchId: string;
      branchName: string;
      isEdit: boolean;
  } | null>(null);
  const [modalTargetInputs, setModalTargetInputs] = useState<Record<string, string>>({});
  
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [activeCategoryPage, setActiveCategoryPage] = useState(0);

  // Granular Tracking State
  const [granularLocation, setGranularLocation] = useState<string>('all');
  const [granularTimeframe, setGranularTimeframe] = useState<'MTD' | 'YTD'>('MTD');

  // Data Quality State
  const [dqLocation, setDqLocation] = useState<string>('all');
  const [dqMonthStr, setDqMonthStr] = useState<string>(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

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
  
  

  // Deduplicate entries to prevent double counting:
  // For each branch and month, if there is at least one 'monthly' entry, ignore all 'daily' entries for that branch/month.
  const validEntries = useMemo(() => {
     const monthlyPresence = new Set<string>();
     entries.forEach(e => {
         if (e.mode === 'monthly') {
             const d = new Date(e.entryDate);
             monthlyPresence.add(`${e.branchId}-${d.getFullYear()}-${d.getMonth()}`);
         }
     });
     return entries.filter(e => {
         if (e.mode === 'daily') {
             const d = new Date(e.entryDate);
             if (monthlyPresence.has(`${e.branchId}-${d.getFullYear()}-${d.getMonth()}`)) {
                 return false; // Ignore daily if monthly exists for this branch/month
             }
         }
         return true;
     });
  }, [entries]);

  const filteredEntries = useMemo(() => {
     return validEntries.filter(entry => {
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

  const [kpiCategory, setKpiCategory] = useState<string>('All Products');

  const { kpiMetrics, projectedTotalBusinessToday } = useMemo(() => {
     const metrics: Record<string, { ftd: number, mtd: number, ytd: number, ftdCount: number, mtdCount: number, ytdCount: number }> = {};
     metrics['All Products'] = { ftd: 0, mtd: 0, ytd: 0, ftdCount: 0, mtdCount: 0, ytdCount: 0 };
     PRODUCTS_LIST.forEach(c => metrics[c] = { ftd: 0, mtd: 0, ytd: 0, ftdCount: 0, mtdCount: 0, ytdCount: 0 });
     let projToday = 0;

     const sd = new Date(selectedDate);
     const sdYear = sd.getFullYear();
     const sdMonth = sd.getMonth();
     
     const sdIsNewFY = sdMonth >= 3;
     const sdFyStart = sdIsNewFY ? sdYear : sdYear - 1;
     
     validEntries.forEach(entry => {
         const isProj = entry.recordType === 'projection';
         const isAch = !entry.recordType || entry.recordType === 'achievement';
         
         const entryProj = isProj ? entry.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) : 0;

         if (isProj && entry.entryDate === selectedDate) {
             projToday += entryProj;
         }

         const ed = new Date(entry.entryDate);
         const edYear = ed.getFullYear();
         const edMonth = ed.getMonth();
         const edIsNewFY = edMonth >= 3;
         const edFyStart = edIsNewFY ? edYear : edYear - 1;

         if (isAch && edFyStart === sdFyStart && ed <= sd) {
             entry.items.forEach(item => {
                 const cat = item.category || 'Loan';
                 const prod = item.product || 'Personal Loan';
                 let achAmt = 0;
                 if (cat === 'Loan') {
                     achAmt = Number(item.disbursedAmount) || 0;
                 } else if (cat === 'Insurance') {
                     achAmt = item.fileStatus === 'Issued' ? (Number(item.amount) || 0) : 0;
                 } else if (cat === 'Investments' || cat === 'Forex' || cat === 'Consultancy') {
                     achAmt = Number(item.amount) || 0;
                 } else {
                     achAmt = Number(item.disbursedAmount) || Number(item.amount) || 0;
                 }

                 if (!metrics[prod]) metrics[prod] = { ftd: 0, mtd: 0, ytd: 0, ftdCount: 0, mtdCount: 0, ytdCount: 0 };
                 
                 metrics[prod].ytd += achAmt;
                 metrics['All Products'].ytd += achAmt;
                 if (achAmt > 0) {
                     metrics[prod].ytdCount++;
                     metrics['All Products'].ytdCount++;
                 }

                 if (edMonth === sdMonth && edYear === sdYear) {
                     metrics[prod].mtd += achAmt;
                     metrics['All Products'].mtd += achAmt;
                     if (achAmt > 0) {
                         metrics[prod].mtdCount++;
                         metrics['All Products'].mtdCount++;
                     }

                     if (entry.entryDate === selectedDate) {
                         metrics[prod].ftd += achAmt;
                         metrics['All Products'].ftd += achAmt;
                         if (achAmt > 0) {
                             metrics[prod].ftdCount++;
                             metrics['All Products'].ftdCount++;
                         }
                     }
                 }
             });
         }
     });
     return { kpiMetrics: metrics, projectedTotalBusinessToday: projToday };
  }, [validEntries, selectedDate]);

  const { filteredBranches, totalBusiness, businessByCategory } = useMemo(() => {
     const branchMap = new Map();
     branches.forEach(b => {
         const initialCategories = PRODUCTS_LIST.reduce((acc, c) => {
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

          let entryAch = 0;
          let entryProj = 0;
          
          if (selectedBusinessBranch === 'all' || selectedBusinessBranch === b.id) {
              entry.items.forEach(item => {
                  let prod = (item.product || 'Personal Loan').trim();
                  
                  // Standardize product names to match PRODUCTS_LIST exactly so they show up on the charts
                  const pLower = prod.toLowerCase();
                  if (pLower === 'mortgage' || pLower === 'home loan' || pLower.includes('housing')) prod = 'Housing Loan/LAP';
                  else if (pLower.includes('mutual') || pLower.includes('sip')) prod = 'Mutual Fund/SIP';
                  else if (pLower.startsWith('personal loan') || pLower.startsWith('pl')) prod = 'Personal Loan';
                  else if (pLower.startsWith('business loan') || pLower.startsWith('bl')) prod = 'Business Loan';
                  else if (pLower.includes('life insurance')) prod = 'Life Insurance';
                  else if (pLower.includes('general insurance')) prod = 'General Insurance';
                  else if (pLower.includes('livlong')) prod = 'Livlong Loan Protector';
                  else if (pLower.includes('forex')) prod = 'Retail Forex';
                  else if (pLower.includes('gst')) prod = 'GST filing';
                  else if (pLower.includes('itr')) prod = 'ITR filing';

                  let achAmt = 0;
                  let projAmt = 0;
                  
                  if (item.category === 'Loan') {
                      achAmt = Number(item.disbursedAmount) || 0;
                      projAmt = Number(item.amount) || 0;
                  } else if (item.category === 'Insurance') {
                      achAmt = item.fileStatus === 'Issued' ? (Number(item.amount) || 0) : 0;
                      projAmt = Number(item.amount) || 0;
                  } else if (item.category === 'Investments' || item.category === 'Forex' || item.category === 'Consultancy') {
                      achAmt = Number(item.amount) || 0;
                      projAmt = Number(item.amount) || 0;
                  } else {
                      achAmt = Number(item.disbursedAmount) || Number(item.amount) || 0;
                      projAmt = Number(item.amount) || 0;
                  }

                  if (isAch) {
                      catMap.set(prod, (catMap.get(prod) || 0) + achAmt);
                      b[`ach_${prod}`] = (b[`ach_${prod}`] || 0) + achAmt;
                      b[`proj_${prod}`] = (b[`proj_${prod}`] || 0) + projAmt; // Line item login amounts act as projections
                      entryAch += achAmt;
                      entryProj += projAmt;
                  }
                  if (isProj) {
                      // Modal daily projections (often just category-level)
                      b[`proj_${prod}`] = (b[`proj_${prod}`] || 0) + (Number(item.amount) || 0);
                      entryProj += (Number(item.amount) || 0);
                  }
              });
          }
          
          b.dailyAchievement += entryAch;
          b.dailyProjection += entryProj;
          total += entryAch;
     });

     const fb = Array.from(branchMap.values());
     const rbC = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

     return { filteredBranches: fb, totalBusiness: total, businessByCategory: rbC };
  }, [filteredEntries, branches, selectedBusinessBranch]);

  const businessTimeSeries = useMemo(() => {
      const timeMap = new Map();
      const endDate = new Date(selectedDate);
      const activeProducts = new Set<string>();
      
      // Initialize map with 0 for all products for the last 7 days ending on selectedDate
      for (let i = 6; i >= 0; i--) {
          const d = new Date(endDate);
          d.setDate(endDate.getDate() - i);
          
          const initialProducts: Record<string, number> = {};
          PRODUCTS_LIST.forEach(p => initialProducts[p] = 0);
          timeMap.set(format(d, 'MMM dd'), initialProducts);
      }

      validEntries.forEach(entry => {
          const isAch = !entry.recordType || entry.recordType === 'achievement';
          if (!isAch) return;
          if (selectedBusinessBranch !== 'all' && entry.branchId !== selectedBusinessBranch) return;

          const entryDateObj = new Date(entry.entryDate);
          if (isNaN(entryDateObj.getTime())) return;

          const entryDateStr = format(entryDateObj, 'MMM dd');
          if (timeMap.has(entryDateStr)) {
              const dayData = timeMap.get(entryDateStr);
              
              entry.items.forEach(item => {
                  let prod = (item.product || 'Personal Loan').trim();
                  
                  const pLower = prod.toLowerCase();
                  if (pLower === 'mortgage' || pLower === 'home loan' || pLower.includes('housing')) prod = 'Housing Loan/LAP';
                  else if (pLower.includes('mutual') || pLower.includes('sip')) prod = 'Mutual Fund/SIP';
                  else if (pLower.startsWith('personal loan') || pLower.startsWith('pl')) prod = 'Personal Loan';
                  else if (pLower.startsWith('business loan') || pLower.startsWith('bl')) prod = 'Business Loan';
                  else if (pLower.includes('life insurance')) prod = 'Life Insurance';
                  else if (pLower.includes('general insurance')) prod = 'General Insurance';
                  else if (pLower.includes('livlong')) prod = 'Livlong Loan Protector';
                  else if (pLower.includes('forex')) prod = 'Retail Forex';
                  else if (pLower.includes('gst')) prod = 'GST filing';
                  else if (pLower.includes('itr')) prod = 'ITR filing';

                  let achAmt = 0;
                  if (item.category === 'Loan') achAmt = (Number(item.disbursedAmount) || 0);
                  else if (item.category === 'Insurance') achAmt = (item.fileStatus === 'Issued' ? (Number(item.amount) || 0) : 0);
                  else if (item.category === 'Investments' || item.category === 'Forex' || item.category === 'Consultancy') achAmt = (Number(item.amount) || 0);
                  else achAmt = (Number(item.disbursedAmount) || Number(item.amount) || 0);
                  
                  if (achAmt > 0) {
                      activeProducts.add(prod);
                      if (dayData[prod] !== undefined) {
                          dayData[prod] += achAmt;
                      }
                  }
              });
          }
      });

      return {
          data: Array.from(timeMap.entries()).map(([date, data]) => ({ date, ...data })),
          activeProducts: Array.from(activeProducts)
      };
  }, [validEntries, selectedDate, selectedBusinessBranch]);

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
     return PRODUCTS_LIST.filter(c => 
         filteredBranches.some((b: any) => (b[`proj_${c}`] || 0) > 0 || (b[`ach_${c}`] || 0) > 0)
     );
  }, [filteredBranches]);

  const granularData = useMemo(() => {
     const data: Record<string, { amount: number, count: number, target: number }> = {};
     
     products.forEach(p => {
         data[p.name] = { amount: 0, count: 0, target: 0 };
     });
     
     // 1. Calculate Targets
     branchTargets.forEach(bt => {
         if (granularLocation !== 'all' && bt.branchId !== granularLocation) return;
         
         const btYear = parseInt(bt.monthYear.split('-')[0]);
         const btMonth = parseInt(bt.monthYear.split('-')[1]) - 1;
         const btIsNewFY = btMonth >= 3;
         const btFyStart = btIsNewFY ? btYear : btYear - 1;

         let includeTarget = false;
         if (granularTimeframe === 'MTD') {
             includeTarget = (bt.monthYear === currentMonthStr);
         } else if (granularTimeframe === 'YTD') {
             const btDate = new Date(btYear, btMonth, 1);
             const sd = new Date(selectedYear, selectedMonth, 1);
             includeTarget = (btFyStart === fyStart && btDate <= sd);
         }

         if (includeTarget && bt.productTargets) {
             Object.entries(bt.productTargets).forEach(([pName, tAmt]) => {
                 // Try strict match first, fallback to standard mapping
                 let mappedProduct = pName.trim();
                 if (mappedProduct === 'Mortgage' || mappedProduct === 'Home Loan') mappedProduct = 'Housing Loan/LAP';
                 else if (mappedProduct === 'SIP & Mutual Fund' || mappedProduct === 'Mutual Fund / SIP') mappedProduct = 'Mutual Fund/SIP';
                 
                 if (data[mappedProduct]) {
                     data[mappedProduct].target += Number(tAmt) || 0;
                 }
             });
         }
     });

     // 2. Calculate Achievements
     validEntries.forEach(entry => {
         if (granularLocation !== 'all' && entry.branchId !== granularLocation) return;
         
         const isAch = !entry.recordType || entry.recordType === 'achievement';
         if (!isAch) return;

         const ed = new Date(entry.entryDate);
         const edYear = ed.getFullYear();
         const edMonth = ed.getMonth();
         const edIsNewFY = edMonth >= 3;
         const edFyStart = edIsNewFY ? edYear : edYear - 1;

         let includeAch = false;
         if (granularTimeframe === 'MTD') {
             includeAch = (edMonth === selectedMonth && edYear === selectedYear);
         } else if (granularTimeframe === 'YTD') {
             const sd = new Date(selectedDate);
             includeAch = (edFyStart === fyStart && ed <= sd);
         }
         if (!includeAch) return;

         entry.items.forEach(item => {
             const pName = (item.product || '').trim();
             
             let amt = 0;
             if (item.category === 'Loan') {
                 amt = Number(item.disbursedAmount) || 0;
             } else if (item.category === 'Insurance') {
                 amt = item.fileStatus === 'Issued' ? (Number(item.amount) || 0) : 0;
             } else if (item.category === 'Investments' || item.category === 'Forex' || item.category === 'Consultancy') {
                 amt = Number(item.amount) || 0;
             } else {
                 amt = Number(item.disbursedAmount) || Number(item.amount) || 0;
             }
             
             if (amt <= 0) return;
             
             let mappedProduct = pName;
             const exactProduct = products.find(p => p.name === pName);
             if (exactProduct) {
                 mappedProduct = exactProduct.name;
             } else {
                 if (pName === 'Mortgage' || pName === 'Home Loan') mappedProduct = 'Housing Loan/LAP';
                 else if (pName === 'SIP & Mutual Fund' || pName === 'Mutual Fund / SIP') mappedProduct = 'Mutual Fund/SIP';
                 else if (item.category === 'Forex') mappedProduct = 'Retail Forex';
             }

             if (data[mappedProduct]) {
                 data[mappedProduct].amount += amt;
                 data[mappedProduct].count++;
             }
         });
     });
     
     return data;
  }, [validEntries, granularLocation, granularTimeframe, products, branchTargets, currentMonthStr, fyStart, selectedMonth, selectedYear, selectedDate]);

  const maxYValue = useMemo(() => {
     let max = 0;
     filteredBranches.forEach((b: any) => {
         let projSum = 0;
         let achSum = 0;
         PRODUCTS_LIST.forEach(c => {
             projSum += (b[`proj_${c}`] || 0);
             achSum += (b[`ach_${c}`] || 0);
         });
         max = Math.max(max, projSum, achSum);
     });
     return max > 0 ? max : 1000;
  }, [filteredBranches]);

  const dataQuality = useMemo(() => {
     let totalItems = 0;
     let completeItems = 0;
     let missingFields = { dob: 0, email: 0, phone: 0, address: 0 };
     
     const filteredEntries = validEntries.filter(entry => {
         if (dqLocation !== 'all' && entry.branchId !== dqLocation) return false;
         
         const entryDate = new Date(entry.entryDate);
         const entryMonthStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
         if (entryMonthStr !== dqMonthStr) return false;
         
         return true;
     });

     filteredEntries.forEach(entry => {
         entry.items.forEach(item => {
             totalItems++;
             let isComplete = true;
             
             if (!item.customerDOB) { isComplete = false; missingFields.dob++; }
             if (!item.emailId) { isComplete = false; missingFields.email++; }
             if (!item.phoneNumber) { isComplete = false; missingFields.phone++; }
             if (!item.customerAddress) { isComplete = false; missingFields.address++; }
             
             if (isComplete) completeItems++;
         });
     });
     
     const score = totalItems > 0 ? Math.round((completeItems / totalItems) * 100) : 0;
     return { score, totalItems, completeItems, missingFields };
  }, [validEntries, dqLocation, dqMonthStr]);

  const renderCustomLegend = (props: any) => {
    return (
      <div className="flex flex-col gap-3 mt-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
        <div className="flex items-center gap-6 justify-center border-b border-slate-800/50 pb-2">
           <div className="flex items-center gap-2 flex-wrap mt-2 md:mt-0 w-full md:w-auto">
              <svg width="14" height="14" className="rounded-[2px] border border-slate-400">
                  <defs>
                      <pattern id="legend-stripe" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                          <line x1="0" y="0" x2="0" y2="4" stroke="#94a3b8" strokeWidth="2" />
                      </pattern>
                  </defs>
                  <rect width="14" height="14" fill="url(#legend-stripe)" />
              </svg>
              <span>Projection</span>
           </div>
           <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="w-[14px] h-[14px] bg-slate-500 rounded-[2px]"></div>
              <span>Achievement</span>
           </div>
        </div>
         {activeCategories.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center px-2">
             {activeCategories.map(c => (
                 <div key={c} className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PRODUCT_COLORS[c].ach }}></div>
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
      {/* Mobile View */}
      <div className="md:hidden font-sans text-slate-800 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Portal</h1>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">{financialYear}</span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex bg-slate-100 p-1 rounded-xl flex-1">
                <button 
                  onClick={() => setViewMode('daily')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  DAILY
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  MONTH
                </button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'year' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  YEAR
                </button>
              </div>

              <button 
                className="relative flex-shrink-0 flex items-center justify-center w-11 h-11 bg-indigo-600 text-white rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                onClick={() => setShowDatePicker(true)}
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex flex-col items-center border-r border-slate-100 pr-2 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-tight h-6 flex items-center justify-center">Projected Total Business Today</span>
                <span className="text-2xl font-mono font-black text-slate-900 mt-1">
                  ₹{projectedTotalBusinessToday.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">{selectedDate.split('-').reverse().join('-')}</span>
              </div>
              <div className="flex flex-col items-center pl-2 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-tight h-6 flex items-center justify-center">Total Achievement Today</span>
                <span className="text-2xl font-mono font-black text-emerald-500 mt-1">
                  ₹{(kpiMetrics['All Products']?.ftd || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">{selectedDate.split('-').reverse().join('-')}</span>
              </div>
            </div>
        </div>
      </div>
      
      <header className="hidden md:flex glass px-6 py-4 flex-col md:flex-row md:justify-between md:items-center gap-4">
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
              <button 
                className="flex items-center gap-2 bg-white dark:bg-black text-slate-900 dark:text-white px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 focus-within:ring-2 ring-indigo-500/50 shadow-sm transition-all cursor-pointer"
                onClick={() => setShowDatePicker(true)}
              >
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white px-1">
                   {selectedDate}
                </span>
                <div className="hidden sm:flex flex-col items-start ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </button>
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
                <span className="text-lg font-mono text-emerald-400 tracking-tight">₹{Object.values(kpiMetrics).reduce((sum, m) => sum + m.ftd, 0).toLocaleString('en-IN')}</span>
                <span className="text-[9px] text-slate-500 mt-0.5 font-mono">{selectedDate.split('-').reverse().join('-')}</span>
            </div>
        </div>
      </header>

      {/* KPI Category Selector (Desktop) */}
      <div className="hidden md:flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
         {['All Products', ...PRODUCTS_LIST].map(cat => (
            <button
               key={cat}
               onClick={() => setKpiCategory(cat)}
               className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border ${
                  kpiCategory === cat 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-white dark:bg-black/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-indigo-500/50'
               }`}
            >
               {cat}
            </button>
         ))}
      </div>

      {/* KPI Category Selector (Mobile - Swipeable Icons) */}
      <div className="md:hidden mb-6">
        <div className="flex gap-3 pb-2 px-1 w-full overflow-hidden relative">
          {/* Fixed "All Products" Button */}
          <div className="shrink-0" style={{ width: 'calc((100% - 36px) / 4)' }}>
            <button
               onClick={() => setKpiCategory('All Products')}
               className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm ${
                  kpiCategory === 'All Products' 
                  ? 'bg-indigo-600 text-white scale-100 shadow-md shadow-indigo-600/30 border border-indigo-600' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 scale-[0.96] hover:scale-[0.98] border border-slate-100 dark:border-white/5'
               }`}
            >
               <LayoutGrid className={`w-[clamp(20px,6vw,28px)] h-[clamp(20px,6vw,28px)] mb-1.5 transition-colors duration-300 ${kpiCategory === 'All Products' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} strokeWidth={2} />
               <div className="h-[2.4em] flex items-center justify-center w-full px-0.5">
                 <span className={`text-[clamp(8px,2.2vw,10px)] font-bold uppercase tracking-wider text-center leading-[1.2em] line-clamp-2 w-full break-words ${kpiCategory === 'All Products' ? 'text-indigo-50' : 'text-slate-600 dark:text-slate-300'}`}>
                   All Products
                 </span>
               </div>
            </button>
          </div>
          
          {/* Swipeable Container for other products */}
          <div 
            ref={categoryScrollRef}
            onScroll={(e) => {
              const container = e.currentTarget;
              const scrollLeft = container.scrollLeft;
              const maxScroll = container.scrollWidth - container.clientWidth;
              if (maxScroll > 0) {
                  const totalPages = Math.ceil(PRODUCTS_LIST.length / 3);
                  if (totalPages > 1) {
                      const scrollFraction = scrollLeft / maxScroll;
                      const activePage = Math.round(scrollFraction * (totalPages - 1));
                      setActiveCategoryPage(activePage);
                  } else {
                      setActiveCategoryPage(0);
                  }
              } else {
                  setActiveCategoryPage(0);
              }
            }}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar flex-1"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
             {PRODUCTS_LIST.map((cat) => {
                const Icon = PRODUCT_ICONS[cat] || LayoutGrid;
                const isActive = kpiCategory === cat;
                return (
                  <button
                     key={cat}
                     onClick={() => setKpiCategory(cat)}
                     className={`snap-start shrink-0 rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-sm ${
                        isActive 
                        ? 'bg-indigo-600 text-white scale-100 shadow-md shadow-indigo-600/30 border border-indigo-600' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 scale-[0.96] hover:scale-[0.98] border border-slate-100 dark:border-white/5'
                     }`}
                     style={{ width: 'calc((100% - 24px) / 3)', aspectRatio: '1/1' }}
                  >
                     <Icon className={`w-[clamp(20px,6vw,28px)] h-[clamp(20px,6vw,28px)] mb-1.5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} strokeWidth={2} />
                     <div className="h-[2.4em] flex items-center justify-center w-full px-0.5">
                       <span className={`text-[clamp(8px,2.2vw,10px)] font-bold uppercase tracking-wider text-center leading-[1.2em] line-clamp-2 w-full break-words ${isActive ? 'text-indigo-50' : 'text-slate-600 dark:text-slate-300'}`}>
                         {cat}
                       </span>
                     </div>
                  </button>
                );
             })}
          </div>
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-1.5 mt-2">
           {Array.from({ length: Math.ceil(PRODUCTS_LIST.length / 3) }).map((_, index) => (
             <div 
                key={index} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeCategoryPage === index 
                  ? 'w-4 bg-indigo-600 dark:bg-indigo-400' 
                  : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                }`}
             />
           ))}
        </div>
      </div>

      {/* KPI Timeline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="hover:dark:bg-white/5 bg-slate-900/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 flex flex-col gap-0.5 min-h-[2.5rem] justify-center">
              <span>FTD</span>
              <span className="truncate">{kpiCategory}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[clamp(14px,4vw,24px)] lg:text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter" title={`₹${(kpiMetrics[kpiCategory]?.ftd || 0).toLocaleString('en-IN')}`}>₹{(kpiMetrics[kpiCategory]?.ftd || 0).toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold bg-sky-500/10 inline-block px-2 py-0.5 rounded text-sky-700 dark:text-sky-300">{kpiMetrics[kpiCategory]?.ftdCount || 0} {kpiCategory === 'All Products' ? 'Entries' : kpiCategory.includes('Insurance') ? 'Policies' : kpiCategory.includes('Loan') ? 'Cases' : kpiCategory.includes('Mutual') ? 'Accounts' : kpiCategory.includes('Forex') ? 'Txns' : 'Entries'}</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex flex-col gap-0.5 min-h-[2.5rem] justify-center">
              <span>MTD</span>
              <span className="truncate">{kpiCategory}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[clamp(14px,4vw,24px)] lg:text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter" title={`₹${(kpiMetrics[kpiCategory]?.mtd || 0).toLocaleString('en-IN')}`}>₹{(kpiMetrics[kpiCategory]?.mtd || 0).toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold bg-indigo-500/10 inline-block px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">{kpiMetrics[kpiCategory]?.mtdCount || 0} {kpiCategory === 'All Products' ? 'Entries' : kpiCategory.includes('Insurance') ? 'Policies' : kpiCategory.includes('Loan') ? 'Cases' : kpiCategory.includes('Mutual') ? 'Accounts' : kpiCategory.includes('Forex') ? 'Txns' : 'Entries'}</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex flex-col gap-0.5 min-h-[2.5rem] justify-center">
              <span>YTD</span>
              <span className="truncate">{kpiCategory}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[clamp(14px,4vw,24px)] lg:text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter" title={`₹${(kpiMetrics[kpiCategory]?.ytd || 0).toLocaleString('en-IN')}`}>₹{(kpiMetrics[kpiCategory]?.ytd || 0).toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold bg-emerald-500/10 inline-block px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-300">{kpiMetrics[kpiCategory]?.ytdCount || 0} {kpiCategory === 'All Products' ? 'Entries' : kpiCategory.includes('Insurance') ? 'Policies' : kpiCategory.includes('Loan') ? 'Cases' : kpiCategory.includes('Mutual') ? 'Accounts' : kpiCategory.includes('Forex') ? 'Txns' : 'Entries'}</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors border-slate-900/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex flex-col gap-0.5 min-h-[2.5rem] justify-center">
              <span>Daily</span>
              <span>Proj.</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[clamp(14px,4vw,24px)] lg:text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter">
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
            <span className="text-base font-bold tracking-widest text-slate-900 dark:text-white uppercase">Branch Performance ({viewMode === 'daily' ? 'Daily' : viewMode === 'month' ? 'Monthly' : 'Yearly'})</span>
          </CardHeader>
          <CardContent className="flex-1 p-4 pb-0 flex flex-col">
            
            {/* Desktop View: Bar Chart */}
            <div className="hidden md:block flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredBranches} margin={{ top: 20, right: 10, left: 0, bottom: 0 }} barGap={4} barCategoryGap="25%">
                  <defs>
                     {PRODUCTS_LIST.map(p => (
                         <pattern key={`pattern_${p}`} id={getPatternId(p)} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                             <line x1="0" y="0" x2="0" y2="6" stroke={PRODUCT_COLORS[p].ach} strokeWidth="3" />
                         </pattern>
                     ))}
                  </defs>
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
                     <Bar key={`proj_${c}`} dataKey={`proj_${c}`} stackId="proj" name={`Proj. ${c}`} fill={PRODUCT_COLORS[c].proj} stroke={PRODUCT_COLORS[c].ach} strokeWidth={1} maxBarSize={50} />
                  ))}

                  {/* Achievement Stacks */}
                  {activeCategories.map(c => (
                     <Bar key={`ach_${c}`} dataKey={`ach_${c}`} stackId="ach" name={`Ach. ${c}`} fill={PRODUCT_COLORS[c].ach} maxBarSize={50} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Mobile View: Flipping Cards */}
            <div className="md:hidden flex flex-col gap-4 py-2 pb-6">
                {filteredBranches.map((branch: any) => (
                    <BranchFlipCard 
                        key={branch.name} 
                        branch={branch} 
                        productsList={PRODUCTS_LIST} 
                        productColors={PRODUCT_COLORS}
                        branchColor={BRANCH_COLORS[branch.name] || '#1e40af'}
                    />
                ))}
            </div>

          </CardContent>
        </Card>

        {/* Right Column: Mix */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Desktop Business Mix (Pie Chart) */}
            <Card className="hidden md:flex flex-col border-slate-900/10 dark:border-white/10 flex-1 min-h-[300px]">
              <CardHeader className="py-4 border-b border-slate-900/10 dark:border-white/10 shrink-0 flex flex-row items-center justify-between">
                <span className="text-base font-bold tracking-widest text-slate-900 dark:text-white uppercase">Business Mix</span>
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
                        const color = PRODUCT_COLORS[entry.name]?.ach || '#94a3b8';
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
                      const color = PRODUCT_COLORS[entry.name]?.ach || '#94a3b8';
                      return (
                          <div key={entry.name} className="flex items-center text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                              <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: color }}></span>
                              {entry.name}
                          </div>
                      );
                  })}
              </div>
            </Card>

            {/* Mobile Business Mix (Area Chart) */}
            <Card className="md:hidden flex flex-col border-slate-900/10 dark:border-white/10 flex-1 min-h-[350px]">
              <CardHeader className="py-4 border-b border-slate-900/10 dark:border-white/10 shrink-0 flex flex-row items-center justify-between">
                <span className="text-base font-bold tracking-widest text-slate-900 dark:text-white uppercase">Sales Overview</span>
                <div className="flex items-center gap-3">
                    <BranchSelect 
                        value={selectedBusinessBranch}
                        onChange={setSelectedBusinessBranch}
                        branches={branches}
                        includeAllOption={true}
                        allOptionText="All Branches"
                        className="w-[110px]"
                    />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4">
                <div className="mb-4">
                  <p className="text-xs text-slate-500 font-medium mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">₹{(totalBusiness || 0).toLocaleString('en-IN')}</h3>
                </div>
                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={businessTimeSeries.data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        {businessTimeSeries.activeProducts.map(prod => (
                            <linearGradient key={`grad_${prod}`} id={`color_${prod.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={PRODUCT_COLORS[prod]?.ach || '#4f46e5'} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={PRODUCT_COLORS[prod]?.ach || '#4f46e5'} stopOpacity={0}/>
                            </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                      <YAxis hide={true} />
                      <RechartsTooltip 
                        contentStyle={{backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                        formatter={(value: any, name: any) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, name]}
                        labelStyle={{color: '#64748b', fontSize: '12px', marginBottom: '4px'}}
                      />
                      {businessTimeSeries.activeProducts.map(prod => (
                          <Area 
                              key={prod}
                              type="monotone" 
                              dataKey={prod} 
                              stackId="1" 
                              stroke={PRODUCT_COLORS[prod]?.ach || '#4f46e5'} 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill={`url(#color_${prod.replace(/[^a-zA-Z0-9]/g, '')})`} 
                          />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <div className="px-6 pb-6 flex flex-wrap gap-4 justify-center mt-auto shrink-0 pt-4">
                  {businessTimeSeries.activeProducts.map((prod) => {
                      const color = PRODUCT_COLORS[prod]?.ach || '#94a3b8';
                      return (
                          <div key={prod} className="flex items-center text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                              <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: color }}></span>
                              {prod}
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
                             onChange={(e: any) => setSelectedDate(e.target.value)}
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
             {/* Desktop Funnel View */}
             <div className="hidden md:flex flex-col items-center w-full max-w-3xl mx-auto py-2">
                 
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

             {/* Mobile Vertical Stepper View */}
             <div className="flex md:hidden flex-col items-stretch w-full max-w-md mx-auto py-2 gap-0 relative">
                 {/* Vertical line connecting the steps */}
                 <div className="absolute left-[31px] top-10 bottom-10 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>

                 {/* Stage 1: Logged */}
                 <div className="relative z-10 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-4">
                     <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] shrink-0"></div>
                     <div className="flex flex-col">
                         <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Logged</span>
                         <span className="text-xl font-mono font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">₹{loanFunnelData.logged.value.toLocaleString('en-IN')}</span>
                         <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{loanFunnelData.logged.count} Applications</span>
                     </div>
                 </div>

                 {/* Conversion 1 */}
                 <div className="relative z-10 flex items-center pl-[52px] mb-4">
                     <div className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5">
                         <ArrowDown className="w-3 h-3 text-slate-400" />
                         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{loanFunnelData.sanctioned.conversion}% Conversion</span>
                     </div>
                 </div>

                 {/* Stage 2: Sanctioned */}
                 <div className="relative z-10 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-4">
                     <div className="w-4 h-4 rounded-full bg-indigo-400 shrink-0"></div>
                     <div className="flex flex-col">
                         <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Sanctioned</span>
                         <span className="text-xl font-mono font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">₹{loanFunnelData.sanctioned.value.toLocaleString('en-IN')}</span>
                         <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{loanFunnelData.sanctioned.count} Approvals</span>
                     </div>
                 </div>

                 {/* Conversion 2 */}
                 <div className="relative z-10 flex items-center pl-[52px] mb-4">
                     <div className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5">
                         <ArrowDown className="w-3 h-3 text-slate-400" />
                         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{loanFunnelData.disbursed.conversion}% Conversion</span>
                     </div>
                 </div>

                 {/* Stage 3: Disbursed */}
                 <div className="relative z-10 flex items-center gap-4 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 shadow-sm">
                     <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0"></div>
                     <div className="flex flex-col">
                         <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Disbursed</span>
                         <span className="text-xl font-mono font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">₹{loanFunnelData.disbursed.value.toLocaleString('en-IN')}</span>
                         <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{loanFunnelData.disbursed.count} Funded</span>
                     </div>
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
                        validEntries.forEach(e => {
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
                                    <div className="z-10">
                                        <button 
                                            onClick={() => {
                                                setProductTargetModal({
                                                    isOpen: true,
                                                    branchId: b.id,
                                                    branchName: b.name,
                                                    isEdit: b.targetAmt === 0 && user?.role === 'admin'
                                                });
                                                const currentTargetRecord = branchTargets.find(t => t.branchId === b.id && t.monthYear === targetMonthStr);
                                                const pt = (currentTargetRecord?.productTargets || {}) as Record<string, any>;
                                                const initialInputs: Record<string, string> = {};
                                                products.forEach(p => {
                                                    initialInputs[p.name] = pt[p.name] !== undefined ? pt[p.name].toString() : '';
                                                });
                                                setModalTargetInputs(initialInputs);
                                            }}
                                            className={`text-xs font-mono font-bold px-2 py-1 rounded transition-colors ${
                                                b.targetAmt > 0 
                                                ? 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800' 
                                                : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700'
                                            }`}
                                        >
                                            {b.targetAmt > 0 ? `₹${b.targetAmt.toLocaleString('en-IN')}` : (user?.role === 'admin' ? 'Set Targets' : 'No Target Set')}
                                        </button>
                                    </div>
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
        </Card>
      </div>

      <hr className="my-10 border-slate-900/10 dark:border-white/10" />

      <div className="flex flex-col gap-4">
      <Card className="p-6 border-slate-900/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">Granular Tracking</h2>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Deeper insights</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                  {/* Location Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold shrink-0">Filter By:</span>
                      <button
                          onClick={() => setGranularLocation('all')}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${
                              granularLocation === 'all'
                                  ? 'bg-indigo-500 text-white shadow-sm'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                      >
                          Consolidated
                      </button>
                      {branches.map(b => (
                          <button
                              key={b.id}
                              onClick={() => setGranularLocation(b.id)}
                              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${
                                  granularLocation === b.id
                                      ? 'bg-indigo-500 text-white shadow-sm'
                                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                              }`}
                          >
                              {b.name}
                          </button>
                      ))}
                  </div>

                  {/* Timeframe Toggle */}
                  <div className="flex bg-slate-900/10 dark:bg-black/40 rounded-lg p-1 border border-slate-900/10 dark:border-white/10 shrink-0">
                      <button 
                          onClick={() => setGranularTimeframe('MTD')}
                          className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${granularTimeframe === 'MTD' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                      >MTD</button>
                      <button 
                          onClick={() => setGranularTimeframe('YTD')}
                          className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors ${granularTimeframe === 'YTD' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                      >YTD</button>
                  </div>
              </div>
          </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {[
              { cat: 'Loan', title: 'Loan Portfolio', colorClass: 'text-indigo-600 dark:text-indigo-400' },
              { cat: 'Insurance', title: 'Insurance Plans', colorClass: 'text-amber-600 dark:text-amber-400' },
              { cat: 'Forex', title: 'Forex Services', colorClass: 'text-emerald-600 dark:text-emerald-400' },
              { cat: 'Consultancy', title: 'Consulting', colorClass: 'text-sky-600 dark:text-sky-400' },
              { cat: 'Investments', title: 'Investments', colorClass: 'text-purple-600 dark:text-purple-400' }
          ].map(categoryInfo => {
              const catProducts = products.filter(p => p.category === categoryInfo.cat);
              if (catProducts.length === 0) return null;

              return (
                  <Card key={categoryInfo.cat} className="border-slate-900/10 dark:border-white/10 flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-slate-900/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${categoryInfo.colorClass}`}>{categoryInfo.title}</span>
                      </CardHeader>
                      <CardContent className="p-0 flex-1">
                          {catProducts.map(p => {
                              const stats = granularData[p.name] || { amount: 0, count: 0, target: 0 };
                              const progress = stats.target > 0 ? (stats.amount / stats.target) * 100 : (stats.amount > 0 ? 100 : 0);

                              return (
                                  <div key={p.id} className="flex flex-col px-3 py-3 border-b border-slate-900/5 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                      <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[10px] uppercase font-bold text-slate-800 dark:text-slate-300 pr-2 leading-tight">{p.name}</span>
                                          <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stats.count} {stats.count === 1 ? 'Entry' : 'Entries'}</span>
                                      </div>
                                      
                                      <div className="flex items-end justify-between mt-1">
                                          <div className="flex flex-col">
                                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Achieved</span>
                                              <span className="text-sm font-mono font-bold text-emerald-500 dark:text-emerald-400 leading-none">₹{stats.amount.toLocaleString('en-IN')}</span>
                                          </div>
                                          
                                          <div className="flex flex-col items-end">
                                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Target</span>
                                              <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 leading-none">₹{stats.target.toLocaleString('en-IN')}</span>
                                          </div>
                                      </div>

                                      {stats.target > 0 && (
                                          <div className="w-full h-1.5 bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden mt-2 relative">
                                              <div className={`h-full rounded-full transition-all duration-500 ${stats.amount >= stats.target ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </CardContent>
                  </Card>
              );
          })}
      </div>
      </div>
      
      <hr className="my-10 border-slate-900/10 dark:border-white/10" />

      {/* Data Quality Dashboard */}
      <Card className="p-6 md:p-8 border-slate-900/10 dark:border-white/10 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 shadow-lg relative overflow-hidden group mb-8 rounded-2xl">
        <div className="absolute -top-12 -right-12 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
           <Info className="w-64 h-64 text-indigo-500" />
        </div>
        
        {/* Filters */}
        <div className="relative z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Info className="w-6 h-6" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Data Quality Index</h2>
                        <div className="group/tooltip relative flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs cursor-help hover:bg-indigo-500 hover:text-white transition-colors">?</div>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed">
                                Measures the completeness of customer records. A high score means entries have Customer DOB, Email, Phone, and Address fully populated. This is critical for future CRM deployments, targeted marketing, and accurate MIS reporting.
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ensure complete KYC profiles for better relationship management.</p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <input 
                    type="month"
                    value={dqMonthStr}
                    onChange={(e) => setDqMonthStr(e.target.value)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                />
                <select 
                    value={dqLocation}
                    onChange={(e) => setDqLocation(e.target.value)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                >
                    <option value="all">All Locations</option>
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {dataQuality.totalItems === 0 ? (
            <div className="relative z-10 flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Info className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Entries Found</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm mt-2">There is no customer data recorded for this specific location and month. Change the filters above to see data quality metrics.</p>
            </div>
        ) : (
            <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-16 items-center">
                {/* Score Display */}
                <div className="flex flex-col items-center justify-center min-w-[240px] p-6 bg-white dark:bg-slate-950/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform drop-shadow-md" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${dataQuality.score * 2.827} 282.7`} strokeLinecap="round" className={`${dataQuality.score >= 90 ? 'text-emerald-500' : dataQuality.score >= 70 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1500 ease-out`} />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-4xl font-mono font-black text-slate-900 dark:text-white drop-shadow-sm">{dataQuality.score}%</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Health Score</span>
                        </div>
                    </div>
                    <div className="mt-5 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 tracking-wider">
                            {dataQuality.completeItems} / {dataQuality.totalItems} Complete Entries
                        </span>
                    </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="flex-1 w-full">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Missing Fields Breakdown</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-950/50 border-b-2 border-rose-200 dark:border-rose-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-rose-500 dark:text-rose-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Date of Birth</span>
                            </div>
                            <span className="text-2xl font-mono font-black text-slate-800 dark:text-slate-200">{dataQuality.missingFields.dob}</span>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-950/50 border-b-2 border-amber-200 dark:border-amber-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-amber-500 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Email ID</span>
                            </div>
                            <span className="text-2xl font-mono font-black text-slate-800 dark:text-slate-200">{dataQuality.missingFields.email}</span>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-950/50 border-b-2 border-sky-200 dark:border-sky-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-sky-500 dark:text-sky-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Phone Number</span>
                            </div>
                            <span className="text-2xl font-mono font-black text-slate-800 dark:text-slate-200">{dataQuality.missingFields.phone}</span>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-950/50 border-b-2 border-purple-200 dark:border-purple-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-purple-500 dark:text-purple-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Customer Address</span>
                            </div>
                            <span className="text-2xl font-mono font-black text-slate-800 dark:text-slate-200">{dataQuality.missingFields.address}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </Card>
      {productTargetModal && productTargetModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-xl w-full text-slate-900 dark:text-white">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                              {productTargetModal.isEdit ? 'Lodge Product Targets' : 'Product Targets Breakdown'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                              {productTargetModal.branchName} • {new Date(targetMonthStr + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </p>
                      </div>
                      <button 
                          onClick={() => setProductTargetModal(null)}
                          className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {products.map(p => {
                          // Calculate MTD achievement for this specific product
                          const [tYearStr, tMonthStr] = targetMonthStr.split('-');
                          const tYear = parseInt(tYearStr);
                          const tMonth = parseInt(tMonthStr) - 1;
                          
                          let ach = 0;
                          entries.forEach(e => {
                              if (e.branchId !== productTargetModal.branchId) return;
                              const isAch = !e.recordType || e.recordType === 'achievement';
                              if (!isAch) return;
                              const ed = new Date(e.entryDate);
                              if (ed.getMonth() === tMonth && ed.getFullYear() === tYear) {
                                  e.items.forEach(item => {
                                      const pName = (item.product || '').trim();
                                      const amount = Number(item.disbursedAmount) || 0;

                                      if (item.category === p.category) {
                                          if (pName === p.name || pName.toLowerCase().startsWith(p.name.toLowerCase())) {
                                              ach += amount;
                                          }
                                      }
                                  });
                              }
                          });

                          const targetVal = Number(modalTargetInputs[p.name] || 0);
                          const progress = targetVal > 0 ? (ach / targetVal) * 100 : (ach > 0 ? 100 : 0);

                          return (
                              <div key={p.name} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{p.category}</span>
                                      </div>
                                      
                                      {productTargetModal.isEdit ? (
                                          <div className="flex items-center gap-1.5">
                                              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">₹</span>
                                              <Input
                                                  type="text"
                                                  value={modalTargetInputs[p.name] ? Number(modalTargetInputs[p.name]).toLocaleString('en-IN') : ''}
                                                  onChange={(e: any) => {
                                                      const raw = e.target.value.replace(/,/g, '');
                                                      if (raw === '' || !isNaN(Number(raw))) {
                                                          setModalTargetInputs(prev => ({ ...prev, [p.name]: raw }));
                                                      }
                                                  }}
                                                  className="h-8 w-32 px-2 py-1 text-xs text-right font-mono font-bold bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                                  placeholder="Target"
                                              />
                                          </div>
                                      ) : (
                                          <div className="flex flex-col items-end">
                                              <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                                  ₹{targetVal.toLocaleString('en-IN')}
                                              </span>
                                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Target</span>
                                          </div>
                                      )}
                                  </div>

                                  <div className="flex justify-between items-center text-xs mt-1 text-slate-500 dark:text-slate-400">
                                      <span>Achieved: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">₹{ach.toLocaleString('en-IN')}</span></span>
                                      {targetVal > 0 && (
                                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress.toFixed(1)}%</span>
                                      )}
                                  </div>
                                  
                                  {targetVal > 0 && (
                                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }}></div>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>

                  {/* Summary Total */}
                  <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Target:</span>
                      <span className="text-xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                          ₹{products.reduce((sum, p) => sum + Number(modalTargetInputs[p.name] || 0), 0).toLocaleString('en-IN')}
                      </span>
                  </div>

                  <div className="flex gap-3 mt-6">
                      <button 
                          onClick={() => setProductTargetModal(null)}
                          className="flex-1 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                          {productTargetModal.isEdit ? 'Cancel' : 'Close'}
                      </button>
                      
                      {productTargetModal.isEdit ? (
                          <button 
                              onClick={async () => {
                                  setSavingTargets(true);
                                  const totalAmt = products.reduce((sum, p) => sum + Number(modalTargetInputs[p.name] || 0), 0);
                                  const productTargetsObj: Record<string, number> = {};
                                  products.forEach(p => {
                                      productTargetsObj[p.name] = Number(modalTargetInputs[p.name] || 0);
                                  });
                                  const success = await setBranchTarget(
                                      productTargetModal.branchId,
                                      targetMonthStr,
                                      totalAmt,
                                      user?.id || '',
                                      productTargetsObj
                                  );
                                  setSavingTargets(false);
                                  if (success) {
                                      setProductTargetModal(null);
                                      alert('Product targets successfully lodged!');
                                  } else {
                                      alert('Failed to save targets. Please try again.');
                                  }
                              }}
                              disabled={savingTargets}
                              className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                              {savingTargets ? 'Saving...' : 'Save Targets'}
                          </button>
                      ) : (
                          user?.role === 'admin' && (
                              <button 
                                  onClick={() => {
                                      setProductTargetModal(prev => prev ? { ...prev, isEdit: true } : null);
                                  }}
                                  className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                  Edit Targets
                              </button>
                          )
                      )}
                  </div>
              </div>
          </div>
      )}

      {showDatePicker && (
        <CustomDatePicker 
          selectedDate={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </>
  );
}
