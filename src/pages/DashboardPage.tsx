import { useDataStore } from '@/store/useDataStore';
import { useAuthStore, INITIAL_AUTHORIZED_USERS } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { Calendar, X, Info, MapPin, LayoutGrid, User, Briefcase, Home, HeartPulse, Shield, ShieldCheck, TrendingUp, DollarSign, FileText, FileCheck, ArrowDown, Zap, BarChart3, Trophy, Target, Award, Sparkles, Percent, Activity, Coins, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { BranchSelect } from '@/components/BranchSelect';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { MonthPicker } from '@/components/ui/month-picker';
import { StatCards, type Stat } from '@/components/application/dashboard/stat-cards';
import { ProductsCard, CATEGORIES } from '@/components/application/dashboard/products-card';
import { ChevronDownSmall } from '@/components/foundations/icons/chevrons';
import { BranchPerformanceOrdersCard, type BranchDataPoint } from '@/components/application/dashboard/branch-performance-orders-card';
import { BusinessMixRadialCard, type RadialMixItem } from '@/components/application/dashboard/business-mix-radial-card';
import { StageBarsCard, type StageBar } from '@/components/application/charts/stage-bars-card';
import { LoanFunnelChart } from '@/components/application/dashboard/loan-funnel-chart';
import {
  RiFlashlightFill,
  RiBarChart2Fill,
  RiTrophyFill,
  RiFocus3Fill,
  RiShieldCheckLine,
  RiBriefcaseLine,
  RiBuilding2Line,
  RiStore2Line,
  RiBankLine,
  RiBuilding4Line,
} from '@remixicon/react';
import { cx } from '@/utils/cx';
import { toast } from '@/components/base/toast/toast';
const COLORS = ['#20535a', '#34d399', '#3b8c96', '#fbbf24', '#f472b6']; // indigo-400, emerald-400, sky-400, amber-400, pink-400

const BRANCH_COLORS: Record<string, string> = {
  'Guwahati': '#20535a',
  'Manipur': '#34d399',
  'Itanagar': '#3b8c96',
  'Nagaland & Mizoram': '#fbbf24'
};

const getPatternId = (name: string) => `pattern_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;

const PRODUCT_COLORS: Record<string, { proj: string, ach: string, textDark: string }> = {
  'Personal Loan': { proj: `url(#${getPatternId('Personal Loan')})`, ach: '#20535a', textDark: '#0d282c' }, // Deep Petrol Teal
  'Business Loan': { proj: `url(#${getPatternId('Business Loan')})`, ach: '#ea580c', textDark: '#7c2d12' }, // Orange
  'Housing Loan/LAP': { proj: `url(#${getPatternId('Housing Loan/LAP')})`, ach: '#16a34a', textDark: '#14532d' }, // Green
  'MSME Working Capital': { proj: `url(#${getPatternId('MSME Working Capital')})`, ach: '#2b6d76', textDark: '#143d43' }, // Deep Teal
  'MSME Term Loan': { proj: `url(#${getPatternId('MSME Term Loan')})`, ach: '#d97706', textDark: '#78350f' }, // Amber
  'Life Insurance': { proj: `url(#${getPatternId('Life Insurance')})`, ach: '#dc2626', textDark: '#7f1d1d' }, // Red
  'General Insurance': { proj: `url(#${getPatternId('General Insurance')})`, ach: '#3b8c96', textDark: '#163b41' }, // Vibrant Teal
  'Livlong Loan Protector': { proj: `url(#${getPatternId('Livlong Loan Protector')})`, ach: '#0891b2', textDark: '#164e63' }, // Cyan
  'Mutual Fund/SIP': { proj: `url(#${getPatternId('Mutual Fund/SIP')})`, ach: '#ca8a04', textDark: '#713f12' }, // Yellow
  'Retail forex sales': { proj: `url(#${getPatternId('Retail forex sales')})`, ach: '#db2777', textDark: '#831843' }, // Pink
  'Retail forex purchase': { proj: `url(#${getPatternId('Retail forex purchase')})`, ach: '#9d174d', textDark: '#4c0519' }, // Dark Pink
  'Student Forex Card': { proj: `url(#${getPatternId('Student Forex Card')})`, ach: '#ec4899', textDark: '#831843' }, // Rose Pink
  'Private Forex Card': { proj: `url(#${getPatternId('Private Forex Card')})`, ach: '#be185d', textDark: '#500724' }, // Deep Rose
  'Remittance': { proj: `url(#${getPatternId('Remittance')})`, ach: '#4fa8b2', textDark: '#20535a' }, // Luminous Teal
  'GST filing': { proj: `url(#${getPatternId('GST filing')})`, ach: '#0d9488', textDark: '#134e4a' }, // Teal
  'ITR filing': { proj: `url(#${getPatternId('ITR filing')})`, ach: '#65a30d', textDark: '#3f6212' } // Lime
};

const PRODUCTS_LIST = Object.keys(PRODUCT_COLORS);

const PRODUCT_ICONS: Record<string, any> = {
  'All Products': LayoutGrid,
  'Personal Loan': User,
  'Business Loan': Briefcase,
  'Housing Loan/LAP': Home,
  'MSME Working Capital': Briefcase,
  'MSME Term Loan': Briefcase,
  'Life Insurance': HeartPulse,
  'General Insurance': Shield,
  'Livlong Loan Protector': ShieldCheck,
  'Mutual Fund/SIP': TrendingUp,
  'Retail forex sales': DollarSign,
  'Retail forex purchase': DollarSign,
  'Student Forex Card': DollarSign,
  'Private Forex Card': DollarSign,
  'Remittance': DollarSign,
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
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl shadow-2xl min-w-[220px]">
        <p className="text-slate-900 dark:text-white font-black text-xs tracking-widest uppercase mb-3 border-b border-slate-200 dark:border-slate-700/80 pb-2">{label}</p>
        <div className="flex flex-col gap-2.5">
          {validPayloads.map((p: any, index: number) => {
            const isProj = p.name.startsWith('Proj.');
            const prodName = p.name.replace('Proj. ', '').replace('Ach. ', '');
            const solidColor = PRODUCT_COLORS[prodName]?.ach || p.color || '#000';

            return (
              <div key={index} className="flex items-center justify-between gap-6 text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                  <div className="w-3 h-3 rounded-[3px] flex-shrink-0" style={{
                    backgroundColor: isProj ? 'transparent' : solidColor,
                    border: isProj ? `1px solid ${solidColor}` : 'none',
                    backgroundImage: isProj ? `repeating-linear-gradient(45deg, transparent, transparent 1px, ${solidColor} 1px, ${solidColor} 2px)` : 'none',
                    boxShadow: isProj ? 'none' : `0 0 8px ${solidColor}40`
                  }}></div>
                  <span className="flex gap-1.5 items-center">
                    <span className="font-bold text-slate-800 dark:text-white">{isProj ? 'PROJ.' : 'ACH.'}</span>
                    <span className="opacity-80">{prodName}</span>
                  </span>
                </span>
                <span className="text-slate-900 dark:text-white font-mono font-bold tracking-tight">₹{Number(p.value).toLocaleString('en-IN')}</span>
              </div>
            );
          })}
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
  const {
    user,
    authorizedUsers,
    isInitialized,
    activePerspective,
    activeManagerBranch,
    activeManagerBranchId,
    setActivePerspective,
    setActiveManagerBranch,
  } = useAuthStore();
  const navigate = useNavigate();

  const userFirstName = useMemo(() => {
    if (!user) return 'Admin';
    const effectiveEmail = (user.email || '').toLowerCase().trim();
    const list = authorizedUsers || INITIAL_AUTHORIZED_USERS;
    const matched = list.find((u) => u.email.toLowerCase() === effectiveEmail);
    if (matched?.name) {
      return matched.name.split(' ')[0];
    }
    if (user.displayName) {
      return user.displayName.split(' ')[0];
    }
    if (user.role === 'admin') return 'Admin';
    if (user.role === 'manager') return 'Manager';
    return 'User';
  }, [user, authorizedUsers]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isRealAdmin =
    user?.role === 'admin' ||
    ['tomas@siroiforex.com', 'surchanddsingh@siroiforex.com', 'sharjuthoudam@siroiforex.com', 'executive@siroiforex.com'].includes(
      user?.email?.toLowerCase() || ''
    );
  const isRealManager = user?.role === 'manager';

  // Effective manager scoping: active if manager user OR admin previewing manager perspective
  const isManager = isRealManager || (isRealAdmin && activePerspective === 'manager');
  const managerBranchId = isRealManager ? (user?.branchId || 'b1') : (activeManagerBranchId || 'b1');
  const managerBranchObj = branches.find((b) => b.id === managerBranchId);
  const managerBranchName = isRealManager
    ? (managerBranchObj?.name || user?.latestLocation || 'Branch')
    : (activeManagerBranch || managerBranchObj?.name || 'Guwahati');

  const [viewMode, setViewMode] = useState<'daily' | 'month' | 'year'>('daily');
  const [selectedBusinessBranch, setSelectedBusinessBranch] = useState<string>(() =>
    isManager && managerBranchId ? managerBranchId : 'all'
  );
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>("All Categories");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
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

  // Granular Tracking State
  const [granularLocation, setGranularLocation] = useState<string>(() =>
    isManager && managerBranchId ? managerBranchId : 'all'
  );
  const [granularTimeframe, setGranularTimeframe] = useState<'MTD' | 'YTD'>('MTD');

  // Data Quality State
  const [dqLocation, setDqLocation] = useState<string>(() =>
    isManager && managerBranchId ? managerBranchId : 'all'
  );
  const [dqMonthStr, setDqMonthStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (isManager && managerBranchId) {
      setSelectedBusinessBranch(managerBranchId);
      setGranularLocation(managerBranchId);
      setDqLocation(managerBranchId);
    } else {
      setSelectedBusinessBranch('all');
      setGranularLocation('all');
      setDqLocation('all');
    }
  }, [isManager, managerBranchId]);

  // Secure routing (Admins & Branch Managers have Dashboard Access)
  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        navigate('/');
      } else if (user.role !== 'admin' && user.role !== 'manager') {
        navigate('/entry');
      }
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



  // Include all non-deleted entries without mutually exclusive daily/monthly overrides
  const validEntries = useMemo(() => {
    return entries.filter(e => !e.isDeleted);
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

      const entryProj = isProj ? entry.items.reduce((sum, i) => sum + ((i.category === 'Forex' || i.category === 'Consultancy') ? 0 : (Number(i.amount) || 0)), 0) : 0;

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
            achAmt = Number(item.disbursedAmount) || Number(item.amount) || 0;
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
    const branchesToProcess = isManager && managerBranchId
      ? branches.filter(b => b.id === managerBranchId)
      : branches;

    branchesToProcess.forEach(b => {
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
          else if (pLower.includes('msme working')) prod = 'MSME Working Capital';
          else if (pLower.includes('msme term')) prod = 'MSME Term Loan';
          else if (pLower.includes('life insurance')) prod = 'Life Insurance';
          else if (pLower.includes('general insurance')) prod = 'General Insurance';
          else if (pLower.includes('livlong')) prod = 'Livlong Loan Protector';
          else if (pLower.includes('student forex')) prod = 'Student Forex Card';
          else if (pLower.includes('private forex')) prod = 'Private Forex Card';
          else if (pLower.includes('remittance')) prod = 'Remittance';
          else if (pLower.includes('forex')) {
            prod = pLower.includes('purchase') ? 'Retail forex purchase' : 'Retail forex sales';
          }
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
          } else if (item.category === 'Investments' || item.category === 'Consultancy' || item.category === 'Forex') {
            achAmt = Number(item.amount) || Number(item.disbursedAmount) || 0;
            projAmt = (item.category === 'Consultancy') ? 0 : (Number(item.amount) || 0);
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
            let mappedProd = prod;
            if (prod === 'Grouped') {
              if (item.category === 'Loan') mappedProd = 'Personal Loan';
              else if (item.category === 'Insurance') mappedProd = 'Life Insurance';
              else if (item.category === 'Investments') mappedProd = 'Mutual Fund/SIP';
              else if (item.category === 'Forex') return; // Exclude Forex from projections per requirements
              else if (item.category === 'Consultancy') mappedProd = 'GST filing';
            }
            b[`proj_${mappedProd}`] = (b[`proj_${mappedProd}`] || 0) + (Number(item.amount) || 0);
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
  }, [filteredEntries, branches, selectedBusinessBranch, isManager, managerBranchId]);

  const branchOrdersData: BranchDataPoint[] = useMemo(() => {
    return filteredBranches.map((b: any) => {
      const productMix = PRODUCTS_LIST.map((prod) => ({
        name: prod,
        amount: Number(b[`ach_${prod}`]) || 0,
      })).filter((item) => item.amount > 0);

      return {
        label: b.name,
        projected: Number(b.dailyProjection) || 0,
        achieved: Number(b.dailyAchievement) || 0,
        productMix,
      };
    });
  }, [filteredBranches]);

  const businessMixRadialData: RadialMixItem[] = useMemo(() => {
    const total = businessByCategory.reduce((sum, item) => sum + item.value, 0);
    return businessByCategory
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return {
          label: item.name,
          value: item.value,
          pct,
        };
      });
  }, [businessByCategory]);

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
          else if (pLower.includes('msme working')) prod = 'MSME Working Capital';
          else if (pLower.includes('msme term')) prod = 'MSME Term Loan';
          else if (pLower.includes('life insurance')) prod = 'Life Insurance';
          else if (pLower.includes('general insurance')) prod = 'General Insurance';
          else if (pLower.includes('livlong')) prod = 'Livlong Loan Protector';
          else if (pLower.includes('student forex')) prod = 'Student Forex Card';
          else if (pLower.includes('private forex')) prod = 'Private Forex Card';
          else if (pLower.includes('remittance')) prod = 'Remittance';
          else if (pLower.includes('forex')) {
            prod = pLower.includes('purchase') ? 'Retail forex purchase' : 'Retail forex sales';
          }
          else if (pLower.includes('gst')) prod = 'GST filing';
          else if (pLower.includes('itr')) prod = 'ITR filing';

          let achAmt = 0;
          if (item.category === 'Loan') achAmt = (Number(item.disbursedAmount) || 0);
          else if (item.category === 'Insurance') achAmt = (item.fileStatus === 'Issued' ? (Number(item.amount) || 0) : 0);
          else if (item.category === 'Investments' || item.category === 'Consultancy' || item.category === 'Forex') achAmt = (Number(item.amount) || Number(item.disbursedAmount) || 0);
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

  const loanAnalyticsData = useMemo(() => {
    let loggedCount = 0, loggedVal = 0;
    let sanctionedCount = 0, sanctionedVal = 0;
    let disbursedCount = 0, disbursedVal = 0;
    let highestSingleLoan = 0;
    let highestLoanProduct = '';
    let highestLoanCustomer = '';

    // Sub-product tracking for loans
    const productStats: Record<string, {
      product: string;
      loggedVal: number;
      loggedCount: number;
      sanctionedVal: number;
      sanctionedCount: number;
      disbursedVal: number;
      disbursedCount: number;
      maxAmount: number;
      avgTicket: number;
      conversionRate: number;
    }> = {};

    const defaultLoanTypes = ['Personal Loan', 'Business Loan', 'Housing Loan/LAP', 'Livlong Loan Protector'];
    defaultLoanTypes.forEach(p => {
      productStats[p] = {
        product: p,
        loggedVal: 0,
        loggedCount: 0,
        sanctionedVal: 0,
        sanctionedCount: 0,
        disbursedVal: 0,
        disbursedCount: 0,
        maxAmount: 0,
        avgTicket: 0,
        conversionRate: 0
      };
    });

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

          let prod = (item.product || 'Personal Loan').trim();
          const pLower = prod.toLowerCase();
          if (pLower === 'mortgage' || pLower === 'home loan' || pLower.includes('housing')) prod = 'Housing Loan/LAP';
          else if (pLower.startsWith('personal loan') || pLower.startsWith('pl')) prod = 'Personal Loan';
          else if (pLower.startsWith('business loan') || pLower.startsWith('bl')) prod = 'Business Loan';
          else if (pLower.includes('livlong')) prod = 'Livlong Loan Protector';

          if (!productStats[prod]) {
            productStats[prod] = {
              product: prod,
              loggedVal: 0,
              loggedCount: 0,
              sanctionedVal: 0,
              sanctionedCount: 0,
              disbursedVal: 0,
              disbursedCount: 0,
              maxAmount: 0,
              avgTicket: 0,
              conversionRate: 0
            };
          }

          loggedCount++;
          loggedVal += amt;
          productStats[prod].loggedCount++;
          productStats[prod].loggedVal += amt;

          const effectiveAmt = disb > 0 ? disb : (sanc > 0 ? sanc : amt);
          if (effectiveAmt > highestSingleLoan) {
            highestSingleLoan = effectiveAmt;
            highestLoanProduct = prod;
            highestLoanCustomer = item.customerName || '';
          }
          if (amt > productStats[prod].maxAmount) {
            productStats[prod].maxAmount = amt;
          }

          if (sanc > 0 || disb > 0 || ['Sanctioned', 'Disbursed'].includes(status)) {
            sanctionedCount++;
            const sAmt = sanc > 0 ? sanc : amt;
            sanctionedVal += sAmt;
            productStats[prod].sanctionedCount++;
            productStats[prod].sanctionedVal += sAmt;
          }

          if (disb > 0 || status === 'Disbursed') {
            disbursedCount++;
            const dAmt = disb > 0 ? disb : (sanc > 0 ? sanc : amt);
            disbursedVal += dAmt;
            productStats[prod].disbursedCount++;
            productStats[prod].disbursedVal += dAmt;
          }
        }
      });
    });

    const productList = Object.values(productStats).map(p => {
      const conversionRate = p.loggedVal > 0 ? (p.disbursedVal / p.loggedVal) * 100 : (p.disbursedVal > 0 ? 100 : 0);
      const avgTicket = p.disbursedCount > 0
        ? p.disbursedVal / p.disbursedCount
        : (p.loggedCount > 0 ? p.loggedVal / p.loggedCount : 0);
      return {
        ...p,
        conversionRate: Number(conversionRate.toFixed(1)),
        avgTicket: Math.round(avgTicket)
      };
    }).filter(p => p.loggedCount > 0 || p.disbursedCount > 0 || ['Personal Loan', 'Business Loan', 'Housing Loan/LAP'].includes(p.product));

    const sancPct = loggedCount > 0 ? ((sanctionedCount / loggedCount) * 100).toFixed(1) : '0.0';
    const disbPct = sanctionedCount > 0 ? ((disbursedCount / sanctionedCount) * 100).toFixed(1) : '0.0';
    const netConversionPct = loggedVal > 0 ? ((disbursedVal / loggedVal) * 100).toFixed(1) : '0.0';
    const avgOverallTicket = disbursedCount > 0 ? Math.round(disbursedVal / disbursedCount) : (loggedCount > 0 ? Math.round(loggedVal / loggedCount) : 0);
    const pendingDisbursalVal = Math.max(0, sanctionedVal - disbursedVal);

    return {
      logged: { count: loggedCount, value: loggedVal },
      sanctioned: { count: sanctionedCount, value: sanctionedVal, conversion: sancPct },
      disbursed: { count: disbursedCount, value: disbursedVal, conversion: disbPct },
      netConversionPct,
      highestSingleLoan,
      highestLoanProduct,
      highestLoanCustomer,
      avgOverallTicket,
      pendingDisbursalVal,
      products: productList
    };
  }, [filteredEntries, selectedBusinessBranch]);

  const loanFunnelData = loanAnalyticsData;

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
        } else if (item.category === 'Investments' || item.category === 'Consultancy') {
          amt = Number(item.amount) || 0;
        } else if (item.category === 'Forex') {
          amt = Number(item.disbursedAmount) || 0;
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
          else if (item.category === 'Forex') {
            const pLow = pName.toLowerCase();
            if (pLow.includes('student')) mappedProduct = 'Student Forex Card';
            else if (pLow.includes('private')) mappedProduct = 'Private Forex Card';
            else if (pLow.includes('remittance')) mappedProduct = 'Remittance';
            else mappedProduct = pLow.includes('purchase') ? 'Retail forex purchase' : 'Retail forex sales';
          }
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
      {/* Top Welcome & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-title-1-semibold text-text-primary tracking-tight">
            Welcome {userFirstName}
          </h1>
          <p className="text-body-medium text-text-secondary mt-0.5">
            {isManager ? `${managerBranchName} Branch Management Overview` : 'All Branches Overview'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-caption-1-semibold px-2.5 py-1 rounded-full bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 border border-accent-500/30">
            {financialYear}
          </span>
          {isManager && (
            <span className="text-caption-1-semibold px-2.5 py-1 rounded-full bg-status-lime-background text-status-lime-text border border-status-lime-border flex items-center gap-1">
              <MapPin className="size-3" />
              {managerBranchName}
            </span>
          )}
        </div>
      </div>

      {/* Row 1: Branch Performance (Orders) & Products Showcase */}
      <div className="flex flex-col lg:flex-row gap-6 items-start mb-6 w-full">
        <BranchPerformanceOrdersCard
          className="flex-1 min-w-0 w-full h-[400px]"
          title={`Branch Performance (${viewMode === 'daily' ? 'Daily' : viewMode === 'month' ? 'Monthly' : 'Yearly'})`}
          data={branchOrdersData}
        />
        <ProductsCard
          className="w-full lg:w-[440px] shrink-0 h-[400px]"
          selectedProduct={kpiCategory}
          categoryFilter={selectedProductCategory}
          onSelectProduct={(productName) => {
            setKpiCategory((prev) => (prev === productName ? 'All Products' : productName));
          }}
          metrics={kpiMetrics}
        />
      </div>

      {/* Row 2: Business Mix Radial Card, Branch Targets (StageBarsCard), and Today's Operations Card */}
      <div className="flex flex-col lg:flex-row gap-6 items-start mb-6 w-full">
        {/* Left: Business Mix Radial Chart Card */}
        <BusinessMixRadialCard
          className="h-[329px] flex-1 min-w-0 w-full"
          data={businessMixRadialData}
          totalValue={totalBusiness}
        />

        {/* Center: Branch Targets StageBarsCard */}
        {(() => {
          const [tYearStr, tMonthStr] = targetMonthStr.split('-');
          const tYear = parseInt(tYearStr);
          const tMonth = parseInt(tMonthStr) - 1;

          const BRANCH_SHORT_LABELS: Record<string, string> = {
            'Guwahati': 'AS',
            'Manipur': 'MN',
            'Itanagar': 'AP',
            'Nagaland & Mizoram': 'NL&MZ',
          };

          const BRANCH_RADIAL_MAP: Record<string, { color: string; activeColor: string; icon: React.ReactNode }> = {
            'Guwahati': {
              color: '#4fa8b2', // Luminous Teal (from radial chart)
              activeColor: '#3b8c96',
              icon: <RiBuilding2Line className="size-3.5 shrink-0 text-white" aria-hidden />,
            },
            'Manipur': {
              color: '#d97706', // Bronze Amber (from radial chart)
              activeColor: '#b45309',
              icon: <RiStore2Line className="size-3.5 shrink-0 text-white" aria-hidden />,
            },
            'Itanagar': {
              color: '#20535a', // Petrol Teal (Brand Primary / radial core)
              activeColor: '#163b41',
              icon: <RiBankLine className="size-3.5 shrink-0 text-white" aria-hidden />,
            },
            'Nagaland & Mizoram': {
              color: '#f2c94c', // Warm Brand Gold (from radial chart)
              activeColor: '#ca8a04',
              icon: <RiBuilding4Line className="size-3.5 shrink-0 text-white" aria-hidden />,
            },
          };

          const FALLBACK_RADIAL_TONES = [
            { color: '#4fa8b2', activeColor: '#3b8c96' },
            { color: '#d97706', activeColor: '#b45309' },
            { color: '#20535a', activeColor: '#163b41' },
            { color: '#f2c94c', activeColor: '#ca8a04' },
            { color: '#10b981', activeColor: '#059669' },
            { color: '#2b6d76', activeColor: '#20535a' },
            { color: '#3b8c96', activeColor: '#2b6d76' },
            { color: '#be123c', activeColor: '#9f1239' },
          ];

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

          const branchStages: StageBar[] = branchData.map((b, i) => {
            const tone = BRANCH_RADIAL_MAP[b.name] || FALLBACK_RADIAL_TONES[i % FALLBACK_RADIAL_TONES.length];
            const icon = BRANCH_RADIAL_MAP[b.name]?.icon || (
              <RiBuilding2Line className="size-3.5 shrink-0 text-white" aria-hidden />
            );
            const shortLabel = BRANCH_SHORT_LABELS[b.name] || b.name.slice(0, 3).toUpperCase();
            const progress = Math.round(b.progress);
            return {
              label: b.name,
              shortLabel,
              value: b.targetAmt > 0 ? b.targetAmt : b.achSum,
              target: b.targetAmt,
              achieved: b.achSum,
              progress,
              color: tone.color,
              activeColor: tone.activeColor,
              icon,
            };
          });

          const totalTargets = branchStages.reduce((sum, s) => sum + s.value, 0);
          const totalAchieved = branchData.reduce((sum, b) => sum + b.achSum, 0);
          const delta = totalTargets > 0 ? (totalAchieved - totalTargets) / totalTargets : undefined;
          const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

          const handleStageClick = (stage: StageBar) => {
            const b = branchData.find((x) => x.name === stage.label);
            if (!b) return;
            setProductTargetModal({
              isOpen: true,
              branchId: b.id,
              branchName: b.name,
              isEdit: b.targetAmt === 0 && user?.role === 'admin',
            });
            const currentTargetRecord = branchTargets.find(
              (t) => t.branchId === b.id && t.monthYear === targetMonthStr
            );
            const pt = (currentTargetRecord?.productTargets || {}) as Record<string, any>;
            const initialInputs: Record<string, string> = {};
            products.forEach((p) => {
              initialInputs[p.name] = pt[p.name] !== undefined ? pt[p.name].toString() : '';
            });
            setModalTargetInputs(initialInputs);
          };

          return (
            <StageBarsCard
              title="Branch Targets"
              stages={branchStages}
              headline={totalTargets}
              delta={delta}
              format={formatCurrency}
              minimal={true}
              showIcons={false}
              showTiles={false}
              className="h-[329px] w-full lg:w-[340px] shrink-0"
              onStageClick={handleStageClick}
            />
          );
        })()}

        {/* Right: Today's Operations Card (Adjusted width) */}
        <div className="w-full lg:w-[380px] shrink-0 h-[329px] flex flex-col justify-between rounded-2xl bg-background-secondary-default p-4 border border-border-button-default shadow-xs">
          {/* Top Section: Header and Metric Cards grouped closely */}
          <div className="flex flex-col gap-2.5">
            <div className="px-1 pt-0.5">
              <p className="text-body-medium text-text-secondary font-medium">
                Today's operations
              </p>
            </div>

            {/* Projected Today & Achieved Today side-by-side */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2lg bg-background-inner-default p-3 border border-border-button-default shadow-card flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
                  Projected Today
                </span>
                <p className="text-title-1-semibold font-mono text-text-primary mt-1">
                  ₹{projectedTotalBusinessToday.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="rounded-2lg bg-background-inner-default p-3 border border-status-lime-border/40 shadow-card flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-status-lime-text">
                  Achieved Today
                </span>
                <p className="text-title-1-semibold font-mono text-status-lime-text mt-1">
                  ₹{Object.values(kpiMetrics).reduce((sum, m) => sum + m.ftd, 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Centralised Filter Section */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary px-1">
              Centralised Filter
            </span>

            {/* Daily / Month Wise / Year Wise Segmented Filter */}
            <div className="flex items-center bg-background-inner-default p-1 rounded-xl border border-border-button-default w-full">
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={cx(
                  "flex-1 py-1.5 text-caption-1-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center",
                  viewMode === 'daily'
                    ? "bg-accent-500 text-text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={cx(
                  "flex-1 py-1.5 text-caption-1-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center",
                  viewMode === 'month'
                    ? "bg-accent-500 text-text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Month Wise
              </button>
              <button
                type="button"
                onClick={() => setViewMode('year')}
                className={cx(
                  "flex-1 py-1.5 text-caption-1-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center",
                  viewMode === 'year'
                    ? "bg-accent-500 text-text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                Year Wise
              </button>
            </div>

            {/* Two Dropdowns: Branches and Categories */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {/* Branches Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  disabled={isManager}
                  onClick={() => {
                    setBranchDropdownOpen((prev) => !prev);
                    setCategoryDropdownOpen(false);
                  }}
                  className={cx(
                    "w-full flex items-center justify-between gap-1.5 rounded-2lg px-2.5 py-1.5 bg-background-inner-default hover:bg-background-tertiary-default border border-border-button-default transition-colors text-body-medium text-text-primary",
                    isManager ? "cursor-default opacity-85" : "cursor-pointer"
                  )}
                >
                  <span className="truncate text-left text-body-medium">
                    {isManager
                      ? managerBranchName
                      : selectedBusinessBranch === 'all'
                        ? 'All Branches'
                        : branches.find((b) => b.id === selectedBusinessBranch)?.name || 'All Branches'}
                  </span>
                  {!isManager && (
                    <ChevronDownSmall
                      className={cx(
                        "size-4 shrink-0 text-text-secondary transition-transform duration-200",
                        branchDropdownOpen && "rotate-180"
                      )}
                    />
                  )}
                </button>

                {branchDropdownOpen && !isManager && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setBranchDropdownOpen(false)}
                    />
                    <div className="absolute left-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 z-50 min-w-[170px] w-full rounded-2lg bg-background-primary-default p-1 shadow-popup border border-border-button-default max-h-[200px] overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBusinessBranch('all');
                          setBranchDropdownOpen(false);
                        }}
                        className={cx(
                          "w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-body-medium transition-colors cursor-pointer",
                          selectedBusinessBranch === 'all'
                            ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-semibold"
                            : "text-text-secondary hover:text-text-primary hover:bg-background-secondary-default"
                        )}
                      >
                        <span>All Branches</span>
                      </button>
                      {branches.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBusinessBranch(b.id);
                            setBranchDropdownOpen(false);
                          }}
                          className={cx(
                            "w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-body-medium transition-colors cursor-pointer",
                            selectedBusinessBranch === b.id
                              ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-semibold"
                              : "text-text-secondary hover:text-text-primary hover:bg-background-secondary-default"
                          )}
                        >
                          <span>{b.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryDropdownOpen((prev) => !prev);
                    setBranchDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-1.5 rounded-2lg px-2.5 py-1.5 bg-background-inner-default hover:bg-background-tertiary-default border border-border-button-default transition-colors text-body-medium text-text-primary cursor-pointer"
                >
                  <span className="truncate text-left text-body-medium">
                    {selectedProductCategory}
                  </span>
                  <ChevronDownSmall
                    className={cx(
                      "size-4 shrink-0 text-text-secondary transition-transform duration-200",
                      categoryDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {categoryDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCategoryDropdownOpen(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1.5 z-50 min-w-[170px] w-full rounded-2lg bg-background-primary-default p-1 shadow-popup border border-border-button-default max-h-[200px] overflow-y-auto">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedProductCategory(cat);
                            setCategoryDropdownOpen(false);
                          }}
                          className={cx(
                            "w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-body-medium transition-colors cursor-pointer",
                            selectedProductCategory === cat
                              ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-semibold"
                              : "text-text-secondary hover:text-text-primary hover:bg-background-secondary-default"
                          )}
                        >
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Date Picker Button */}
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-background-inner-default border border-border-button-default hover:border-border-button-hover shadow-xs transition-all cursor-pointer"
            title="Open Interactive Calendar"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300">
                <Calendar className="size-4" />
              </div>
              <span className="text-body-medium font-bold text-text-primary">
                {selectedDate}
              </span>
            </div>
            <span className="text-caption-1-semibold text-text-tertiary">
              {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </button>
        </div>
      </div>

      {/* BoardUI KPI Stat Cards */}
      {(() => {
        const dashboardKpiStats: Stat[] = [
          {
            icon: RiFlashlightFill,
            label: `FTD (${kpiCategory})`,
            value: `₹${(kpiMetrics[kpiCategory]?.ftd || 0).toLocaleString('en-IN')}`,
            delta: `${kpiMetrics[kpiCategory]?.ftdCount || 0} ${kpiCategory === 'All Products' ? 'Entries' : kpiCategory.includes('Insurance') ? 'Policies' : kpiCategory.includes('Loan') ? 'Cases' : kpiCategory.includes('Mutual') ? 'Accounts' : kpiCategory.includes('Forex') ? 'Txns' : 'Entries'}`,
            deltaColor: "lime",
            tone: "teal",
            caption: "Daily Pulse",
            hint: "For Selected Date across branches",
          },
          {
            icon: RiBarChart2Fill,
            label: `MTD (${kpiCategory})`,
            value: `₹${(kpiMetrics[kpiCategory]?.mtd || 0).toLocaleString('en-IN')}`,
            delta: `${kpiMetrics[kpiCategory]?.mtdCount || 0} ${kpiCategory === 'All Products' ? 'Entries' : kpiCategory.includes('Insurance') ? 'Policies' : kpiCategory.includes('Loan') ? 'Cases' : kpiCategory.includes('Mutual') ? 'Accounts' : kpiCategory.includes('Forex') ? 'Txns' : 'Entries'}`,
            deltaColor: "lime",
            tone: "teal",
            caption: "Monthly Target",
            hint: "Month-To-Date aggregated volume",
          },
          {
            icon: RiTrophyFill,
            label: `YTD (${kpiCategory})`,
            value: `₹${(kpiMetrics[kpiCategory]?.ytd || 0).toLocaleString('en-IN')}`,
            delta: `${kpiMetrics[kpiCategory]?.ytdCount || 0} ${kpiCategory === 'All Products' ? 'Entries' : kpiCategory.includes('Insurance') ? 'Policies' : kpiCategory.includes('Loan') ? 'Cases' : kpiCategory.includes('Mutual') ? 'Accounts' : kpiCategory.includes('Forex') ? 'Txns' : 'Entries'}`,
            deltaColor: "lime",
            tone: "teal",
            caption: "Annual Cum.",
            hint: "Financial Year Progress",
          },
          {
            icon: RiFocus3Fill,
            label: "Daily Target",
            value: `₹${filteredBranches.reduce((acc, b) => acc + b.dailyProjection, 0).toLocaleString('en-IN')}`,
            delta: isManager ? `${managerBranchName} Branch` : "All Branches",
            deltaColor: "neutral",
            tone: "teal",
            caption: "Today Target",
            hint: isManager ? `${managerBranchName} Forecast` : "Consolidated Forecast Pipeline",
          },
        ];
        return <StatCards variant="footer" stats={dashboardKpiStats} columns={4} />;
      })()}



      {/* Intelligence & Funnel Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 w-full items-start">

        {/* Loan Conversion & Portfolio Intelligence */}
        <section className="rounded-2xl bg-background-secondary-default p-5 md:p-6 border border-border-button-default shadow-xs flex flex-col w-full gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-title-2-medium text-text-primary">Loan Conversion & Intelligence</h3>
          </div>
          {/* 1. Flow Funnel Chart (Replaces old static boxes with BoardUI flow funnel) */}
          <LoanFunnelChart
            logged={loanAnalyticsData.logged}
            sanctioned={loanAnalyticsData.sanctioned}
            disbursed={loanAnalyticsData.disbursed}
            netConversionPct={loanAnalyticsData.netConversionPct}
          />

          {/* 2. Key Metric Quick-Stats Strip (4 Mini-KPIs) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-background-primary-default border border-border-button-default rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                <span>Highest Loan</span>
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="mt-2">
                <span className="text-base font-mono font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{loanAnalyticsData.highestSingleLoan.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 block truncate mt-0.5">
                  {loanAnalyticsData.highestLoanProduct || 'All Loans'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-background-primary-default border border-border-button-default rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                <span>Average Ticket</span>
                <Activity className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div className="mt-2">
                <span className="text-base font-mono font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{loanAnalyticsData.avgOverallTicket.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Per Disbursal Case</span>
              </div>
            </div>

            <div className="p-3.5 bg-background-primary-default border border-border-button-default rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                <span>Pipeline Yield</span>
                <Percent className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="mt-2">
                <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {loanAnalyticsData.netConversionPct}%
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Logged → Disbursed</span>
              </div>
            </div>

            <div className="p-3.5 bg-background-primary-default border border-border-button-default rounded-xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                <span>In Pipeline</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="mt-2">
                <span className="text-base font-mono font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{loanAnalyticsData.pendingDisbursalVal.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Ready for Disbursal</span>
              </div>
            </div>
          </div>

          {/* 3. Loan Product Breakdown Matrix (Sub-types logged & converted) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-separator-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Loan Product Conversion Breakdown
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Filtered Scope
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {loanAnalyticsData.products.map(prod => {
                const Icon = PRODUCT_ICONS[prod.product] || Briefcase;
                const colorObj = PRODUCT_COLORS[prod.product] || { ach: '#3b8c96' };

                return (
                  <div
                    key={prod.product}
                    className="p-3.5 rounded-xl border border-border-button-default bg-background-primary-default hover:border-border-button-hover transition-all flex flex-col justify-between shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: `${colorObj.ach}15`, color: colorObj.ach }}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{prod.product}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${prod.conversionRate >= 70 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : prod.conversionRate >= 40 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        {prod.conversionRate}% Conv
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-separator-border my-1">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Logged</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5">₹{prod.loggedVal.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-slate-400">({prod.loggedCount})</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Sanctioned</span>
                        <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 block mt-0.5">₹{prod.sanctionedVal.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-slate-400">({prod.sanctionedCount})</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Disbursed</span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">₹{prod.disbursedVal.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-slate-400">({prod.disbursedCount})</span>
                      </div>
                    </div>

                    {/* Progress Bar & Sub-Metrics */}
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-background-tertiary-default rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, prod.conversionRate)}%`,
                            backgroundColor: colorObj.ach
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
                        <span>Avg: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{prod.avgTicket.toLocaleString('en-IN')}</span></span>
                        <span>Max: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{prod.maxAmount.toLocaleString('en-IN')}</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Bottom Footer Bar: Timeframe • Branch dropdown and Net Realization */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-separator-border text-caption-1-semibold text-text-secondary">
            <div className="flex items-center flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                Timeframe:
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="ml-1 text-text-primary hover:text-accent-600 dark:hover:text-accent-400 transition-colors font-bold underline decoration-dotted decoration-border-button-default underline-offset-4 cursor-pointer"
                >
                  {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/(\d+)/, (match, p1) => {
                    const d = parseInt(p1);
                    const suffix = ["th", "st", "nd", "rd"][((d % 100) - 20) % 10] || ["th", "st", "nd", "rd"][d % 100] || "th";
                    return p1 + suffix;
                  })}
                </button>
              </span>
              <span className="text-text-tertiary mx-1">•</span>
              <span className="flex items-center gap-1.5">
                Branch:
                {isManager ? (
                  <span className="font-bold text-text-primary ml-1 px-2.5 py-0.5 rounded-full bg-background-tertiary-default text-accent-600 dark:text-accent-400">
                    {managerBranchName}
                  </span>
                ) : (
                  <BranchSelect
                    value={selectedBusinessBranch}
                    onChange={setSelectedBusinessBranch}
                    branches={branches}
                    includeAllOption={true}
                    allOptionText="Consolidated"
                    className="min-w-[175px] ml-1"
                  />
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption-1-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full font-bold">
                {loanAnalyticsData.netConversionPct}% Net Realization
              </span>
            </div>
          </div>
        </section>
      </div>

      <hr className="my-8 border-slate-200/80 dark:border-white/10" />

      <div className="flex flex-col gap-5">
        <Card className="p-5 md:p-6 border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Granular Product Intelligence</h2>
              </div>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">Deep Portfolio & Performance Breakdown</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Location Filter */}
              {isManager ? (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-xs">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{managerBranchName} Branch</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-extrabold mr-1 shrink-0">Branch:</span>
                  <button
                    onClick={() => setGranularLocation('all')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${granularLocation === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/60 dark:border-white/5'
                      }`}
                  >
                    Consolidated
                  </button>
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setGranularLocation(b.id)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${granularLocation === b.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/60 dark:border-white/5'
                        }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Timeframe Toggle */}
              <div className="flex bg-slate-100 dark:bg-black/40 rounded-xl p-1 border border-slate-200/80 dark:border-white/5 shadow-inner shrink-0">
                <button
                  onClick={() => setGranularTimeframe('MTD')}
                  className={`px-3.5 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all ${granularTimeframe === 'MTD' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-white/10' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >MTD</button>
                <button
                  onClick={() => setGranularTimeframe('YTD')}
                  className={`px-3.5 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all ${granularTimeframe === 'YTD' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-white/10' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >YTD</button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {[
            { cat: 'Loan', title: 'Loan Portfolio', colorClass: 'text-accent-600 dark:text-accent-400' },
            { cat: 'Insurance', title: 'Insurance Plans', colorClass: 'text-amber-600 dark:text-amber-400' },
            { cat: 'Forex', title: 'Forex Services', colorClass: 'text-emerald-600 dark:text-emerald-400' },
            { cat: 'Consultancy', title: 'Consulting', colorClass: 'text-sky-600 dark:text-sky-400' },
            { cat: 'Investments', title: 'Investments', colorClass: 'text-accent-600 dark:text-accent-400' }
          ].map(categoryInfo => {
            const catProducts = products.filter(p => p.category === categoryInfo.cat);
            if (catProducts.length === 0) return null;

            return (
              <Card key={categoryInfo.cat} className="border-slate-200/80 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white/80 dark:bg-slate-900/60">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${categoryInfo.colorClass}`}>{categoryInfo.title}</span>
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
            <MonthPicker
              value={dqMonthStr}
              onChange={setDqMonthStr}
            />
            {isManager ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>{managerBranchName}</span>
              </div>
            ) : (
              <BranchSelect
                value={dqLocation}
                onChange={setDqLocation}
                branches={branches}
                includeAllOption={true}
                allOptionText="All Locations"
                className="min-w-[180px]"
              />
            )}
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

                <div className="bg-white dark:bg-slate-950/50 border-b-2 border-accent-200 dark:border-accent-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2 text-accent-500 dark:text-accent-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
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
                      toast.saved('Product targets saved', {
                        description: 'Monthly targets lodged successfully.',
                      });
                    } else {
                      toast('Saving failed', {
                        description: 'Failed to save targets. Please try again.',
                        status: 'neutral',
                      });
                    }
                  }}
                  disabled={savingTargets}
                  className="flex-1 py-2.5 text-sm font-bold text-text-white bg-button-primary shadow-xs inset-shadow-2xs border border-white/10 rounded-xl hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingTargets ? 'Saving...' : 'Save Targets'}
                </button>
              ) : (
                user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setProductTargetModal(prev => prev ? { ...prev, isEdit: true } : null);
                    }}
                    className="flex-1 py-2.5 text-sm font-bold text-text-white bg-button-primary shadow-xs inset-shadow-2xs border border-white/10 rounded-xl hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
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
