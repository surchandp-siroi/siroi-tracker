import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useDataStore } from '@/store/useDataStore';
import { useAuthStore, BRANCH_ACCOUNTS } from '@/store/useAuthStore';
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
    ShieldCheck, 
    MapPin, 
    CreditCard, 
    ArrowRight,
    Calculator,
    Plus,
    Trash2,
    TrendingUp,
    Percent,
    Wallet,
    Info,
    RefreshCw,
    ArrowUpRight,
    Upload,
    Eye,
    FileCheck,
    AlertCircle,
    Sparkles,
    UploadCloud,
    FileSpreadsheet,
    Paperclip,
    Save,
    Fingerprint,
    Building2,
    FileUp,
    UserCheck
} from 'lucide-react';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';
import { NumericFormat } from 'react-number-format';
import { formatCustomerName, mapCustomerTypeToCategory } from '@/utils/formatCustomerName';
import { 
    scanIdentityDocument, 
    ScannedIdData, 
    DeviationItem, 
    compareNames, 
    compareDates, 
    formatDisplayDate,
    scanSalarySlip,
    ScannedSalaryData
} from '@/utils/ocrScanner';
import { lookupPincode } from '@/utils/pincodeLookup';
import { KycDeviationDialog } from '@/components/KycDeviationDialog';

export const BANK_OPTIONS = [
    'State Bank of India (SBI)',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Bank',
    'Godrej Capital',
    'Punjab National Bank (PNB)',
    'Bank of Baroda (BOB)',
    'IndusInd Bank',
    'Canara Bank',
    'Union Bank of India',
    'IDFC First Bank',
    'Federal Bank',
    'Bandhan Bank',
    'Yes Bank',
    'Central Bank of India',
    'Indian Bank',
    'Bank of India',
    'RBL Bank',
    'South Indian Bank',
    'Manipur Rural Bank',
    'Other Bank / NBFC'
];

export const CHANNEL_PARTNER_OPTIONS = [
    'State Bank of India (SBI)',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Bank',
    'IndusInd Bank',
    'Punjab National Bank (PNB)',
    'Bank of Baroda (BOB)',
    'IDFC First Bank',
    'Godrej Capital',
    'Bandhan Bank',
    'Federal Bank',
    'Yes Bank',
    'Canara Bank',
    'Union Bank of India',
    'Central Bank of India',
    'Indian Bank',
    'Bank of India',
    'Punjab & Sind Bank',
    'RBL Bank',
    'South Indian Bank',
    'Manipur Rural Bank',
    'Axis Finance',
    'SMFG India',
    'Cholamandalam',
    'Finnable',
    'L&T Finance',
    'Piramal Capital',
    'Poonawalla Fincorp',
    'Tata Capital',
    'Bajaj Finserv',
    'Bajaj Market',
    'Aditya Birla Finance',
    'Credit Saison',
    'InCred',
    'Indifi',
    'Slice',
    'SIROI',
    'Other Bank / NBFC'
];

export const OBLIGATION_TYPES = [
    'Personal Loan (BT Possible)',
    'Home Loan',
    'Credit Card',
    '2 Wheeler Loan',
    '4 Wheeler Loan',
    'Gold Loan',
    'Other Obligation'
];

// IndusInd Bank / Retail FOIR Matrix (DBR Ratio based on Employer Cat, Owned House, Mortgage TradeLine, Income Band)
const FOIR_MATRIX: Record<string, number> = {
    // Co Cat: A/B/G, Owned Resi: Y, LAP/HL TradeLine: Y
    'A/B/GYY0': 0.00,
    'A/B/GYY1': 0.55,
    'A/B/GYY2': 0.60,
    'A/B/GYY3': 0.70,
    'A/B/GYY4': 0.75,
    // Co Cat: C1000/C, Owned Resi: Y, LAP/HL TradeLine: Y
    'C1000/CYY0': 0.00,
    'C1000/CYY1': 0.50,
    'C1000/CYY2': 0.50,
    'C1000/CYY3': 0.70,
    'C1000/CYY4': 0.70,

    // Co Cat: A/B/G, Owned Resi: N, LAP/HL TradeLine: Y
    'A/B/GNY0': 0.00,
    'A/B/GNY1': 0.50,
    'A/B/GNY2': 0.60,
    'A/B/GNY3': 0.65,
    'A/B/GNY4': 0.65,
    // Co Cat: C1000/C, Owned Resi: N, LAP/HL TradeLine: Y
    'C1000/CNY0': 0.00,
    'C1000/CNY1': 0.50,
    'C1000/CNY2': 0.50,
    'C1000/CNY3': 0.60,
    'C1000/CNY4': 0.60,

    // Co Cat: A/B/G, Owned Resi: Y, LAP/HL TradeLine: N
    'A/B/GYN0': 0.00,
    'A/B/GYN1': 0.50,
    'A/B/GYN2': 0.60,
    'A/B/GYN3': 0.70,
    'A/B/GYN4': 0.70,
    // Co Cat: C1000/C, Owned Resi: Y, LAP/HL TradeLine: N
    'C1000/CYN0': 0.00,
    'C1000/CYN1': 0.50,
    'C1000/CYN2': 0.50,
    'C1000/CYN3': 0.65,
    'C1000/CYN4': 0.65,

    // Co Cat: A/B/G, Owned Resi: N, LAP/HL TradeLine: N
    'A/B/GNN0': 0.00,
    'A/B/GNN1': 0.50,
    'A/B/GNN2': 0.60,
    'A/B/GNN3': 0.60,
    'A/B/GNN4': 0.65,
    // Co Cat: C1000/C, Owned Resi: N, LAP/HL TradeLine: N
    'C1000/CNN0': 0.00,
    'C1000/CNN1': 0.50,
    'C1000/CNN2': 0.50,
    'C1000/CNN3': 0.60,
    'C1000/CNN4': 0.60,
};

export default function CustomerDataEntryPage() {
    const navigate = useNavigate();
    const branches = useDataStore(state => state.branches);
    const products = useDataStore(state => state.products);
    const channels = useDataStore(state => state.channels);
    const consultants = useDataStore(state => state.consultants);
    const currentUser = useAuthStore(state => state.user);
    const isAdmin = currentUser?.role === 'admin';

    // Resolve user's designated branch based on login profile / accounts
    const userBranchAccount = currentUser?.email ? BRANCH_ACCOUNTS[currentUser.email.toLowerCase().trim()] : null;
    const userBranchId = currentUser?.branchId || userBranchAccount?.branchId;
    const userBranchName = userBranchAccount?.branchName || 
                           (userBranchId ? (branches.find(b => b.id === userBranchId)?.name) : null) || 
                           currentUser?.latestLocation;

    const initialLocationSetRef = useRef(false);
    
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
    const [channelPartner, setChannelPartner] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
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
    const [consultantName, setConsultantName] = useState<string>('');
    const [managerName, setManagerName] = useState<string>('');
    const [consultantOptions, setConsultantOptions] = useState<Array<{ name: string; branch?: string }>>([]);
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
    const [entryLocation, setEntryLocation] = useState(userBranchName || branches[0]?.name || 'HO');
    const [employees, setEmployees] = useState<string[]>(['Surchand Singh', 'Sharju Thoudam', 'Tomas', 'Branch Manager', 'Branch Executive']);
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
    const employeeDropdownRef = useRef<HTMLDivElement>(null);

    // Consolidated Channel Partner banks & lenders
    const availableChannelPartners = useMemo(() => {
        const set = new Set<string>();
        CHANNEL_PARTNER_OPTIONS.forEach(c => set.add(c));
        channels.forEach(c => {
            if (c.name) set.add(c.name.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [channels]);

    // Normalizes branch name strings for strict branch-specific filtering
    const normalizeBranchName = (name?: string): string => {
        if (!name) return '';
        const clean = name.toLowerCase().replace(/\s+/g, ' ').trim();
        if (clean.includes('guwahati') || clean === 'ho' || clean.includes('ghy')) {
            return 'guwahati';
        }
        if (clean.includes('manipur') || clean.includes('imphal')) {
            return 'manipur';
        }
        if (clean.includes('itanagar') || clean.includes('arunachal')) {
            return 'itanagar';
        }
        if (clean.includes('nagaland') || clean.includes('mizoram') || clean.includes('dimapur') || clean.includes('aizawl') || clean.includes('mizo')) {
            return 'nagaland & mizoram';
        }
        return clean;
    };

    // Initialize or lock branch location
    useEffect(() => {
        if (!initialLocationSetRef.current) {
            if (userBranchName) {
                setEntryLocation(userBranchName);
                initialLocationSetRef.current = true;
            } else if (branches.length > 0 && (!entryLocation || entryLocation === 'HO')) {
                setEntryLocation(branches[0].name);
                initialLocationSetRef.current = true;
            }
        }
    }, [userBranchName, branches]);

    // For non-admin users with an assigned branch, enforce their branch
    useEffect(() => {
        if (userBranchName && !isAdmin && entryLocation !== userBranchName) {
            setEntryLocation(userBranchName);
        }
    }, [userBranchName, isAdmin, entryLocation]);

    // Fetch approved consultants directly from Supabase for guaranteed real-time availability
    useEffect(() => {
        const fetchApprovedConsultants = async () => {
            try {
                const { data, error } = await supabase
                    .from('consultants')
                    .select('name, associated_branch')
                    .eq('status', 'approved')
                    .order('name');
                if (data && data.length > 0) {
                    const list = data.map((c: any) => ({
                        name: c.name?.replace(/\s+/g, ' ').trim() || '',
                        branch: c.associated_branch?.trim() || ''
                    })).filter(c => Boolean(c.name));
                    setConsultantOptions(list);
                }
            } catch (err) {
                console.warn('Could not fetch consultants directly:', err);
            }
        };
        fetchApprovedConsultants();
    }, []);

    // Consolidated consultant options (merging Supabase query + dataStore)
    const allConsultants = useMemo(() => {
        const map = new Map<string, { name: string; branch?: string }>();
        consultantOptions.forEach(c => {
            if (c.name) map.set(c.name, c);
        });
        consultants.forEach(c => {
            if (c.name) {
                const clean = c.name.replace(/\s+/g, ' ').trim();
                if (!map.has(clean)) {
                    map.set(clean, { name: clean, branch: c.associated_branch?.trim() });
                }
            }
        });
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [consultantOptions, consultants]);

    // Filter consultants strictly by the active branch (entryLocation or user's branch)
    const branchConsultants = useMemo(() => {
        const activeNorm = normalizeBranchName(entryLocation || userBranchName || '');
        if (!activeNorm) return allConsultants;

        const filtered = allConsultants.filter(c => {
            const cNorm = normalizeBranchName(c.branch);
            return cNorm === activeNorm;
        });

        // Ensure previously assigned consultant is retained on edit / viewing
        if (consultantName && !filtered.some(c => c.name.toLowerCase() === consultantName.toLowerCase())) {
            const existing = allConsultants.find(c => c.name.toLowerCase() === consultantName.toLowerCase());
            if (existing) {
                return [existing, ...filtered];
            }
        }

        return filtered;
    }, [allConsultants, entryLocation, userBranchName, consultantName]);

    // Consolidated branch managers list
    const managerOptions = useMemo(() => {
        const set = new Set<string>();
        ['Aroop Sharma', 'Ajay Waikhom', 'Nobin Nani', 'Ramesh Singh'].forEach(m => set.add(m));
        branches.forEach(b => {
            if (b.managerName) set.add(b.managerName.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [branches]);

    // Auto-update branch manager when entryLocation changes
    const defaultManagers = ['Aroop Sharma', 'Ajay Waikhom', 'Nobin Nani', 'Ramesh Singh'];
    useEffect(() => {
        const loc = normalizeBranchName(entryLocation || userBranchName || '');
        let defaultManager = '';
        if (loc === 'guwahati') defaultManager = 'Aroop Sharma';
        else if (loc === 'manipur') defaultManager = 'Ajay Waikhom';
        else if (loc === 'itanagar') defaultManager = 'Nobin Nani';
        else if (loc === 'nagaland & mizoram') defaultManager = 'Ramesh Singh';

        if (defaultManager && (!managerName || defaultManagers.includes(managerName))) {
            setManagerName(defaultManager);
        }
    }, [entryLocation, userBranchName]);

    // Reset selected consultant if active branch changes and current consultant is not in new branch
    useEffect(() => {
        if (consultantName) {
            const activeNorm = normalizeBranchName(entryLocation || userBranchName || '');
            const currentCons = allConsultants.find(c => c.name.toLowerCase() === consultantName.toLowerCase());
            if (currentCons && normalizeBranchName(currentCons.branch) !== activeNorm) {
                setConsultantName('');
            }
        }
    }, [entryLocation]);

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
    const [state, setState] = useState('');
    const [hasCurrentAddressProof, setHasCurrentAddressProof] = useState<boolean>(false);
    const [currentAddressProofFile, setCurrentAddressProofFile] = useState<File | null>(null);
    const [currentAddressProofUrl, setCurrentAddressProofUrl] = useState<string>('');
    const [isUploadingAddressProof, setIsUploadingAddressProof] = useState<boolean>(false);

    // Permanent Address Structured Fields
    const [isSameAsCurrentAddress, setIsSameAsCurrentAddress] = useState(false);
    const [permanentStreet, setPermanentStreet] = useState('');
    const [permanentPincode, setPermanentPincode] = useState('');
    const [permanentCity, setPermanentCity] = useState('');
    const [permanentDistrict, setPermanentDistrict] = useState('');
    const [permanentState, setPermanentState] = useState('');
    const [permanentAddress, setPermanentAddress] = useState('');
    const [permanentAddressLandmark, setPermanentAddressLandmark] = useState('');
    const [permanentPhone, setPermanentPhone] = useState('');

    const [salaryBankName, setSalaryBankName] = useState('');
    const [customBankName, setCustomBankName] = useState('');
    const [salaryAccountNumber, setSalaryAccountNumber] = useState('');
    const [salarySlipMode, setSalarySlipMode] = useState<'individual' | 'combined'>('individual');
    const [salarySlips, setSalarySlips] = useState<Array<{
        id: string;
        monthYear: string;
        file: File | null;
        fileUrl: string;
        isScanning?: boolean;
        detectedSalary?: number | null;
    }>>([
        { id: '1', monthYear: 'Last Month', file: null, fileUrl: '' },
        { id: '2', monthYear: '2 Months Ago', file: null, fileUrl: '' },
        { id: '3', monthYear: '3 Months Ago', file: null, fileUrl: '' },
    ]);
    const [combinedSlip, setCombinedSlip] = useState<{
        monthYear: string;
        file: File | null;
        fileUrl: string;
        isScanning?: boolean;
        detectedSalary?: number | null;
    }>({
        monthYear: 'Last 3 Months Combined',
        file: null,
        fileUrl: ''
    });

    const [tenure, setTenure] = useState('');
    const [ref1Name, setRef1Name] = useState('');
    const [ref1Phone, setRef1Phone] = useState('');
    const [ref1Address, setRef1Address] = useState('');
    const [ref1Relation, setRef1Relation] = useState('');
    const [ref2Name, setRef2Name] = useState('');
    const [ref2Phone, setRef2Phone] = useState('');
    const [ref2Address, setRef2Address] = useState('');
    const [ref2Relation, setRef2Relation] = useState('');

    const isLoan = customerType === 'Loans' || customerType === 'Loan';
    const isForex = customerType === 'Forex';

    // Loan-Specific KYC Document Upload & Scanning State
    const [aadharFile, setAadharFile] = useState<File | null>(null);
    const [aadharFileUrl, setAadharFileUrl] = useState<string>('');
    const [aadharBackFile, setAadharBackFile] = useState<File | null>(null);
    const [aadharBackFileUrl, setAadharBackFileUrl] = useState<string>('');
    const [panFile, setPanFile] = useState<File | null>(null);
    const [panFileUrl, setPanFileUrl] = useState<string>('');

    const [isScanningAadhaar, setIsScanningAadhaar] = useState<boolean>(false);
    const [isScanningAadhaarBack, setIsScanningAadhaarBack] = useState<boolean>(false);
    const [isScanningPan, setIsScanningPan] = useState<boolean>(false);
    const [scanProgressAadhaar, setScanProgressAadhaar] = useState<{ progress: number; status: string }>({ progress: 0, status: '' });
    const [scanProgressAadhaarBack, setScanProgressAadhaarBack] = useState<{ progress: number; status: string }>({ progress: 0, status: '' });
    const [scanProgressPan, setScanProgressPan] = useState<{ progress: number; status: string }>({ progress: 0, status: '' });

    const [scannedAadhaar, setScannedAadhaar] = useState<ScannedIdData | null>(null);
    const [scannedPan, setScannedPan] = useState<ScannedIdData | null>(null);

    const [deviations, setDeviations] = useState<DeviationItem[]>([]);
    const [isDeviationDialogOpen, setIsDeviationDialogOpen] = useState<boolean>(false);
    const [isEarlySaveModalOpen, setIsEarlySaveModalOpen] = useState<boolean>(false);
    const [eligibilitySkipReason, setEligibilitySkipReason] = useState<string>('');
    const [incomeCategory, setIncomeCategory] = useState<'salaried' | 'business'>('salaried');

    const handleIncomeCategoryChange = (category: 'salaried' | 'business') => {
        setIncomeCategory(category);
        if (category === 'business') {
            if (!incomeType || incomeType.toLowerCase().startsWith('salary')) {
                setIncomeType('Business');
            }
            if (!eligibilitySkipReason.trim()) {
                setEligibilitySkipReason('Business Income profile - Eligibility calculation logic yet to be received from team.');
            }
        } else {
            if (incomeType === 'Business' || incomeType === 'SEP - Business') {
                setIncomeType('Salary - Private');
            }
            if (eligibilitySkipReason.includes('Business Income')) {
                setEligibilitySkipReason('');
            }
        }
    };
    const aadhaarInputRef = useRef<HTMLInputElement>(null);
    const aadhaarBackInputRef = useRef<HTMLInputElement>(null);
    const panInputRef = useRef<HTMLInputElement>(null);

    // Loan-Specific Eligibility Calculator State (Step 6)
    const [monthlySalary, setMonthlySalary] = useState('');
    const [employerCategory, setEmployerCategory] = useState<'A/B/G' | 'C1000/C'>('A/B/G');
    const [customOwnsHome, setCustomOwnsHome] = useState<boolean | null>(null);
    const [hasBureauHlLap, setHasBureauHlLap] = useState<boolean>(false);
    const [interestRateAnnual, setInterestRateAnnual] = useState<number>(11.0);
    const [calcTenureMonths, setCalcTenureMonths] = useState<number>(36);
    const [bankMultiplier, setBankMultiplier] = useState<number>(24);
    const [manualFoirPercent, setManualFoirPercent] = useState<string>('');
    const [absoluteMaxCap, setAbsoluteMaxCap] = useState<number>(2500000);
    const [existingLoans, setExistingLoans] = useState<Array<{
        id: string;
        loan_type: string;
        name: string;
        emi_amount: string;
        outstanding_principal: string;
        is_balance_transfer: boolean;
    }>>([]);

    // Auto-sync calculator tenure from Step 1 tenure input
    useEffect(() => {
        if (tenure) {
            const num = parseInt(tenure.replace(/\D/g, ''), 10);
            if (!isNaN(num) && num > 0) {
                if (num <= 10 && tenure.toLowerCase().includes('year')) {
                    setCalcTenureMonths(num * 12);
                } else if (num >= 6 && num <= 120) {
                    setCalcTenureMonths(num);
                }
            }
        }
    }, [tenure]);

    // Auto-suggest monthly salary based on yearly income bracket if blank
    useEffect(() => {
        if (!monthlySalary && yearlyIncomeRange) {
            if (yearlyIncomeRange === 'Above 20L') setMonthlySalary('150000');
            else if (yearlyIncomeRange === '10L - 20L') setMonthlySalary('100000');
            else if (yearlyIncomeRange === '5L - 10L') setMonthlySalary('60000');
            else if (yearlyIncomeRange === '2.5L - 5L') setMonthlySalary('35000');
            else if (yearlyIncomeRange === 'Below 2.5L') setMonthlySalary('18000');
        }
    }, [yearlyIncomeRange, monthlySalary]);

    // Comprehensive Retail Loan Eligibility Calculation Engine
    const eligibilityResults = useMemo(() => {
        const salary = Number(monthlySalary) || 0;
        
        let incomeBand = 0;
        if (salary >= 80000) incomeBand = 4;
        else if (salary >= 50000) incomeBand = 3;
        else if (salary >= 35000) incomeBand = 2;
        else if (salary >= 20000) incomeBand = 1;
        else incomeBand = 0;

        const effectiveOwnsHome = customOwnsHome !== null 
            ? customOwnsHome 
            : (residenceType === 'Owned' || residenceType === 'Parental');

        const ownsChar = effectiveOwnsHome ? 'Y' : 'N';
        const mortChar = hasBureauHlLap ? 'Y' : 'N';
        const profileKey = `${employerCategory}${ownsChar}${mortChar}${incomeBand}`;
        const matrixFoir = FOIR_MATRIX[profileKey] ?? 0.60;
        const foirPercent = manualFoirPercent !== '' 
            ? Math.max(0.01, Math.min(1.0, (parseFloat(manualFoirPercent) || 0) / 100))
            : matrixFoir;

        // Obligations breakdown (The BT Rule)
        const continuingEmis = existingLoans
            .filter(l => !l.is_balance_transfer)
            .reduce((sum, l) => sum + (Number(l.emi_amount) || 0), 0);

        const totalBtPayoff = existingLoans
            .filter(l => l.is_balance_transfer)
            .reduce((sum, l) => sum + (Number(l.outstanding_principal) || 0), 0);

        // FOIR Capacity (Gross Monthly Capacity minus continuing obligations)
        const totalGrossFoirEmi = Math.round(salary * foirPercent);
        const maxAllowedEmi = Math.max(0, totalGrossFoirEmi - continuingEmis);

        // Present Value (PV) Loan Formula based on interest rate and tenure
        const annualRate = (interestRateAnnual || 11.0) / 100;
        const monthlyRate = annualRate / 12;
        const nMonths = calcTenureMonths > 0 ? calcTenureMonths : 36;

        let maxLoanFoir = 0;
        if (monthlyRate > 0 && maxAllowedEmi > 0 && nMonths > 0) {
            maxLoanFoir = Math.round(maxAllowedEmi * (1 - Math.pow(1 + monthlyRate, -nMonths)) / monthlyRate);
        }

        // Multiplier Eligibility
        const multiplierLoan = salary * (bankMultiplier || 24);
        const maxLoanMultiplier = Math.min(multiplierLoan, absoluteMaxCap || 2500000);

        // Final Approvals
        const grossEligibleLoan = Math.min(maxLoanMultiplier, maxLoanFoir);
        const netCashTopUp = grossEligibleLoan - totalBtPayoff;

        // Estimated Monthly EMI on gross eligible loan
        let estimatedEmi = 0;
        if (grossEligibleLoan > 0 && monthlyRate > 0 && nMonths > 0) {
            const factor = Math.pow(1 + monthlyRate, nMonths);
            estimatedEmi = Math.round((grossEligibleLoan * monthlyRate * factor) / (factor - 1));
        }

        return {
            salary,
            incomeBand,
            profileKey,
            matrixFoir,
            foirPercent,
            effectiveOwnsHome,
            continuingEmis,
            totalBtPayoff,
            totalGrossFoirEmi,
            maxAllowedEmi,
            maxLoanFoir,
            maxLoanMultiplier,
            grossEligibleLoan,
            netCashTopUp,
            estimatedEmi,
            isBtDeficit: netCashTopUp < 0 && totalBtPayoff > 0
        };
    }, [
        monthlySalary,
        employerCategory,
        customOwnsHome,
        residenceType,
        hasBureauHlLap,
        interestRateAnnual,
        calcTenureMonths,
        bankMultiplier,
        manualFoirPercent,
        absoluteMaxCap,
        existingLoans
    ]);

    // Dynamic Sections based on whether Customer Type is Loan vs Forex vs Standard
    const sections = useMemo(() => {
        if (isLoan) {
            return [
                { id: 'loan_req', title: 'Loan & Requirements', shortTitle: 'Loan Req', icon: Landmark },
                { id: 'family', title: 'Personal & Family', shortTitle: 'Family', icon: Users },
                { id: 'employment', title: 'Work & Office', shortTitle: 'Employment', icon: Briefcase },
                { id: 'residential', title: 'Addresses & Stay', shortTitle: 'Addresses', icon: Home },
                { id: 'banking_refs', title: 'Banking Details', shortTitle: 'Banking', icon: ShieldCheck },
                { id: 'eligibility', title: 'Eligibility', shortTitle: 'Eligibility', icon: Calculator },
            ];
        }
        if (isForex) {
            return [
                { id: 'forex_primary', title: 'Profile & Requirements', shortTitle: 'Profile', icon: User },
                { id: 'forex_address_staff', title: 'Address & Staff Entry', shortTitle: 'Address & Staff', icon: Home },
            ];
        }
        return [
            { id: 'std_primary', title: 'Profile & Requirements', shortTitle: 'Profile', icon: User },
            { id: 'std_address', title: 'Residential Address', shortTitle: 'Address', icon: Home },
            { id: 'std_income', title: 'Income & Author', shortTitle: 'Income', icon: Briefcase },
        ];
    }, [isLoan, isForex]);

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

    // Auto-fill District, City & State based on Pincode
    const handlePincodeChange = async (val: string) => {
        setPincode(val);
        const clean = val.replace(/\D/g, '');
        if (clean.length === 6) {
            const details = await lookupPincode(clean);
            if (details) {
                setDistrict(details.district || '');
                setState(details.state || '');
                setCity(details.city || details.district || '');
                if (isSameAsCurrentAddress) {
                    setPermanentDistrict(details.district || '');
                    setPermanentState(details.state || '');
                    setPermanentCity(details.city || details.district || '');
                }
            }
        } else {
            // If 1 digit of pincode is removed (< 6 digits), clear dynamically populated fields immediately
            setDistrict('');
            setCity('');
            setState('');
            if (isSameAsCurrentAddress) {
                setPermanentDistrict('');
                setPermanentCity('');
                setPermanentState('');
            }
        }
    };

    // Auto-fill Permanent District, City & State based on Pincode
    const handlePermanentPincodeChange = async (val: string) => {
        setPermanentPincode(val);
        const clean = val.replace(/\D/g, '');
        if (clean.length === 6) {
            const details = await lookupPincode(clean);
            if (details) {
                setPermanentDistrict(details.district || '');
                setPermanentState(details.state || '');
                setPermanentCity(details.city || details.district || '');
            }
        } else {
            // If 1 digit of pincode is removed (< 6 digits), clear dynamically populated fields immediately
            setPermanentDistrict('');
            setPermanentCity('');
            setPermanentState('');
        }
    };

    // Pull Current Address from Scanned Aadhaar Card
    const handlePullCurrentAddressFromAadhaar = async () => {
        if (!scannedAadhaar?.address && !scannedAadhaar?.pincode) {
            setError('Please upload and scan the Aadhaar Card document in Step 1 first.');
            return;
        }
        if (scannedAadhaar.address) {
            setAddress(scannedAadhaar.address);
        }
        if (scannedAadhaar.pincode) {
            setPincode(scannedAadhaar.pincode);
            const details = await lookupPincode(scannedAadhaar.pincode);
            if (details) {
                if (details.district) setDistrict(details.district);
                if (details.state) setState(details.state);
                if (details.city) setCity(details.city);
            } else {
                if (scannedAadhaar.district) setDistrict(scannedAadhaar.district);
                if (scannedAadhaar.state) setState(scannedAadhaar.state);
            }
        } else {
            if (scannedAadhaar.district) setDistrict(scannedAadhaar.district);
            if (scannedAadhaar.state) setState(scannedAadhaar.state);
        }
    };

    // Pull Permanent Address from Scanned Aadhaar Card
    const handlePullPermanentAddressFromAadhaar = async () => {
        if (!scannedAadhaar?.address && !scannedAadhaar?.pincode) {
            setError('Please upload and scan the Aadhaar Card document in Step 1 first.');
            return;
        }
        if (scannedAadhaar.address) {
            setPermanentStreet(scannedAadhaar.address);
            setPermanentAddress(scannedAadhaar.address);
        }
        if (scannedAadhaar.pincode) {
            setPermanentPincode(scannedAadhaar.pincode);
            const details = await lookupPincode(scannedAadhaar.pincode);
            if (details) {
                if (details.district) setPermanentDistrict(details.district);
                if (details.state) setPermanentState(details.state);
                if (details.city) setPermanentCity(details.city);
            } else {
                if (scannedAadhaar.district) setPermanentDistrict(scannedAadhaar.district);
                if (scannedAadhaar.state) setPermanentState(scannedAadhaar.state);
            }
        } else {
            if (scannedAadhaar.district) setPermanentDistrict(scannedAadhaar.district);
            if (scannedAadhaar.state) setPermanentState(scannedAadhaar.state);
        }
    };

    // Handle "Same as Current Address" toggle for Loans
    const handleSameAddressToggle = (checked: boolean) => {
        setIsSameAsCurrentAddress(checked);
        if (checked) {
            setPermanentStreet(address);
            setPermanentPincode(pincode);
            setPermanentCity(city);
            setPermanentDistrict(district);
            setPermanentState(state);
            setPermanentAddressLandmark(currentAddressLandmark);
            const combined = [address, city, district, state, pincode ? `PIN: ${pincode}` : ''].filter(Boolean).join(', ');
            setPermanentAddress(combined || address);
        } else {
            setPermanentStreet('');
            setPermanentPincode('');
            setPermanentCity('');
            setPermanentDistrict('');
            setPermanentState('');
            setPermanentAddressLandmark('');
            setPermanentAddress('');
        }
    };

    // Handle Current Address Proof Upload
    const handleAddressProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCurrentAddressProofFile(file);
        setIsUploadingAddressProof(true);
        setError('');
        try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const cleanPan = panNumber || 'UNKNOWN_PAN';
            const fileName = `${cleanPan}_address_proof_${Date.now()}.${fileExt}`;
            const filePath = `address_proofs/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('customer_kyc')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('customer_kyc')
                .getPublicUrl(data.path);

            setCurrentAddressProofUrl(urlData.publicUrl);
            setHasCurrentAddressProof(true);
        } catch (err: any) {
            setError(`Address Proof upload error: ${err.message || 'Failed to upload'}`);
        } finally {
            setIsUploadingAddressProof(false);
        }
    };

    // Handle Individual Salary Slip Upload
    const handleSalarySlipUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop() || 'pdf';
            const cleanPan = panNumber || 'UNKNOWN_PAN';
            const fileName = `${cleanPan}_slip_${index + 1}_${Date.now()}.${fileExt}`;
            const filePath = `salary_slips/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('customer_kyc')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('customer_kyc')
                .getPublicUrl(data.path);

            setSalarySlips(prev => prev.map((s, idx) => idx === index ? { ...s, file, fileUrl: urlData.publicUrl } : s));
        } catch (err: any) {
            setError(`Salary slip upload failed: ${err.message}`);
        }
    };

    // Handle OCR Scan of an Individual Salary Slip
    const handleScanSalarySlip = async (index: number) => {
        const slip = salarySlips[index];
        if (!slip?.file) return;

        setSalarySlips(prev => prev.map((s, idx) => idx === index ? { ...s, isScanning: true } : s));
        try {
            const scanned = await scanSalarySlip(slip.file);
            setSalarySlips(prev => prev.map((s, idx) => idx === index ? {
                ...s,
                isScanning: false,
                detectedSalary: scanned.detectedSalary,
                monthYear: scanned.monthYear || s.monthYear
            } : s));

            if (scanned.detectedSalary) {
                setMonthlySalary(String(scanned.detectedSalary));
            }
        } catch (err: any) {
            setError(`Salary slip scan failed: ${err.message}`);
            setSalarySlips(prev => prev.map((s, idx) => idx === index ? { ...s, isScanning: false } : s));
        }
    };

    // Handle Combined 3-Month Salary Statement Upload
    const handleCombinedSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop() || 'pdf';
            const cleanPan = panNumber || 'UNKNOWN_PAN';
            const fileName = `${cleanPan}_combined_slip_${Date.now()}.${fileExt}`;
            const filePath = `salary_slips/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('customer_kyc')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('customer_kyc')
                .getPublicUrl(data.path);

            setCombinedSlip(prev => ({ ...prev, file, fileUrl: urlData.publicUrl }));
        } catch (err: any) {
            setError(`Combined slip upload failed: ${err.message}`);
        }
    };

    // Handle OCR Scan on Combined Statement
    const handleScanCombinedSlip = async () => {
        if (!combinedSlip.file) return;
        setCombinedSlip(prev => ({ ...prev, isScanning: true }));
        try {
            const scanned = await scanSalarySlip(combinedSlip.file);
            setCombinedSlip(prev => ({
                ...prev,
                isScanning: false,
                detectedSalary: scanned.detectedSalary,
                monthYear: scanned.monthYear || prev.monthYear
            }));
            if (scanned.detectedSalary) {
                setMonthlySalary(String(scanned.detectedSalary));
            }
        } catch (err: any) {
            setError(`Combined statement scan failed: ${err.message}`);
            setCombinedSlip(prev => ({ ...prev, isScanning: false }));
        }
    };

    // Step 6: Loan Eligibility Obligations Handlers
    const handleAddLoan = () => {
        setExistingLoans(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                loan_type: 'Personal Loan (BT Possible)',
                name: '',
                emi_amount: '',
                outstanding_principal: '',
                is_balance_transfer: false,
            }
        ]);
    };

    const handleUpdateLoan = (id: string, field: string, value: any) => {
        setExistingLoans(prev => prev.map(loan => {
            if (loan.id === id) {
                return { ...loan, [field]: value };
            }
            return loan;
        }));
    };

    const handleRemoveLoan = (id: string) => {
        setExistingLoans(prev => prev.filter(loan => loan.id !== id));
    };

    const formatInr = (val: number) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

    // Format Aadhaar Input with ergonomic spaces (1234 5678 9012)
    const formatAadhaarInput = (val: string) => {
        const raw = val.replace(/\D/g, '').slice(0, 12);
        const parts = [];
        for (let i = 0; i < raw.length; i += 4) {
            parts.push(raw.slice(i, i + 4));
        }
        return parts.join(' ');
    };

    // KYC Document Storage Helper
    const uploadDocToSupabase = async (file: File, type: 'aadhar' | 'aadhar_back' | 'pan'): Promise<string> => {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const cleanPan = panNumber || 'UNKNOWN_PAN';
        const fileName = `${cleanPan}_${type}_${Date.now()}.${fileExt}`;
        const filePath = `loans/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
            .from('customer_kyc')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            const docLabel = type === 'aadhar' ? 'Aadhaar Front' : type === 'aadhar_back' ? 'Aadhaar Back' : 'PAN';
            throw new Error(`Failed to upload ${docLabel} card: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from('customer_kyc')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    };

    // 3-Way Reconciliation Engine between Form, Aadhaar Scan, and PAN Scan
    const evaluateDeviations = (
        currentAadhaar = scannedAadhaar, 
        currentPan = scannedPan,
        currentName = customerName,
        currentDob = birthday,
        currentAadhaarNum = aadharNumber,
        currentPanNum = panNumber
    ): DeviationItem[] => {
        const items: DeviationItem[] = [];

        // 1. Name Check
        if (currentAadhaar?.fullName || currentPan?.fullName || currentName) {
            const aadhaarName = currentAadhaar?.fullName || '';
            const panName = currentPan?.fullName || '';
            
            let status: 'MATCH' | 'WARNING' | 'MISMATCH' = 'MATCH';
            let msg = 'Name matches across verified records.';

            if (currentName && aadhaarName) {
                const cmp = compareNames(currentName, aadhaarName);
                if (!cmp.isMatch) {
                    status = 'MISMATCH';
                    msg = `Spelling mismatch between entered name and Aadhaar (${cmp.reason}).`;
                } else if (cmp.isWarning) {
                    status = 'WARNING';
                    msg = `Aadhaar name variation: ${cmp.reason}.`;
                }
            }

            if (currentName && panName) {
                const cmp = compareNames(currentName, panName);
                if (!cmp.isMatch) {
                    status = 'MISMATCH';
                    msg = `Spelling mismatch between entered name and PAN (${cmp.reason}).`;
                } else if (cmp.isWarning && status !== 'MISMATCH') {
                    status = 'WARNING';
                    msg = `PAN name variation: ${cmp.reason}.`;
                }
            }

            if (aadhaarName && panName) {
                const cmp = compareNames(aadhaarName, panName);
                if (!cmp.isMatch) {
                    status = 'MISMATCH';
                    msg = `Aadhaar and PAN names differ (${cmp.reason}).`;
                } else if (cmp.isWarning && status !== 'MISMATCH') {
                    status = 'WARNING';
                    msg = `Aadhaar and PAN name variance: ${cmp.reason}.`;
                }
            }

            items.push({
                field: 'Customer Name',
                formValue: currentName,
                aadhaarValue: aadhaarName,
                panValue: panName,
                status,
                message: msg
            });
        }

        // 2. Date of Birth (DOB) Check
        if (currentAadhaar?.dob || currentPan?.dob || currentDob) {
            const aadhaarDob = currentAadhaar?.dob || '';
            const panDob = currentPan?.dob || '';

            let status: 'MATCH' | 'WARNING' | 'MISMATCH' = 'MATCH';
            let msg = 'DOB matches across verified records.';

            if (currentDob && aadhaarDob) {
                const cmp = compareDates(currentDob, aadhaarDob);
                if (!cmp.isMatch) {
                    status = 'MISMATCH';
                    msg = `Date of Birth on Aadhaar differs from form DOB (${cmp.reason}).`;
                } else if (cmp.isWarning) {
                    status = 'WARNING';
                    msg = `Aadhaar DOB: ${cmp.reason}.`;
                }
            }

            if (currentDob && panDob) {
                const cmp = compareDates(currentDob, panDob);
                if (!cmp.isMatch) {
                    status = 'MISMATCH';
                    msg = `Date of Birth on PAN differs from form DOB (${cmp.reason}).`;
                } else if (cmp.isWarning && status !== 'MISMATCH') {
                    status = 'WARNING';
                    msg = `PAN DOB: ${cmp.reason}.`;
                }
            }

            if (aadhaarDob && panDob) {
                const cmp = compareDates(aadhaarDob, panDob);
                if (!cmp.isMatch) {
                    status = 'MISMATCH';
                    msg = `Discrepancy between Aadhaar DOB and PAN DOB (${cmp.reason}).`;
                } else if (cmp.isWarning && status !== 'MISMATCH') {
                    status = 'WARNING';
                    msg = `Aadhaar & PAN DOB note: ${cmp.reason}.`;
                }
            }

            items.push({
                field: 'Date of Birth (DOB)',
                formValue: currentDob,
                aadhaarValue: aadhaarDob,
                panValue: panDob,
                status,
                message: msg
            });
        }

        // 3. Aadhaar Number Check
        if (currentAadhaar?.idNumber || currentAadhaarNum) {
            const cleanForm = (currentAadhaarNum || '').replace(/\s+/g, '');
            const cleanScanned = (currentAadhaar?.idNumber || '').replace(/\s+/g, '');

            let status: 'MATCH' | 'WARNING' | 'MISMATCH' = 'MATCH';
            let msg = 'Aadhaar number verified.';

            if (cleanForm && cleanScanned) {
                if (cleanForm !== cleanScanned) {
                    status = 'MISMATCH';
                    msg = `Entered Aadhaar (${currentAadhaarNum}) does not match scanned card (${currentAadhaar?.idNumber}).`;
                }
            } else if (!cleanScanned) {
                status = 'WARNING';
                msg = 'Aadhaar number could not be read clearly from image.';
            }

            items.push({
                field: 'Aadhaar Number',
                formValue: currentAadhaarNum,
                aadhaarValue: currentAadhaar?.idNumber || '',
                panValue: 'N/A',
                status,
                message: msg
            });
        }

        // 4. PAN Number Check
        if (currentPan?.idNumber || currentPanNum) {
            const cleanForm = (currentPanNum || '').toUpperCase().trim();
            const cleanScanned = (currentPan?.idNumber || '').toUpperCase().trim();

            let status: 'MATCH' | 'WARNING' | 'MISMATCH' = 'MATCH';
            let msg = 'PAN number verified.';

            if (cleanForm && cleanScanned) {
                if (cleanForm !== cleanScanned) {
                    status = 'MISMATCH';
                    msg = `Scanned PAN (${cleanScanned}) does not match entered PAN (${cleanForm}).`;
                }
            } else if (!cleanScanned) {
                status = 'WARNING';
                msg = 'PAN number could not be read clearly from image.';
            }

            items.push({
                field: 'PAN Number',
                formValue: cleanForm,
                aadhaarValue: 'N/A',
                panValue: cleanScanned,
                status,
                message: msg
            });
        }

        return items;
    };

    // Upload & Scan Aadhaar Card (Front)
    const handleAadhaarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAadharFile(file);
        setError('');
        setIsScanningAadhaar(true);
        setScanProgressAadhaar({ progress: 10, status: 'Uploading Aadhaar Front to vault...' });

        try {
            const publicUrl = await uploadDocToSupabase(file, 'aadhar');
            setAadharFileUrl(publicUrl);

            const scanned = await scanIdentityDocument(file, 'AADHAAR', (p, s) => {
                setScanProgressAadhaar({ progress: p, status: s });
            });

            // Merge with existing Aadhaar data (e.g. from Back if already uploaded)
            setScannedAadhaar(prev => ({
                documentType: 'AADHAAR',
                rawText: (scanned.rawText || '') + (prev?.rawText ? '\n--- BACK ---\n' + prev.rawText : ''),
                idNumber: scanned.idNumber || prev?.idNumber || null,
                fullName: scanned.fullName || prev?.fullName || null,
                dob: scanned.dob || prev?.dob || null,
                rawDob: scanned.rawDob || prev?.rawDob || null,
                gender: scanned.gender || prev?.gender || null,
                fatherName: prev?.fatherName || scanned.fatherName || null,
                address: prev?.address || scanned.address || null,
                pincode: prev?.pincode || scanned.pincode || null,
                district: prev?.district || scanned.district || null,
                state: prev?.state || scanned.state || null,
                confidence: Math.round(((scanned.confidence || 0) + (prev?.confidence || 0)) / (prev ? 2 : 1))
            }));

            // Auto-fill form fields if empty
            if (scanned.idNumber && !aadharNumber) {
                setAadharNumber(scanned.idNumber);
            }
            if (scanned.fullName && !customerName) {
                setCustomerName(formatCustomerName(scanned.fullName, true));
            }
            if (scanned.dob && !birthday) {
                setBirthday(scanned.dob);
            }
            if (scanned.address && !address) {
                setAddress(scanned.address);
            }
            if (scanned.pincode && !pincode) {
                setPincode(scanned.pincode);
                if (scanned.district && !district) setDistrict(scanned.district);
                if (scanned.state && !state) setState(scanned.state);
            }

            // Run cross-check
            const devList = evaluateDeviations(
                scanned, 
                scannedPan, 
                customerName || scanned.fullName || '', 
                birthday || scanned.dob || '',
                aadharNumber || scanned.idNumber || '',
                panNumber
            );

            setDeviations(devList);
            const hasIssue = devList.some(d => d.status === 'MISMATCH' || d.status === 'WARNING');
            if (hasIssue) {
                setIsDeviationDialogOpen(true);
            }
        } catch (err: any) {
            setError(`Aadhaar Scan Error: ${err.message || 'Failed to scan document'}`);
        } finally {
            setIsScanningAadhaar(false);
        }
    };

    // Upload & Scan Aadhaar Card (Back / Address side)
    const handleAadhaarBackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAadharBackFile(file);
        setError('');
        setIsScanningAadhaarBack(true);
        setScanProgressAadhaarBack({ progress: 10, status: 'Uploading Aadhaar Back to vault...' });

        try {
            const publicUrl = await uploadDocToSupabase(file, 'aadhar_back');
            setAadharBackFileUrl(publicUrl);

            const scanned = await scanIdentityDocument(file, 'AADHAAR', (p, s) => {
                setScanProgressAadhaarBack({ progress: p, status: s });
            });

            // Merge with existing Aadhaar data (e.g. from Front if already uploaded)
            setScannedAadhaar(prev => ({
                documentType: 'AADHAAR',
                rawText: (prev?.rawText ? prev.rawText + '\n--- BACK ---\n' : '') + (scanned.rawText || ''),
                idNumber: prev?.idNumber || scanned.idNumber || null,
                fullName: prev?.fullName || scanned.fullName || null,
                dob: prev?.dob || scanned.dob || null,
                rawDob: prev?.rawDob || scanned.rawDob || null,
                gender: prev?.gender || scanned.gender || null,
                fatherName: scanned.fatherName || prev?.fatherName || null,
                address: scanned.address || prev?.address || null,
                pincode: scanned.pincode || prev?.pincode || null,
                district: scanned.district || prev?.district || null,
                state: scanned.state || prev?.state || null,
                confidence: Math.round(((prev?.confidence || 0) + (scanned.confidence || 0)) / (prev ? 2 : 1))
            }));

            // Auto-fill form fields
            if (scanned.idNumber && !aadharNumber) {
                setAadharNumber(scanned.idNumber);
            }
            if (scanned.address && !address) {
                setAddress(scanned.address);
                if (!permanentAddress) {
                    setPermanentAddress(scanned.address);
                    setPermanentStreet(scanned.address);
                }
            }
            if (scanned.pincode && !pincode) {
                setPincode(scanned.pincode);
                if (!permanentPincode) setPermanentPincode(scanned.pincode);
                if (scanned.district && !district) {
                    setDistrict(scanned.district);
                    if (!permanentDistrict) setPermanentDistrict(scanned.district);
                }
                if (scanned.state && !state) {
                    setState(scanned.state);
                    if (!permanentState) setPermanentState(scanned.state);
                }
            }
            if (scanned.fatherName && !fatherName) {
                setFatherName(scanned.fatherName);
            }

            // Run cross-check
            const devList = evaluateDeviations(
                scanned, 
                scannedPan, 
                customerName || scanned.fullName || '', 
                birthday || scanned.dob || '',
                aadharNumber || scanned.idNumber || '',
                panNumber
            );

            setDeviations(devList);
            const hasIssue = devList.some(d => d.status === 'MISMATCH' || d.status === 'WARNING');
            if (hasIssue) {
                setIsDeviationDialogOpen(true);
            }
        } catch (err: any) {
            setError(`Aadhaar Back Scan Error: ${err.message || 'Failed to scan document'}`);
        } finally {
            setIsScanningAadhaarBack(false);
        }
    };

    // Upload & Scan PAN Card
    const handlePanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPanFile(file);
        setError('');
        setIsScanningPan(true);
        setScanProgressPan({ progress: 10, status: 'Uploading PAN to vault...' });

        try {
            const publicUrl = await uploadDocToSupabase(file, 'pan');
            setPanFileUrl(publicUrl);

            const scanned = await scanIdentityDocument(file, 'PAN', (p, s) => {
                setScanProgressPan({ progress: p, status: s });
            });

            setScannedPan(scanned);

            // Auto-fill form fields if empty
            if (scanned.fullName && !customerName) {
                setCustomerName(formatCustomerName(scanned.fullName, true));
            }
            if (scanned.dob && !birthday) {
                setBirthday(scanned.dob);
            }

            // Run 3-way cross-check
            const devList = evaluateDeviations(
                scannedAadhaar, 
                scanned, 
                customerName || scanned.fullName || '', 
                birthday || scanned.dob || '',
                aadharNumber,
                panNumber
            );

            setDeviations(devList);
            const hasIssue = devList.some(d => d.status === 'MISMATCH' || d.status === 'WARNING');
            if (hasIssue) {
                setIsDeviationDialogOpen(true);
            }
        } catch (err: any) {
            setError(`PAN Scan Error: ${err.message || 'Failed to scan document'}`);
        } finally {
            setIsScanningPan(false);
        }
    };

    const handleApplyCorrection = (field: string, value: string) => {
        if (field === 'Customer Name') setCustomerName(formatCustomerName(value, true));
        else if (field.includes('DOB') || field.includes('Birth')) setBirthday(value);
        else if (field === 'Aadhaar Number') setAadharNumber(value);
        else if (field === 'PAN Number') setPanNumber(value.toUpperCase());
    };

    const handleApplyAllAadhaar = () => {
        if (scannedAadhaar?.fullName) setCustomerName(formatCustomerName(scannedAadhaar.fullName, true));
        if (scannedAadhaar?.dob) setBirthday(scannedAadhaar.dob);
        if (scannedAadhaar?.idNumber) setAadharNumber(scannedAadhaar.idNumber);
        setIsDeviationDialogOpen(false);
    };

    const handleApplyAllPan = () => {
        if (scannedPan?.fullName) setCustomerName(formatCustomerName(scannedPan.fullName, true));
        if (scannedPan?.dob) setBirthday(scannedPan.dob);
        if (scannedPan?.idNumber) setPanNumber(scannedPan.idNumber.toUpperCase());
        setIsDeviationDialogOpen(false);
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
                // Existing record found: auto-populate all known customer details
                setCustomerName(data.customer_name || '');
                const rawType = data.customer_type || (data.category === 'Loan' ? 'Loans' : data.category) || '';
                if (rawType) setCustomerType(rawType === 'Loan' ? 'Loans' : rawType);
                if (data.product) setProduct(data.product);
                if (data.amount) setAmount(String(data.amount));
                setPhoneNumber(data.phone_number || '');
                setEmailId(data.email_id || '');
                setAadharNumber(data.aadhar_number || '');
                setAssociationDate(data.association_date || '');
                setAddress(data.address || '');
                setPincode(data.pincode || '');
                setCity(data.city || '');
                setDistrict(data.district || '');
                setIncomeType(data.income_type || '');
                setCompanyName(data.company_name || '');
                setYearlyIncomeRange(data.yearly_income_range || '');
                setBirthday(data.birthday || '');
                setAnniversary(data.anniversary || '');
                if (data.entry_person_name) setEntryPersonName(data.entry_person_name);
                setConsultantName(data.consultant_name || '');
                setManagerName(data.manager_name || '');
                setChannelPartner(data.channel_partner || '');
                setTrackingNumber(data.tracking_number || '');

                // Loan-specific KYC attributes
                setFatherName(data.father_name || '');
                setMotherName(data.mother_name || '');
                setMaritalStatus(data.marital_status || '');
                setSpouseName(data.spouse_name || '');
                setEducationQualification(data.education_qualification || '');
                setDesignation(data.designation || '');
                setOfficialEmail(data.official_email || '');
                setOfficePhone(data.office_phone || '');
                setOfficeAddress(data.office_address || '');
                setOfficeLandmark(data.office_landmark || '');
                setResidenceType(data.residence_type || '');
                setCurrentAddressLandmark(data.current_address_landmark || '');
                setYearsInCurrentResidence(data.years_in_current_residence || '');
                setYearsInCurrentCity(data.years_in_current_city || '');
                setState(data.state || '');
                setHasCurrentAddressProof(Boolean(data.has_current_address_proof));
                setCurrentAddressProofUrl(data.current_address_proof_url || '');
                setPermanentStreet(data.permanent_street || '');
                setPermanentPincode(data.permanent_pincode || '');
                setPermanentCity(data.permanent_city || '');
                setPermanentDistrict(data.permanent_district || '');
                setPermanentState(data.permanent_state || '');
                setPermanentAddress(data.permanent_address || '');
                setPermanentAddressLandmark(data.permanent_address_landmark || '');
                setPermanentPhone(data.permanent_phone || '');
                
                if (data.salary_bank_name) {
                    if (BANK_OPTIONS.includes(data.salary_bank_name)) {
                        setSalaryBankName(data.salary_bank_name);
                        setCustomBankName('');
                    } else {
                        setSalaryBankName('Other Bank / NBFC');
                        setCustomBankName(data.salary_bank_name);
                    }
                } else {
                    setSalaryBankName('');
                    setCustomBankName('');
                }

                if (data.salary_slip_urls && Array.isArray(data.salary_slip_urls) && data.salary_slip_urls.length > 0) {
                    if (data.salary_slip_urls.length === 1 && (data.salary_slip_urls[0].monthYear?.toLowerCase().includes('combined') || data.salary_slip_urls[0].url)) {
                        setSalarySlipMode('combined');
                        setCombinedSlip({
                            monthYear: data.salary_slip_urls[0].monthYear || 'Last 3 Months Combined',
                            file: null,
                            fileUrl: data.salary_slip_urls[0].url || '',
                            detectedSalary: data.salary_slip_urls[0].detectedSalary || null
                        });
                    } else {
                        setSalarySlipMode('individual');
                        setSalarySlips(data.salary_slip_urls.map((s: any, idx: number) => ({
                            id: String(idx + 1),
                            monthYear: s.monthYear || `Month ${idx + 1}`,
                            file: null,
                            fileUrl: s.url || '',
                            detectedSalary: s.detectedSalary || null
                        })));
                    }
                }
                setSalaryAccountNumber(data.salary_account_number || '');
                setTenure(data.tenure || '');
                setRef1Name(data.ref1_name || '');
                setRef1Phone(data.ref1_phone || '');
                setRef1Address(data.ref1_address || '');
                setRef1Relation(data.ref1_relation || '');
                setRef2Name(data.ref2_name || '');
                setRef2Phone(data.ref2_phone || '');
                setRef2Address(data.ref2_address || '');
                setRef2Relation(data.ref2_relation || '');

                // Restore Step 6 Loan Eligibility snapshot if present
                if (data.loan_eligibility) {
                    const le = data.loan_eligibility;
                    if (le.monthly_salary) setMonthlySalary(String(le.monthly_salary));
                    if (le.employer_category) setEmployerCategory(le.employer_category);
                    if (typeof le.owns_home === 'boolean') setCustomOwnsHome(le.owns_home);
                    if (typeof le.has_bureau_hl_lap === 'boolean') setHasBureauHlLap(le.has_bureau_hl_lap);
                    if (le.interest_rate_annual) setInterestRateAnnual(le.interest_rate_annual);
                    if (le.tenure_months) setCalcTenureMonths(le.tenure_months);
                    if (le.bank_multiplier) setBankMultiplier(le.bank_multiplier);
                    if (le.absolute_max_cap) setAbsoluteMaxCap(le.absolute_max_cap);
                    if (Array.isArray(le.existing_loans)) setExistingLoans(le.existing_loans);
                }

                // Restore KYC Document details if present
                if (data.aadhar_file_url) setAadharFileUrl(data.aadhar_file_url);
                if (data.aadhar_back_file_url) setAadharBackFileUrl(data.aadhar_back_file_url);
                if (data.pan_file_url) setPanFileUrl(data.pan_file_url);
                if (data.kyc_verification_status) {
                    if (Array.isArray(data.kyc_verification_status.deviations)) {
                        setDeviations(data.kyc_verification_status.deviations);
                    }
                    if (data.kyc_verification_status.scanned_aadhaar) {
                        setScannedAadhaar(data.kyc_verification_status.scanned_aadhaar);
                    }
                    if (data.kyc_verification_status.scanned_pan) {
                        setScannedPan(data.kyc_verification_status.scanned_pan);
                    }
                }

                setExistingRecord(data);
            } else {
                // New customer: reset existing record
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

                // Aadhaar Number & Mandatory Document Uploads for Loans
                const cleanAadhaar = aadharNumber.replace(/\s+/g, '');
                if (!cleanAadhaar || cleanAadhaar.length !== 12) {
                    setError('Aadhaar Number is mandatory for Loan customers (Must be 12 digits).');
                    return false;
                }
                if (!aadharFile && !aadharFileUrl) {
                    setError('Please upload the Aadhaar Card document for identity verification.');
                    return false;
                }
                if (!panFile && !panFileUrl) {
                    setError('Please upload the PAN Card document for identity verification.');
                    return false;
                }
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
            if (index === 5) {
                if (!monthlySalary || Number(monthlySalary) <= 0) {
                    setError('Please enter a valid positive Net Monthly Salary (₹).');
                    return false;
                }
            }
        } else if (isForex) {
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
    
    const buildCustomerPayload = (selectedAuthor?: string, skipReason?: string) => {
        const author = selectedAuthor || entryPersonName;
        const isSkippingEligibility = isLoan && (Boolean(skipReason && skipReason.trim()) || incomeCategory === 'business');
        const finalSkipReason = (skipReason || (incomeCategory === 'business' ? 'Business Income profile - Eligibility calculation logic yet to be received from team.' : '')).trim();
        return {
            pan_number: panNumber.toUpperCase(),
            customer_name: formatCustomerName(customerName, true),
            customer_type: customerType,
            category: mapCustomerTypeToCategory(customerType),
            product: product,
            amount: Number(amount) || 0,
            aadhar_number: isLoan ? (aadharNumber.trim() || null) : null,
            association_date: associationDate || null,
            address: address.trim() || null,
            pincode: pincode.trim() || null,
            city: city.trim() || null,
            district: district.trim() || null,
            state: state.trim() || null,
            phone_number: phoneNumber.trim(),
            email_id: emailId.trim() || null,
            income_type: isForex ? null : (incomeType || null),
            company_name: isForex ? null : (companyName.trim() || null),
            yearly_income_range: isForex ? null : (yearlyIncomeRange || null),
            birthday: isForex ? null : (birthday || null),
            anniversary: isForex ? null : (anniversary || null),
            entry_person_name: author,
            entry_location: entryLocation,
            consultant_name: consultantName.trim() || null,
            manager_name: managerName.trim() || null,
            channel_partner: channelPartner.trim() || null,
            tracking_number: trackingNumber.trim() || null,

            // KYC Document Uploads & Verification Status
            aadhar_file_url: isLoan ? (aadharFileUrl || null) : null,
            aadhar_back_file_url: isLoan ? (aadharBackFileUrl || null) : null,
            pan_file_url: isLoan ? (panFileUrl || null) : null,
            kyc_verification_status: isLoan ? {
                is_verified: deviations.length > 0 && !deviations.some(d => d.status === 'MISMATCH'),
                has_deviations: deviations.some(d => d.status === 'MISMATCH' || d.status === 'WARNING'),
                deviations: deviations,
                scanned_aadhaar: scannedAadhaar,
                scanned_pan: scannedPan,
            } : null,

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
            has_current_address_proof: isLoan ? Boolean(hasCurrentAddressProof) : false,
            current_address_proof_url: isLoan ? (currentAddressProofUrl || null) : null,
            permanent_street: isLoan ? (permanentStreet.trim() || null) : null,
            permanent_pincode: isLoan ? (permanentPincode.trim() || null) : null,
            permanent_city: isLoan ? (permanentCity.trim() || null) : null,
            permanent_district: isLoan ? (permanentDistrict.trim() || null) : null,
            permanent_state: isLoan ? (permanentState.trim() || null) : null,
            permanent_address: isLoan ? (
                permanentAddress.trim() || 
                [permanentStreet, permanentCity, permanentDistrict, permanentState, permanentPincode ? `PIN: ${permanentPincode}` : ''].filter(Boolean).join(', ') || 
                null
            ) : null,
            permanent_address_landmark: isLoan ? (permanentAddressLandmark.trim() || null) : null,
            permanent_phone: isLoan ? (permanentPhone.trim() || null) : null,
            salary_bank_name: isLoan ? (
                salaryBankName === 'Other Bank / NBFC'
                    ? (customBankName.trim() || 'Other Bank / NBFC')
                    : (salaryBankName.trim() || null)
            ) : null,
            salary_account_number: isLoan ? (salaryAccountNumber.trim() || null) : null,
            salary_slip_urls: isLoan ? (
                salarySlipMode === 'individual'
                    ? salarySlips.filter(s => !!s.fileUrl).map(s => ({
                        monthYear: s.monthYear,
                        url: s.fileUrl,
                        detectedSalary: s.detectedSalary || null
                    }))
                    : (combinedSlip.fileUrl ? [{
                        monthYear: combinedSlip.monthYear,
                        url: combinedSlip.fileUrl,
                        detectedSalary: combinedSlip.detectedSalary || null
                    }] : null)
            ) : null,
            tenure: isLoan ? (tenure.trim() || null) : null,
            ref1_name: isLoan ? (ref1Name.trim() || null) : null,
            ref1_phone: isLoan ? (ref1Phone.trim() || null) : null,
            ref1_address: isLoan ? (ref1Address.trim() || null) : null,
            ref1_relation: isLoan ? (ref1Relation.trim() || null) : null,
            ref2_name: isLoan ? (ref2Name.trim() || null) : null,
            ref2_phone: isLoan ? (ref2Phone.trim() || null) : null,
            ref2_address: isLoan ? (ref2Address.trim() || null) : null,
            ref2_relation: isLoan ? (ref2Relation.trim() || null) : null,

            // Record eligibility skip reason explicitly
            eligibility_skip_reason: isSkippingEligibility ? finalSkipReason : null,

            // Loan Eligibility Engine Calculation Snapshot or Skip Record
            loan_eligibility: isLoan ? (
                isSkippingEligibility ? {
                    skipped: true,
                    skip_reason: finalSkipReason,
                    skipped_at: new Date().toISOString(),
                    skipped_by: author,
                    skipped_at_step: activeSectionIndex + 1,
                    income_category: incomeCategory,
                } : {
                    income_category: incomeCategory,
                    monthly_salary: Number(monthlySalary) || 0,
                    employer_category: employerCategory,
                    owns_home: eligibilityResults.effectiveOwnsHome,
                    has_bureau_hl_lap: hasBureauHlLap,
                    interest_rate_annual: interestRateAnnual,
                    tenure_months: calcTenureMonths,
                    bank_multiplier: bankMultiplier,
                    absolute_max_cap: absoluteMaxCap,
                    existing_loans: existingLoans,
                    results: eligibilityResults
                }
            ) : null,
        };
    };

    const resetFormFields = () => {
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
        setState('');
        setPhoneNumber('');
        setEmailId('');
        setIncomeType('');
        setCompanyName('');
        setYearlyIncomeRange('');
        setBirthday('');
        setAnniversary('');
        setEntryPersonName('');
        setConsultantName('');
        setManagerName('');
        setChannelPartner('');
        setTrackingNumber('');
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
        setHasCurrentAddressProof(false);
        setCurrentAddressProofFile(null);
        setCurrentAddressProofUrl('');
        setIsSameAsCurrentAddress(false);
        setPermanentStreet('');
        setPermanentPincode('');
        setPermanentCity('');
        setPermanentDistrict('');
        setPermanentState('');
        setPermanentAddress('');
        setPermanentAddressLandmark('');
        setPermanentPhone('');
        setSalaryBankName('');
        setCustomBankName('');
        setSalaryAccountNumber('');
        setSalarySlipMode('individual');
        setSalarySlips([
            { id: '1', monthYear: 'Last Month', file: null, fileUrl: '' },
            { id: '2', monthYear: '2 Months Ago', file: null, fileUrl: '' },
            { id: '3', monthYear: '3 Months Ago', file: null, fileUrl: '' },
        ]);
        setCombinedSlip({
            monthYear: 'Last 3 Months Combined',
            file: null,
            fileUrl: ''
        });
        setTenure('');
        setRef1Name('');
        setRef1Phone('');
        setRef1Address('');
        setRef1Relation('');
        setRef2Name('');
        setRef2Phone('');
        setRef2Address('');
        setRef2Relation('');
        setMonthlySalary('');
        setEmployerCategory('A/B/G');
        setCustomOwnsHome(null);
        setHasBureauHlLap(false);
        setInterestRateAnnual(11.0);
        setCalcTenureMonths(36);
        setBankMultiplier(24);
        setManualFoirPercent('');
        setAbsoluteMaxCap(2500000);
        setExistingLoans([]);
        setAadharFile(null);
        setAadharFileUrl('');
        setAadharBackFile(null);
        setAadharBackFileUrl('');
        setPanFile(null);
        setPanFileUrl('');
        setScannedAadhaar(null);
        setScannedPan(null);
        setDeviations([]);
        setEligibilitySkipReason('');
        setIncomeCategory('salaried');
        setExistingRecord(null);
    };

    // Auto-populate customer record as an active line item in the daily entries ledger
    const syncCustomerToEntryPage = async (customerPayload: any, authorName: string) => {
        try {
            // 1. Resolve branch ID from entry location
            const loc = (customerPayload.entry_location || entryLocation || '').toLowerCase().trim();
            let targetBranchId = 'b1'; // default to Guwahati / HO
            const matchedBranch = branches.find(b => 
                b.name.toLowerCase().trim() === loc || 
                (loc === 'ho' && b.id === 'b1')
            );
            if (matchedBranch) {
                targetBranchId = matchedBranch.id;
            } else if (loc.includes('manipur')) {
                targetBranchId = 'b2';
            } else if (loc.includes('itanagar')) {
                targetBranchId = 'b3';
            } else if (loc.includes('nagaland') || loc.includes('mizoram')) {
                targetBranchId = 'b4';
            }

            // 2. Resolve Target Date (association_date or today's date in YYYY-MM-DD)
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const targetDate = customerPayload.association_date || todayStr;

            // 3. Format fields
            const cleanPan = (customerPayload.pan_number || panNumber || '').toUpperCase().trim();
            const cleanPhone = (customerPayload.phone_number || phoneNumber || '').trim();
            const cleanCustomerName = customerPayload.customer_name || formatCustomerName(customerName, true);
            const cleanCategory = customerPayload.category || (isLoan ? 'Loan' : isForex ? 'Forex' : 'Insurance');
            const cleanProduct = customerPayload.product || product || (isLoan ? 'Personal Loan' : '');
            const cleanChannel = customerPayload.channel_partner || channelPartner || customerPayload.salary_bank_name || salaryBankName || '';
            const cleanTrackingNumber = customerPayload.tracking_number || trackingNumber || '';
            const loginAmount = Number(customerPayload.amount) || Number(amount) || 0;

            const entryLineItem: any = {
                date: targetDate,
                customerName: cleanCustomerName,
                phoneNumber: cleanPhone,
                emailId: customerPayload.email_id || emailId || '',
                customerDOB: customerPayload.birthday || birthday || '',
                customerAddress: customerPayload.address || address || '',
                category: cleanCategory,
                product: cleanProduct,
                channel: cleanChannel, // Bank Name / Channel Partner
                trackingNumber: cleanTrackingNumber,
                amount: loginAmount, // Login Amount
                status: 'Login',
                fileStatus: 'Login',
                staffName: authorName,
                managerName: customerPayload.manager_name || managerName || '',
                consultantName: customerPayload.consultant_name || consultantName || '',
                repaymentBank: customerPayload.salary_bank_name || salaryBankName || '',
                branchLocation: customerPayload.entry_location || entryLocation,
                firmName: isForex ? 'FOREX' : '',
                fileLogin: 'Branch walkin',
                sanctionedAmount: 0,
                disbursedAmount: 0,
                disbursedDate: '',
                emiDate: '', // Updated by staff on Entry Page
                rejectionRemark: '',
                panNumber: cleanPan,
                isManual: true
            };

            // 4. Check if an achievement entry already exists for targetBranchId + targetDate + mode: 'daily'
            const { data: existingRows, error: fetchErr } = await supabase
                .from('entries')
                .select('*')
                .eq('branchId', targetBranchId)
                .eq('entryDate', targetDate)
                .eq('mode', 'daily');

            if (fetchErr) {
                console.warn('Could not fetch existing entries for sync:', fetchErr);
                return;
            }

            const achievementRow = existingRows?.find(r => !r.recordType || r.recordType === 'achievement');

            if (achievementRow) {
                const currentItems: any[] = Array.isArray(achievementRow.items) ? [...achievementRow.items] : [];
                
                // Match existing item by PAN number or Customer Name + Phone Number
                const existingIdx = currentItems.findIndex((it: any) => 
                    (cleanPan && it.panNumber === cleanPan) ||
                    (it.customerName?.toLowerCase().trim() === cleanCustomerName.toLowerCase().trim() && it.phoneNumber === cleanPhone)
                );

                if (existingIdx >= 0) {
                    const existingItem = currentItems[existingIdx];
                    currentItems[existingIdx] = {
                        ...entryLineItem,
                        // Preserve any updates the staff already made on the Entry page
                        fileStatus: existingItem.fileStatus || entryLineItem.fileStatus,
                        disbursedAmount: existingItem.disbursedAmount !== undefined ? existingItem.disbursedAmount : entryLineItem.disbursedAmount,
                        disbursedDate: existingItem.disbursedDate || entryLineItem.disbursedDate,
                        emiDate: existingItem.emiDate || entryLineItem.emiDate,
                        sanctionedAmount: existingItem.sanctionedAmount !== undefined ? existingItem.sanctionedAmount : entryLineItem.sanctionedAmount,
                        rejectionRemark: existingItem.rejectionRemark || entryLineItem.rejectionRemark,
                        channel: existingItem.channel || entryLineItem.channel,
                        repaymentBank: existingItem.repaymentBank || entryLineItem.repaymentBank
                    };
                } else {
                    currentItems.push(entryLineItem);
                }

                const newTotal = currentItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

                const { error: updateErr } = await supabase
                    .from('entries')
                    .update({
                        items: currentItems,
                        totalAmount: newTotal,
                        location: customerPayload.entry_location || entryLocation,
                        recordType: 'achievement'
                    })
                    .eq('id', achievementRow.id);

                if (updateErr) {
                    console.warn('Failed to update entries table with new line item:', updateErr);
                } else {
                    console.log('Successfully synced customer line item to entries table.');
                }
            } else {
                // Create a new daily achievement entry row
                const newEntryRecord = {
                    branchId: targetBranchId,
                    entryDate: targetDate,
                    mode: 'daily',
                    recordType: 'achievement',
                    items: [entryLineItem],
                    totalAmount: loginAmount,
                    authorEmail: currentUser?.email || 'portal@siroiforex.com',
                    authorId: currentUser?.id || null,
                    location: customerPayload.entry_location || entryLocation,
                    createdAt: new Date().toISOString()
                };

                const { error: insertErr } = await supabase
                    .from('entries')
                    .insert([newEntryRecord]);

                if (insertErr) {
                    console.warn('Failed to create new daily entry with line item:', insertErr);
                } else {
                    console.log('Successfully created daily entry row with customer line item.');
                }
            }
        } catch (syncErr) {
            console.warn('Error in syncCustomerToEntryPage:', syncErr);
        }
    };

    const executeCustomerSave = async (authorName?: string, skipReason?: string) => {
        const finalAuthor = authorName || entryPersonName;
        if (!finalAuthor) {
            setIsEarlySaveModalOpen(true);
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const customerPayload = buildCustomerPayload(finalAuthor, skipReason);

            if (existingRecord?.id) {
                const { error: updateError } = await supabase
                    .from('customer_data')
                    .update(customerPayload)
                    .eq('id', existingRecord.id);
                    
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('customer_data')
                    .insert([customerPayload]);
                    
                if (insertError) throw insertError;
            }

            // Auto-populate customer record as an active line item in the daily entries ledger
            await syncCustomerToEntryPage(customerPayload, finalAuthor);
            
            setIsEarlySaveModalOpen(false);
            setEligibilitySkipReason('');
            setSuccess(true);
            setTimeout(() => {
                resetFormFields();
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to save customer data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDirectSaveCustomer = async () => {
        // Validate Step 1 basics
        if (!customerName.trim()) { setError('Please enter Customer Name.'); setActiveSectionIndex(0); return; }
        if (!customerType) { setError('Please select a Customer Type.'); setActiveSectionIndex(0); return; }
        if (!product) { setError('Please select a Product.'); setActiveSectionIndex(0); return; }
        if (!amount || Number(amount) <= 0) { setError('Please enter a valid positive Amount.'); setActiveSectionIndex(0); return; }
        if (!phoneNumber.trim()) { setError('Please enter Phone Number.'); setActiveSectionIndex(0); return; }

        if (isLoan) {
            const cleanAadhaar = aadharNumber.replace(/\s+/g, '');
            if (!cleanAadhaar || cleanAadhaar.length !== 12) {
                setError('Aadhaar Number is mandatory for Loan customers (Must be 12 digits).');
                setActiveSectionIndex(0);
                return;
            }
            if (!aadharFile && !aadharFileUrl) {
                setError('Please upload the Aadhaar Card document for identity verification.');
                setActiveSectionIndex(0);
                return;
            }
            if (!panFile && !panFileUrl) {
                setError('Please upload the PAN Card document for identity verification.');
                setActiveSectionIndex(0);
                return;
            }
        }

        // Validate Address
        if (!address.trim() || !pincode.trim() || !city.trim() || !district.trim()) {
            setError('Please fill in complete Address details.');
            setActiveSectionIndex(isLoan ? 3 : 1);
            return;
        }

        // If Business Income, pre-suggest the reason if empty
        if (incomeCategory === 'business' && !eligibilitySkipReason.trim()) {
            setEligibilitySkipReason('Business Income profile - Eligibility calculation logic yet to be received from team.');
        }

        // Always show the Skip Loan Eligibility Confirmation & Remarks modal!
        setError('');
        setIsEarlySaveModalOpen(true);
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

        if (isLoan) {
            const cleanAadhaar = aadharNumber.replace(/\s+/g, '');
            if (!cleanAadhaar || cleanAadhaar.length !== 12) {
                setError('Aadhaar Number is mandatory for Loan customers (Must be 12 digits).');
                setActiveSectionIndex(0);
                return;
            }
            if (!aadharFile && !aadharFileUrl) {
                setError('Please upload the Aadhaar Card document for identity verification.');
                setActiveSectionIndex(0);
                return;
            }
            if (!panFile && !panFileUrl) {
                setError('Please upload the PAN Card document for identity verification.');
                setActiveSectionIndex(0);
                return;
            }
        }

        await executeCustomerSave(entryPersonName);
    };

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
                className={`relative z-10 w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    step === 1 
                        ? 'max-w-[480px] p-8 sm:p-10' 
                        : (isLoan && activeSectionIndex === 5 ? 'max-w-5xl p-6 sm:p-10' : 'max-w-3xl p-6 sm:p-10')
                } bg-white/75 dark:bg-slate-900/75 shadow-2xl border border-white/70 dark:border-white/10`}
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
                        {step === 1 ? 'Customer Identification' : isLoan ? 'Loan Application Form' : isForex ? 'Forex Customer Entry' : 'Customer Profile Form'}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {step === 1 ? 'Customer Verification' : isForex ? 'Forex Data Entry' : 'Customer Data Entry'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        {step === 1 
                            ? 'Verify PAN to start or check existing customer profile.' 
                            : isLoan 
                                ? 'Complete loan applicant credentials, KYC, and guarantor details.' 
                                : isForex
                                    ? 'Streamlined 2-step profile and address verification for forex walk-ins.'
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
                        
                        {/* STEP 1: Location & PAN Verification (Refined, Focused Proportions) */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Operating Location Dropdown */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>Operating Location</span>
                                        </span>
                                        {!isAdmin && Boolean(userBranchName) && (
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Assigned Branch
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            disabled={!isAdmin && Boolean(userBranchName)}
                                            onClick={() => {
                                                if (isAdmin || !userBranchName) {
                                                    setIsLocationDropdownOpen(!isLocationDropdownOpen);
                                                }
                                            }}
                                            className={`flex items-center justify-between h-12 w-full rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-xs ${(!isAdmin && Boolean(userBranchName)) ? 'cursor-default opacity-95' : 'hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                                                <span className="font-semibold text-slate-800 dark:text-slate-100">{entryLocation}</span>
                                            </div>
                                            {(isAdmin || !userBranchName) && (
                                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                                            )}
                                        </button>
                                        
                                        {(isAdmin || !userBranchName) && isLocationDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsLocationDropdownOpen(false)}></div>
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                                    {branches.map(branch => (
                                                        <button
                                                            key={branch.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setEntryLocation(branch.name);
                                                                setIsLocationDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${entryLocation === branch.name ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                                        >
                                                            <span>{branch.name}</span>
                                                            {entryLocation === branch.name && <Check className="w-4 h-4 text-indigo-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* PAN Card Number with Ergonomic Proportions */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>PAN Card Number</span>
                                        </label>
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800">
                                            10 Alphanumeric
                                        </span>
                                    </div>
                                    <Input 
                                        type="text" 
                                        value={panNumber}
                                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        required
                                        className="h-14 bg-white/90 dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 rounded-2xl shadow-xs font-mono tracking-[0.25em] text-center text-lg font-bold uppercase focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all"
                                    />
                                    <p className="text-[11px] text-slate-400 text-center pt-0.5">
                                        Verified across all branch databases to prevent duplicate customer records.
                                    </p>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isLoading || panNumber.length < 10}
                                    className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold tracking-wide transition-all shadow-md shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <><span>Verify Customer PAN</span><ArrowRight className="w-4 h-4" /></>
                                    )}
                                </Button>
                            </div>
                        )}
                        
                        {/* STEP 2: Multi-Section Form with Google Modern Stepper Dots */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                
                                {/* Existing customer record indicator if found */}
                                {existingRecord && (
                                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center justify-between text-xs font-medium animate-in fade-in">
                                        <div className="flex items-center gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>
                                                Existing profile found for PAN <strong className="font-mono">{panNumber}</strong> ({existingRecord.entry_location || 'Branch'}). Details auto-populated.
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                                            Auto-Filled
                                        </span>
                                    </div>
                                )}

                                {/* Google Modern Step Dots Indicator */}
                                <div className="space-y-4 pt-1 pb-2">
                                    {/* Desktop & Tablet: Connected Dot Stepper */}
                                    <div className="relative flex items-center justify-between max-w-xl mx-auto px-2">
                                        {sections.map((sec, idx) => {
                                            const isActive = idx === activeSectionIndex;
                                            const isDone = idx < activeSectionIndex;

                                            return (
                                                <React.Fragment key={sec.id}>
                                                    {/* Step Dot & Label */}
                                                    <div className="flex flex-col items-center relative z-10">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (idx <= activeSectionIndex) {
                                                                    setError('');
                                                                    setActiveSectionIndex(idx);
                                                                } else if (validateCurrentSection(activeSectionIndex)) {
                                                                    setActiveSectionIndex(idx);
                                                                }
                                                            }}
                                                            className={`relative flex items-center justify-center transition-all duration-300 rounded-full select-none ${
                                                                isActive
                                                                    ? 'w-9 h-9 bg-indigo-600 text-white font-bold text-xs ring-4 ring-indigo-500/20 dark:ring-indigo-400/25 shadow-md shadow-indigo-500/25 scale-105'
                                                                    : isDone
                                                                        ? 'w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white font-bold text-xs hover:scale-105 shadow-xs cursor-pointer'
                                                                        : 'w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-xs border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
                                                            }`}
                                                            title={`Step ${idx + 1}: ${sec.title}`}
                                                        >
                                                            {isDone ? (
                                                                <Check className="w-4 h-4 stroke-[2.5]" />
                                                            ) : (
                                                                <span>{idx + 1}</span>
                                                            )}
                                                        </button>
                                                        
                                                        <span className={`text-[11px] mt-2 font-medium transition-colors text-center max-w-[80px] truncate ${
                                                            isActive 
                                                                ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                                                                : isDone 
                                                                    ? 'text-slate-700 dark:text-slate-300 font-semibold' 
                                                                    : 'text-slate-400 dark:text-slate-500'
                                                        }`}>
                                                            {sec.shortTitle}
                                                        </span>
                                                    </div>

                                                    {/* Hairline connecting track between dots */}
                                                    {idx < sections.length - 1 && (
                                                        <div className="flex-1 h-[2px] mx-2 -mt-6 transition-all duration-500 rounded-full relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                                                            <div 
                                                                className={`h-full transition-all duration-500 ${
                                                                    idx < activeSectionIndex 
                                                                        ? 'w-full bg-indigo-600 dark:bg-indigo-500' 
                                                                        : 'w-0'
                                                                }`} 
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>

                                    {/* Google Dynamic Capsule Dots (Pagination indicator) */}
                                    <div className="flex items-center justify-center gap-1.5 pt-1">
                                        {sections.map((sec, idx) => (
                                            <button
                                                key={sec.id}
                                                type="button"
                                                onClick={() => {
                                                    if (idx <= activeSectionIndex) {
                                                        setError('');
                                                        setActiveSectionIndex(idx);
                                                    } else if (validateCurrentSection(activeSectionIndex)) {
                                                        setActiveSectionIndex(idx);
                                                    }
                                                }}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    idx === activeSectionIndex
                                                        ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                                                        : idx < activeSectionIndex
                                                            ? 'w-1.5 bg-indigo-300 dark:bg-indigo-700 hover:bg-indigo-400'
                                                            : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                                                }`}
                                                title={`Step ${idx + 1}: ${sec.title}`}
                                            />
                                        ))}
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

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>Aadhar Number</span>
                                                            </span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory for Loans</span>
                                                        </label>
                                                        <Input 
                                                            type="text" 
                                                            value={aadharNumber} 
                                                            onChange={(e) => setAadharNumber(formatAadhaarInput(e.target.value))} 
                                                            placeholder="1234 5678 9012" 
                                                            maxLength={14} 
                                                            required
                                                            className="h-11 bg-white/70 dark:bg-slate-800/70 font-mono tracking-widest text-base font-semibold" 
                                                        />
                                                    </div>

                                                    {/* Channel Partner (Bank) - Optional */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>Channel Partner (Bank)</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                        </label>
                                                        <select
                                                            value={channelPartner}
                                                            onChange={(e) => setChannelPartner(e.target.value)}
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer shadow-xs"
                                                        >
                                                            <option value="">Select Channel Partner Bank / NBFC...</option>
                                                            {availableChannelPartners.map(cp => (
                                                                <option key={cp} value={cp}>{cp}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Tracking Number - Optional */}
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>Tracking / Application Number</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                        </label>
                                                        <Input
                                                            type="text"
                                                            value={trackingNumber}
                                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                                            placeholder="e.g. LAN12345678, Lead ID or Bank File No."
                                                            className="h-11 bg-white/70 dark:bg-slate-800/70 font-mono"
                                                        />
                                                    </div>

                                                    {/* DOCUMENT SCAN & VERIFICATION SUITE (For Loans) */}
                                                    <div className="md:col-span-2 space-y-4 pt-2">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-800 gap-2">
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                                    KYC Document Verification Suite
                                                                </span>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                    Upload Aadhaar (Front & Back) and PAN cards. Automatic OCR scans for any spelling or DOB mistakes and alerts for deviations.
                                                                </p>
                                                            </div>
                                                            {deviations.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsDeviationDialogOpen(true)}
                                                                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto ${
                                                                        deviations.some(d => d.status === 'MISMATCH')
                                                                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                                                                            : deviations.some(d => d.status === 'WARNING')
                                                                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                                    }`}
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span>Review Verification ({deviations.some(d => d.status === 'MISMATCH') ? 'Mismatch' : deviations.some(d => d.status === 'WARNING') ? 'Warning' : 'Matched'})</span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* 1. Aadhaar Card (Front Side) */}
                                                        <div className={`p-4 rounded-2xl border transition-all ${
                                                            scannedAadhaar?.fullName || scannedAadhaar?.dob 
                                                                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/50' 
                                                                : 'bg-white/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                                                        }`}>
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">Aadhaar Card (Front Side)</span>
                                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                            {aadharFile ? aadharFile.name : (aadharFileUrl ? 'Aadhaar Front uploaded' : 'Upload front photo (Scans Name, DOB, Photo & Aadhaar No)')}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                                    <input 
                                                                        type="file" 
                                                                        ref={aadhaarInputRef}
                                                                        accept="image/*,application/pdf" 
                                                                        onChange={handleAadhaarFileChange} 
                                                                        className="hidden" 
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="secondary"
                                                                        disabled={isScanningAadhaar}
                                                                        onClick={() => aadhaarInputRef.current?.click()}
                                                                        className="text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
                                                                    >
                                                                        {isScanningAadhaar ? (
                                                                            <>
                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                                                                <span>{scanProgressAadhaar.status || 'Scanning...'}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                                                                <span>{aadharFileUrl || aadharFile ? 'Re-upload Front' : 'Upload Aadhaar Front'}</span>
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 2. Aadhaar Card (Back Side / Address) */}
                                                        <div className={`p-4 rounded-2xl border transition-all ${
                                                            scannedAadhaar?.address || scannedAadhaar?.pincode 
                                                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50' 
                                                                : 'bg-white/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                                                        }`}>
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                                        <Home className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">Aadhaar Card (Back Side / Address)</span>
                                                                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">For Address & S/O</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                            {aadharBackFile ? aadharBackFile.name : (aadharBackFileUrl ? 'Aadhaar Back uploaded' : 'Upload back photo (Scans Address, Pincode & S/O Father Name)')}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                                    <input 
                                                                        type="file" 
                                                                        ref={aadhaarBackInputRef}
                                                                        accept="image/*,application/pdf" 
                                                                        onChange={handleAadhaarBackFileChange} 
                                                                        className="hidden" 
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="secondary"
                                                                        disabled={isScanningAadhaarBack}
                                                                        onClick={() => aadhaarBackInputRef.current?.click()}
                                                                        className="text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
                                                                    >
                                                                        {isScanningAadhaarBack ? (
                                                                            <>
                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                                                                <span>{scanProgressAadhaarBack.status || 'Scanning...'}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                                                                                <span>{aadharBackFileUrl || aadharBackFile ? 'Re-upload Back' : 'Upload Aadhaar Back'}</span>
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Consolidated Aadhaar Scan Results Summary Chips */}
                                                        {scannedAadhaar && (
                                                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                                                                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Scanned Name</span>
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                                        {scannedAadhaar.fullName || 'Not detected'}
                                                                    </span>
                                                                </div>
                                                                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Scanned DOB</span>
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                                        {formatDisplayDate(scannedAadhaar.dob)}
                                                                    </span>
                                                                </div>
                                                                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Scanned Aadhaar No</span>
                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                                        {scannedAadhaar.idNumber || 'Not detected'}
                                                                    </span>
                                                                </div>
                                                                {scannedAadhaar.fatherName && (
                                                                    <div className="sm:col-span-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                                                        <span className="text-slate-400 text-[9px] uppercase font-bold">Care of / Father (S/O):</span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                                                                            {scannedAadhaar.fatherName}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {scannedAadhaar.address && (
                                                                    <div className="sm:col-span-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                                        <span className="text-slate-400 block text-[9px] uppercase font-bold flex items-center justify-between">
                                                                            <span>Scanned Address (from Back)</span>
                                                                            {scannedAadhaar.pincode && <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">PIN: {scannedAadhaar.pincode}</span>}
                                                                        </span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-[10px] leading-relaxed block mt-0.5">
                                                                            {scannedAadhaar.address}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 2. PAN Card Upload Box (Placed Directly Below Aadhaar Upload) */}
                                                        <div className={`p-4 rounded-2xl border transition-all ${
                                                            scannedPan 
                                                                ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/50' 
                                                                : 'bg-white/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                                                        }`}>
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                                        <CreditCard className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">PAN Card Document</span>
                                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                            {panFile ? panFile.name : (panFileUrl ? 'PAN uploaded to vault' : 'Upload photo or PDF of PAN card')}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                                    <input 
                                                                        type="file" 
                                                                        ref={panInputRef}
                                                                        accept="image/*,application/pdf" 
                                                                        onChange={handlePanFileChange} 
                                                                        className="hidden" 
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="secondary"
                                                                        disabled={isScanningPan}
                                                                        onClick={() => panInputRef.current?.click()}
                                                                        className="text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
                                                                    >
                                                                        {isScanningPan ? (
                                                                            <>
                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                                                                <span>{scanProgressPan.status || 'Scanning...'}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Upload className="w-3.5 h-3.5 text-blue-600" />
                                                                                <span>{panFileUrl || panFile ? 'Re-upload PAN' : 'Upload PAN Card'}</span>
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* PAN Scan Results Summary Chips */}
                                                            {scannedPan && (
                                                                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                                                                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Scanned Name</span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                                            {scannedPan.fullName || 'Not detected'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Scanned DOB</span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                                            {formatDisplayDate(scannedPan.dob)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Scanned PAN No</span>
                                                                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                                            {scannedPan.idNumber || 'Not detected'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                
                                                {/* Step 4 Top Segmented Toggle: Salaried Income vs Business Income */}
                                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-800/80 dark:via-indigo-950/20 dark:to-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                                <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Income Assessment Stream
                                                            </span>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                Choose profile structure for eligibility and banking workflows
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                                                            {incomeCategory === 'salaried' ? 'Salaried FOIR Engine' : 'Underwriting Pending'}
                                                        </span>
                                                    </div>

                                                    {/* Segmented Controls */}
                                                    <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-slate-900/80 rounded-xl border border-slate-300/60 dark:border-slate-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleIncomeCategoryChange('salaried')}
                                                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                                                                incomeCategory === 'salaried'
                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-slate-300 dark:shadow-none border border-slate-200/80 dark:border-slate-700'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                        >
                                                            <Briefcase className="w-3.5 h-3.5" />
                                                            <span>Salaried Income</span>
                                                            {incomeCategory === 'salaried' && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse ml-0.5"></span>
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleIncomeCategoryChange('business')}
                                                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                                                                incomeCategory === 'business'
                                                                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm shadow-slate-300 dark:shadow-none border border-amber-300/80 dark:border-amber-700/60'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                            }`}
                                                        >
                                                            <Building2 className="w-3.5 h-3.5" />
                                                            <span>Business Income</span>
                                                            {incomeCategory === 'business' && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5"></span>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* When Business Income is switched: Banner */}
                                                    {incomeCategory === 'business' && (
                                                        <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-800/40 space-y-1.5 animate-in fade-in duration-200">
                                                            <div className="flex items-center gap-2">
                                                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                                                    Business Income: Logic yet to be received from team.
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-medium pl-6">
                                                                Underwriting parameters, GST/ITR assessment models, and business cash-flow ratios are currently being formulated by the risk policy team. You can complete the residential address below and save the customer profile directly.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Current Residence Box */}
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                            <Home className="w-3.5 h-3.5 text-indigo-500" /> Current Residential Address
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={handlePullCurrentAddressFromAadhaar}
                                                            className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/35 active:scale-[0.97] transition-all duration-150 self-start sm:self-auto cursor-pointer select-none"
                                                            title="Autofill current address & pincode from scanned Aadhaar card"
                                                        >
                                                            <span className="w-5 h-5 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                                                                <Fingerprint className="w-3.5 h-3.5 stroke-[2.2]" />
                                                            </span>
                                                            <span className="tracking-tight">Pull Address from Aadhaar</span>
                                                        </button>
                                                    </div>

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
                                                                <span className="text-[10px] text-red-500 font-bold">*Auto-fills District & State</span>
                                                            </label>
                                                            <Input 
                                                                type="text" 
                                                                value={pincode} 
                                                                onChange={(e) => handlePincodeChange(e.target.value)} 
                                                                placeholder="e.g. 781354" 
                                                                maxLength={6} 
                                                                required 
                                                                className="h-10 font-mono" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>City / Town</span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / Town" required className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>District</span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            <Input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" required className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>State</span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            <Input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" required className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Years in Current Residence</label>
                                                            <Input type="text" value={yearsInCurrentResidence} onChange={(e) => setYearsInCurrentResidence(e.target.value)} placeholder="e.g. 5 Years" className="h-10" />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Years in Current City</label>
                                                            <Input type="text" value={yearsInCurrentCity} onChange={(e) => setYearsInCurrentCity(e.target.value)} placeholder="e.g. 10 Years" className="h-10" />
                                                        </div>
                                                    </div>

                                                    {/* Current Address Proof Document Box */}
                                                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                                    <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                                    <span>Proof of Current Address</span>
                                                                </label>
                                                                <p className="text-[11px] text-slate-400">Electricity bill, Rent agreement, Gas connection, Voter ID, Aadhaar, etc.</p>
                                                            </div>
                                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={hasCurrentAddressProof}
                                                                    onChange={(e) => setHasCurrentAddressProof(e.target.checked)}
                                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                                />
                                                                <span>Customer has proof</span>
                                                            </label>
                                                        </div>

                                                        {hasCurrentAddressProof && (
                                                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
                                                                <div className="relative">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,.pdf"
                                                                        id="current-address-proof-file"
                                                                        className="hidden"
                                                                        onChange={handleAddressProofUpload}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        disabled={isUploadingAddressProof}
                                                                        onClick={() => document.getElementById('current-address-proof-file')?.click()}
                                                                        className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-xl font-semibold text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
                                                                    >
                                                                        <span className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                                            {isUploadingAddressProof ? (
                                                                                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                                                            ) : (
                                                                                <FileUp className="w-3.5 h-3.5 stroke-[2.2]" />
                                                                            )}
                                                                        </span>
                                                                        <span>{isUploadingAddressProof ? 'Uploading...' : currentAddressProofUrl ? 'Re-upload Address Proof' : 'Upload Address Proof'}</span>
                                                                    </button>
                                                                </div>

                                                                {currentAddressProofUrl && (
                                                                    <a
                                                                        href={currentAddressProofUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                                    >
                                                                        <FileCheck className="w-3.5 h-3.5" />
                                                                        <span>✓ Proof Uploaded (View Document)</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Permanent Address Box */}
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                            <Home className="w-3.5 h-3.5 text-indigo-500" /> Permanent Address
                                                        </span>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400 select-none mr-2">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isSameAsCurrentAddress} 
                                                                    onChange={(e) => handleSameAddressToggle(e.target.checked)}
                                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                                />
                                                                <span>Same as Current Address</span>
                                                            </label>

                                                            <button
                                                                type="button"
                                                                disabled={isSameAsCurrentAddress}
                                                                onClick={handlePullPermanentAddressFromAadhaar}
                                                                className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/35 active:scale-[0.97] transition-all duration-150 self-start sm:self-auto cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                                                title="Autofill permanent address from scanned Aadhaar card"
                                                            >
                                                                <span className="w-5 h-5 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                                                                    <Fingerprint className="w-3.5 h-3.5 stroke-[2.2]" />
                                                                </span>
                                                                <span className="tracking-tight">Pull Address from Aadhaar</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5 md:col-span-2">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Street Address / House No.</label>
                                                            <Input 
                                                                type="text" 
                                                                value={permanentStreet} 
                                                                disabled={isSameAsCurrentAddress}
                                                                onChange={(e) => {
                                                                    setPermanentStreet(e.target.value);
                                                                    setPermanentAddress(e.target.value);
                                                                }} 
                                                                placeholder="Permanent Street / Village / Locality" 
                                                                className="h-10 disabled:opacity-60 bg-white dark:bg-slate-800" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Pincode</span>
                                                                <span className="text-[10px] text-slate-400 font-normal">Auto-fills District & State</span>
                                                            </label>
                                                            <Input 
                                                                type="text" 
                                                                value={permanentPincode} 
                                                                disabled={isSameAsCurrentAddress}
                                                                onChange={(e) => handlePermanentPincodeChange(e.target.value)} 
                                                                placeholder="e.g. 781354" 
                                                                maxLength={6}
                                                                className="h-10 disabled:opacity-60 font-mono bg-white dark:bg-slate-800" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">City / Town</label>
                                                            <Input 
                                                                type="text" 
                                                                value={permanentCity} 
                                                                disabled={isSameAsCurrentAddress}
                                                                onChange={(e) => setPermanentCity(e.target.value)} 
                                                                placeholder="City / Town" 
                                                                className="h-10 disabled:opacity-60 bg-white dark:bg-slate-800" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">District</label>
                                                            <Input 
                                                                type="text" 
                                                                value={permanentDistrict} 
                                                                disabled={isSameAsCurrentAddress}
                                                                onChange={(e) => setPermanentDistrict(e.target.value)} 
                                                                placeholder="District" 
                                                                className="h-10 disabled:opacity-60 bg-white dark:bg-slate-800" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">State</label>
                                                            <Input 
                                                                type="text" 
                                                                value={permanentState} 
                                                                disabled={isSameAsCurrentAddress}
                                                                onChange={(e) => setPermanentState(e.target.value)} 
                                                                placeholder="State" 
                                                                className="h-10 disabled:opacity-60 bg-white dark:bg-slate-800" 
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
                                                                className="h-10 disabled:opacity-60 bg-white dark:bg-slate-800" 
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Permanent / Alt Mobile No.</label>
                                                            <Input type="tel" value={permanentPhone} onChange={(e) => setPermanentPhone(e.target.value)} placeholder="Alternative Contact Number" className="h-10 bg-white dark:bg-slate-800" />
                                                        </div>
                                                    </div>


                                                </div>

                                            </div>
                                        )}

                                        {/* SECTION 5: Banking Details */}
                                        {activeSectionIndex === 4 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                
                                                {/* Notice for Business Income applicants */}
                                                {incomeCategory === 'business' && (
                                                    <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-800/40 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                                                Business Income Selected: Logic yet to be received from team.
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-medium pl-6">
                                                            Salary account and salary slips are intended for salaried employees. Business banking, GST turnover statements, and ITR schedules underwriting guidelines are pending from the team.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Salary Account Details */}
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                        <Landmark className="w-3.5 h-3.5 text-indigo-500" /> Salary Account Banking Details
                                                    </span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bank Name</label>
                                                            <select
                                                                value={salaryBankName}
                                                                onChange={(e) => setSalaryBankName(e.target.value)}
                                                                className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                            >
                                                                <option value="">Select Bank / Financial Institution...</option>
                                                                {BANK_OPTIONS.map(bank => (
                                                                    <option key={bank} value={bank}>{bank}</option>
                                                                ))}
                                                            </select>
                                                            {salaryBankName === 'Other Bank / NBFC' && (
                                                                <Input
                                                                    type="text"
                                                                    value={customBankName}
                                                                    onChange={(e) => setCustomBankName(e.target.value)}
                                                                    placeholder="Specify Bank or NBFC Name"
                                                                    className="h-10 mt-1.5 bg-white dark:bg-slate-800"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bank Account Number</label>
                                                            <Input type="text" value={salaryAccountNumber} onChange={(e) => setSalaryAccountNumber(e.target.value)} placeholder="Account No." className="h-10 font-mono bg-white dark:bg-slate-800" />
                                                        </div>
                                                    </div>


                                                </div>

                                                {/* Salary Slips Upload (Last 3 Months) */}
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2.5">
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                                                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                                                                Last 3 Months Salary Slips / Statement
                                                            </span>
                                                            <p className="text-[11px] text-slate-400">Upload slips to auto-extract Net Salary via OCR scanner</p>
                                                        </div>

                                                        {/* Mode Switcher */}
                                                        <div className="inline-flex rounded-lg p-0.5 bg-slate-200/70 dark:bg-slate-700/70 self-start sm:self-auto">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSalarySlipMode('individual')}
                                                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                                                    salarySlipMode === 'individual'
                                                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                3 Separate Slips
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSalarySlipMode('combined')}
                                                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                                                    salarySlipMode === 'combined'
                                                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                1 Combined Statement
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {salarySlipMode === 'individual' ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            {salarySlips.map((slip, idx) => (
                                                                <div key={slip.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Slip #{idx + 1}</span>
                                                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{slip.monthYear}</span>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-medium text-slate-500 uppercase">Month & Year</label>
                                                                        <Input
                                                                            type="text"
                                                                            value={slip.monthYear}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setSalarySlips(prev => prev.map((s, i) => i === idx ? { ...s, monthYear: val } : s));
                                                                            }}
                                                                            placeholder={`e.g. Month ${idx + 1}`}
                                                                            className="h-8 text-xs bg-slate-50 dark:bg-slate-800"
                                                                        />
                                                                    </div>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*,.pdf"
                                                                            id={`salary-slip-${idx}`}
                                                                            className="hidden"
                                                                            onChange={(e) => handleSalarySlipUpload(idx, e)}
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="secondary"
                                                                            onClick={() => document.getElementById(`salary-slip-${idx}`)?.click()}
                                                                            className="w-full h-8 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                                                                        >
                                                                            <Paperclip className="w-3.5 h-3.5" />
                                                                            <span className="truncate">{slip.file ? slip.file.name : (slip.fileUrl ? 'Change Slip' : 'Upload Slip')}</span>
                                                                        </Button>
                                                                    </div>
                                                                    {(slip.file || slip.fileUrl) && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={slip.isScanning || !slip.file}
                                                                            onClick={() => handleScanSalarySlip(idx)}
                                                                            className="group w-full h-8 px-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer select-none"
                                                                        >
                                                                            <span className="w-4.5 h-4.5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                                                                                {slip.isScanning ? (
                                                                                    <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
                                                                                ) : (
                                                                                    <Sparkles className="w-2.5 h-2.5 fill-white/20" />
                                                                                )}
                                                                            </span>
                                                                            <span>{slip.isScanning ? 'Scanning...' : 'Scan with OCR'}</span>
                                                                        </button>
                                                                    )}
                                                                    {slip.detectedSalary && (
                                                                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-[10px] space-y-1">
                                                                            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                                                                                <span>Detected:</span>
                                                                                <span>₹{slip.detectedSalary.toLocaleString('en-IN')}</span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setMonthlySalary(String(slip.detectedSalary))}
                                                                                className="w-full text-center py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
                                                                            >
                                                                                Apply to Step 6 Income
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                                <div className="space-y-1 flex-1">
                                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Statement Description</label>
                                                                    <Input
                                                                        type="text"
                                                                        value={combinedSlip.monthYear}
                                                                        onChange={(e) => setCombinedSlip(prev => ({ ...prev, monthYear: e.target.value }))}
                                                                        placeholder="e.g. Last 3 Months Combined Statement"
                                                                        className="h-9 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2 pt-2 sm:pt-4">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,.pdf"
                                                                        id="combined-salary-statement"
                                                                        className="hidden"
                                                                        onChange={handleCombinedSlipUpload}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => document.getElementById('combined-salary-statement')?.click()}
                                                                        className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-xl font-semibold text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer select-none"
                                                                    >
                                                                        <span className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                                            <UploadCloud className="w-3.5 h-3.5 stroke-[2.2]" />
                                                                        </span>
                                                                        <span className="truncate max-w-[180px]">{combinedSlip.file ? combinedSlip.file.name : (combinedSlip.fileUrl ? 'Change Statement' : 'Upload Combined Statement')}</span>
                                                                    </button>
                                                                    {combinedSlip.file && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={combinedSlip.isScanning}
                                                                            onClick={handleScanCombinedSlip}
                                                                            className="group inline-flex items-center gap-2 h-9 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/25 active:scale-[0.97] transition-all cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none"
                                                                        >
                                                                            <span className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                                                {combinedSlip.isScanning ? (
                                                                                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                                                                                ) : (
                                                                                    <Sparkles className="w-3 h-3 fill-white/20" />
                                                                                )}
                                                                            </span>
                                                                            <span>{combinedSlip.isScanning ? 'Scanning...' : 'Scan with OCR'}</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {combinedSlip.detectedSalary && (
                                                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                                                                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                                                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                                                        <span>Detected Net Salary: ₹{combinedSlip.detectedSalary.toLocaleString('en-IN')}</span>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => setMonthlySalary(String(combinedSlip.detectedSalary))}
                                                                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                                                    >
                                                                        Apply to Step 6 Income
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
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

                                                {/* Sourcing Consultant Dropdown */}
                                                <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span>Consultant / Sourcing Partner</span>
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-normal">Optional / Walk-in</span>
                                                    </label>
                                                    <select
                                                        value={consultantName}
                                                        onChange={(e) => setConsultantName(e.target.value)}
                                                        className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
                                                    >
                                                        <option value="">Direct / Walk-in (No Consultant)</option>
                                                        {branchConsultants.length > 0 && (
                                                            <optgroup label={`${entryLocation || 'Branch'} Connectors (${branchConsultants.length})`}>
                                                                {branchConsultants.map(c => (
                                                                    <option key={c.name} value={c.name}>
                                                                        {c.name}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                                                        <span>Showing connectors for <strong className="text-slate-600 dark:text-slate-300 font-medium">{entryLocation}</strong></span>
                                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">{branchConsultants.length} available</span>
                                                    </div>
                                                </div>

                                                {/* Reporting Branch Manager Dropdown */}
                                                <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span>Branch Manager / Reporting Manager</span>
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                    </label>
                                                    <select
                                                        value={managerName}
                                                        onChange={(e) => setManagerName(e.target.value)}
                                                        className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
                                                    >
                                                        <option value="">Select Manager...</option>
                                                        {managerOptions.map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Channel Partner & Tracking Governance */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>Channel Partner Bank</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                        </label>
                                                        <select
                                                            value={channelPartner}
                                                            onChange={(e) => setChannelPartner(e.target.value)}
                                                            className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
                                                        >
                                                            <option value="">Select Channel Partner Bank / NBFC...</option>
                                                            {availableChannelPartners.map(cp => (
                                                                <option key={cp} value={cp}>{cp}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>Tracking / File Number</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                        </label>
                                                        <Input
                                                            type="text"
                                                            value={trackingNumber}
                                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                                            placeholder="e.g. LAN12345678, Lead ID"
                                                            className="h-11 bg-white dark:bg-slate-800 font-mono"
                                                        />
                                                    </div>
                                                </div>

                                            </div>
                                        )}

                                        {/* SECTION 6: Loan Eligibility Calculator */}
                                        {activeSectionIndex === 5 && (
                                            <div className="space-y-6 animate-in fade-in duration-300">
                                                
                                                {/* Notice for Business Income applicants */}
                                                {incomeCategory === 'business' && (
                                                    <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-800/40 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                                                Business Income Selected: Logic yet to be received from team.
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-medium pl-6">
                                                            This eligibility matrix is currently calibrated for Salaried applicants. Business turnover, ITR assessment, and company multiplier formulas are pending from the credit risk team.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Top 2-Column Responsive Layout: Inputs & Evaluation Bento */}
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                                    
                                                    {/* LEFT COLUMN: Inputs & Parameters (7 Cols) */}
                                                    <div className="lg:col-span-7 space-y-4">
                                                        
                                                        {/* 1. Monthly Salary Input */}
                                                        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-2">
                                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                                                                    Net Monthly In-Hand Salary
                                                                </span>
                                                                <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                            </label>
                                                            
                                                            <div className="relative">
                                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</span>
                                                                <NumericFormat 
                                                                    customInput={Input}
                                                                    value={monthlySalary}
                                                                    onValueChange={(values) => setMonthlySalary(values.value || '')}
                                                                    thousandSeparator=","
                                                                    thousandsGroupStyle="lakh"
                                                                    placeholder="e.g. 1,00,000"
                                                                    required
                                                                    className="h-12 pl-8 text-base font-bold text-slate-900 dark:text-white bg-white/90 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 font-mono"
                                                                />
                                                            </div>
                                                            
                                                            {/* Quick Income Presets */}
                                                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                                <span className="text-[10px] text-slate-400 font-medium">Quick presets:</span>
                                                                {[35000, 50000, 75000, 100000, 150000].map(amt => (
                                                                    <button
                                                                        key={amt}
                                                                        type="button"
                                                                        onClick={() => setMonthlySalary(String(amt))}
                                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                                                                            Number(monthlySalary) === amt 
                                                                                ? 'bg-indigo-600 text-white' 
                                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
                                                                        }`}
                                                                    >
                                                                        {amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 2. Profile Classification Matrix Drivers */}
                                                        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-3">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                                                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                                                Risk & Profile Classification
                                                            </span>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {/* Employer Category */}
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                        Employer Category
                                                                    </label>
                                                                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEmployerCategory('A/B/G')}
                                                                            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                                                                                employerCategory === 'A/B/G'
                                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                            }`}
                                                                        >
                                                                            Tier A / B / Govt
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEmployerCategory('C1000/C')}
                                                                            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                                                                                employerCategory === 'C1000/C'
                                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                            }`}
                                                                        >
                                                                            Tier C / 1000 Co.
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* House */}
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                        House
                                                                    </label>
                                                                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setCustomOwnsHome(true)}
                                                                            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                                                                                eligibilityResults.effectiveOwnsHome
                                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                            }`}
                                                                        >
                                                                            Owned
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setCustomOwnsHome(false)}
                                                                            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                                                                                !eligibilityResults.effectiveOwnsHome
                                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                            }`}
                                                                        >
                                                                            Rented
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Bureau HL / LAP */}
                                                                <div className="space-y-1.5 sm:col-span-2">
                                                                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                        Active Home Loan or LAP TradeLine on Bureau?
                                                                    </label>
                                                                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setHasBureauHlLap(false)}
                                                                            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                                                                                !hasBureauHlLap
                                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                            }`}
                                                                        >
                                                                            No Mortgage (HL/LAP: No)
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setHasBureauHlLap(true)}
                                                                            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                                                                                hasBureauHlLap
                                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                            }`}
                                                                        >
                                                                            Has HL / LAP (TradeLine: Yes)
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 3. Bank Loan & Multiplier Parameters */}
                                                        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-3">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                                                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                                                Bank Terms & Eligibility Controls
                                                            </span>

                                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                                {/* FOIR (%) Manual Field */}
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-between">
                                                                        <span>FOIR (%)</span>
                                                                        {manualFoirPercent === '' && (
                                                                            <span className="text-[9px] text-indigo-500 font-normal">Auto</span>
                                                                        )}
                                                                    </label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            max="100"
                                                                            step="1"
                                                                            value={manualFoirPercent !== '' ? manualFoirPercent : Math.round(eligibilityResults.matrixFoir * 100)}
                                                                            onChange={(e) => setManualFoirPercent(e.target.value)}
                                                                            placeholder="e.g. 65"
                                                                            className="h-10 text-xs font-mono font-bold bg-white dark:bg-slate-900 pr-6"
                                                                        />
                                                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                                                                    </div>
                                                                </div>

                                                                {/* Multiplier Manual Field */}
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Multiplier</label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            max="100"
                                                                            step="1"
                                                                            value={bankMultiplier}
                                                                            onChange={(e) => setBankMultiplier(parseInt(e.target.value, 10) || 0)}
                                                                            placeholder="e.g. 24"
                                                                            className="h-10 text-xs font-mono font-bold bg-white dark:bg-slate-900 pr-6"
                                                                        />
                                                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">x</span>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Rate (% p.a.)</label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        value={interestRateAnnual}
                                                                        onChange={(e) => setInterestRateAnnual(parseFloat(e.target.value) || 0)}
                                                                        className="h-10 text-xs font-mono font-bold bg-white dark:bg-slate-900"
                                                                    />
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Tenure (Mos)</label>
                                                                    <Input
                                                                        type="number"
                                                                        value={calcTenureMonths}
                                                                        onChange={(e) => setCalcTenureMonths(parseInt(e.target.value, 10) || 0)}
                                                                        className="h-10 text-xs font-mono font-bold bg-white dark:bg-slate-900"
                                                                    />
                                                                </div>

                                                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Max Cap (₹)</label>
                                                                    <NumericFormat
                                                                        customInput={Input}
                                                                        value={absoluteMaxCap}
                                                                        onValueChange={(v) => setAbsoluteMaxCap(Number(v.value) || 0)}
                                                                        thousandSeparator=","
                                                                        thousandsGroupStyle="lakh"
                                                                        className="h-10 text-xs font-mono font-bold bg-white dark:bg-slate-900"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>

                                                    {/* RIGHT COLUMN: Live Calculation Results Bento (5 Cols) */}
                                                    <div className="lg:col-span-5 space-y-4">
                                                        
                                                        {/* 1. HERO SANCTION CARD */}
                                                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden space-y-4">
                                                            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                                            
                                                            <div className="flex items-center justify-between relative z-10">
                                                                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
                                                                    Maximum Sanction
                                                                </span>
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                                                                    MIN(FOIR, Multiplier)
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1 relative z-10">
                                                                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white block">
                                                                    {formatInr(eligibilityResults.grossEligibleLoan)}
                                                                </span>
                                                                <div className="flex items-center justify-between text-xs text-indigo-100/90 pt-1">
                                                                    <span>Estimated Monthly EMI:</span>
                                                                    <span className="font-mono font-bold text-white text-sm">
                                                                        {formatInr(eligibilityResults.estimatedEmi)} / mo
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Net Cash Disbursement Section */}
                                                            <div className="pt-3 border-t border-white/15 relative z-10 space-y-1.5">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-indigo-200 font-medium">Net Cash-in-Hand (Top-Up):</span>
                                                                    <span className="font-mono font-bold text-emerald-300 text-sm">
                                                                        {formatInr(Math.max(0, eligibilityResults.netCashTopUp))}
                                                                    </span>
                                                                </div>
                                                                {eligibilityResults.totalBtPayoff > 0 && (
                                                                    <p className="text-[10px] text-indigo-200/70 font-mono">
                                                                        = Sanction ({formatInr(eligibilityResults.grossEligibleLoan)}) - BT Payoff ({formatInr(eligibilityResults.totalBtPayoff)})
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* BT Deficit Alert (if BT > Max Sanction) */}
                                                        {eligibilityResults.isBtDeficit && (
                                                            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 shadow-sm">
                                                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                                <div>
                                                                    <span className="font-bold block">BT Outstanding Exceeds Eligibility!</span>
                                                                    <span className="text-[11px] text-red-600 dark:text-red-400">
                                                                        Total BT payoff ({formatInr(eligibilityResults.totalBtPayoff)}) is greater than the gross approval ({formatInr(eligibilityResults.grossEligibleLoan)}). Net disbursement is negative.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 2. FOIR Capacity vs Multiplier Breakdown Bento */}
                                                        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-3">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Dual-Engine Evaluation</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">Whichever is Lower</span>
                                                            </span>

                                                            <div className="space-y-2.5">
                                                                {/* FOIR Principal Card */}
                                                                <div className={`p-3 rounded-xl border transition-all ${
                                                                    eligibilityResults.grossEligibleLoan === eligibilityResults.maxLoanFoir 
                                                                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' 
                                                                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800'
                                                                }`}>
                                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                                        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                                            <Percent className="w-3.5 h-3.5 text-indigo-500" />
                                                                            1. FOIR Capacity (PV Loan)
                                                                        </span>
                                                                        {eligibilityResults.grossEligibleLoan === eligibilityResults.maxLoanFoir && (
                                                                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">Governing</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-baseline justify-between">
                                                                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                                                            {formatInr(eligibilityResults.maxLoanFoir)}
                                                                        </span>
                                                                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                                            Allowed EMI: {formatInr(eligibilityResults.maxAllowedEmi)}/mo
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                                                                        <span>FOIR: {(eligibilityResults.foirPercent * 100).toFixed(0)}%{manualFoirPercent !== '' ? ' (Manual)' : ` (Key: ${eligibilityResults.profileKey})`}</span>
                                                                        <span>Rate: {interestRateAnnual}% • {calcTenureMonths}m</span>
                                                                    </div>
                                                                </div>

                                                                {/* Multiplier Principal Card */}
                                                                <div className={`p-3 rounded-xl border transition-all ${
                                                                    eligibilityResults.grossEligibleLoan === eligibilityResults.maxLoanMultiplier && eligibilityResults.maxLoanMultiplier < eligibilityResults.maxLoanFoir
                                                                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' 
                                                                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800'
                                                                }`}>
                                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                                        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                                            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                                                            2. Bank Multiplier Capacity
                                                                        </span>
                                                                        {eligibilityResults.grossEligibleLoan === eligibilityResults.maxLoanMultiplier && eligibilityResults.maxLoanMultiplier < eligibilityResults.maxLoanFoir && (
                                                                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">Governing</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-baseline justify-between">
                                                                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                                                            {formatInr(eligibilityResults.maxLoanMultiplier)}
                                                                        </span>
                                                                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                                            Cap: {formatInr(absoluteMaxCap)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                                                                        <span>{bankMultiplier}x of Salary ({formatInr(eligibilityResults.salary)})</span>
                                                                        <span>Capped at {formatInr(absoluteMaxCap)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>

                                                </div>

                                                {/* FULL-WIDTH CARD: Existing Obligations & Balance Transfer (BT) */}
                                                <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="w-4 h-4 text-indigo-500" />
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                                                Existing Obligations & Balance Transfer (BT)
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleAddLoan}
                                                            className="group inline-flex items-center gap-2 h-8.5 px-3.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/35 active:scale-[0.97] transition-all cursor-pointer select-none"
                                                        >
                                                            <span className="w-4.5 h-4.5 rounded-md bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                                <Plus className="w-3 h-3 stroke-[2.5]" />
                                                            </span>
                                                            <span>Add Loan / Obligation</span>
                                                        </button>
                                                    </div>

                                                    {existingLoans.length === 0 ? (
                                                        <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1 bg-slate-50/50 dark:bg-slate-900/30">
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No existing loans or liabilities recorded.</p>
                                                            <p className="text-[10px] text-slate-400">Customer has full disposable FOIR capacity (0 continuing EMIs).</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {existingLoans.map((loan) => (
                                                                <div 
                                                                    key={loan.id} 
                                                                    className={`p-3.5 rounded-xl border transition-all ${
                                                                        loan.is_balance_transfer 
                                                                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50' 
                                                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/60'
                                                                    }`}
                                                                >
                                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                                                        <div className="md:col-span-3">
                                                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Obligation Type</label>
                                                                            <select
                                                                                value={loan.loan_type || 'Personal Loan (BT Possible)'}
                                                                                onChange={(e) => handleUpdateLoan(loan.id, 'loan_type', e.target.value)}
                                                                                className="w-full h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                                            >
                                                                                {OBLIGATION_TYPES.map(t => (
                                                                                    <option key={t} value={t}>{t}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div className="md:col-span-3">
                                                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Financer / Bank</label>
                                                                            <Input
                                                                                type="text"
                                                                                value={loan.name}
                                                                                onChange={(e) => handleUpdateLoan(loan.id, 'name', e.target.value)}
                                                                                placeholder="Financer / Name (e.g. HDFC)"
                                                                                className="h-9 text-xs bg-white dark:bg-slate-800"
                                                                            />
                                                                        </div>
                                                                        <div className="md:col-span-3">
                                                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">EMI Amount</label>
                                                                            <div className="relative">
                                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                                                                <NumericFormat
                                                                                    customInput={Input}
                                                                                    value={loan.emi_amount}
                                                                                    onValueChange={(v) => handleUpdateLoan(loan.id, 'emi_amount', v.value || '')}
                                                                                    thousandSeparator=","
                                                                                    thousandsGroupStyle="lakh"
                                                                                    placeholder="EMI / mo"
                                                                                    className="h-9 pl-6 text-xs font-mono font-medium bg-white dark:bg-slate-800"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="md:col-span-2">
                                                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Principal O/S</label>
                                                                            <div className="relative">
                                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                                                                <NumericFormat
                                                                                    customInput={Input}
                                                                                    value={loan.outstanding_principal}
                                                                                    onValueChange={(v) => handleUpdateLoan(loan.id, 'outstanding_principal', v.value || '')}
                                                                                    thousandSeparator=","
                                                                                    thousandsGroupStyle="lakh"
                                                                                    placeholder="Principal O/S"
                                                                                    className="h-9 pl-6 text-xs font-mono font-medium bg-white dark:bg-slate-800"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="md:col-span-1 flex items-end justify-end md:justify-center pt-2 md:pt-4">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveLoan(loan.id)}
                                                                                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                                                title="Delete loan"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Balance Transfer Toggle */}
                                                                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs">
                                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={loan.is_balance_transfer}
                                                                                onChange={(e) => handleUpdateLoan(loan.id, 'is_balance_transfer', e.target.checked)}
                                                                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
                                                                            />
                                                                            <span className={`font-semibold ${loan.is_balance_transfer ? 'text-amber-800 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                                Balance Transfer (BT)
                                                                            </span>
                                                                            {loan.loan_type?.includes('Personal Loan') && (
                                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium">
                                                                                    BT Eligible
                                                                                </span>
                                                                            )}
                                                                        </label>
                                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                                            {loan.is_balance_transfer ? '✓ EMI Waived from FOIR' : 'Counts toward FOIR'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Obligations Totals */}
                                                    {existingLoans.length > 0 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                                                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                                                <span className="text-xs uppercase font-semibold text-slate-400">Total Continuing EMIs</span>
                                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                                    {formatInr(eligibilityResults.continuingEmis)} / mo
                                                                </span>
                                                            </div>
                                                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
                                                                <span className="text-xs uppercase font-semibold text-amber-700 dark:text-amber-400">Total BT Payoff</span>
                                                                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 text-sm">
                                                                    {formatInr(eligibilityResults.totalBtPayoff)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* BOTTOM AUDIT TRAIL: Formula Breakdown & Audit Trail */}
                                                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                                                            Formula Breakdown & Audit Trail
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">Real-time Calculation Audit</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                                                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gross Monthly Capacity ({((eligibilityResults.foirPercent || 0) * 100).toFixed(0)}%)</span>
                                                            <span className="font-mono text-slate-800 dark:text-slate-200 font-bold text-sm mt-0.5 block">{formatInr(eligibilityResults.totalGrossFoirEmi)}</span>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                                                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Less Continuing EMIs</span>
                                                            <span className="font-mono text-red-500 font-bold text-sm mt-0.5 block">-{formatInr(eligibilityResults.continuingEmis)}</span>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800">
                                                            <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 block">Max Allowed EMI (New Loan)</span>
                                                            <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold text-sm mt-0.5 block">{formatInr(eligibilityResults.maxAllowedEmi)}</span>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800">
                                                            <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-400 block">Balance Transfer Deducted</span>
                                                            <span className="font-mono text-amber-700 dark:text-amber-300 font-bold text-sm mt-0.5 block">{formatInr(eligibilityResults.totalBtPayoff)}</span>
                                                        </div>
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

                                                    {/* Channel Partner - Optional */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>Channel Partner</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                        </label>
                                                        <select
                                                            value={channelPartner}
                                                            onChange={(e) => setChannelPartner(e.target.value)}
                                                            className="w-full h-11 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium cursor-pointer shadow-xs"
                                                        >
                                                            <option value="">Select Channel Partner Bank / NBFC...</option>
                                                            {availableChannelPartners.map(cp => (
                                                                <option key={cp} value={cp}>{cp}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Tracking Number - Optional */}
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>Tracking Number</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                        </label>
                                                        <Input
                                                            type="text"
                                                            value={trackingNumber}
                                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                                            placeholder="e.g. Lead / Application Number"
                                                            className="h-11 bg-white/70 dark:bg-slate-800/70 font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STANDARD / FOREX SECTION 2: Address */}
                                        {activeSectionIndex === 1 && (
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span>Street Address / House No.</span>
                                                        <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                    </label>
                                                    <Input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House No, Road, Locality" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>Pincode</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder="e.g. 795001" maxLength={6} required className="h-11 font-mono bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>City</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / Town" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>District</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                            <span>State</span>
                                                            <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                                        </label>
                                                        <Input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" required className="h-11 bg-white/70 dark:bg-slate-800/70" />
                                                    </div>
                                                </div>

                                                {/* For Forex: include Staff Signature, Sourcing Partner and Manager */}
                                                {isForex && (
                                                    <>
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

                                                        {/* Sourcing Consultant Dropdown (Forex) */}
                                                        <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span className="flex items-center gap-1.5">
                                                                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                                    <span>Consultant / Sourcing Partner</span>
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-normal">Optional / Walk-in</span>
                                                            </label>
                                                            <select
                                                                value={consultantName}
                                                                onChange={(e) => setConsultantName(e.target.value)}
                                                                className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
                                                            >
                                                                <option value="">Direct / Walk-in (No Consultant)</option>
                                                                {branchConsultants.length > 0 && (
                                                                    <optgroup label={`${entryLocation || 'Branch'} Connectors (${branchConsultants.length})`}>
                                                                        {branchConsultants.map(c => (
                                                                            <option key={c.name} value={c.name}>
                                                                                {c.name}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                )}
                                                            </select>
                                                            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                                                                <span>Showing connectors for <strong className="text-slate-600 dark:text-slate-300 font-medium">{entryLocation}</strong></span>
                                                                <span className="font-medium text-indigo-600 dark:text-indigo-400">{branchConsultants.length} available</span>
                                                            </div>
                                                        </div>

                                                        {/* Reporting Branch Manager Dropdown (Forex) */}
                                                        <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                                <span className="flex items-center gap-1.5">
                                                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                                    <span>Branch Manager / Reporting Manager</span>
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                            </label>
                                                            <select
                                                                value={managerName}
                                                                onChange={(e) => setManagerName(e.target.value)}
                                                                className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
                                                            >
                                                                <option value="">Select Manager...</option>
                                                                {managerOptions.map(m => (
                                                                    <option key={m} value={m}>{m}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* STANDARD SECTION 3: Income & Author (Excluded for Forex) */}
                                        {!isForex && activeSectionIndex === 2 && (
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

                                                {/* Sourcing Consultant Dropdown (Standard) */}
                                                <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span>Consultant / Sourcing Partner</span>
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-normal">Optional / Walk-in</span>
                                                    </label>
                                                    <select
                                                        value={consultantName}
                                                        onChange={(e) => setConsultantName(e.target.value)}
                                                        className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
                                                    >
                                                        <option value="">Direct / Walk-in (No Consultant)</option>
                                                        {branchConsultants.length > 0 && (
                                                            <optgroup label={`${entryLocation || 'Branch'} Connectors (${branchConsultants.length})`}>
                                                                {branchConsultants.map(c => (
                                                                    <option key={c.name} value={c.name}>
                                                                        {c.name}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                                                        <span>Showing connectors for <strong className="text-slate-600 dark:text-slate-300 font-medium">{entryLocation}</strong></span>
                                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">{branchConsultants.length} available</span>
                                                    </div>
                                                </div>

                                                {/* Reporting Branch Manager Dropdown (Standard) */}
                                                <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span>Branch Manager / Reporting Manager</span>
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                                                    </label>
                                                    <select
                                                        value={managerName}
                                                        onChange={(e) => setManagerName(e.target.value)}
                                                        className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
                                                    >
                                                        <option value="">Select Manager...</option>
                                                        {managerOptions.map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
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

                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Option to Save & Submit early after Step 4 or Step 5 for Loan customers */}
                                        {isLoan && (activeSectionIndex === 3 || activeSectionIndex === 4) && (
                                            <button
                                                type="button"
                                                disabled={isLoading}
                                                onClick={handleDirectSaveCustomer}
                                                className="group inline-flex items-center gap-2 h-11 px-4 sm:px-5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 active:scale-[0.97] transition-all duration-150 cursor-pointer select-none disabled:opacity-50"
                                                title="Save customer profile now and record reason for skipping remaining steps"
                                            >
                                                <span className="w-5 h-5 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-all duration-200">
                                                    <UserCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                                                </span>
                                                <span className="tracking-tight">Save New Customer Profile</span>
                                            </button>
                                        )}

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

                            </div>
                        )}
                        
                    </form>
                )}

                {/* KYC Discrepancy & Deviation Modal */}
                <KycDeviationDialog
                    isOpen={isDeviationDialogOpen}
                    onClose={() => setIsDeviationDialogOpen(false)}
                    deviations={deviations}
                    onApplyCorrection={handleApplyCorrection}
                    onApplyAllAadhaar={handleApplyAllAadhaar}
                    onApplyAllPan={handleApplyAllPan}
                    onConfirmAndProceed={() => {
                        setIsDeviationDialogOpen(false);
                    }}
                    hasAadhaarData={Boolean(scannedAadhaar?.fullName || scannedAadhaar?.dob || scannedAadhaar?.idNumber)}
                    hasPanData={Boolean(scannedPan?.fullName || scannedPan?.dob || scannedPan?.idNumber)}
                />

                {/* Skip Loan Eligibility Confirmation & Remarks Modal */}
                {isEarlySaveModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                            
                            {/* Alert Header */}
                            <div className="flex items-start gap-3.5 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                    <AlertCircle className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {incomeCategory === 'business' ? 'Save Business Customer Profile?' : 'Skip Loan Eligibility Calculation?'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        {incomeCategory === 'business'
                                            ? 'Business income underwriting logic is yet to be received from the team. Step 5 & 6 are bypassed. Please record remarks to register this profile.'
                                            : 'You are saving this loan applicant at Step 4. Step 5 (Banking Details) and Step 6 (Eligibility & FOIR Engine) will be skipped. Please record your reason below.'}
                                    </p>
                                </div>
                            </div>

                            {/* Remarks / Reason for Skipping Field */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between">
                                    <span>Reason for Skipping Eligibility</span>
                                    <span className="text-[10px] text-red-500 font-bold">*Mandatory Remarks</span>
                                </label>
                                <textarea
                                    value={eligibilitySkipReason}
                                    onChange={(e) => setEligibilitySkipReason(e.target.value)}
                                    placeholder="Please specify why eligibility was not calculated (e.g. preliminary KYC onboarding only, offline banking approval underway, applicant will provide salary slips/ITR next week)..."
                                    rows={3}
                                    required
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-medium placeholder:font-normal placeholder:text-slate-400 leading-relaxed"
                                />
                            </div>

                            {/* Staff Member (Data Enterer) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between">
                                    <span>Your Name (Data Enterer)</span>
                                    <span className="text-[10px] text-red-500 font-bold">*Mandatory</span>
                                </label>
                                <select
                                    value={entryPersonName}
                                    onChange={(e) => setEntryPersonName(e.target.value)}
                                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="">Select your name...</option>
                                    {employees.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons with Theme Styling */}
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsEarlySaveModalOpen(false)}
                                    className="w-full sm:w-auto h-10 px-4 rounded-xl text-xs font-semibold"
                                >
                                    Cancel & Continue Form
                                </Button>
                                <button
                                    type="button"
                                    disabled={!entryPersonName || !eligibilitySkipReason.trim() || isLoading}
                                    onClick={() => executeCustomerSave(entryPersonName, eligibilitySkipReason.trim())}
                                    className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-sm shadow-amber-600/25 active:scale-[0.97] transition-all cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <span>Confirm & Save Profile</span>
                                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </LiquidGlassCard>
        </div>
    );
}
