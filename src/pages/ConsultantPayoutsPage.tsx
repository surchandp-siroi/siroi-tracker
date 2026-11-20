import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Button } from '@/components/ui';
import { 
  Mail, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search,
  Percent,
  Receipt,
  Scale
} from 'lucide-react';
import { BranchSelect } from '@/components/BranchSelect';
import { MonthPicker } from '@/components/ui/month-picker';
import { triggerNotification } from '@/lib/notifications';
import * as XLSX from 'xlsx';

const PAYOUT_PRESETS = [
  0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.5, 5.0
];

const EmailCell = ({ email }: { email: string | undefined }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!email || email === '-') return <span className="text-slate-400 text-xs">-</span>;
  
  return (
    <div 
      onClick={() => setIsOpen(!isOpen)}
      className="inline-flex items-center px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 cursor-pointer transition-all duration-300 overflow-hidden group mx-auto"
      title={email}
    >
      <Mail className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-500 transition-colors shrink-0" />
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center ${isOpen ? 'max-w-[220px] opacity-100 ml-1.5' : 'max-w-0 opacity-0 ml-0'}`}>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{email}</span>
      </div>
    </div>
  );
};

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
};

const formatInr = (val?: number | null) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
};

const computePayoutMetrics = (
  disbursedAmount: number = 0,
  payoutPct: number = 0,
  commissionPct: number = 0
) => {
  const grossPayout = disbursedAmount * (payoutPct / 100);
  const netPayout = grossPayout * 0.98; // Deduct 2% TDS

  const grossCommission = disbursedAmount * (commissionPct / 100);
  const netSettlement = grossCommission * 0.98; // Deduct 2% TDS

  const netRevenue = netPayout - netSettlement;

  return {
    grossPayout,
    netPayout: Math.round(netPayout * 100) / 100,
    grossCommission,
    netSettlement: Math.round(netSettlement * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100
  };
};

export default function ConsultantPayoutsPage() {
  const { user } = useAuthStore();
  const { entries, branches, updateCommission } = useDataStore();
  
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [payoutPercentages, setPayoutPercentages] = useState<Record<string, string>>({});
  const [commissions, setCommissions] = useState<Record<string, string>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<string, 'Not Settled' | 'Settled'>>({});
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const handlePayoutChange = (itemId: string, value: string) => {
    setPayoutPercentages(prev => ({ ...prev, [itemId]: value }));
  };

  const handleCommissionChange = (itemId: string, value: string) => {
    setCommissions(prev => ({ ...prev, [itemId]: value }));
  };

  const handleStatusChange = (itemId: string, val: 'Not Settled' | 'Settled') => {
    setDraftStatuses(prev => ({ ...prev, [itemId]: val }));
  };

  const handleDateChange = (itemId: string, val: string) => {
    setDraftDates(prev => ({ ...prev, [itemId]: val }));
  };

  const filteredItems = useMemo(() => {
    let items = entries.flatMap(entry => 
      entry.items.map((item, itemIdx) => ({ 
        ...item, 
        _uniqueId: `${entry.id}-${itemIdx}`,
        _entryId: entry.id,
        _itemIdx: itemIdx,
        _entryDate: entry.entryDate, 
        _branchId: entry.branchId 
      }))
    );
    
    // Only include rows where a consultant is mentioned
    items = items.filter(item => item.consultantName?.trim() || item.consultantEmail?.trim());

    // Exclude loan items that are missing an EMI date (payout settlement requires completed EMI date)
    items = items.filter(item => {
      const isLoan = item.category === 'Loan' || (!item.category && item.product);
      if (isLoan) {
        const hasEmiDate = Boolean(item.emiDate && item.emiDate.trim() !== '' && item.emiDate !== '-');
        return hasEmiDate;
      }
      return true;
    });

    if (filterMonth) {
      items = items.filter(item => {
        const dateToCheck = item.disbursedDate || item._entryDate;
        return dateToCheck?.startsWith(filterMonth);
      });
    }

    if (filterLocation !== 'all') {
      const selectedBranch = branches.find(b => b.id === filterLocation || b.name === filterLocation);
      const branchIdMatch = selectedBranch ? selectedBranch.id : filterLocation;
      const branchNameMatch = selectedBranch ? selectedBranch.name : filterLocation;

      items = items.filter(item => 
        item._branchId === branchIdMatch || 
        item.branchLocation === branchNameMatch ||
        item.branchLocation === branchIdMatch
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item => 
        (item.consultantName || '').toLowerCase().includes(q) ||
        (item.customerName || '').toLowerCase().includes(q) ||
        (item.consultantEmail || '').toLowerCase().includes(q)
      );
    }
    
    return items;
  }, [entries, filterMonth, filterLocation, searchQuery, branches]);

  // Aggregated Monthly KPI Overview
  const monthlyMetrics = useMemo(() => {
    let totalDisbursed = 0;
    let totalPayoutAmount = 0;
    let totalSettlement = 0;
    let totalRevenue = 0;
    let settledCount = 0;

    filteredItems.forEach(item => {
      const disb = Number(item.disbursedAmount) || 0;
      totalDisbursed += disb;

      const pDraft = payoutPercentages[item._uniqueId];
      const pVal = pDraft !== undefined && pDraft !== '' ? parseFloat(pDraft) : (item.payoutPercentage || 0);

      const cDraft = commissions[item._uniqueId];
      const cVal = cDraft !== undefined && cDraft !== '' ? parseFloat(cDraft) : (item.commissionPercentage || 0);

      const { netPayout, netSettlement, netRevenue } = computePayoutMetrics(disb, pVal, cVal);

      if (pVal > 0) totalPayoutAmount += netPayout;
      if (cVal > 0) totalSettlement += netSettlement;
      if (pVal > 0 || cVal > 0) totalRevenue += netRevenue;

      const status = draftStatuses[item._uniqueId] ?? item.settlementStatus;
      if (status === 'Settled') settledCount++;
    });

    return {
      totalDisbursed,
      totalPayoutAmount,
      totalSettlement,
      totalRevenue,
      settledCount,
      totalCount: filteredItems.length
    };
  }, [filteredItems, payoutPercentages, commissions, draftStatuses]);

  // Items with pending draft edits
  const pendingSaves = useMemo(() => {
    return filteredItems.filter(item => {
      const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined || item.payoutPercentage === undefined;
      return isEditing && (
        (payoutPercentages[item._uniqueId] !== undefined && payoutPercentages[item._uniqueId] !== '') ||
        (commissions[item._uniqueId] !== undefined && commissions[item._uniqueId] !== '') ||
        draftStatuses[item._uniqueId] !== undefined ||
        draftDates[item._uniqueId] !== undefined
      );
    });
  }, [filteredItems, editingIds, payoutPercentages, commissions, draftStatuses, draftDates]);

  // Single Item Save Handler
  const handleSaveItem = async (item: any) => {
    const pStr = payoutPercentages[item._uniqueId];
    const pVal = pStr !== undefined && pStr !== '' ? parseFloat(pStr) : item.payoutPercentage;

    const cStr = commissions[item._uniqueId];
    const cVal = cStr !== undefined && cStr !== '' ? parseFloat(cStr) : item.commissionPercentage;

    const newStatus = draftStatuses[item._uniqueId] ?? (item.settlementStatus || 'Not Settled');
    const newDate = draftDates[item._uniqueId] ?? (item.settlementDate || '');

    const updates: {
      payoutPercentage?: number;
      commissionPercentage?: number;
      settlementStatus?: 'Not Settled' | 'Settled';
      settlementDate?: string;
    } = {
      settlementStatus: newStatus,
      settlementDate: newDate
    };

    if (pVal !== undefined && !isNaN(pVal)) updates.payoutPercentage = pVal;
    if (cVal !== undefined && !isNaN(cVal)) updates.commissionPercentage = cVal;

    const success = await updateCommission(item._entryId, item._itemIdx, updates);
    if (success) {
      setEditingIds(prev => ({ ...prev, [item._uniqueId]: false }));

      if (newStatus === 'Settled' && item.settlementStatus !== 'Settled') {
        const { netSettlement } = computePayoutMetrics(item.disbursedAmount, pVal || 0, cVal || 0);
        triggerNotification('payout_settled', {
          email: item.consultantEmail,
          name: item.consultantName,
          amount: Math.round(netSettlement)
        });
      }
    }
    return success;
  };

  // Batch Save All Handler
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    for (const item of pendingSaves) {
      await handleSaveItem(item);
    }
    setIsSavingAll(false);
  };

  // Export 13-column reconciliation sheet matching Sharju's specification
  const handleExportExcel = () => {
    const dataToExport = filteredItems.map(item => {
      const pDraft = payoutPercentages[item._uniqueId];
      const pVal = pDraft !== undefined && pDraft !== '' ? parseFloat(pDraft) : (item.payoutPercentage || 0);

      const cDraft = commissions[item._uniqueId];
      const cVal = cDraft !== undefined && cDraft !== '' ? parseFloat(cDraft) : (item.commissionPercentage || 0);

      const status = draftStatuses[item._uniqueId] ?? (item.settlementStatus || 'Not Settled');
      const sDate = draftDates[item._uniqueId] ?? (item.settlementDate || '-');

      const { netPayout, netSettlement, netRevenue } = computePayoutMetrics(
        item.disbursedAmount,
        pVal,
        cVal
      );

      return {
        'ENTRY DATE': item._entryDate || '-',
        'DISBURSED DATE': item.disbursedDate || '-',
        'CONSULTANT NAME': item.consultantName || 'Unknown',
        'CONSULTANT EMAIL': item.consultantEmail || '-',
        'CUSTOMER NAME': item.customerName || '-',
        'DISBURSED AMOUNT': item.disbursedAmount || 0,
        'PAYOUT (%)': pVal || 0,
        'PAYOUT AMOUNT': pVal > 0 ? netPayout : 0,
        'COMMISSION (%)': cVal || 0,
        'SETTLEMENT': cVal > 0 ? netSettlement : 0,
        'STATUS': status,
        'DATE OF SETTLEMANT': sDate,
        'REVENUE': (pVal > 0 || cVal > 0) ? netRevenue : 0
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultant Payouts');
    XLSX.writeFile(workbook, `Consultant_Payouts_${filterMonth || 'all'}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-[1700px] mx-auto p-2 sm:p-4">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Consultant Payout & Settlement Ledger
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Financial Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reconcile lender partner payouts (3% TDS basis), consultant commission payouts (2.5%), and SIROI net retained revenue.
            </p>
          </div>
        </div>

        {/* Action Button: Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            title="Export 13-column reconciliation sheet as Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disbursed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Disbursed Volume
            </span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="font-mono text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {formatInr(monthlyMetrics.totalDisbursed)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {monthlyMetrics.totalCount} consultant files in period
          </p>
        </div>

        {/* Total Lender Payout */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 dark:border-emerald-800/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Lender Payout (Net)
            </span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {formatInr(monthlyMetrics.totalPayoutAmount)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Received from banks (after 2% TDS)
          </p>
        </div>

        {/* Total Consultant Settlement */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 dark:border-rose-800/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Consultant Settlement
            </span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">
            {formatInr(monthlyMetrics.totalSettlement)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {monthlyMetrics.settledCount} settled of {monthlyMetrics.totalCount} (after 2% TDS)
          </p>
        </div>

        {/* Net SIROI Retained Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-950/30 dark:via-emerald-900/10 dark:to-transparent border border-teal-500/30 dark:border-teal-800/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>SIROI Net Revenue</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
              Margin
            </span>
          </div>
          <div className="font-mono text-2xl font-black text-teal-600 dark:text-teal-400 mt-1.5">
            {formatInr(monthlyMetrics.totalRevenue)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Payout Amount minus Settlement
          </p>
        </div>
      </div>
      
      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Toolbar Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-850/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter by Month */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                Disbursed Month
              </label>
              <MonthPicker 
                value={filterMonth} 
                onChange={setFilterMonth} 
                buttonClassName="h-9 px-3 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            
            {/* Filter by Location */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Branch Location
              </label>
              <BranchSelect 
                value={filterLocation}
                onChange={setFilterLocation}
                branches={branches}
                includeAllOption
                allOptionText="All Locations"
                valueField="name"
                className="min-w-[170px] [&>button]:h-9 [&>button]:bg-white dark:[&>button]:bg-slate-950 [&>button]:border-slate-200 dark:[&>button]:border-slate-800 [&>button]:rounded-xl [&>button]:shadow-xs text-xs"
              />
            </div>

            {/* Search Box */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Consultant or Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 pr-3 text-xs font-medium rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 w-44 sm:w-56"
                />
              </div>
            </div>
          </div>
            
          {/* Batch Save Button */}
          <div>
            {pendingSaves.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="h-9 px-4 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider rounded-xl bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
              >
                {isSavingAll ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save All Changes ({pendingSaves.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 13-Column Master Payouts Table */}
        <div className="rounded-3xl overflow-hidden border border-separator-border bg-background-full shadow-xs overflow-x-auto">
          <Table className="w-full text-left border-collapse">
            <TableHeader className="bg-background-secondary-default border-b border-border-table">
              <TableRow className="text-caption-1-semibold text-text-tertiary uppercase tracking-wider">
                <TableHead className="py-3 px-3.5 whitespace-nowrap">Entry Date</TableHead>
                <TableHead className="py-3 px-3.5 whitespace-nowrap">Disbursed Date</TableHead>
                <TableHead className="py-3 px-3.5 whitespace-nowrap">Consultant Name</TableHead>
                <TableHead className="py-3 px-2 text-center whitespace-nowrap">Email</TableHead>
                <TableHead className="py-3 px-3.5 whitespace-nowrap">Customer Name</TableHead>
                <TableHead className="py-3 px-3 text-right whitespace-nowrap">Disbursed Amt</TableHead>
                <TableHead className="py-3 px-2.5 text-center whitespace-nowrap">Payout (%)</TableHead>
                <TableHead className="py-3 px-3 text-right whitespace-nowrap">Payout Amt (₹)</TableHead>
                <TableHead className="py-3 px-2.5 text-center whitespace-nowrap">Commission (%)</TableHead>
                <TableHead className="py-3 px-3 text-right whitespace-nowrap">Settlement (₹)</TableHead>
                <TableHead className="py-3 px-3 text-center whitespace-nowrap">Status</TableHead>
                <TableHead className="py-3 px-3 text-center whitespace-nowrap">Settlement Date</TableHead>
                <TableHead className="py-3 px-3 text-right whitespace-nowrap">Revenue (₹)</TableHead>
                <TableHead className="py-3 px-3 text-center whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-12 text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <p>No consultant payout records found for the selected month/location.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const initial = (item.consultantName || '?').charAt(0).toUpperCase();
                  const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined || item.payoutPercentage === undefined;

                  const draftPayout = payoutPercentages[item._uniqueId] !== undefined 
                    ? payoutPercentages[item._uniqueId] 
                    : (item.payoutPercentage !== undefined ? item.payoutPercentage.toString() : '');

                  const draftComm = commissions[item._uniqueId] !== undefined 
                    ? commissions[item._uniqueId] 
                    : (item.commissionPercentage !== undefined ? item.commissionPercentage.toString() : '');

                  const draftStatus = draftStatuses[item._uniqueId] ?? (item.settlementStatus || 'Not Settled');
                  const draftDate = draftDates[item._uniqueId] ?? (item.settlementDate || '');

                  const pVal = draftPayout !== '' ? parseFloat(draftPayout) : (item.payoutPercentage || 0);
                  const cVal = draftComm !== '' ? parseFloat(draftComm) : (item.commissionPercentage || 0);
                  const disb = Number(item.disbursedAmount) || 0;

                  const { netPayout, netSettlement, netRevenue } = computePayoutMetrics(disb, pVal, cVal);

                  return (
                    <TableRow key={item._uniqueId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      {/* 1. Entry Date */}
                      <TableCell className="py-3 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(item._entryDate)}
                      </TableCell>

                      {/* 2. Disbursed Date */}
                      <TableCell className="py-3 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(item.disbursedDate)}
                      </TableCell>

                      {/* 3. Consultant Name */}
                      <TableCell className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block leading-tight">
                              {item.consultantName || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium leading-tight">
                              {branches.find(b => b.id === item._branchId)?.name || item.branchLocation || 'Guwahati'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 4. Consultant Email */}
                      <TableCell className="py-3 px-2 text-center">
                        <EmailCell email={item.consultantEmail} />
                      </TableCell>

                      {/* 5. Customer Name */}
                      <TableCell className="py-3 px-3.5 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {item.customerName || '-'}
                      </TableCell>

                      {/* 6. Disbursed Amount */}
                      <TableCell className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className="text-slate-900 dark:text-white">
                          {formatInr(disb)}
                        </span>
                      </TableCell>

                      {/* 7. Payout (%) with Dropdown */}
                      <TableCell className="py-3 px-2.5 text-center">
                        {isEditing ? (
                          <select
                            value={draftPayout}
                            onChange={(e) => handlePayoutChange(item._uniqueId, e.target.value)}
                            className="h-8 text-xs font-bold rounded-lg px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 mx-auto"
                          >
                            <option value="">Select %</option>
                            {PAYOUT_PRESETS.map((pct) => (
                              <option key={pct} value={pct}>
                                {pct}%
                              </option>
                            ))}
                            {draftPayout && !PAYOUT_PRESETS.includes(parseFloat(draftPayout)) && (
                              <option value={draftPayout}>{draftPayout}%</option>
                            )}
                          </select>
                        ) : (
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {item.payoutPercentage !== undefined ? `${item.payoutPercentage}%` : '—'}
                          </span>
                        )}
                      </TableCell>

                      {/* 8. Payout Amount (₹) (Lender Payout - 2% TDS) */}
                      <TableCell className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {pVal > 0 && disb > 0 ? formatInr(netPayout) : '—'}
                      </TableCell>

                      {/* 9. Commission (%) */}
                      <TableCell className="py-3 px-2.5 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={draftComm}
                            onChange={(e) => handleCommissionChange(item._uniqueId, e.target.value)}
                            className="w-16 text-center font-bold text-xs h-8 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 px-2 mx-auto"
                            placeholder="0.0"
                          />
                        ) : (
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {item.commissionPercentage !== undefined ? `${item.commissionPercentage}%` : '—'}
                          </span>
                        )}
                      </TableCell>

                      {/* 10. Settlement (₹) (Consultant Payout - 2% TDS) */}
                      <TableCell className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {cVal > 0 && disb > 0 ? formatInr(netSettlement) : '—'}
                      </TableCell>

                      {/* 11. Status */}
                      <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={draftStatus}
                            onChange={(e) => handleStatusChange(item._uniqueId, e.target.value as 'Not Settled' | 'Settled')}
                            className={`h-8 rounded-lg px-2 text-xs font-bold border outline-none focus:ring-2 focus:ring-indigo-500 mx-auto ${
                              draftStatus === 'Settled' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            <option value="Not Settled">Not Settled</option>
                            <option value="Settled">Settled</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.settlementStatus === 'Settled' 
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800' 
                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300/60 dark:border-rose-800'
                          }`}>
                            {item.settlementStatus || 'Not Settled'}
                          </span>
                        )}
                      </TableCell>

                      {/* 12. Date of Settlement */}
                      <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                        {isEditing && draftStatus === 'Settled' ? (
                          <Input
                            type="date"
                            value={draftDate}
                            onChange={(e) => handleDateChange(item._uniqueId, e.target.value)}
                            className="w-32 h-8 text-xs font-medium bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 px-2 mx-auto"
                          />
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">
                            {item.settlementStatus === 'Settled' ? formatDate(item.settlementDate) : '—'}
                          </span>
                        )}
                      </TableCell>

                      {/* 13. Revenue (₹) (Payout Amount - Settlement) */}
                      <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                        {(pVal > 0 || cVal > 0) && disb > 0 ? (
                          <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                            netRevenue > 0 
                              ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40' 
                              : netRevenue < 0 
                              ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40' 
                              : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {formatInr(netRevenue)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* 14. Action Button */}
                      <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleSaveItem(item)}
                            className="h-7 px-3 text-xs font-bold rounded-lg bg-button-primary text-text-white shadow-xs inset-shadow-2xs border border-white/10 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingIds(prev => ({ ...prev, [item._uniqueId]: true }))}
                            className="h-7 px-2.5 text-xs font-bold rounded-lg text-accent-600 hover:bg-background-secondary-hover dark:text-accent-400 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
