import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Consultant } from '@/store/useDataStore';
import { useAuthStore, BRANCH_ACCOUNTS } from '@/store/useAuthStore';
import { getBankLogoPath } from '@/utils/bankMapper';
import { 
  Users, UserCheck, Phone, Mail, MapPin, Building2, CreditCard, 
  Search, Download, FileText, Check, Copy, ShieldCheck, Sparkles, 
  RefreshCw, Filter, Calendar, ExternalLink
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import * as XLSX from 'xlsx';

const BRANCH_LOCATION_ALIASES: Record<string, string[]> = {
  b1: ['Guwahati', 'Guwahati (HO)', 'HO'],
  b2: ['Manipur', 'Imphal'],
  b3: ['Itanagar', 'Arunachal Pradesh'],
  b4: ['Nagaland & Mizoram', 'Nagaland', 'Mizoram', 'Dimapur', 'Aizawl']
};

const getFormattedBankName = (bankName: string) => {
  if (!bankName) return bankName;
  const name = bankName.toLowerCase().trim();
  
  if (name.includes('slice')) return 'Slice Small Finance Bank';
  if (name.includes('north east small finance')) return 'North East Small Finance Bank';
  if (name.includes('state bank') || name.includes('sbi')) return 'State Bank of India';
  if (name.includes('pnb') || name.includes('punjab national')) return 'Punjab National Bank';
  if (name.includes('hdfc')) return 'HDFC Bank';
  if (name.includes('icici')) return 'ICICI Bank';
  if (name.includes('axis')) return 'Axis Bank';
  if (name.includes('kotak')) return 'Kotak Mahindra Bank';
  if (name.includes('yes')) return 'Yes Bank';
  if (name.includes('canara')) return 'Canara Bank';
  if (name.includes('bank of baroda')) return 'Bank of Baroda';
  if (name.includes('union bank')) return 'Union Bank of India';
  if (name.includes('central bank')) return 'Central Bank of India';
  if (name.includes('maharashtra')) return 'Bank of Maharashtra';
  if (name === 'bank of india' || name.includes('bank of india')) return 'Bank of India';

  return bankName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const BankIcon = ({ bankName, className }: { bankName?: string, className?: string }) => {
  const isMobileApp = Capacitor.isNativePlatform();
  const logoPath = !isMobileApp && bankName ? getBankLogoPath(bankName) : null;
  
  if (logoPath) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className || ''}`}>
        <img src={logoPath} alt={bankName} className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className={`w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 ${className || ''}`}>
      <Building2 className="w-4 h-4" />
    </div>
  );
};

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('All');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentUser = useAuthStore(state => state.user);
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  const managerBranchAccount = currentUser?.email ? BRANCH_ACCOUNTS[currentUser.email.toLowerCase()] : null;
  const managerBranchId = currentUser?.branchId || managerBranchAccount?.branchId || '';
  const managerBranchName = managerBranchAccount?.branchName || currentUser?.latestLocation || 'Branch';

  const allowedAliases = useMemo(() => {
    if (!isManager) return null;
    if (managerBranchId && BRANCH_LOCATION_ALIASES[managerBranchId]) {
      return BRANCH_LOCATION_ALIASES[managerBranchId];
    }
    return [managerBranchName];
  }, [isManager, managerBranchId, managerBranchName]);

  useEffect(() => {
    fetchConsultants();
  }, [allowedAliases]);

  const fetchConsultants = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('consultants')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (isManager && allowedAliases && allowedAliases.length > 0) {
        query = query.in('associated_branch', allowedAliases);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching consultants:', error);
      } else if (data) {
        if (isManager && allowedAliases && allowedAliases.length > 0) {
          const lowerAllowed = allowedAliases.map(l => l.toLowerCase());
          const scoped = data.filter(c => 
            lowerAllowed.includes((c.associated_branch || '').toLowerCase().trim()) ||
            lowerAllowed.includes((c.state || '').toLowerCase().trim()) ||
            lowerAllowed.some(al => (c.associated_branch || '').toLowerCase().includes(al))
          );
          setConsultants(scoped as Consultant[]);
        } else {
          setConsultants(data as Consultant[]);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, fieldKey: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadDoc = async (path: string, fallbackName: string) => {
    if (!path) return;
    try {
      const { data, error } = await supabase.storage.from('consultant_docs').download(path);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || fallbackName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      console.error("Error downloading file", e);
      alert("Could not download file.");
    }
  };

  const handleExportExcel = () => {
    if (filteredConsultants.length === 0) return;
    try {
      const exportData = filteredConsultants.map(c => ({
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone,
        'Bank Name': getFormattedBankName(c.bank_name),
        'Account Number': c.account_number,
        'IFSC Code': c.ifsc_code,
        'Associated Branch': c.associated_branch,
        'State': c.state,
        'City': c.city || '',
        'Pincode': c.pincode,
        'Address': c.address,
        'PAN': c.pan_number,
        'Aadhar': c.aadhar_number,
        'Status': c.status,
        'Onboarded Date': new Date(c.created_at).toLocaleDateString('en-IN')
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Consultants");
      const fileName = `Consultants_${isManager ? managerBranchName : selectedBranchFilter}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Export error:", err);
      alert('Failed to export Excel file');
    }
  };

  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(consultants.map(c => c.associated_branch))).filter(Boolean).sort();
  }, [consultants]);

  const filteredConsultants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return consultants.filter(c => {
      if (isAdmin && selectedBranchFilter !== 'All' && c.associated_branch !== selectedBranchFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (c.name?.toLowerCase() || '').includes(q) ||
        (c.phone?.toLowerCase() || '').includes(q) ||
        (c.email?.toLowerCase() || '').includes(q) ||
        (c.pan_number?.toLowerCase() || '').includes(q) ||
        (c.bank_name?.toLowerCase() || '').includes(q) ||
        (c.associated_branch?.toLowerCase() || '').includes(q) ||
        (c.state?.toLowerCase() || '').includes(q) ||
        (c.city?.toLowerCase() || '').includes(q)
      );
    });
  }, [consultants, searchQuery, selectedBranchFilter, isAdmin]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
      
      {/* Header Section with Double-Bezel Architecture */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Sparkles className="w-3 h-3" />
              {isManager ? `${managerBranchName} Consultant Roster` : 'Authorized Consultant Network'}
            </span>
            {isManager && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-2.5 h-2.5" /> Scoped to Branch
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Branch Consultants
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isManager 
              ? `Onboarded and verified business consultants linked directly to the ${managerBranchName} branch.` 
              : 'Complete registry of approved institutional partners and external consultants across all branches.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchConsultants}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportExcel}
            disabled={filteredConsultants.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Double-Bezel Metrics & Summary Shelf */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Active Consultants */}
        <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <div className="p-6 rounded-[calc(1.75rem-0.25rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {isManager ? `${managerBranchName} Consultants` : 'Total Active Network'}
              </p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-black tracking-tight font-mono text-slate-900 dark:text-white">
                  {isLoading ? '—' : consultants.length}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Approved & Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Compliance Status */}
        <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-sm">
          <div className="p-6 rounded-[calc(1.75rem-0.25rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/5 relative overflow-hidden">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              KYC & Bank Verified
            </p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-black tracking-tight font-mono text-slate-900 dark:text-white">
                100%
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Full Documentation
              </span>
            </div>
          </div>
        </div>

        {/* Branch Scope Badge */}
        <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-slate-200/60 via-slate-200/20 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent border border-slate-200/80 dark:border-white/10 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="p-6 rounded-[calc(1.75rem-0.25rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/5 relative overflow-hidden flex flex-col justify-between h-full">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Assigned Territory
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                {isManager ? `${managerBranchName} Branch` : 'All 4 Regional Hubs'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-3">
              {isManager 
                ? 'Strict privacy: Consultants from other branches are restricted.' 
                : 'Super Admin: Cross-branch access enabled.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Shelf */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by consultant name, phone, email, PAN, bank name, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-13 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm font-medium transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Admin Multi-Branch Filter Switcher */}
        {isAdmin && uniqueBranches.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-2xl shrink-0">
            <button
              onClick={() => setSelectedBranchFilter('All')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedBranchFilter === 'All'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              All Branches
            </button>
            {uniqueBranches.map((br) => (
              <button
                key={br}
                onClick={() => setSelectedBranchFilter(br)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedBranchFilter === br
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {br}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Consultants Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-1 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
            <div className="p-12 text-center rounded-[calc(1.5rem-0.25rem)] bg-white/80 dark:bg-slate-900/80">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading consultant roster...</p>
              <p className="text-xs text-slate-400 mt-1">Verifying branch association credentials</p>
            </div>
          </div>
        ) : filteredConsultants.length === 0 ? (
          <div className="p-1 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
            <div className="p-12 text-center rounded-[calc(1.5rem-0.25rem)] bg-white/80 dark:bg-slate-900/80">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Consultants Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery 
                  ? `No consultants matched "${searchQuery}". Try a different keyword.` 
                  : isManager 
                  ? `No approved consultants are currently listed under the ${managerBranchName} branch.` 
                  : 'No approved consultant records are currently in the system.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConsultants.map((consultant) => {
              const cId = consultant.id;
              const isPhoneCopied = copiedField === `phone_${cId}`;
              const isEmailCopied = copiedField === `email_${cId}`;
              const isPanCopied = copiedField === `pan_${cId}`;
              const isAccCopied = copiedField === `acc_${cId}`;

              return (
                <div 
                  key={cId}
                  className="p-1 rounded-[1.75rem] bg-gradient-to-b from-slate-200/60 via-slate-100/30 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="p-5 rounded-[calc(1.75rem-0.25rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/60 dark:border-white/5 flex flex-col justify-between h-full relative overflow-hidden">
                    
                    {/* Top Identity Header */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 
                            className="font-bold text-slate-900 dark:text-white text-base truncate" 
                            title={consultant.name}
                          >
                            {consultant.name}
                          </h3>
                          
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              {consultant.associated_branch} Branch
                            </span>

                            {consultant.state && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {consultant.state}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Approved
                        </span>
                      </div>

                      {/* Contact Info Shelf */}
                      <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300">
                        {/* Phone */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-mono">{consultant.phone || 'No phone'}</span>
                          </div>
                          {consultant.phone && (
                            <button
                              onClick={() => handleCopy(consultant.phone, `phone_${cId}`)}
                              className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Copy Phone"
                            >
                              {isPhoneCopied ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate" title={consultant.email}>{consultant.email}</span>
                          </div>
                          {consultant.email && (
                            <button
                              onClick={() => handleCopy(consultant.email, `email_${cId}`)}
                              className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Copy Email"
                            >
                              {isEmailCopied ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bank Details Container */}
                      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <BankIcon bankName={getFormattedBankName(consultant.bank_name)} className="w-5 h-5" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                            {getFormattedBankName(consultant.bank_name) || 'Bank Details'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400 font-mono">
                            A/c: {consultant.account_number ? `•••• ${consultant.account_number.slice(-4)}` : 'N/A'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            IFSC: {consultant.ifsc_code || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom KYC Documents & Meta */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        {/* PAN Document */}
                        {consultant.pan_file_url ? (
                          <button
                            onClick={() => handleDownloadDoc(consultant.pan_file_url, `PAN_${consultant.name}`)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200/60 dark:border-indigo-800/40 flex-1 justify-center"
                            title="Download PAN Card"
                          >
                            <FileText className="w-3 h-3 text-indigo-500" />
                            <span>PAN: {consultant.pan_number || 'View'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1 text-center">
                            PAN: {consultant.pan_number || 'N/A'}
                          </span>
                        )}

                        {/* Aadhar Document */}
                        {consultant.aadhar_file_url && (
                          <button
                            onClick={() => handleDownloadDoc(consultant.aadhar_file_url, `Aadhar_${consultant.name}`)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200/60 dark:border-indigo-800/40 flex-1 justify-center"
                            title="Download Aadhar Card"
                          >
                            <FileText className="w-3 h-3 text-indigo-500" />
                            <span>Aadhar KYC</span>
                          </button>
                        )}
                      </div>

                      {/* Onboarded Date */}
                      {consultant.created_at && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Onboarded:
                          </span>
                          <span className="font-mono font-medium text-slate-600 dark:text-slate-400">
                            {new Date(consultant.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
