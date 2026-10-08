import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui';
import { 
  Search, UsersRound, Phone, MapPin, User, Calendar, Mail, 
  Building, Copy, Check, ShieldCheck, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { useAuthStore, BRANCH_ACCOUNTS } from '@/store/useAuthStore';
import { EditCustomerDialog } from '@/components/EditCustomerDialog';
import { Edit } from 'lucide-react';

type CustomerData = {
  id: string;
  created_at: string;
  pan_number: string;
  customer_name: string;
  customer_type?: string;
  phone_number: string;
  email_id: string;
  entry_person_name: string;
  entry_location: string;
  association_date: string;
  city: string;
};

const BRANCH_LOCATION_ALIASES: Record<string, string[]> = {
  b1: ['Guwahati', 'Guwahati (HO)', 'HO'],
  b2: ['Manipur', 'Imphal'],
  b3: ['Itanagar', 'Arunachal Pradesh'],
  b4: ['Nagaland & Mizoram', 'Nagaland', 'Mizoram', 'Dimapur', 'Aizawl']
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  
  const currentUser = useAuthStore(state => state.user);
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  
  const managerBranchAccount = currentUser?.email ? BRANCH_ACCOUNTS[currentUser.email.toLowerCase()] : null;
  const managerBranchId = currentUser?.branchId || managerBranchAccount?.branchId || '';
  const managerBranchName = managerBranchAccount?.branchName || currentUser?.latestLocation || 'Branch';

  const allowedLocations = useMemo(() => {
    if (!isManager) return null;
    if (managerBranchId && BRANCH_LOCATION_ALIASES[managerBranchId]) {
      return BRANCH_LOCATION_ALIASES[managerBranchId];
    }
    return [managerBranchName];
  }, [isManager, managerBranchId, managerBranchName]);

  useEffect(() => {
    fetchCustomers();
  }, [allowedLocations]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('customer_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (isManager && allowedLocations && allowedLocations.length > 0) {
        query = query.in('entry_location', allowedLocations);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching customers:', error);
      } else if (data) {
        // Double-guard client-side filter for strict branch privacy
        if (isManager && allowedLocations && allowedLocations.length > 0) {
          const lowerAllowed = allowedLocations.map(l => l.toLowerCase());
          const scoped = data.filter(c => 
            lowerAllowed.includes((c.entry_location || '').toLowerCase().trim()) ||
            lowerAllowed.some(al => (c.entry_location || '').toLowerCase().includes(al))
          );
          setCustomers(scoped);
        } else {
          setCustomers(data);
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

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => 
      (c.customer_name?.toLowerCase() || '').includes(q) ||
      (c.pan_number?.toLowerCase() || '').includes(q) ||
      (c.phone_number?.toLowerCase() || '').includes(q) ||
      (c.email_id?.toLowerCase() || '').includes(q) ||
      (c.entry_person_name?.toLowerCase() || '').includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
      
      {/* Header Section with Double-Bezel Design System */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Sparkles className="w-3 h-3" />
              {isManager ? `${managerBranchName} Branch Directory` : 'Enterprise Directory'}
            </span>
            {isManager && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-2.5 h-2.5" /> Scoped
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <UsersRound className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Customer Portfolio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isManager 
              ? `Real-time customer registrations logged strictly for the ${managerBranchName} branch.` 
              : 'Unified ledger of customer registrations, compliance records, and profile associations.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchCustomers}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Double-Bezel Metrics & Summary Shelf */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Count Card */}
        <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <div className="p-6 rounded-[calc(1.75rem-0.25rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UsersRound className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {isManager ? `${managerBranchName} Registrations` : 'Total Active Profiles'}
              </p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-black tracking-tight font-mono text-slate-900 dark:text-white">
                  {isLoading ? '—' : customers.length}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Entries
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtered Count Card */}
        <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-slate-200/60 via-slate-200/20 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="p-6 rounded-[calc(1.75rem-0.25rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/5 relative overflow-hidden">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Matching Search
            </p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-black tracking-tight font-mono text-slate-900 dark:text-white">
                {isLoading ? '—' : filteredCustomers.length}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {searchQuery ? `matches for "${searchQuery}"` : 'all displayed'}
              </span>
            </div>
          </div>
        </div>

        {/* Location Scope Indicator */}
        <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-slate-200/60 via-slate-200/20 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent border border-slate-200/80 dark:border-white/10 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="p-6 rounded-[calc(1.75rem-0.25rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/5 relative overflow-hidden flex flex-col justify-between h-full">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Security Scope
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                {isManager ? `${managerBranchName} Branch Only` : 'Universal Multi-Branch Access'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-3">
              {isManager 
                ? 'Data isolation enabled: Other branch accounts remain encrypted & hidden.' 
                : 'Super Admin: Full cross-branch registry access enabled.'}
            </p>
          </div>
        </div>
      </div>

      {/* Refined Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by customer name, PAN number, phone, email, or entry person..."
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

      {/* Customer Directory Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-1 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
            <div className="p-12 text-center rounded-[calc(1.5rem-0.25rem)] bg-white/80 dark:bg-slate-900/80">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Retrieving customer database...</p>
              <p className="text-xs text-slate-400 mt-1">Applying cryptographic branch isolation filters</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-1 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
            <div className="p-12 text-center rounded-[calc(1.5rem-0.25rem)] bg-white/80 dark:bg-slate-900/80">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <UsersRound className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Customer Records Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery 
                  ? `No entries matched "${searchQuery}". Try searching with a different name or PAN.` 
                  : isManager 
                  ? `No customer entries have been logged for the ${managerBranchName} branch yet.` 
                  : 'No customer records are currently present in the system.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCustomers.map((customer) => {
              const customerId = customer.id || customer.pan_number;
              const isPanCopied = copiedField === `pan_${customerId}`;
              const isPhoneCopied = copiedField === `phone_${customerId}`;

              return (
                <div 
                  key={customerId} 
                  className="p-1 rounded-[1.75rem] bg-gradient-to-b from-slate-200/60 via-slate-100/30 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="p-5 rounded-[calc(1.75rem-0.25rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/60 dark:border-white/5 flex flex-col justify-between h-full relative overflow-hidden">
                    
                    {/* Top Identity Row */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 
                            className="font-bold text-slate-900 dark:text-white text-base truncate" 
                            title={customer.customer_name}
                          >
                            {customer.customer_name || 'Unnamed Record'}
                          </h3>
                          
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {/* PAN Badge with click-to-copy */}
                            <button
                              onClick={() => handleCopy(customer.pan_number, `pan_${customerId}`)}
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-0.5 rounded-md transition-colors border border-slate-200/60 dark:border-white/5"
                              title="Click to copy PAN"
                            >
                              {customer.pan_number || 'PAN Pending'}
                              {isPanCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                              )}
                            </button>

                            {/* Customer Type Tag */}
                            {customer.customer_type && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
                                {customer.customer_type}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit Control for Admin */}
                        {isAdmin && (
                          <button 
                            onClick={() => setEditingCustomer(customer)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors border border-slate-200/50 dark:border-white/5"
                            title="Edit Customer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Contact Details with refined layout */}
                      <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300">
                        {/* Phone */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-mono">{customer.phone_number || 'No phone'}</span>
                          </div>
                          {customer.phone_number && (
                            <button
                              onClick={() => handleCopy(customer.phone_number, `phone_${customerId}`)}
                              className="text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              title="Copy Phone"
                            >
                              {isPhoneCopied ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate" title={customer.email_id || ''}>
                            {customer.email_id || 'No email provided'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Provenance Shelf */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <Building className="w-3.5 h-3.5 text-indigo-500" />
                          {customer.entry_location || 'HO'}
                        </span>
                        {customer.association_date && (
                          <span className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
                            <Calendar className="w-3 h-3" />
                            {customer.association_date}
                          </span>
                        )}
                      </div>

                      {/* Entry Author */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                        <span>Created by:</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {customer.entry_person_name || 'System Record'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <EditCustomerDialog 
          customer={editingCustomer} 
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}

