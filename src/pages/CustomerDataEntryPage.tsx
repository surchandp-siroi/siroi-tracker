import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/store/useDataStore';
import { Button, Input } from '@/components/ui';
import { ArrowLeft, CheckCircle2, AlertTriangle, Search, Loader2, ChevronDown } from 'lucide-react';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';

export default function CustomerDataEntryPage() {
    const navigate = useNavigate();
    const branches = useDataStore(state => state.branches);
    
    const [step, setStep] = useState<1 | 2>(1);
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    
    // Form State
    const [panNumber, setPanNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [aadharNumber, setAadharNumber] = useState('');
    const [associationDate, setAssociationDate] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emailId, setEmailId] = useState('');
    const [entryPersonName, setEntryPersonName] = useState('');
    const [entryLocation, setEntryLocation] = useState(branches[0]?.name || 'HO');
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [existingRecord, setExistingRecord] = useState<any>(null);

    const handlePanLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!panNumber || panNumber.length < 10) {
            setError('Please enter a valid 10-character PAN number.');
            return;
        }
        setError('');
        setIsLoading(true);
        
        try {
            const { data, error: fetchError } = await supabase
                .from('customer_data')
                .select('*')
                .eq('pan_number', panNumber.toUpperCase())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
                
            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }
            
            if (data) {
                if (data.entry_location !== entryLocation) {
                    setError(`This customer entry has already happened at ${data.entry_location}.`);
                    setIsLoading(false);
                    return;
                }
                
                // Exists and location matches, auto-populate
                setCustomerName(data.customer_name || '');
                setAadharNumber(data.aadhar_number || '');
                setAssociationDate(data.association_date || '');
                setAddress(data.address || '');
                setPhoneNumber(data.phone_number || '');
                setEmailId(data.email_id || '');
                setEntryPersonName(data.entry_person_name || '');
                setExistingRecord(data);
            } else {
                setExistingRecord(null);
            }
            
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Failed to lookup PAN.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const { error: insertError } = await supabase
                .from('customer_data')
                .insert([{
                    pan_number: panNumber.toUpperCase(),
                    customer_name: customerName,
                    aadhar_number: aadharNumber,
                    association_date: associationDate,
                    address: address,
                    phone_number: phoneNumber,
                    email_id: emailId,
                    entry_person_name: entryPersonName,
                    entry_location: entryLocation
                }]);
                
            if (insertError) throw insertError;
            
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setStep(1);
                setPanNumber('');
                setCustomerName('');
                setAadharNumber('');
                setAssociationDate('');
                setAddress('');
                setPhoneNumber('');
                setEmailId('');
                setEntryPersonName('');
                setExistingRecord(null);
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save customer data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Minimal Background Orbs to emphasize the glass effect */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-blue-200/60 dark:bg-blue-900/40 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/50 dark:bg-purple-900/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

            <LiquidGlassCard
                glowIntensity="md"
                shadowIntensity="lg"
                borderRadius="2.5rem"
                blurIntensity="lg"
                className="relative z-10 w-full max-w-2xl p-8 sm:p-12 bg-white/60 dark:bg-slate-900/60"
            >
                <button 
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-10 mt-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Customer Data Entry</h1>
                    <p className="text-sm text-slate-500">
                        {step === 1 ? 'Please verify the customer PAN to proceed.' : 'Complete the customer details.'}
                    </p>
                </div>
                
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl mb-8 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
                
                {success ? (
                    <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Entry Successful</h2>
                        <p className="text-slate-500">Ready for next entry...</p>
                    </div>
                ) : (
                    <form onSubmit={step === 1 ? handlePanLookup : handleSubmit} className="space-y-6">
                        
                        {/* Custom Styled Location Dropdown */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Active Location</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                    className="flex items-center justify-between h-12 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                                >
                                    <span>{entryLocation}</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isLocationDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsLocationDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                            {branches.map(branch => (
                                                <button
                                                    key={branch.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setEntryLocation(branch.name);
                                                        if(step === 2) setStep(1);
                                                        setIsLocationDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${entryLocation === branch.name ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                                >
                                                    {branch.name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">PAN Card Number</label>
                            <Input 
                                type="text" 
                                value={panNumber}
                                onChange={(e) => {
                                    setPanNumber(e.target.value.toUpperCase());
                                    if(step === 2) setStep(1);
                                }}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                required
                                className="h-12 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm"
                            />
                        </div>
                        
                        {step === 2 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                                {existingRecord && (
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs text-center font-medium">
                                        Found existing record for this PAN at {entryLocation}. Fields auto-populated.
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer Name</label>
                                        <Input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" required className="h-12 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Aadhar Number</label>
                                        <Input type="text" value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} placeholder="1234 5678 9012" maxLength={14} required className="h-12 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Association Date</label>
                                        <Input type="date" value={associationDate} onChange={(e) => setAssociationDate(e.target.value)} required className="h-12 bg-white/50 border-slate-200 text-slate-900 rounded-xl shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone Number</label>
                                        <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 9876543210" required className="h-12 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm" />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email ID</label>
                                    <Input type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} placeholder="customer@email.com" className="h-12 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Address</label>
                                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full Address" required rows={2} className="w-full flex min-h-[80px] rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900" />
                                </div>

                                <div className="space-y-2 pt-5 border-t border-slate-200/60 mt-2">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Your Name (Data Enterer)</label>
                                    <select 
                                        value={entryPersonName} 
                                        onChange={(e) => setEntryPersonName(e.target.value)} 
                                        required 
                                        className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="" disabled>Select your name...</option>
                                        <option value="Surchand Singh">Surchand Singh</option>
                                        <option value="Sharju Thoudam">Sharju Thoudam</option>
                                        <option value="Tomas">Tomas</option>
                                        <option value="Branch Manager">Branch Manager</option>
                                        <option value="Branch Executive">Branch Executive</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-12 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium tracking-wide transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : step === 1 ? (
                                <span className="flex items-center justify-center gap-2">Verify PAN <Search className="w-4 h-4" /></span>
                            ) : (
                                'Submit Customer Data'
                            )}
                        </Button>
                    </form>
                )}
            </LiquidGlassCard>
        </div>
    );
}
