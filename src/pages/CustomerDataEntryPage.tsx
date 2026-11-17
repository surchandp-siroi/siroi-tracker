import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/store/useDataStore';
import { Button, Input } from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { 
    ArrowLeft, 
    CheckCircle2, 
    AlertTriangle, 
    Search, 
    Loader2, 
    ChevronDown, 
    ChevronRight, 
    ChevronLeft, 
    User, 
    Users, 
    Briefcase, 
    Home, 
    Landmark, 
    Check,
    FileText,
    ShieldCheck
} from 'lucide-react';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';
import { NumericFormat } from 'react-number-format';
import { formatCustomerName, mapCustomerTypeToCategory } from '@/utils/formatCustomerName';

export default function CustomerDataEntryPage() {
    const navigate = useNavigate();
    const branches = useDataStore(state => state.branches);
    const products = useDataStore(state => state.products);
    
    const [step, setStep] = useState<1 | 2>(1);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    
    // Core Form State
    const [panNumber, setPanNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerType, setCustomerType] = useState('');
    const [product, setProduct] = useState('');
    const [amount, setAmount] = useState('');
    const [aadharNumber, setAadharNumber] = useState('');
    const [associationDate, setAssociationDate] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emailId, setEmailId] = useState('');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [incomeType, setIncomeType] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [yearlyIncomeRange, setYearlyIncomeRange] = useState('');
    const [birthday, setBirthday] = useState('');
    const [anniversary, setAnniversary] = useState('');
    const [entryPersonName, setEntryPersonName] = useState('');
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
    const [entryLocation, setEntryLocation] = useState(branches[0]?.name || 'HO');
    const [employees, setEmployees] = useState<string[]>(['Surchand Singh', 'Sharju Thoudam', 'Tomas', 'Branch Manager', 'Branch Executive']);
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
    const employeeDropdownRef = useRef<HTMLDivElement>(null);

    // Loan-Specific Extended Form State
    const [fatherName, setFatherName] = useState('');
    const [motherName, setMotherName] = useState('');
    const [maritalStatus, setMaritalStatus] = useState('');
    const [spouseName, setSpouseName] = useState('');
    const [educationQualification, setEducationQualification] = useState('');
    const [designation, setDesignation] = useState('');
    const [officialEmail, setOfficialEmail] = useState('');
    const [officePhone, setOfficePhone] = useState('');
    const [officeAddress, setOfficeAddress] = useState('');
    const [officeLandmark, setOfficeLandmark] = useState('');
    const [residenceType, setResidenceType] = useState('');
    const [currentAddressLandmark, setCurrentAddressLandmark] = useState('');
    const [yearsInCurrentResidence, setYearsInCurrentResidence] = useState('');
    const [yearsInCurrentCity, setYearsInCurrentCity] = useState('');
    const [isSameAsCurrentAddress, setIsSameAsCurrentAddress] = useState(false);
    const [permanentAddress, setPermanentAddress] = useState('');
    const [permanentAddressLandmark, setPermanentAddressLandmark] = useState('');
    const [permanentPhone, setPermanentPhone] = useState('');
    const [salaryBankName, setSalaryBankName] = useState('');
    const [salaryAccountNumber, setSalaryAccountNumber] = useState('');
    const [tenure, setTenure] = useState('');
    const [ref1Name, setRef1Name] = useState('');
    const [ref1Phone, setRef1Phone] = useState('');
    const [ref1Address, setRef1Address] = useState('');
    const [ref1Relation, setRef1Relation] = useState('');
    const [ref2Name, setRef2Name] = useState('');
    const [ref2Phone, setRef2Phone] = useState('');
    const [ref2Address, setRef2Address] = useState('');
    const [ref2Relation, setRef2Relation] = useState('');

    const isLoan = customerType === 'Loans';

    // Dynamic Sections based on whether Customer Type is Loan vs Standard
    const sections = useMemo(() => {
        if (isLoan) {
            return [
                { id: 'loan_req', title: 'Loan & Requirements', shortTitle: 'Loan Req', icon: Landmark },
                { id: 'family', title: 'Personal & Family', shortTitle: 'Family', icon: Users },
                { id: 'employment', title: 'Work & Office', shortTitle: 'Employment', icon: Briefcase },
                { id: 'residential', title: 'Addresses & Stay', shortTitle: 'Addresses', icon: Home },
                { id: 'banking_refs', title: 'Banking & References', shortTitle: 'Bank & Refs', icon: ShieldCheck },
            ];
        }
        return [
            { id: 'std_primary', title: 'Profile & Requirements', shortTitle: 'Profile', icon: User },
            { id: 'std_address', title: 'Residential Address', shortTitle: 'Address', icon: Home },
            { id: 'std_income', title: 'Income & Author', shortTitle: 'Income', icon: Briefcase },
        ];
    }, [isLoan]);

    // Safety guard to prevent out-of-bounds section index when switching types
    useEffect(() => {
        if (activeSectionIndex >= sections.length) {
            setActiveSectionIndex(0);
        }
    }, [sections, activeSectionIndex]);

    const availableProducts = useMemo(() => {
        const cat = mapCustomerTypeToCategory(customerType);
        if (!cat) return [];
        return products.filter((p: any) => p.category === cat);
    }, [products, customerType]);

    // Sync initial location when branches load
    useEffect(() => {
        if (branches.length > 0 && entryLocation === 'HO') {
            setEntryLocation(branches[0].name);
        }
    }, [branches, entryLocation]);

    useEffect(() => {
        const fetchEmployees = async () => {
            let searchBranches = [entryLocation];
            if (entryLocation === 'HO' || entryLocation === 'Guwahati') {
                searchBranches = ['Guwahati', 'Guwahati (HO)'];
            }
            
            const { data, error } = await supabase
                .from('org_nodes')
                .select('name')
                .in('branch', searchBranches);
                
            if (!error && data && data.length > 0) {
                setEmployees(data.map(d => d.name));
            } else {
                setEmployees(['Surchand Singh', 'Sharju Thoudam', 'Tomas', 'Branch Manager', 'Branch Executive']);
            }
        };
        fetchEmployees();
    }, [entryLocation]);

    // Handle "Same as Current Address" toggle for Loans
    const handleSameAddressToggle = (checked: boolean) => {
        setIsSameAsCurrentAddress(checked);
        if (checked) {
            const combined = [address, city, district, pincode ? `PIN: ${pincode}` : ''].filter(Boolean).join(', ');
            setPermanentAddress(combined || address);
            setPermanentAddressLandmark(currentAddressLandmark);
        } else {
            setPermanentAddress('');
            setPermanentAddressLandmark('');
        }
    };
    
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
                setError(`This PAN number already exists in the system (entered at ${data.entry_location || 'another location'}).`);
                setIsLoading(false);
                return;
            } else {
                setExistingRecord(null);
            }
            
            setStep(2);
            setActiveSectionIndex(0);
        } catch (err: any) {
            setError(err.message || 'Failed to lookup PAN.');
        } finally {
            setIsLoading(false);
        }
    };

    // Section validation before moving forward
    const validateCurrentSection = (index: number): boolean => {
        setError('');
        if (isLoan) {
            if (index === 0) {
                if (!customerName.trim()) { setError('Please enter Customer Name.'); return false; }
                if (!customerType) { setError('Please select Customer Type.'); return false; }
                if (!product) { setError('Please select a Product.'); return false; }
                if (!amount || Number(amount) <= 0) { setError('Please enter a valid positive Loan Amount.'); return false; }
                if (!phoneNumber.trim()) { setError('Please enter Phone Number.'); return false; }
            }
            if (index === 3) {
                if (!address.trim()) { setError('Please enter Current Street Address.'); return false; }
                if (!pincode.trim()) { setError('Please enter Pincode.'); return false; }
                if (!city.trim()) { setError('Please enter City.'); return false; }
                if (!district.trim()) { setError('Please enter District.'); return false; }
            }
            if (index === 4) {
                if (!entryPersonName) { setError('Please select Your Name (Data Enterer).'); return false; }
            }
        } else {
            if (index === 0) {
                if (!customerName.trim()) { setError('Please enter Customer Name.'); return false; }
                if (!customerType) { setError('Please select Customer Type.'); return false; }
                if (!product) { setError('Please select a Product.'); return false; }
                if (!amount || Number(amount) <= 0) { setError('Please enter a valid positive Amount.'); return false; }
                if (!phoneNumber.trim()) { setError('Please enter Phone Number.'); return false; }
            }
            if (index === 1) {
                if (!address.trim()) { setError('Please enter Street Address.'); return false; }
                if (!pincode.trim()) { setError('Please enter Pincode.'); return false; }
                if (!city.trim()) { setError('Please enter City.'); return false; }
                if (!district.trim()) { setError('Please enter District.'); return false; }
            }
            if (index === 2) {
                if (!entryPersonName) { setError('Please select Your Name (Data Enterer).'); return false; }
            }
        }
        return true;
    };

    const handleNextSection = () => {
        if (validateCurrentSection(activeSectionIndex)) {
            if (activeSectionIndex < sections.length - 1) {
                setActiveSectionIndex(prev => prev + 1);
            }
        }
    };

    const handlePrevSection = () => {
        setError('');
        if (activeSectionIndex > 0) {
            setActiveSectionIndex(prev => prev - 1);
        } else {
            setStep(1);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final validation
        if (!customerName.trim()) { setError('Please enter Customer Name.'); setActiveSectionIndex(0); return; }
        if (!customerType) { setError('Please select a Customer Type.'); setActiveSectionIndex(0); return; }
        if (!product) { setError('Please select a Product.'); setActiveSectionIndex(0); return; }
        if (!amount || Number(amount) <= 0) { setError('Please enter a valid positive Amount.'); setActiveSectionIndex(0); return; }
        if (!phoneNumber.trim()) { setError('Please enter Phone Number.'); setActiveSectionIndex(0); return; }
        if (!address.trim() || !pincode.trim() || !city.trim() || !district.trim()) {
            setError('Please fill in complete Address details.');
            setActiveSectionIndex(isLoan ? 3 : 1);
            return;
        }
        if (!entryPersonName) {
            setError('Please select Your Name (Data Enterer).');
            setActiveSectionIndex(sections.length - 1);
            return;
        }

        setError('');
        setIsLoading(true);
        
        try {
            const { error: insertError } = await supabase
                .from('customer_data')
                .insert([{
                    pan_number: panNumber.toUpperCase(),
                    customer_name: formatCustomerName(customerName, true),
                    customer_type: customerType,
                    category: mapCustomerTypeToCategory(customerType),
                    product: product,
                    amount: Number(amount) || 0,
                    aadhar_number: aadharNumber.trim() || null,
                    association_date: associationDate || null,
                    address: address.trim() || null,
                    pincode: pincode.trim() || null,
                    city: city.trim() || null,
                    district: district.trim() || null,
                    phone_number: phoneNumber.trim(),
                    email_id: emailId.trim() || null,
                    income_type: incomeType || null,
                    company_name: companyName.trim() || null,
                    yearly_income_range: yearlyIncomeRange || null,
                    birthday: birthday || null,
                    anniversary: anniversary || null,
                    entry_person_name: entryPersonName,
                    entry_location: entryLocation,

                    // Loan-specific KYC attributes
                    father_name: isLoan ? (fatherName.trim() || null) : null,
                    mother_name: isLoan ? (motherName.trim() || null) : null,
                    marital_status: isLoan ? (maritalStatus || null) : null,
                    spouse_name: isLoan ? (spouseName.trim() || null) : null,
                    education_qualification: isLoan ? (educationQualification || null) : null,
                    designation: isLoan ? (designation.trim() || null) : null,
                    official_email: isLoan ? (officialEmail.trim() || null) : null,
                    office_phone: isLoan ? (officePhone.trim() || null) : null,
                    office_address: isLoan ? (officeAddress.trim() || null) : null,
                    office_landmark: isLoan ? (officeLandmark.trim() || null) : null,
                    residence_type: isLoan ? (residenceType || null) : null,
                    current_address_landmark: isLoan ? (currentAddressLandmark.trim() || null) : null,
                    years_in_current_residence: isLoan ? (yearsInCurrentResidence.trim() || null) : null,
                    years_in_current_city: isLoan ? (yearsInCurrentCity.trim() || null) : null,
                    permanent_address: isLoan ? (permanentAddress.trim() || null) : null,
                    permanent_address_landmark: isLoan ? (permanentAddressLandmark.trim() || null) : null,
                    permanent_phone: isLoan ? (permanentPhone.trim() || null) : null,
                    salary_bank_name: isLoan ? (salaryBankName.trim() || null) : null,
                    salary_account_number: isLoan ? (salaryAccountNumber.trim() || null) : null,
                    tenure: isLoan ? (tenure.trim() || null) : null,
                    ref1_name: isLoan ? (ref1Name.trim() || null) : null,
                    ref1_phone: isLoan ? (ref1Phone.trim() || null) : null,
                    ref1_address: isLoan ? (ref1Address.trim() || null) : null,
                    ref1_relation: isLoan ? (ref1Relation.trim() || null) : null,
                    ref2_name: isLoan ? (ref2Name.trim() || null) : null,
                    ref2_phone: isLoan ? (ref2Phone.trim() || null) : null,
                    ref2_address: isLoan ? (ref2Address.trim() || null) : null,
                    ref2_relation: isLoan ? (ref2Relation.trim() || null) : null,
                }]);
                
            if (insertError) throw insertError;
            
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setStep(1);
                setActiveSectionIndex(0);
                setPanNumber('');
                setCustomerName('');
                setCustomerType('');
                setProduct('');
                setAmount('');
                setAadharNumber('');
                setAssociationDate('');
                setAddress('');
                setPincode('');
                setCity('');
                setDistrict('');
                setPhoneNumber('');
                setEmailId('');
                setIncomeType('');
                setCompanyName('');
                setYearlyIncomeRange('');
                setBirthday('');
                setAnniversary('');
                setEntryPersonName('');
                setFatherName('');
                setMotherName('');
                setMaritalStatus('');
                setSpouseName('');
                setEducationQualification('');
                setDesignation('');
                setOfficialEmail('');
                setOfficePhone('');
                setOfficeAddress('');
                setOfficeLandmark('');
                setResidenceType('');
                setCurrentAddressLandmark('');
                setYearsInCurrentResidence('');
                setYearsInCurrentCity('');
                setIsSameAsCurrentAddress(false);
                setPermanentAddress('');
                setPermanentAddressLandmark('');
                setPermanentPhone('');
                setSalaryBankName('');
                setSalaryAccountNumber('');
                setTenure('');
                setRef1Name('');
                setRef1Phone('');
                setRef1Address('');
                setRef1Relation('');
                setRef2Name('');
                setRef2Phone('');
                setRef2Address('');
                setRef2Relation('');
                setExistingRecord(null);
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to save customer data.');
        } finally {
            setIsLoading(false);
        }
    };

    const progressPercentage = Math.round(((activeSectionIndex + 1) / sections.length) * 100);

    return (
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Ambient Lighting Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[50%] bg-indigo-200/50 dark:bg-indigo-900/30 rounded-full blur-[130px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[50%] bg-blue-200/50 dark:bg-blue-900/30 rounded-full blur-[130px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
            <div className="absolute top-[25%] right-[15%] w-[35%] h-[35%] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[110px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

            <LiquidGlassCard
                glowIntensity="md"
                shadowIntensity="lg"
                borderRadius="2.5rem"
                blurIntensity="lg"
                className="relative z-10 w-full max-w-3xl p-6 sm:p-10 md:p-12 bg-white/70 dark:bg-slate-900/70 shadow-2xl border border-white/60 dark:border-white/10"
            >
                <button 
                    onClick={() => {
                        if (step === 2 && activeSectionIndex > 0) {
                            setActiveSectionIndex(prev => prev - 1);
                        } else if (step === 2) {
                            setStep(1);
                        } else {
                            navigate('/');
                        }
                    }}
                    className="absolute top-6 left-6 text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    title="Go back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-8 mt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest border border-indigo-200/60 dark:border-indigo-500/20 mb-2">
                        {step === 1 ? 'Customer Identification' : isLoan ? 'Loan Application Form' : 'Customer Profile Form'}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Customer Data Entry
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        {step === 1 
                            ? 'Verify PAN to start or check existing customer profile.' 
                            : isLoan 
                                ? 'Complete loan applicant credentials, KYC, and guarantor details.' 
                                : 'Complete basic customer requirement profile.'}
                    </p>
                </div>
                
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-2xl mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                        <p className="text-xs sm:text-sm font-medium">{error}</p>
                    </div>
                )}
                
                {success ? (
                    <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-500 text-center">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Customer Profile Saved!</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Record successfully created and linked to terminal.</p>
                    </div>
                ) : (
                    <form onSubmit={step === 1 ? handlePanLookup : handleSubmit} className="space-y-6">
                        
                        {/* STEP 1: Location & PAN Verification */}
                        {step === 1 && (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                {/* Custom Styled Location Dropdown */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Active Location</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                            className="flex items-center justify-between h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                                        >
                                            <span className="font-medium">{entryLocation}</span>
                                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isLocationDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsLocationDropdownOpen(false)}></div>
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                                    {branches.map(branch => (
                                                        <button
                                                            key={branch.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setEntryLocation(branch.name);
                                                                setIsLocationDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${entryLocation === branch.name ? 'bg-indigo-600 text-white font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
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
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">PAN Card Number</label>
                                        <span className="text-[10px] text-red-500 font-bold">*Mandatory (10 Characters)</span>
                                    </div>
                                    <Input 
                                        type="text" 
                                        value={panNumber}
                                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                                        placeholder="e.g. ABCDE1234F"
                                        maxLength={10}
                                        required
                                        className="h-12 bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl shadow-sm font-mono tracking-wider text-base"
                                    />
                                    <p className="text-[11px] text-slate-400">Verifying PAN ensures no duplicate records exist across locations.</p>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isLoading || panNumber.length < 10}
                                    className="w-full h-12 mt-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium tracking-wide transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <><span>Verify PAN</span><Search className="w-4 h-4" /></>
                                    )}
                                </Button>
                            </div>
                        )}
                        
                        {/* STEP 2: Multi-Section Form with Live Progress Stepper */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                
                                {/* Progress Header & Dynamic Stepper */}
                                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
                                            {React.createElement(sections[activeSectionIndex]?.icon || User, { className: "w-4 h-4 text-indigo-600 dark:text-indigo-400" })}
                                            <span>
                                                Section {activeSectionIndex + 1} of {sections.length}: <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{sections[activeSectionIndex]?.title}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300">
                                                {progressPercentage}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Glowing Animated Progress Track */}
                                    <div className="h-2 w-full rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 overflow-hidden relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-full transition-all duration-500 ease-out shadow-sm"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>

                                    {/* Section Navigation Tabs / Pills */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
                                        {sections.map((sec, idx) => {
                                            const isActive = idx === activeSectionIndex;
                                            const isDone = idx < activeSectionIndex;
                                            return (
                                                <button
                                                    key={sec.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (idx < activeSectionIndex || validateCurrentSection(activeSectionIndex)) {
                                                            setActiveSectionIndex(idx);
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                                        isActive 
                                                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-700' 
                                                            : isDone 
                                                                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50' 
                                                                : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {isDone ? (
                                                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <span className={`w-3.5 h-3.5 rounded-full text-[10px] flex items-center justify-center font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                    <span>{sec.shortTitle}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* SECTION CONTENTS */}

                                {/* === LOAN FORM SECTIONS === */}
                                {isLoan && (
                                    <div className="space-y-5">
                                        
                                        {/* SECTION 1: Loan & Requirements */}
                                        {activeSectionIndex === 0 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Customer Name</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={customerName} onChange={(e) => setCustomerName(formatCustomerName(e.target.value))} placeholder="Full Name as on PAN" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Customer Type</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <select 
                                                            value={customerType} 
                                                            onChange={(e) => {
                                                                setCustomerType(e.target.value);
                                                                setProduct('');
                                                                setActiveSectionIndex(0);
                                                            }} 
                                                            required 
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer"
                                                        >
                                                            <option value="Loans">Loans</option>
                                                            <option value="Forex">Forex</option>
                                                            <option value="Insurance">Insurance</option>
                                                            <option value="Consulting">Consulting</option>
                                                            <option value="Investments">Investments</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Loan Product</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <select 
                                                            value={product} 
                                                            onChange={(e) => setProduct(e.target.value)} 
                                                            required 
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer"
                                                        >
                                                            <option value="">Select Loan Product...</option>
                                                            {availableProducts.map((p: any) => (
                                                                <option key={p.id} value={p.name}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Loan Amount (₹)</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <NumericFormat 
                                                            customInput={Input}
                                                            value={amount} 
                                                            onValueChange={(values) => setAmount(values.value || '')} 
                                                            thousandSeparator=","
                                                            thousandsGroupStyle="lakh"
                                                            placeholder="e.g. 5,00,000" 
                                                            required 
                                                            className="h-11 bg-white/70 dark:bg-slate-800/70 font-mono" 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                            <span>Tenure (Months / Years)</span>
                                                        </label>
                                                        <Input 
                                                            type="text" 
                                                            value={tenure} 
                                                            onChange={(e) => setTenure(e.target.value)} 
                                                            placeholder="e.g. 60 Months or 5 Years" 
                                                            className="h-11 bg-white/70 dark:bg-slate-800/70" 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Primary Phone Number</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 9876543210" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Personal Email ID</label>
                                                        <Input type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} placeholder="customer@email.com" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <DatePicker
                                                          label="Association Date"
                                                          value={associationDate}
                                                          onChange={(_, dateStr) => setAssociationDate(dateStr)}
                                                          captionLayout="dropdown"
                                                          buttonClassName="h-11 bg-white/70 dark:bg-slate-800/70"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Aadhar Number</span>
                                                            <span className="text-[10px] text-slate-400">Optional</span>
                                                        </label>
                                                        <Input type="text" value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} placeholder="1234 5678 9012" maxLength={14} className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* SECTION 2: Personal & Family Details */}
                                        {activeSectionIndex === 1 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Father's Name</label>
                                                        <Input type="text" value={fatherName} onChange={(e) => setFatherName(formatCustomerName(e.target.value))} placeholder="Father's Full Name" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Mother's Name</label>
                                                        <Input type="text" value={motherName} onChange={(e) => setMotherName(formatCustomerName(e.target.value))} placeholder="Mother's Full Name" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <DatePicker
                                                          label="Date of Birth (DOB)"
                                                          value={birthday}
                                                          onChange={(_, dateStr) => setBirthday(dateStr)}
                                                          captionLayout="dropdown"
                                                          buttonClassName="h-11 bg-white/70 dark:bg-slate-800/70"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Marital Status</label>
                                                        <select 
                                                            value={maritalStatus} 
                                                            onChange={(e) => setMaritalStatus(e.target.value)} 
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        >
                                                            <option value="">Select Status...</option>
                                                            <option value="Single">Single</option>
                                                            <option value="Married">Married</option>
                                                            <option value="Divorced">Divorced</option>
                                                            <option value="Widowed">Widowed</option>
                                                        </select>
                                                    </div>

                                                    {maritalStatus === 'Married' && (
                                                        <>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Spouse Name</label>
                                                                <Input type="text" value={spouseName} onChange={(e) => setSpouseName(formatCustomerName(e.target.value))} placeholder="Spouse's Full Name" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <DatePicker
                                                                  label="Anniversary Date"
                                                                  value={anniversary}
                                                                  onChange={(_, dateStr) => setAnniversary(dateStr)}
                                                                  captionLayout="dropdown"
                                                                  buttonClassName="h-11 bg-white/70 dark:bg-slate-800/70"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Education Qualification</label>
                                                        <select 
                                                            value={educationQualification} 
                                                            onChange={(e) => setEducationQualification(e.target.value)} 
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        >
                                                            <option value="">Select Qualification...</option>
                                                            <option value="Undergraduate">Undergraduate / 10+2</option>
                                                            <option value="Graduate">Graduate</option>
                                                            <option value="Post Graduate">Post Graduate</option>
                                                            <option value="Professional">Professional (CA, CS, MBBS, LLB, etc.)</option>
                                                            <option value="Doctorate">Doctorate / PhD</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* SECTION 3: Work & Office Details */}
                                        {activeSectionIndex === 2 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Income Type</label>
                                                        <select value={incomeType} onChange={(e) => setIncomeType(e.target.value)} className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                                            <option value="">Select Income Type...</option>
                                                            <option value="Salary - Government">Salary - Government</option>
                                                            <option value="Salary - Private">Salary - Private</option>
                                                            <option value="Business">Business</option>
                                                            <option value="SEP - Business">SEP - Business</option>
                                                            <option value="SEP - Government Salary">SEP - Government Salary</option>
                                                            <option value="SEP - Private Salary">SEP - Private Salary</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name of Company / Firm</label>
                                                        <Input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Employer or Business Name" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Designation / Role</label>
                                                        <Input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. SIG. MAINTAINER - 1" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Yearly Income Range (INR)</label>
                                                        <select value={yearlyIncomeRange} onChange={(e) => setYearlyIncomeRange(e.target.value)} className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                                            <option value="">Select Range...</option>
                                                            <option value="Below 2.5L">Below 2.5L</option>
                                                            <option value="2.5L - 5L">2.5L - 5L</option>
                                                            <option value="5L - 10L">5L - 10L</option>
                                                            <option value="10L - 20L">10L - 20L</option>
                                                            <option value="Above 20L">Above 20L</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Official / Work Email</label>
                                                        <Input type="email" value={officialEmail} onChange={(e) => setOfficialEmail(e.target.value)} placeholder="name@company.com" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Office Landline / Phone No.</label>
                                                        <Input type="tel" value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} placeholder="0361-XXXXXXX" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Office Address with Pincode</label>
                                                        <Input type="text" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="Full Office / Workplace Address with PIN" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Office Address Landmark</label>
                                                        <Input type="text" value={officeLandmark} onChange={(e) => setOfficeLandmark(e.target.value)} placeholder="e.g. Near Water Tank, Tech Park" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* SECTION 4: Addresses & Stay Stability */}
                                        {activeSectionIndex === 3 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                
                                                {/* Current Residence Box */}
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                        <Home className="w-3.5 h-3.5 text-indigo-500" /> Current Residential Address
                                                    </span>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Residence Ownership</label>
                                                            <select value={residenceType} onChange={(e) => setResidenceType(e.target.value)} className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                                                <option value="">Select Ownership...</option>
                                                                <option value="Owned">Owned</option>
                                                                <option value="Rented">Rented</option>
                                                                <option value="CO-PROVIDED">Company Provided</option>
                                                                <option value="Parental">Parental / Family</option>
                                                                <option value="Others">Others</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Current Address Landmark</label>
                                                            <Input type="text" value={currentAddressLandmark} onChange={(e) => setCurrentAddressLandmark(e.target.value)} placeholder="e.g. Near Water Tank" className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5 md:col-span-2">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Street Address / House No.</span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            <Input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House No, Road, Locality" required className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Pincode</span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            <Input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 781354" maxLength={6} required className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>City</span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / Town" required className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>District</span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            <Input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District / State" required className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Years in Current Residence</label>
                                                            <Input type="text" value={yearsInCurrentResidence} onChange={(e) => setYearsInCurrentResidence(e.target.value)} placeholder="e.g. 5 Years" className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5 md:col-span-2">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Years in Current City</label>
                                                            <Input type="text" value={yearsInCurrentCity} onChange={(e) => setYearsInCurrentCity(e.target.value)} placeholder="e.g. 10 Years" className="h-10" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Permanent Address Box */}
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                            Permanent Address
                                                        </span>
                                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSameAsCurrentAddress} 
                                                                onChange={(e) => handleSameAddressToggle(e.target.checked)}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                            />
                                                            <span>Same as Current Address</span>
                                                        </label>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5 md:col-span-2">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Permanent Address with Pincode</label>
                                                            <Input 
                                                                type="text" 
                                                                value={permanentAddress} 
                                                                disabled={isSameAsCurrentAddress}
                                                                onChange={(e) => setPermanentAddress(e.target.value)} 
                                                                placeholder="Permanent Address with PIN" 
                                                                className="h-10 disabled:opacity-60" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Permanent Address Landmark</label>
                                                            <Input 
                                                                type="text" 
                                                                value={permanentAddressLandmark} 
                                                                disabled={isSameAsCurrentAddress}
                                                                onChange={(e) => setPermanentAddressLandmark(e.target.value)} 
                                                                placeholder="Permanent Landmark" 
                                                                className="h-10 disabled:opacity-60" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Permanent / Alt Mobile No.</label>
                                                            <Input type="tel" value={permanentPhone} onChange={(e) => setPermanentPhone(e.target.value)} placeholder="Alternative Contact Number" className="h-10" />
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        )}

                                        {/* SECTION 5: Banking & References */}
                                        {activeSectionIndex === 4 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                
                                                {/* Salary Account Details */}
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                        <Landmark className="w-3.5 h-3.5 text-indigo-500" /> Salary Account Banking Details
                                                    </span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bank Name</label>
                                                            <Input type="text" value={salaryBankName} onChange={(e) => setSalaryBankName(e.target.value)} placeholder="e.g. SBI, HDFC Bank, ICICI" className="h-10" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bank Account Number</label>
                                                            <Input type="text" value={salaryAccountNumber} onChange={(e) => setSalaryAccountNumber(e.target.value)} placeholder="Account No." className="h-10 font-mono" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* References */}
                                                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                                                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-indigo-600" /> KYC Reference 1
                                                    </span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reference 1 Name</label>
                                                            <Input type="text" value={ref1Name} onChange={(e) => setRef1Name(formatCustomerName(e.target.value))} placeholder="Full Name" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contact Number</label>
                                                            <Input type="tel" value={ref1Phone} onChange={(e) => setRef1Phone(e.target.value)} placeholder="Mobile Number" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Relation</label>
                                                            <Input type="text" value={ref1Relation} onChange={(e) => setRef1Relation(e.target.value)} placeholder="e.g. Friend, Colleague, Relative" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Complete Address with PIN</label>
                                                            <Input type="text" value={ref1Address} onChange={(e) => setRef1Address(e.target.value)} placeholder="Address & Pincode" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                                                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-indigo-600" /> KYC Reference 2
                                                    </span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reference 2 Name</label>
                                                            <Input type="text" value={ref2Name} onChange={(e) => setRef2Name(formatCustomerName(e.target.value))} placeholder="Full Name" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contact Number</label>
                                                            <Input type="tel" value={ref2Phone} onChange={(e) => setRef2Phone(e.target.value)} placeholder="Mobile Number" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Relation</label>
                                                            <Input type="text" value={ref2Relation} onChange={(e) => setRef2Relation(e.target.value)} placeholder="e.g. Spouse, Brother, Friend" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Complete Address with PIN</label>
                                                            <Input type="text" value={ref2Address} onChange={(e) => setRef2Address(e.target.value)} placeholder="Address & Pincode" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Staff Signature */}
                                                <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span>Your Name (Data Enterer)</span>
                                                        <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                    </label>
                                                    <div className="relative" ref={employeeDropdownRef}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!isEmployeeDropdownOpen && employeeDropdownRef.current) {
                                                                    const rect = employeeDropdownRef.current.getBoundingClientRect();
                                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                                    setDropdownPosition(spaceBelow < 320 ? 'top' : 'bottom');
                                                                }
                                                                setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen);
                                                            }}
                                                            className="flex items-center justify-between h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                                                        >
                                                            <span className={entryPersonName ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
                                                                {entryPersonName || 'Select your name...'}
                                                            </span>
                                                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        
                                                        {isEmployeeDropdownOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setIsEmployeeDropdownOpen(false)}></div>
                                                                <div className={`absolute ${dropdownPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 max-h-[260px] overflow-y-auto`}>
                                                                    {employees.map(name => (
                                                                        <button
                                                                            key={name}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEntryPersonName(name);
                                                                                setIsEmployeeDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${entryPersonName === name ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                                        >
                                                                            {name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        )}

                                    </div>
                                )}

                                {/* === STANDARD TEMPLATE SECTIONS (Forex, Insurance, Investments, Consulting) === */}
                                {!isLoan && (
                                    <div className="space-y-5">
                                        
                                        {/* STANDARD SECTION 1: Profile & Requirements */}
                                        {activeSectionIndex === 0 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Customer Name</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={customerName} onChange={(e) => setCustomerName(formatCustomerName(e.target.value))} placeholder="Full Name" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Customer Type</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <select 
                                                            value={customerType} 
                                                            onChange={(e) => {
                                                                setCustomerType(e.target.value);
                                                                setProduct('');
                                                                setActiveSectionIndex(0);
                                                            }} 
                                                            required 
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer"
                                                        >
                                                            <option value="">Select Customer Type...</option>
                                                            <option value="Loans">Loans</option>
                                                            <option value="Forex">Forex</option>
                                                            <option value="Insurance">Insurance</option>
                                                            <option value="Consulting">Consulting</option>
                                                            <option value="Investments">Investments</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Product</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <select 
                                                            value={product} 
                                                            onChange={(e) => setProduct(e.target.value)} 
                                                            required 
                                                            disabled={!customerType}
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer disabled:opacity-50"
                                                        >
                                                            <option value="">{customerType ? 'Select Product...' : 'Select Customer Type first'}</option>
                                                            {availableProducts.map((p: any) => (
                                                                <option key={p.id} value={p.name}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Amount (₹)</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <NumericFormat 
                                                            customInput={Input}
                                                            value={amount} 
                                                            onValueChange={(values) => setAmount(values.value || '')} 
                                                            thousandSeparator=","
                                                            thousandsGroupStyle="lakh"
                                                            placeholder="e.g. 5,00,000" 
                                                            required 
                                                            className="h-11 bg-white/70 dark:bg-slate-800/70 font-mono" 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Phone Number</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 9876543210" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email ID</label>
                                                        <Input type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} placeholder="customer@email.com" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <DatePicker
                                                          label="Association Date"
                                                          value={associationDate}
                                                          onChange={(_, dateStr) => setAssociationDate(dateStr)}
                                                          captionLayout="dropdown"
                                                          buttonClassName="h-11 bg-white/70 dark:bg-slate-800/70"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Aadhar Number</span>
                                                            <span className="text-[10px] text-slate-400">Optional</span>
                                                        </label>
                                                        <Input type="text" value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} placeholder="1234 5678 9012" maxLength={14} className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STANDARD SECTION 2: Address */}
                                        {activeSectionIndex === 1 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span>Street Address / House No.</span>
                                                        <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                    </label>
                                                    <Input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House No, Road, Locality" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Pincode</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="795001" maxLength={6} required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>City</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Imphal" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>District</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Imphal West" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STANDARD SECTION 3: Income & Author */}
                                        {activeSectionIndex === 2 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Income Type</label>
                                                        <select value={incomeType} onChange={(e) => setIncomeType(e.target.value)} className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                                            <option value="">Select Type...</option>
                                                            <option value="Salary - Government">Salary - Government</option>
                                                            <option value="Salary - Private">Salary - Private</option>
                                                            <option value="Business">Business</option>
                                                            <option value="SEP - Business">SEP - Business</option>
                                                            <option value="SEP - Government Salary">SEP - Government Salary</option>
                                                            <option value="SEP - Private Salary">SEP - Private Salary</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Company Name</label>
                                                        <Input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company / Firm Name" className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Yearly Income Range (INR)</label>
                                                        <select value={yearlyIncomeRange} onChange={(e) => setYearlyIncomeRange(e.target.value)} className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                                            <option value="">Select Range...</option>
                                                            <option value="Below 2.5L">Below 2.5L</option>
                                                            <option value="2.5L - 5L">2.5L - 5L</option>
                                                            <option value="5L - 10L">5L - 10L</option>
                                                            <option value="10L - 20L">10L - 20L</option>
                                                            <option value="Above 20L">Above 20L</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <DatePicker
                                                          label="Birthday"
                                                          value={birthday}
                                                          onChange={(_, dateStr) => setBirthday(dateStr)}
                                                          captionLayout="dropdown"
                                                          buttonClassName="h-11 bg-white/70 dark:bg-slate-800/70"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <DatePicker
                                                          label="Anniversary"
                                                          value={anniversary}
                                                          onChange={(_, dateStr) => setAnniversary(dateStr)}
                                                          captionLayout="dropdown"
                                                          buttonClassName="h-11 bg-white/70 dark:bg-slate-800/70"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span>Your Name (Data Enterer)</span>
                                                        <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                    </label>
                                                    <div className="relative" ref={employeeDropdownRef}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!isEmployeeDropdownOpen && employeeDropdownRef.current) {
                                                                    const rect = employeeDropdownRef.current.getBoundingClientRect();
                                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                                    setDropdownPosition(spaceBelow < 320 ? 'top' : 'bottom');
                                                                }
                                                                setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen);
                                                            }}
                                                            className="flex items-center justify-between h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                                                        >
                                                            <span className={entryPersonName ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
                                                                {entryPersonName || 'Select your name...'}
                                                            </span>
                                                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        
                                                        {isEmployeeDropdownOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setIsEmployeeDropdownOpen(false)}></div>
                                                                <div className={`absolute ${dropdownPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 max-h-[260px] overflow-y-auto`}>
                                                                    {employees.map(name => (
                                                                        <button
                                                                            key={name}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEntryPersonName(name);
                                                                                setIsEmployeeDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${entryPersonName === name ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                                        >
                                                                            {name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}

                                {/* Bottom Stepper Navigation Controls */}
                                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800 mt-6">
                                    <Button 
                                        type="button" 
                                        variant="secondary"
                                        onClick={handlePrevSection}
                                        className="h-11 px-4 rounded-xl flex items-center gap-1.5 text-xs font-semibold"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>{activeSectionIndex === 0 ? 'Back to PAN' : 'Previous'}</span>
                                    </Button>

                                    {activeSectionIndex < sections.length - 1 ? (
                                        <Button 
                                            type="button" 
                                            onClick={handleNextSection}
                                            className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 text-xs font-semibold shadow-md shadow-indigo-500/20"
                                        >
                                            <span>Continue to {sections[activeSectionIndex + 1]?.shortTitle}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <><span>Submit Customer Profile</span><Check className="w-4 h-4" /></>
                                            )}
                                        </Button>
                                    )}
                                </div>

                            </div>
                        )}
                        
                    </form>
                )}
            </LiquidGlassCard>
        </div>
    );
}
