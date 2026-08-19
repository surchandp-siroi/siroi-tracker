import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Consultant } from '@/store/useDataStore';
import { Loader2, Check, X, FileText, Download, Trash2, MoreHorizontal, MapPin, Phone, Mail, Building2, CreditCard, UserCircle } from 'lucide-react';
import { triggerNotification } from '@/lib/notifications';
import { EditConsultantDialog } from '@/components/EditConsultantDialog';



const BANK_MAP: Record<string, string> = {
  "airp": "Airtel Payments Bank",
  "aubl": "AU Small Finance Bank Limited",
  "barb": "Bank of Baroda",
  "bdbl": "Bandhan Bank",
  "bkid": "Bank of India",
  "cbin": "Central Bank of India",
  "ciub": "City Union Bank",
  "cnrb": "Canara Bank",
  "csbk": "CSB Bank Limited",
  "dcbl": "DCB Bank Limited",
  "dlxb": "Dhanalakshmi Bank",
  "esmf": "ESAF Small Finance Bank",
  "fdrl": "Federal Bank",
  "fino": "FINO Payments Bank",
  "hdfc": "HDFC Bank",
  "ibkl": "IDBI Bank",
  "icic": "ICICI Bank Limited",
  "idfb": "IDFC First Bank Limited",
  "idib": "Indian Bank",
  "indb": "IndusInd Bank",
  "ioba": "Indian Overseas Bank",
  "jaka": "Jammu and Kashmir Bank",
  "jiop": "Jio Payments Bank",
  "karb": "Karnataka Bank Limited",
  "kkbk": "Kotak Mahindra Bank Limited",
  "kvbl": "Karur Vysya Bank",
  "mahb": "Bank of Maharashtra",
  "ntbl": "The Nainital Bank Limited",
  "psib": "Punjab and Sind Bank",
  "punb": "Punjab National Bank",
  "pytm": "Paytm Payments Bank",
  "ratn": "RBL Bank Limited",
  "sbin": "State Bank of India",
  "scbl": "Standard Chartered Bank",
  "sibl": "South Indian Bank",
  "tmbl": "Tamilnad Mercantile Bank Limited",
  "ubin": "Union Bank of India",
  "ucba": "UCO Bank",
  "ujvn": "Ujjivan Small Finance Bank Ltd",
  "utib": "Axis Bank",
  "yesb": "Yes Bank"
};


const getFormattedBankName = (bankName: string) => {
    if (!bankName) return bankName;
    const name = bankName.toLowerCase().trim();
    
    // Explicit overrides for common shorthand names and collisions
    if (name.includes('slice')) return 'Slice Small Finance Bank';
    if (name.includes('north east small finance')) return 'North East Small Finance Bank';
    if (name.includes('slice')) return '/banks/slice.svg';
    if (name.includes('north east small finance')) return '/banks/nesfb.svg';
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

    // Reverse lookup
    const sortedBanks = Object.entries(BANK_MAP).sort((a, b) => b[1].length - a[1].length);
    for (const [slug, fullName] of sortedBanks) {
        if (name.includes(fullName.toLowerCase()) || fullName.toLowerCase().includes(name)) {
            return fullName;
        }
    }
    
    // Fallback: Title Case
    return bankName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getBankLogoUrl = (bankName: string) => {
    const name = (bankName || '').toLowerCase().trim();
    
    // Explicit overrides for common shorthand names and collisions
    if (name.includes('slice')) return '/banks/slice.svg';
    if (name.includes('north east small finance')) return '/banks/nesfb.svg';
    if (name.includes('state bank') || name.includes('sbi')) return '/banks/sbin/symbol.svg';
    if (name.includes('pnb') || name.includes('punjab national')) return '/banks/punb/symbol.svg';
    if (name.includes('hdfc')) return '/banks/hdfc/symbol.svg';
    if (name.includes('icici')) return '/banks/icic/symbol.svg';
    if (name.includes('axis')) return '/banks/utib/symbol.svg';
    if (name.includes('kotak')) return '/banks/kkbk/symbol.svg';
    if (name.includes('yes')) return '/banks/yesb/symbol.svg';
    if (name.includes('canara')) return '/banks/cnrb/symbol.svg';
    if (name.includes('bank of baroda')) return '/banks/barb/symbol.svg';
    if (name.includes('union bank')) return '/banks/ubin/symbol.svg';
    if (name.includes('central bank')) return '/banks/cbin/symbol.svg';
    if (name.includes('maharashtra')) return '/banks/mahb/symbol.svg';
    if (name === 'bank of india' || name.includes('bank of india')) return '/banks/bkid/symbol.svg';

    // Reverse lookup, sort by length descending to avoid substring bugs
    const sortedBanks = Object.entries(BANK_MAP).sort((a, b) => b[1].length - a[1].length);
    for (const [slug, fullName] of sortedBanks) {
        if (name.includes(fullName.toLowerCase()) || fullName.toLowerCase().includes(name)) {
            return `/banks/${slug}/symbol.svg`;
        }
    }
    return null;
};

const BankIcon = ({ bankName, className }: { bankName: string, className?: string }) => {
    const logoUrl = getBankLogoUrl(bankName);
    const [error, setError] = useState(false);

    if (logoUrl && !error) {
        return <img src={logoUrl} alt={bankName} className={`${className || ''} object-contain rounded bg-white p-[2px] shadow-sm ring-1 ring-slate-900/5`} onError={() => setError(true)} />;
    }
    return <CreditCard className={`${className || ''} text-slate-400`} />;
};

export default function ConsultantApprovalPage() {
    const [pendingConsultants, setPendingConsultants] = useState<Consultant[]>([]);
    const [approvedConsultants, setApprovedConsultants] = useState<Consultant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApprovedLoading, setIsApprovedLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filterState, setFilterState] = useState<string>('All');
    const [filterBranch, setFilterBranch] = useState<string>('All');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);

    useEffect(() => {
        fetchPending();
        fetchApproved();
    }, []);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('consultants')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setPendingConsultants(data as Consultant[]);
        } catch (error) {
            console.error('Error fetching pending consultants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchApproved = async () => {
        setIsApprovedLoading(true);
        try {
            const { data, error } = await supabase
                .from('consultants')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setApprovedConsultants(data as Consultant[]);
        } catch (error) {
            console.error('Error fetching approved consultants:', error);
        } finally {
            setIsApprovedLoading(false);
        }
    };

    const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
        setActionLoading(id);
        try {
            const consultantToUpdate = pendingConsultants.find(c => c.id === id);
            const finalBankName = newStatus === 'approved' && consultantToUpdate?.bank_name 
                ? getFormattedBankName(consultantToUpdate.bank_name)
                : consultantToUpdate?.bank_name;

            const { error } = await supabase
                .from('consultants')
                .update({ 
                    status: newStatus,
                    ...(newStatus === 'approved' ? { bank_name: finalBankName } : {})
                })
                .eq('id', id);
            
            if (error) throw error;
            
            // Remove from list
            setPendingConsultants(prev => prev.filter(c => c.id !== id));
            
            if (newStatus === 'approved') {
                if (consultantToUpdate) {
                    setApprovedConsultants(prev => [{ ...consultantToUpdate, status: 'approved', bank_name: finalBankName }, ...prev]);
                    
                    // Trigger email notification
                    triggerNotification('onboarding_approved', {
                        email: consultantToUpdate.email,
                        name: consultantToUpdate.name
                    });
                }
            }
        } catch (error) {
            console.error(`Error ${newStatus} consultant:`, error);
            alert(`Failed to ${newStatus} consultant. Please try again.`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('consultants')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            setApprovedConsultants(prev => prev.filter(c => c.id !== id));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting consultant:', error);
            alert('Failed to delete consultant. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleFormatAllBanks = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('consultants').select('*');
            if (error) throw error;
            
            let updated = 0;
            for (const c of data) {
                const newName = getFormattedBankName(c.bank_name);
                if (newName !== c.bank_name) {
                    await supabase.from('consultants').update({ bank_name: newName }).eq('id', c.id);
                    updated++;
                }
            }
            fetchPending();
            fetchApproved();
        } catch (e) {
            console.error(e);
            alert('Error formatting banks');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSave = async (id: string, updates: Partial<Consultant>) => {
        try {
            const { error } = await supabase
                .from('consultants')
                .update(updates)
                .eq('id', id);
            
            if (error) throw error;
            
            setApprovedConsultants(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            // Optional success notification could go here
        } catch (error) {
            console.error('Error updating consultant:', error);
            alert('Failed to update consultant.');
            throw error;
        }
    };

    const handleDownload = async (path: string, fallbackName: string) => {
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

    const uniqueStates = Array.from(new Set(approvedConsultants.map(c => c.state))).filter(Boolean).sort();
    const uniqueBranches = Array.from(new Set(approvedConsultants.map(c => c.associated_branch))).filter(Boolean).sort();

    const filteredApproved = approvedConsultants.filter(c => {
        if (filterState !== 'All' && c.state !== filterState) return false;
        if (filterBranch !== 'All' && c.associated_branch !== filterBranch) return false;
        return true;
    });

    return (
        <div className="space-y-12 pb-24">
            <div className="max-w-7xl">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-500 mb-3 block">Consultant Management</span>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Consultant Approval</h1>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">Review and approve new consultant registrations. Ensure all provided documents and bank details are accurate before proceeding.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] ring-1 ring-slate-200/50 dark:ring-white/10 rounded-3xl overflow-hidden">
                <div className="flex flex-col space-y-1.5 p-6 md:p-8 border-b border-slate-100 dark:border-white/5">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            Pending Requests
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold">
                                {pendingConsultants.length}
                            </span>
                        </h2>
                    </div>
                    <div className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : pendingConsultants.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            No pending consultant requests.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Name & Contact</th>
                                        <th className="px-6 py-4 font-semibold">Location</th>
                                        <th className="px-6 py-4 font-semibold">Bank Details</th>
                                        <th className="px-6 py-4 font-semibold">Documents</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {pendingConsultants.map((consultant) => (
                                        <tr key={consultant.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-300">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-2 rounded-full bg-blue-500 dark:bg-blue-600 shrink-0 shadow-sm">
                                                        <UserCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white text-base">{consultant.name}</div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><span className="bg-orange-500 rounded-full p-[3px] shadow-sm"><Mail className="w-2.5 h-2.5 text-white" /></span> {consultant.email}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><span className="bg-violet-500 rounded-full p-[3px] shadow-sm"><Phone className="w-2.5 h-2.5 text-white" /></span> {consultant.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium text-xs mb-2">
                                                    <Building2 className="w-3 h-3" /> {consultant.associated_branch} Branch
                                                </div>
                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <span className="bg-emerald-500 rounded-full p-1 shadow-sm"><MapPin className="w-2.5 h-2.5 text-white" /></span> {consultant.state}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{consultant.address}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{consultant.pincode}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <BankIcon bankName={getFormattedBankName(consultant.bank_name)} className="w-6 h-6 shrink-0" /> {getFormattedBankName(consultant.bank_name)}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block">A/c: {consultant.account_number}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase">IFSC: {consultant.ifsc_code}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-2 w-max">
                                                    <button 
                                                        className="h-8 text-xs flex items-center justify-start px-3 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-all duration-300 active:scale-[0.98] border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                                                        onClick={() => handleDownload(consultant.pan_file_url, 'PAN_Card')}
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-indigo-500 mr-2" /> PAN: {consultant.pan_number}
                                                    </button>
                                                    <button 
                                                        className="h-8 text-xs flex items-center justify-start px-3 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-all duration-300 active:scale-[0.98] border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                                                        onClick={() => handleDownload(consultant.aadhar_file_url, 'Aadhar_Card')}
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-indigo-500 mr-2" /> Aadhar: {consultant.aadhar_number}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-500 hover:text-white dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-600 dark:hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.9] disabled:opacity-50 disabled:pointer-events-none"
                                                        disabled={actionLoading === consultant.id}
                                                        onClick={() => handleAction(consultant.id, 'approved')}
                                                        title="Approve"
                                                    >
                                                        {actionLoading === consultant.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                    </button>
                                                    <button 
                                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.9] disabled:opacity-50 disabled:pointer-events-none"
                                                        disabled={actionLoading === consultant.id}
                                                        onClick={() => handleAction(consultant.id, 'rejected')}
                                                        title="Reject"
                                                    >
                                                        {actionLoading === consultant.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Approved Consultants */}
            <div className="bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] ring-1 ring-slate-200/50 dark:ring-white/10 rounded-3xl overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-white/5 gap-4">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            Approved Consultants
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-semibold">
                                {filteredApproved.length}
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 p-1.5 rounded-full shadow-lg shadow-indigo-600/20">
                            <select 
                                value={filterState} 
                                onChange={(e) => setFilterState(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-white px-4 py-1.5 focus:outline-none appearance-none pr-8 cursor-pointer rounded-full hover:bg-white/10 transition-colors"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value="All" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">All States</option>
                                {uniqueStates.map(state => <option key={state} value={state} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">{state}</option>)}
                            </select>
                            <div className="w-px h-5 bg-white/20"></div>
                            <select 
                                value={filterBranch} 
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-white px-4 py-1.5 focus:outline-none appearance-none pr-8 cursor-pointer rounded-full hover:bg-white/10 transition-colors"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value="All" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">All Branches</option>
                                {uniqueBranches.map(branch => <option key={branch} value={branch} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">{branch}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-0">
                    {isApprovedLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : approvedConsultants.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            No approved consultants.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Name & Contact</th>
                                        <th className="px-6 py-4 font-semibold">Location</th>
                                        <th className="px-6 py-4 font-semibold">Bank Details</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredApproved.map((consultant) => (
                                        <tr key={consultant.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-300">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-2 rounded-full bg-blue-500 dark:bg-blue-600 shrink-0 shadow-sm">
                                                        <UserCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white text-base">{consultant.name}</div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><span className="bg-orange-500 rounded-full p-[3px] shadow-sm"><Mail className="w-2.5 h-2.5 text-white" /></span> {consultant.email}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><span className="bg-violet-500 rounded-full p-[3px] shadow-sm"><Phone className="w-2.5 h-2.5 text-white" /></span> {consultant.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium text-xs mb-2">
                                                    <Building2 className="w-3 h-3" /> {consultant.associated_branch} Branch
                                                </div>
                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <span className="bg-emerald-500 rounded-full p-1 shadow-sm"><MapPin className="w-2.5 h-2.5 text-white" /></span> {consultant.state}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{consultant.address}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{consultant.pincode}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <BankIcon bankName={getFormattedBankName(consultant.bank_name)} className="w-6 h-6 shrink-0" /> {getFormattedBankName(consultant.bank_name)}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block">A/c: {consultant.account_number}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase">IFSC: {consultant.ifsc_code}</div>
                                            </td>
                                            <td className="px-6 py-5 text-right relative">
                                                {confirmDeleteId === consultant.id ? (
                                                    <div className="flex items-center justify-end gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full inline-flex">
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 px-2">Sure?</span>
                                                        <button 
                                                            className="h-8 px-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 text-xs font-bold shadow-[0_2px_10px_rgba(239,68,68,0.3)] active:scale-95 flex items-center justify-center min-w-[60px]"
                                                            disabled={actionLoading === consultant.id}
                                                            onClick={() => handleDelete(consultant.id)}
                                                        >
                                                            {actionLoading === consultant.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes'}
                                                        </button>
                                                        <button 
                                                            className="h-8 px-4 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 text-xs font-bold active:scale-95 shadow-sm"
                                                            disabled={actionLoading === consultant.id}
                                                            onClick={() => setConfirmDeleteId(null)}
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button 
                                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.9]"
                                                            onClick={() => setOpenMenuId(openMenuId === consultant.id ? null : consultant.id)}
                                                        >
                                                            <MoreHorizontal className="w-5 h-5" />
                                                        </button>
                                                        {openMenuId === consultant.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                                                <div className="absolute right-12 top-10 z-20 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                                    <button 
                                                                        onClick={() => { setEditingConsultant(consultant); setOpenMenuId(null); }}
                                                                        className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                                    >
                                                                        Edit Details
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => { setConfirmDeleteId(consultant.id); setOpenMenuId(null); }}
                                                                        className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <EditConsultantDialog
                consultant={editingConsultant}
                isOpen={!!editingConsultant}
                onClose={() => setEditingConsultant(null)}
                onSave={handleEditSave}
            />
        </div>
    );
}
