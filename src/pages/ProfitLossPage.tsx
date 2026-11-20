import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { Button, Input } from '@/components/ui';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  RefreshCw, 
  Search, 
  Trash2, 
  Edit, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  Receipt,
  Landmark,
  ShieldCheck,
  Scale
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  AddFinancialEntryDialog, 
  BRANCH_NAMES, 
  INCOME_CATEGORIES, 
  EXPENSE_CATEGORIES 
} from '@/components/AddFinancialEntryDialog';

export interface FinancialRecord {
  id: string;
  branch_name: string;
  month_year: string;
  entry_date: string;
  entry_type: 'income' | 'expense';
  category: string;
  sub_category?: string;
  amount: number;
  description?: string;
  voucher_ref?: string;
  created_by?: string;
  created_at: string;
}

export const DISPLAY_BRANCHES = [
  { id: 'Guwahati', name: 'Guwahati', displayName: 'Guwahati Branch', state: 'Assam' },
  { id: 'Imphal', name: 'Imphal', displayName: 'Imphal / Manipur Branch', state: 'Manipur' },
  { id: 'Itanagar', name: 'Itanagar', displayName: 'Itanagar Branch', state: 'Arunachal Pradesh' },
  { id: 'Nagaland & Mizoram', name: 'Nagaland & Mizoram', displayName: 'Nagaland & Mizoram Branch', state: 'Nagaland/Mizoram' },
  { id: 'HO', name: 'HO', displayName: 'Head Office (HO)', state: 'Corporate' }
];

const normalizeBranchName = (raw?: string): string => {
  if (!raw) return 'Guwahati';
  const clean = raw.toLowerCase().trim();
  if (clean.includes('imphal') || clean.includes('manipur')) return 'Imphal';
  if (clean.includes('itanagar') || clean.includes('arunachal')) return 'Itanagar';
  if (clean.includes('nagaland') || clean.includes('mizoram') || clean.includes('dimapur') || clean.includes('aizawl')) return 'Nagaland & Mizoram';
  if (clean === 'ho' || clean.includes('head office')) return 'HO';
  return 'Guwahati';
};

const formatInr = (val?: number | string | null) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '₹0.00';
  const num = Number(val);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ProfitLossPage() {
  const { user } = useAuthStore();
  const { entries, branches } = useDataStore();

  // Strict Access Guard for Sharju & Surchand (plus Developer Tomas & Executive)
  const isAuthorized = useMemo(() => {
    const email = user?.email?.toLowerCase().trim() || '';
    const authorizedEmails = [
      'sharjuthoudam@siroiforex.com',
      'surchanddsingh@siroiforex.com',
      'tomas@siroiforex.com',
      'executive@siroiforex.com'
    ];
    return authorizedEmails.includes(email) || user?.role === 'admin';
  }, [user]);

  // Current Month State (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [activeTab, setActiveTab] = useState<'matrix' | 'deepdive' | 'ledger'>('matrix');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [deepDiveBranch, setDeepDiveBranch] = useState<string>('Guwahati');

  // Database Records & State
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Dialog State
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [dialogEntryType, setDialogEntryType] = useState<'income' | 'expense'>('income');
  const [dialogBranch, setDialogBranch] = useState<string>('Guwahati');
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);

  // Month Navigation
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const formattedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Fetch Financial Records from Supabase
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('branch_financial_records')
        .select('*')
        .eq('month_year', selectedMonth)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setRecords((data as FinancialRecord[]) || []);
    } catch (err: any) {
      console.error('Failed to load financial records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (isAuthorized) {
      fetchRecords();
    }
  }, [isAuthorized, fetchRecords]);

  // Real-time Consultant Payouts computed per branch for the selected month from entries
  const autoConsultantPayouts = useMemo(() => {
    const map: Record<string, number> = {
      Guwahati: 0,
      Imphal: 0,
      Itanagar: 0,
      'Nagaland & Mizoram': 0,
      HO: 0
    };

    entries.forEach(entry => {
      (entry.items || []).forEach(item => {
        const dateToCheck = item.disbursedDate || entry.entryDate;
        if (dateToCheck && dateToCheck.startsWith(selectedMonth)) {
          const hasConsultant = Boolean(item.consultantName?.trim() || item.consultantEmail?.trim());
          if (hasConsultant) {
            const comm = Number(item.commissionPercentage) || 0;
            const disb = Number(item.disbursedAmount) || 0;
            if (comm > 0 && disb > 0) {
              const payout = (disb * comm) / 100;
              const rawBranch = item.branchLocation || branches.find(b => b.id === entry.branchId)?.name || 'Guwahati';
              const bName = normalizeBranchName(rawBranch);
              map[bName] = (map[bName] || 0) + payout;
            }
          }
        }
      });
    });

    return map;
  }, [entries, selectedMonth, branches]);

  // Aggregate P&L Matrix per branch
  const branchPnlMatrix = useMemo(() => {
    return DISPLAY_BRANCHES.map(branch => {
      const branchRecords = records.filter(r => normalizeBranchName(r.branch_name) === branch.id);

      // 7 Income Categories
      const incomeStreams: Record<string, number> = {
        Forex: 0,
        Loans: 0,
        Insurance: 0,
        Wealth: 0,
        'Professional Services': 0,
        Advisory: 0,
        Other: 0
      };

      branchRecords
        .filter(r => r.entry_type === 'income')
        .forEach(r => {
          const cat = r.category in incomeStreams ? r.category : 'Other';
          incomeStreams[cat] += Number(r.amount) || 0;
        });

      const totalIncome = Object.values(incomeStreams).reduce((a, b) => a + b, 0);

      // Expenses
      let operatingExpenses = 0;
      let miscellaneousExpenses = 0;
      let manualConsultantPayouts = 0;

      branchRecords
        .filter(r => r.entry_type === 'expense')
        .forEach(r => {
          const amt = Number(r.amount) || 0;
          if (r.category === 'Operating Expenses') {
            operatingExpenses += amt;
          } else if (r.category === 'Miscellaneous Expenses') {
            miscellaneousExpenses += amt;
          } else if (r.category === 'Consultant Commission') {
            manualConsultantPayouts += amt;
          } else {
            operatingExpenses += amt;
          }
        });

      // Total Consultant Commission = Auto from entries + Manual records
      const autoPayout = autoConsultantPayouts[branch.id] || 0;
      const consultantPayout = autoPayout + manualConsultantPayouts;

      const totalExpenses = operatingExpenses + miscellaneousExpenses + consultantPayout;
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      return {
        ...branch,
        incomeStreams,
        totalIncome,
        operatingExpenses,
        miscellaneousExpenses,
        consultantPayout,
        autoConsultantPayout: autoPayout,
        manualConsultantPayout: manualConsultantPayouts,
        totalExpenses,
        netProfit,
        profitMargin
      };
    });
  }, [records, autoConsultantPayouts]);

  // Overall Company Totals
  const companySummary = useMemo(() => {
    let totalIncome = 0;
    let totalOperating = 0;
    let totalMisc = 0;
    let totalConsultant = 0;

    branchPnlMatrix.forEach(b => {
      totalIncome += b.totalIncome;
      totalOperating += b.operatingExpenses;
      totalMisc += b.miscellaneousExpenses;
      totalConsultant += b.consultantPayout;
    });

    const totalExpenses = totalOperating + totalMisc + totalConsultant;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalOperating,
      totalMisc,
      totalConsultant,
      totalExpenses,
      netProfit,
      profitMargin
    };
  }, [branchPnlMatrix]);

  // Performance analytics: highest income/profit branches and relative rankings for horizontal chart
  const performanceTags = useMemo(() => {
    let highestIncomeId = '';
    let highestIncomeVal = 0;
    let highestProfitId = '';
    let highestProfitVal = -Infinity;

    branchPnlMatrix.forEach(b => {
      if (b.totalIncome > highestIncomeVal && b.totalIncome > 0) {
        highestIncomeVal = b.totalIncome;
        highestIncomeId = b.id;
      }
      if (b.netProfit > highestProfitVal && b.netProfit > 0) {
        highestProfitVal = b.netProfit;
        highestProfitId = b.id;
      }
    });

    const maxAbsNetProfit = Math.max(
      ...branchPnlMatrix.map(b => Math.abs(b.netProfit)),
      1
    );

    const rankedBranches = [...branchPnlMatrix].sort((a, b) => b.netProfit - a.netProfit);

    return {
      highestIncomeId,
      highestProfitId,
      maxAbsNetProfit,
      rankedBranches
    };
  }, [branchPnlMatrix]);

  // Filtered branches for display based on branch filter
  const displayedBranchRows = useMemo(() => {
    if (selectedBranchFilter === 'all') return branchPnlMatrix;
    return branchPnlMatrix.filter(b => b.id === selectedBranchFilter);
  }, [branchPnlMatrix, selectedBranchFilter]);

  // Selected Branch Deep Dive Data
  const currentDeepDiveData = useMemo(() => {
    return branchPnlMatrix.find(b => b.id === deepDiveBranch) || branchPnlMatrix[0];
  }, [branchPnlMatrix, deepDiveBranch]);

  // Filtered Ledger Records
  const filteredLedgerRecords = useMemo(() => {
    return records.filter(r => {
      if (ledgerTypeFilter !== 'all' && r.entry_type !== ledgerTypeFilter) return false;
      if (selectedBranchFilter !== 'all' && normalizeBranchName(r.branch_name) !== selectedBranchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        const matchCat = (r.category || '').toLowerCase().includes(q);
        const matchSub = (r.sub_category || '').toLowerCase().includes(q);
        const matchRef = (r.voucher_ref || '').toLowerCase().includes(q);
        const matchBranch = (r.branch_name || '').toLowerCase().includes(q);
        return matchDesc || matchCat || matchSub || matchRef || matchBranch;
      }
      return true;
    });
  }, [records, ledgerTypeFilter, selectedBranchFilter, searchQuery]);

  // Delete Record Handler
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this financial record?')) return;
    try {
      const { error } = await supabase.from('branch_financial_records').delete().eq('id', id);
      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert('Failed to delete entry: ' + (err.message || 'Unknown error'));
    }
  };

  // Export P&L Report to Excel
  const handleExportExcel = () => {
    const summaryRows = branchPnlMatrix.map(b => ({
      'Branch': b.displayName,
      'Forex Income': b.incomeStreams.Forex,
      'Loan Business Income': b.incomeStreams.Loans,
      'Insurance Income': b.incomeStreams.Insurance,
      'Wealth Income': b.incomeStreams.Wealth,
      'Professional Services Income': b.incomeStreams['Professional Services'],
      'Advisory Income': b.incomeStreams.Advisory,
      'Other Income': b.incomeStreams.Other,
      'TOTAL INCOME': b.totalIncome,
      'Operating Expenses': b.operatingExpenses,
      'Consultant Commission': b.consultantPayout,
      'Miscellaneous Expenses': b.miscellaneousExpenses,
      'TOTAL EXPENSES': b.totalExpenses,
      'NET PROFIT / (LOSS)': b.netProfit,
      'PROFIT MARGIN (%)': Number(b.profitMargin.toFixed(2))
    }));

    summaryRows.push({
      'Branch': 'TOTAL (ALL BRANCHES)',
      'Forex Income': branchPnlMatrix.reduce((s, b) => s + b.incomeStreams.Forex, 0),
      'Loan Business Income': branchPnlMatrix.reduce((s, b) => s + b.incomeStreams.Loans, 0),
      'Insurance Income': branchPnlMatrix.reduce((s, b) => s + b.incomeStreams.Insurance, 0),
      'Wealth Income': branchPnlMatrix.reduce((s, b) => s + b.incomeStreams.Wealth, 0),
      'Professional Services Income': branchPnlMatrix.reduce((s, b) => s + b.incomeStreams['Professional Services'], 0),
      'Advisory Income': branchPnlMatrix.reduce((s, b) => s + b.incomeStreams.Advisory, 0),
      'Other Income': branchPnlMatrix.reduce((s, b) => s + b.incomeStreams.Other, 0),
      'TOTAL INCOME': companySummary.totalIncome,
      'Operating Expenses': companySummary.totalOperating,
      'Consultant Commission': companySummary.totalConsultant,
      'Miscellaneous Expenses': companySummary.totalMisc,
      'TOTAL EXPENSES': companySummary.totalExpenses,
      'NET PROFIT / (LOSS)': companySummary.netProfit,
      'PROFIT MARGIN (%)': Number(companySummary.profitMargin.toFixed(2))
    });

    const ledgerRows = records.map(r => ({
      'Date': r.entry_date,
      'Branch': r.branch_name,
      'Type': r.entry_type.toUpperCase(),
      'Category': r.category,
      'Sub Category': r.sub_category || '—',
      'Amount (INR)': Number(r.amount),
      'Description': r.description || '—',
      'Voucher Ref': r.voucher_ref || '—',
      'Recorded By': r.created_by || '—'
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Branch P&L Summary');
    XLSX.utils.book_append_sheet(wb, wsLedger, 'Voucher Ledger');

    XLSX.writeFile(wb, `Siroi_Branch_PnL_${selectedMonth}.xlsx`);
  };

  // Access Denied Fallback
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Restricted Access</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          The Financial Operations and Profit & Loss terminal is restricted to Sharju Thoudam and Surchand Singh.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Top Header & Executive Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Branch P&L
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Financial Operations
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track cash income, expenses and profitability across SIROI branches.
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector Navigation */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-xs font-black text-slate-800 dark:text-slate-100 min-w-[125px] text-center tracking-tight font-mono">
              {formattedMonthLabel}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 ml-1 rounded-lg bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => {
              setDialogEntryType('income');
              setDialogBranch(selectedBranchFilter !== 'all' ? selectedBranchFilter : 'Guwahati');
              setEditingRecord(null);
              setIsEntryDialogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Add Income</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDialogEntryType('expense');
              setDialogBranch(selectedBranchFilter !== 'all' ? selectedBranchFilter : 'Guwahati');
              setEditingRecord(null);
              setIsEntryDialogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            title="Download full P&L Statement as Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export</span> Excel
          </button>
        </div>
      </div>

      {/* KPI Overview Cards Shelf */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income Card */}
        <div className="p-5 rounded-3xl bg-background-full border border-separator-border shadow-xs relative overflow-hidden group hover:border-border-button-hover transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                <ArrowDownLeft className="size-4 stroke-[2.5]" />
              </span>
              <span className="text-body-2-medium text-text-secondary">
                Total Cash Income
              </span>
            </span>
            <span className="text-caption-2-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              7 Streams
            </span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-text-primary tracking-tight tabular-nums">
              {formatInr(companySummary.totalIncome)}
            </div>
            <p className="text-caption-1-regular text-text-tertiary mt-1">
              Forex, Loans, Insurance, Wealth, Services & Advisory
            </p>
          </div>
        </div>

        {/* Operating & Misc Expenses Card */}
        <div className="p-5 rounded-3xl bg-background-full border border-separator-border shadow-xs relative overflow-hidden group hover:border-border-button-hover transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center size-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                <Building2 className="size-4" />
              </span>
              <span className="text-body-2-medium text-text-secondary">
                Total Cash Expenses
              </span>
            </span>
            <span className="text-caption-2-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              Rent & Operations
            </span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-text-primary tracking-tight tabular-nums">
              {formatInr(companySummary.totalOperating + companySummary.totalMisc)}
            </div>
            <p className="text-caption-1-regular text-text-tertiary mt-1">
              Rent, staff salaries, travel, marketing & utilities
            </p>
          </div>
        </div>

        {/* Consultant Payouts Card */}
        <div className="p-5 rounded-3xl bg-background-full border border-separator-border shadow-xs relative overflow-hidden group hover:border-border-button-hover transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center size-8 rounded-xl bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400 border border-accent-200/50 dark:border-accent-800/40">
                <Receipt className="size-4 stroke-[2.2]" />
              </span>
              <span className="text-body-2-medium text-text-secondary">
                Consultant Commissions
              </span>
            </span>
            <span className="text-caption-2-bold px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-950/80 text-accent-700 dark:text-accent-300">
              Auto-Synced
            </span>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-text-primary tracking-tight tabular-nums">
              {formatInr(companySummary.totalConsultant)}
            </div>
            <p className="text-caption-1-regular text-text-tertiary mt-1">
              Disbursal payouts linked directly to connectors
            </p>
          </div>
        </div>

        {/* Net Profit / (Loss) Card */}
        <div className="p-5 rounded-3xl bg-background-full border border-separator-border shadow-xs relative overflow-hidden group hover:border-border-button-hover transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className={`flex items-center justify-center size-8 rounded-xl border ${
                companySummary.netProfit >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40'
              }`}>
                {companySummary.netProfit >= 0 ? <TrendingUp className="size-4 stroke-[2.5]" /> : <TrendingDown className="size-4 stroke-[2.5]" />}
              </span>
              <span className="text-body-2-medium text-text-secondary">
                Net Profit / (Loss)
              </span>
            </span>
            <span className={`text-caption-2-bold px-2.5 py-0.5 rounded-full font-mono ${
              companySummary.profitMargin >= 0
                ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200'
            }`}>
              {companySummary.profitMargin >= 0 ? '+' : ''}{companySummary.profitMargin.toFixed(1)}% Margin
            </span>
          </div>
          <div className="mt-3">
            <div className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
              companySummary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatInr(companySummary.netProfit)}
            </div>
            <p className="text-caption-1-regular text-text-tertiary mt-1">
              Total Revenue minus All Operating & Commission Costs
            </p>
          </div>
        </div>

      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Branch P&L Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deepdive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'deepdive'
                ? 'bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Branch Statement Deep Dive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Voucher Ledger ({records.length})</span>
          </button>
        </div>

        {/* Branch Filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Scope:</span>
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Branches ({DISPLAY_BRANCHES.length})</option>
            {DISPLAY_BRANCHES.map(b => (
              <option key={b.id} value={b.id}>{b.displayName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: Branch-wise P&L Master Matrix Table (Exact format requested) */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">

          {/* Visual Analytics Row: Allocation Summary & Net P&L by branch */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left card (7 cols): Income vs Cost Structure */}
            <div className="lg:col-span-7 bg-background-full rounded-3xl border border-separator-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-separator-border pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Cash P&L Allocation Summary
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Proportion of gross revenue retained as net profit vs operating costs and payouts.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-text-secondary bg-background-tertiary-default px-2.5 py-1 rounded-lg">
                  {formattedMonthLabel}
                </span>
              </div>

              {/* Proportional visual distribution bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Revenue Retention</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {companySummary.profitMargin >= 0 ? '+' : ''}{companySummary.profitMargin.toFixed(1)}% Net Margin
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${companySummary.totalIncome > 0 ? Math.min(100, Math.max(0, (companySummary.netProfit / companySummary.totalIncome) * 100)) : 0}%` }}
                    title={`Net Profit: ${formatInr(companySummary.netProfit)}`}
                  />
                  <div 
                    className="bg-rose-500 transition-all duration-500" 
                    style={{ width: `${companySummary.totalIncome > 0 ? Math.min(100, ((companySummary.totalOperating + companySummary.totalMisc) / companySummary.totalIncome) * 100) : 0}%` }}
                    title={`Operating & Misc: ${formatInr(companySummary.totalOperating + companySummary.totalMisc)}`}
                  />
                  <div 
                    className="bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${companySummary.totalIncome > 0 ? Math.min(100, (companySummary.totalConsultant / companySummary.totalIncome) * 100) : 0}%` }}
                    title={`Consultant Commissions: ${formatInr(companySummary.totalConsultant)}`}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Net Profit ({formatInr(companySummary.netProfit)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Operating ({formatInr(companySummary.totalOperating + companySummary.totalMisc)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Commissions ({formatInr(companySummary.totalConsultant)})</span>
                  </div>
                </div>
              </div>

              {/* Quick 3 Stat Pills */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Income</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {formatInr(companySummary.totalIncome)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Expenses</span>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 block mt-0.5">
                    {formatInr(companySummary.totalExpenses)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Bottom Line</span>
                  <span className={`text-xs font-mono font-bold block mt-0.5 ${companySummary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatInr(companySummary.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right card (5 cols): Net P&L by branch (Ranked Horizontal Bars from Reference) */}
            <div className="lg:col-span-5 bg-background-full rounded-3xl border border-separator-border p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-separator-border pb-2.5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                    Net P&L by branch
                  </h3>
                  <span className="text-[11px] text-text-tertiary">{formattedMonthLabel} · Cash basis</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-background-tertiary-default text-text-secondary">
                  Ranked
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {performanceTags.rankedBranches.map(branch => {
                  const isPositive = branch.netProfit >= 0;
                  const widthPercent = Math.min(100, Math.max(8, (Math.abs(branch.netProfit) / performanceTags.maxAbsNetProfit) * 100));

                  return (
                    <div key={branch.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">
                          {branch.name}
                        </span>
                        <span className={`font-mono font-bold text-xs shrink-0 ${isPositive ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatInr(branch.netProfit)}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-rose-500 dark:bg-rose-600'}`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-background-full rounded-3xl border border-separator-border shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-separator-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary tracking-tight uppercase">
                  Branch Profitability ({formattedMonthLabel})
                </h3>
                <p className="text-xs text-text-secondary">
                  Detailed branch breakdown of revenue vs expenditure and resulting profit margins.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchRecords}
                  disabled={isLoading}
                  className="gap-1.5 text-xs h-8 rounded-lg"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* The Master P&L Table */}
            <div className="overflow-x-auto">
              <table className="bui-table w-full text-start border-collapse text-body-2-regular">
                <thead>
                  <tr className="border-b border-border-table bg-background-secondary-default text-caption-1-semibold text-text-tertiary uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Branch</th>
                    <th className="py-3.5 px-4 text-right">Income</th>
                    <th className="py-3.5 px-4 text-right">Operating Expenses</th>
                    <th className="py-3.5 px-4 text-right">Consultant Payout</th>
                    <th className="py-3.5 px-4 text-right">Total Expenses</th>
                    <th className="py-3.5 px-4 text-right">Net Profit / (Loss)</th>
                    <th className="py-3.5 px-4 text-right">Profit Margin</th>
                    <th className="py-3.5 px-4 text-center">Performance</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {displayedBranchRows.map((row) => {
                    const isProfit = row.netProfit >= 0;
                    return (
                      <tr 
                        key={row.id} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setDeepDiveBranch(row.id);
                          setActiveTab('deepdive');
                        }}
                      >
                        {/* Branch Name */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center font-bold text-xs shrink-0">
                              {row.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 transition-colors">
                                {row.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {row.state}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Income */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {formatInr(row.totalIncome)}
                          </span>
                        </td>

                        {/* Operating Expenses */}
                        <td className="py-4 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatInr(row.operatingExpenses + row.miscellaneousExpenses)}
                        </td>

                        {/* Consultant Payout */}
                        <td className="py-4 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          <span title={`Auto calculated: ${formatInr(row.autoConsultantPayout)} | Manual vouchers: ${formatInr(row.manualConsultantPayout)}`}>
                            {formatInr(row.consultantPayout)}
                          </span>
                        </td>

                        {/* Total Expenses */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatInr(row.totalExpenses)}
                          </span>
                        </td>

                        {/* Net Profit */}
                        <td className="py-4 px-4 text-right font-mono font-black">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                            isProfit 
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50' 
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50'
                          }`}>
                            {formatInr(row.netProfit)}
                          </span>
                        </td>

                        {/* Profit Margin */}
                        <td className="py-4 px-4 text-right font-mono font-bold">
                          <span className={isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {row.profitMargin >= 0 ? '+' : ''}{row.profitMargin.toFixed(1)}%
                          </span>
                        </td>

                        {/* Performance Tags from Reference */}
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {row.id === performanceTags.highestIncomeId && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 whitespace-nowrap">
                                Highest income
                              </span>
                            )}
                            {row.id === performanceTags.highestProfitId && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300/60 dark:border-teal-800 whitespace-nowrap">
                                Highest profit
                              </span>
                            )}
                            {row.netProfit < 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800 whitespace-nowrap">
                                Loss
                              </span>
                            )}
                            {row.netProfit >= 0 && row.id !== performanceTags.highestProfitId && row.id !== performanceTags.highestIncomeId && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                Profitable
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action Drill Down */}
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDialogEntryType('income');
                                setDialogBranch(row.id);
                                setEditingRecord(null);
                                setIsEntryDialogOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title={`Add Income to ${row.name}`}
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeepDiveBranch(row.id);
                                setActiveTab('deepdive');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            >
                              View &rarr;
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Footer Row */}
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-xs">
                    <td className="py-4 px-4 sm:px-6 uppercase tracking-wider text-slate-900 dark:text-white">
                      TOTAL (ALL BRANCHES)
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      {formatInr(companySummary.totalIncome)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatInr(companySummary.totalOperating + companySummary.totalMisc)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatInr(companySummary.totalConsultant)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-black text-sm">
                      {formatInr(companySummary.totalExpenses)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black ${
                        companySummary.netProfit >= 0
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-rose-600 text-white shadow-sm'
                      }`}>
                        {formatInr(companySummary.netProfit)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-sm">
                      <span className={companySummary.profitMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {companySummary.profitMargin >= 0 ? '+' : ''}{companySummary.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                      All Branches
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Branch Financial Statement Deep Dive (7 Incomes vs 3 Expenses) */}
      {activeTab === 'deepdive' && (
        <div className="space-y-6">
          {/* Branch Picker */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-background-full p-4 rounded-3xl border border-separator-border shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Select Branch Statement:</span>
              <div className="flex flex-wrap gap-1.5">
                {DISPLAY_BRANCHES.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setDeepDiveBranch(b.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      deepDiveBranch === b.id
                        ? 'bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10'
                        : 'bg-background-tertiary-default text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setDialogEntryType('income');
                  setDialogBranch(deepDiveBranch);
                  setEditingRecord(null);
                  setIsEntryDialogOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Income to {deepDiveBranch}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setDialogEntryType('expense');
                  setDialogBranch(deepDiveBranch);
                  setEditingRecord(null);
                  setIsEntryDialogOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense to {deepDiveBranch}
              </Button>
            </div>
          </div>

          {/* Side by Side Statements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Income Streams (7 Categories) */}
            <div className="bg-background-full rounded-3xl border border-separator-border p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-separator-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">
                      Income Streams ({deepDiveBranch})
                    </h4>
                    <span className="text-[10px] text-text-tertiary">7 Required Revenue Categories</span>
                  </div>
                </div>
                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatInr(currentDeepDiveData.totalIncome)}
                </span>
              </div>

              <div className="space-y-3">
                {INCOME_CATEGORIES.map(cat => {
                  const amt = currentDeepDiveData.incomeStreams[cat.id] || 0;
                  const pct = currentDeepDiveData.totalIncome > 0 ? (amt / currentDeepDiveData.totalIncome) * 100 : 0;
                  return (
                    <div key={cat.id} className="p-3.5 rounded-2xl bg-background-tertiary-default border border-separator-border space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-text-primary block">{cat.name}</span>
                          <span className="text-[10px] text-text-tertiary">{cat.examples}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-text-primary block">{formatInr(amt)}</span>
                          <span className="text-[10px] font-mono text-text-tertiary">{pct.toFixed(1)}% of income</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-background-secondary-default rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Income Subtotal */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 font-extrabold text-xs">
                <span className="text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">TOTAL BRANCH INCOME</span>
                <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">{formatInr(currentDeepDiveData.totalIncome)}</span>
              </div>
            </div>

            {/* Expenses Structure (Operating, Misc, Consultant) */}
            <div className="bg-background-full rounded-3xl border border-separator-border p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-separator-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">
                      Expenses Breakdown ({deepDiveBranch})
                    </h4>
                    <span className="text-[10px] text-text-tertiary">Operating, Sundry & Consultant Payouts</span>
                  </div>
                </div>
                <span className="font-mono text-base font-black text-rose-600 dark:text-rose-400">
                  {formatInr(currentDeepDiveData.totalExpenses)}
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Operating Expenses */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Operating Expenses</span>
                      <span className="text-[10px] text-slate-400">Rent, Staff Salaries, Travel, Marketing, Electricity</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">{formatInr(currentDeepDiveData.operatingExpenses)}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentDeepDiveData.totalExpenses > 0 ? ((currentDeepDiveData.operatingExpenses / currentDeepDiveData.totalExpenses) * 100).toFixed(1) : 0}% of costs
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-300" 
                      style={{ width: `${currentDeepDiveData.totalExpenses > 0 ? Math.min(100, (currentDeepDiveData.operatingExpenses / currentDeepDiveData.totalExpenses) * 100) : 0}%` }} 
                    />
                  </div>
                </div>

                {/* 2. Miscellaneous Expenses */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Miscellaneous Expenses</span>
                      <span className="text-[10px] text-slate-400">Office repairs, unexpected overheads, stationery</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">{formatInr(currentDeepDiveData.miscellaneousExpenses)}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentDeepDiveData.totalExpenses > 0 ? ((currentDeepDiveData.miscellaneousExpenses / currentDeepDiveData.totalExpenses) * 100).toFixed(1) : 0}% of costs
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                      style={{ width: `${currentDeepDiveData.totalExpenses > 0 ? Math.min(100, (currentDeepDiveData.miscellaneousExpenses / currentDeepDiveData.totalExpenses) * 100) : 0}%` }} 
                    />
                  </div>
                </div>

                {/* 3. Consultant Commission Payouts */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Consultant Commission / Payouts</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">Auto</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Auto entries: {formatInr(currentDeepDiveData.autoConsultantPayout)} | Manual vouchers: {formatInr(currentDeepDiveData.manualConsultantPayout)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block">{formatInr(currentDeepDiveData.consultantPayout)}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentDeepDiveData.totalExpenses > 0 ? ((currentDeepDiveData.consultantPayout / currentDeepDiveData.totalExpenses) * 100).toFixed(1) : 0}% of costs
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                      style={{ width: `${currentDeepDiveData.totalExpenses > 0 ? Math.min(100, (currentDeepDiveData.consultantPayout / currentDeepDiveData.totalExpenses) * 100) : 0}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Expense Subtotal */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 font-extrabold text-xs">
                <span className="text-rose-800 dark:text-rose-300 uppercase tracking-wider">TOTAL EXPENSES</span>
                <span className="font-mono text-sm text-rose-700 dark:text-rose-400">{formatInr(currentDeepDiveData.totalExpenses)}</span>
              </div>
            </div>

          </div>

          {/* Result Statement Card */}
          <div className={`p-6 rounded-3xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            currentDeepDiveData.netProfit >= 0
              ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/30 dark:border-emerald-700/50'
              : 'bg-gradient-to-r from-rose-500/15 via-red-500/10 to-transparent border-rose-500/30 dark:border-rose-700/50'
          }`}>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 dark:text-slate-400 block">
                {currentDeepDiveData.name} Monthly Financial Result
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {currentDeepDiveData.netProfit >= 0 ? 'NET BRANCH PROFIT' : 'NET BRANCH LOSS'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated as Total Branch Income ({formatInr(currentDeepDiveData.totalIncome)}) − Total Expenses ({formatInr(currentDeepDiveData.totalExpenses)})
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profit Margin</span>
                <span className={`text-xl font-black font-mono ${currentDeepDiveData.profitMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {currentDeepDiveData.profitMargin >= 0 ? '+' : ''}{currentDeepDiveData.profitMargin.toFixed(2)}%
                </span>
              </div>
              <div className={`px-5 py-3 rounded-2xl font-mono text-2xl font-black shadow-lg ${
                currentDeepDiveData.netProfit >= 0 ? 'bg-emerald-600 text-white shadow-emerald-600/30' : 'bg-rose-600 text-white shadow-rose-600/30'
              }`}>
                {formatInr(currentDeepDiveData.netProfit)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Voucher Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-background-full rounded-3xl border border-separator-border shadow-xs overflow-hidden space-y-4 p-5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, category, voucher ref, branch..."
                className="pl-9 h-10 text-xs bg-background-tertiary-default border-border-button-default text-text-primary rounded-xl focus:border-border-focus-ring focus:ring-2 focus:ring-border-focus-ring/25"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-background-tertiary-default p-1 rounded-xl text-xs font-bold border border-separator-border">
                <button
                  type="button"
                  onClick={() => setLedgerTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${ledgerTypeFilter === 'all' ? 'bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  All ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerTypeFilter('income')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${ledgerTypeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Income ({records.filter(r => r.entry_type === 'income').length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerTypeFilter('expense')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${ledgerTypeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Expenses ({records.filter(r => r.entry_type === 'expense').length})
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-3xl border border-separator-border bg-background-full shadow-xs">
            <table className="bui-table w-full text-start border-collapse text-body-2-regular">
              <thead className="bg-background-secondary-default text-caption-1-semibold uppercase tracking-wider text-text-tertiary border-b border-border-table">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description / Sub-category</th>
                  <th className="py-3.5 px-4">Voucher Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator-border text-body-2-regular">
                {filteredLedgerRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-tertiary">
                      No financial records found for {formattedMonthLabel}. Click "Add Income" or "Add Expense" to record entries.
                    </td>
                  </tr>
                ) : (
                  filteredLedgerRecords.map((r) => {
                    const isInc = r.entry_type === 'income';
                    return (
                      <tr key={r.id} className="hover:bg-background-secondary-hover transition-colors duration-150">
                        <td className="py-3 px-4 font-mono text-text-tertiary">{r.entry_date}</td>
                        <td className="py-3 px-4 font-bold text-text-primary">{r.branch_name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption-2-bold uppercase ${
                            isInc
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {isInc ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {r.entry_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-text-primary">{r.category}</td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs truncate text-text-secondary">
                            {r.description || '—'}
                          </div>
                          {r.sub_category && (
                            <span className="text-[10px] text-accent-500 font-mono">#{r.sub_category}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-tertiary">{r.voucher_ref || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {formatInr(r.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(r);
                                setDialogEntryType(r.entry_type);
                                setDialogBranch(r.branch_name);
                                setIsEntryDialogOpen(true);
                              }}
                              className="p-1.5 text-text-tertiary hover:text-accent-600 rounded-lg transition-colors cursor-pointer active:scale-[0.95]"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r.id)}
                              className="p-1.5 text-text-tertiary hover:text-button-danger rounded-lg transition-colors cursor-pointer active:scale-[0.95]"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Financial Entry Dialog */}
      <AddFinancialEntryDialog
        isOpen={isEntryDialogOpen}
        onClose={() => {
          setIsEntryDialogOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={fetchRecords}
        defaultType={dialogEntryType}
        defaultBranch={dialogBranch}
        defaultMonth={selectedMonth}
        existingRecord={editingRecord}
      />

    </div>
  );
}
