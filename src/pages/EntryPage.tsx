import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardContent, CardHeader, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { UploadCloud, FileSpreadsheet, Loader2, Save, LogOut, CheckCircle2, Trash2, IndianRupee, Layers, Tag, Network, AlertTriangle, X, AlertCircle, Download, Calendar, ChevronDown, Search, Filter, Check } from 'lucide-react';
import { useDataStore, EntryItem } from '@/store/useDataStore';
import * as XLSX from 'xlsx';
import { NumericFormat } from 'react-number-format';
import { ThemeSelect, SelectOption } from '../components/ThemeSelect';
import { BranchSelect } from '@/components/BranchSelect';
import { AppSelect } from '@/components/AppSelect';
import { ExecutivePerformanceWidget } from '@/components/ExecutivePerformanceWidget';
import { StaffNameResolutionDialog } from '@/components/StaffNameResolutionDialog';
import { ColumnMappingDialog, ColumnMapping } from '@/components/ColumnMappingDialog';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { MonthPicker } from '@/components/ui/month-picker';

function InlineDatePicker({ value, onChange, disabled, className, min }: any) {
    const [displayVal, setDisplayVal] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    
    useEffect(() => {
        if (!value) {
            setDisplayVal('');
            return;
        }
        const parts = value.split('-');
        if (parts.length === 3) {
            setDisplayVal(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
            setDisplayVal(value);
        }
    }, [value]);

    const handleTextChange = (e: any) => {
        const newVal = e.target.value;
        setDisplayVal(newVal);
        const match = newVal.trim().match(/^(\d{1,2})[-\/.\s](\d{1,2})[-\/.\s](\d{4})$/);
        if (match) {
            const d = match[1].padStart(2, '0');
            const m = match[2].padStart(2, '0');
            const y = match[3];
            onChange(`${y}-${m}-${d}`);
        } else if (newVal === '') {
            onChange('');
        }
    };

    return (
        <div className="relative flex items-center w-full h-full">
            <Input 
                disabled={disabled}
                value={displayVal}
                onChange={handleTextChange}
                placeholder="DD-MM-YYYY"
                className={`pr-8 font-mono ${className || ''}`}
            />
            <button 
                type="button"
                disabled={disabled}
                onClick={() => setShowPicker(true)}
                className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center text-slate-400 hover:text-indigo-500 disabled:opacity-50 transition-colors z-10"
            >
                <Calendar className="w-4 h-4" />
            </button>
            {showPicker && (
                <CustomDatePicker
                    selectedDate={value || new Date().toISOString().split('T')[0]}
                    onChange={(val) => {
                        onChange(val);
                        setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

const generateDailyOptions = () => {
    const options = [];
    const start = new Date(2026, 0, 1);
    const end = new Date();
    let current = new Date(start);
    while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dStr = `${year}-${month}-${day}`;
        const display = current.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        options.push({ id: dStr, name: display });
        current.setDate(current.getDate() + 1);
    }
    const tYear = end.getFullYear();
    const tMonth = String(end.getMonth() + 1).padStart(2, '0');
    const tDay = String(end.getDate()).padStart(2, '0');
    const todayStr = `${tYear}-${tMonth}-${tDay}`;
    if (!options.find(o => o.id === todayStr)) {
        options.push({ id: todayStr, name: end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) });
    }
    return options.reverse();
};

const generateMonthlyOptions = () => {
    const options = [];
    const start = new Date(2026, 0, 1);
    const end = new Date();
    let current = new Date(start);
    current.setDate(1);
    
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const dStr = `${year}-${month}-01`;
        const display = current.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        options.push({ id: dStr, name: display });
        current.setMonth(current.getMonth() + 1);
    }
    return options.reverse();
};

const DAILY_OPTIONS = generateDailyOptions();
const MONTHLY_OPTIONS = generateMonthlyOptions();

export default function DataEntryTerminal() {
  const { user, isInitialized, logout } = useAuthStore();
  const navigate = useNavigate();
  const { products, channels, branches, branchTargets, orgMembers, consultants } = useDataStore();

  const [entryMode, setEntryMode] = useState<'daily'|'monthly'>(
      new Date() >= new Date('2026-01-01T00:00:00Z') ? 'daily' : 'monthly'
  );
  const [dateStr, setDateStr] = useState<string>(() => {
      const today = new Date().toISOString().split('T')[0];
      return today >= '2026-01-01' ? today : '2026-01-01';
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [items, setItems] = useState<EntryItem[]>([]);
  const [smartPrompt, setSmartPrompt] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDate, setTransferDate] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedItems, setStagedItems] = useState<EntryItem[]>([]);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lodgeName, setLodgeName] = useState('');
  const [lodgeEmail, setLodgeEmail] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  // Staff name resolution dialog (bulk upload)
  const [pendingParsed, setPendingParsed] = useState<any[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawJsonData, setRawJsonData] = useState<any[]>([]);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  
  // Projection states
  const [isProjectionLodged, setIsProjectionLodged] = useState(false);
  const [lodgedProjectionAmount, setLodgedProjectionAmount] = useState(0);
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState(false);
  const [projectionInputs, setProjectionInputs] = useState<Record<string, number>>({
      'Personal Loan': 0, 'Business Loan': 0, 'Housing Loan/LAP': 0, 'Life Insurance': 0, 'General Insurance': 0, 'Livlong Loan Protector': 0, 'Mutual Fund/SIP': 0, 'Retail Forex': 0, 'GST filing': 0, 'ITR filing': 0
  });
  const [projectionReason, setProjectionReason] = useState<string>('Business as Usual');
  const [isLodgingProjection, setIsLodgingProjection] = useState(false);
  
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [entryCreatedAt, setEntryCreatedAt] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [branchDetails, setBranchDetails] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [executiveAuditLogs, setExecutiveAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  const fetchExecutiveAuditLogs = async () => {
      try {
          setLoadingAuditLogs(true);
          const { data, error } = await supabase
              .from('upload_audit_logs')
              .select('*')
              .eq('email_id', user?.email || '')
              .order('uploaded_at', { ascending: false });

          if (error) throw error;
          setExecutiveAuditLogs(data || []);
      } catch (err) {
          console.error('Error fetching audit logs:', err);
      } finally {
          setLoadingAuditLogs(false);
      }
  };

  const handleTransferToDaily = async () => {
      if (!currentEntryId || !transferDate) return;
      try {
          setIsTransferring(true);
          const { error } = await supabase
              .from('entries')
              .update({ mode: 'daily', entryDate: transferDate })
              .eq('id', currentEntryId);
              
          if (error) throw error;
          
          setSuccess('Successfully transferred entries to Daily mode');
          setIsTransferModalOpen(false);
          // switch mode and date to view the transferred entries
          setEntryMode('daily');
          setDateStr(transferDate);
          setRefreshTrigger(p => p + 1);
      } catch (e: any) {
          console.error(e);
          setError(e.message || 'Error transferring entries');
      } finally {
          setIsTransferring(false);
      }
  };

  const [showContextModal, setShowContextModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDeleteIndices, setSelectedDeleteIndices] = useState<Set<number>>(new Set());
  
  // Admin Context
  const [adminSelectedBranch, setAdminSelectedBranch] = useState<string>('');
  
  const fetchCache = useRef<Record<string, any>>({});
  const [fetchError, setFetchError] = useState(false);
  
  const [metricCategory, setMetricCategory] = useState<string>('Loan');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredItemsWithIndex = useMemo(() => {
    return items.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Disbursed') {
          if (item.fileStatus !== 'Disbursed' && item.fileStatus !== 'Issued' && item.fileStatus !== 'POLICY ISSUED') return false;
        } else if (item.fileStatus !== statusFilter) {
          return false;
        }
      }
      
      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.customerName?.toLowerCase().includes(q);
        const matchTrack = item.trackingNumber?.toLowerCase().includes(q);
        const matchRM = item.relationshipManagerName?.toLowerCase().includes(q);
        const matchChannel = item.channel?.toLowerCase().includes(q);
        const matchProduct = item.product?.toLowerCase().includes(q);
        const matchStaff = item.staffName?.toLowerCase().includes(q);
        const matchManager = item.managerName?.toLowerCase().includes(q);
        const matchConsultant = item.consultantName?.toLowerCase().includes(q);
        const matchPhone = item.phoneNumber?.toLowerCase().includes(q);
        const matchEmail = item.emailId?.toLowerCase().includes(q);
        const matchAddress = item.customerAddress?.toLowerCase().includes(q);
        const matchFirm = item.firmName?.toLowerCase().includes(q);
        const matchStatus = item.fileStatus?.toLowerCase().includes(q);
        const matchAmount = item.amount?.toString().includes(q);
        const matchSanctioned = item.sanctionedAmount?.toString().includes(q);
        const matchDisbursed = item.disbursedAmount?.toString().includes(q);
        
        return !!(matchName || matchTrack || matchRM || matchChannel || matchProduct || matchStaff || matchManager || matchConsultant || matchPhone || matchEmail || matchAddress || matchFirm || matchStatus || matchAmount || matchSanctioned || matchDisbursed);
      }
      
      return true;
    });
  }, [items, searchQuery, statusFilter]);

  // 60-day deletion window from entry creation date
  const daysSinceCreation = entryCreatedAt
    ? Math.floor((Date.now() - new Date(entryCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const allowDeletion = hasExistingEntry && (user?.role === 'admin' || daysSinceCreation < 60);
  const daysRemaining = Math.max(0, 60 - daysSinceCreation);

  const isBackdoor = user?.role === 'admin' || user?.email === 'executive@siroiforex.com';
  const isExecutive = user?.email === 'executive@siroiforex.com';
  const isExecutiveOverride = hasExistingEntry && isExecutive;
  const isMIS = user?.email?.toLowerCase().startsWith('mis.');
  
  // Projection logic
  const currentJsDate = new Date();
  const isSunday = currentJsDate.getDay() === 0;
  const isPastMay1 = currentJsDate >= new Date('2026-05-01T00:00:00');
  const isPast11AM = currentJsDate.getHours() >= 11;
  const isTimeLocked = isPastMay1 && isPast11AM;
  const isProjectionLocked = isSunday || isTimeLocked || isProjectionLodged;
  const isGridBlocked = (entryMode === 'daily' && !isProjectionLodged && user?.role !== 'admin' && !isBackdoor) || (isSunday && !isBackdoor);

  const allowEdit = !hasExistingEntry || daysSinceCreation <= 60;
  const canModify = (allowEdit || isExecutiveOverride) && !isGridBlocked;
  const activeBranchId = isBackdoor ? adminSelectedBranch : user?.branchId;

  // Derive active branch name and scoped staff list for the Staff Name dropdown
  const activeBranchName = branches.find(b => b.id === activeBranchId)?.name ?? '';
  const branchStaff = orgMembers.filter(m => {
      if (!m.branch) return false;
      const mBranch = m.branch.toLowerCase();
      const aBranch = activeBranchName.toLowerCase();
      return mBranch.includes(aBranch) || aBranch.includes(mBranch);
  });

  // Unsaved Guard
  const isDirty = !hasExistingEntry && items.length > 0;

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        setCurrentTime(`${dateStr}, ${timeStr}`);
    }, 1000);
    
    const initialNow = new Date();
    setCurrentTime(`${initialNow.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${initialNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isInitialized && !user) {
      navigate(Capacitor.isNativePlatform() ? '/' : '/login');
    }
    // Auto-select first branch for admin / backdoor
    if (isBackdoor && branches.length > 0 && !adminSelectedBranch) {
       const available = branches.filter(b => b.name !== 'HO' && b.name !== 'Test Branch');
       if (available.length > 0) {
           setAdminSelectedBranch(available[0].id);
       }
    }
  }, [user, isInitialized, navigate, branches, adminSelectedBranch, isBackdoor]);

  // Derived mode
  const isDailyMode = entryMode === 'daily';
  const modeLabel = isDailyMode ? 'Daily Direct Tracking' : 'Monthly Batch Tracking';

  useEffect(() => {
      if (!activeBranchId) return;
      
      const cacheKey = `${activeBranchId}_${dateStr}_${entryMode}`;
      
      const fetchContext = async () => {
          setIsLoadingExisting(true);
          setHasExistingEntry(false);
          setFetchError(false);
          setItems([]); // Clear items immediately when branch changes to prevent stale UI
          
          try {
              // Get branch info
              const b = branches.find(br => br.id === activeBranchId);
              if (b) setBranchDetails(b);
              
              if (fetchCache.current[cacheKey]) {
                  const data = fetchCache.current[cacheKey];
                  if (data.empty) {
                      setHasExistingEntry(false);
                      setItems(data.items || []);
                      setCurrentEntryId(null);
                      setEntryCreatedAt(null);
                  } else {
                      setHasExistingEntry(true);
                      setItems(data.items || []);
                      setCurrentEntryId(data.id);
                      setEntryCreatedAt(data.createdAt || null);
                  }
                  
                  if (data._proj) {
                      setIsProjectionLodged(true);
                      setLodgedProjectionAmount(data._proj.totalAmount || 0);
                      
                      const fetchedInputs = { Loan: 0, Insurance: 0, Forex: 0, Consultancy: 0, Investments: 0 };
                      if (data._proj.items) {
                          data._proj.items.forEach((item: any) => {
                              if (item.category && item.category in fetchedInputs) {
                                  fetchedInputs[item.category as keyof typeof fetchedInputs] = item.projectionAmt || item.amount || 0;
                              }
                          });
                      }
                      setProjectionInputs(fetchedInputs);
                  } else {
                      setIsProjectionLodged(false);
                      setLodgedProjectionAmount(0);
                      setProjectionInputs({ Loan: 0, Insurance: 0, Forex: 0, Consultancy: 0, Investments: 0 });
                  }
                  
                  setIsLoadingExisting(false);
                  return;
              }
              
              const fetchPromise = supabase
                .from('entries')
                .select('*')
                .eq('branchId', activeBranchId)
                .eq('entryDate', dateStr)
                .eq('mode', entryMode)
                ;
                
              const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('TIMEOUT')), 10000)
              );
              
              const { data: snap } = await Promise.race([fetchPromise, timeoutPromise]) as any;
              
              if (snap && snap.length > 0) {
                  const achievementData = snap.find((e: any) => !e.recordType || e.recordType === 'achievement');
                  const projectionData = snap.find((e: any) => e.recordType === 'projection');
                  
                  if (achievementData) {
                      setHasExistingEntry(true);
                      fetchCache.current[cacheKey] = { ...achievementData, _proj: projectionData };
                      setItems(achievementData.items || []);
                      setCurrentEntryId(achievementData.id);
                      setEntryCreatedAt(achievementData.createdAt || null);
                  } else {
                      fetchCache.current[cacheKey] = { empty: true, items: [], _proj: projectionData };
                      setHasExistingEntry(false);
                      setItems([]);
                      setCurrentEntryId(null);
                      setEntryCreatedAt(null);
                  }
                  
                  if (projectionData) {
                      setIsProjectionLodged(true);
                      setLodgedProjectionAmount(projectionData.totalAmount || 0);
                      
                      const fetchedInputs = { Loan: 0, Insurance: 0, Forex: 0, Consultancy: 0, Investments: 0 };
                      if (projectionData.items) {
                          projectionData.items.forEach((item: any) => {
                              if (item.category && item.category in fetchedInputs) {
                                  fetchedInputs[item.category as keyof typeof fetchedInputs] = item.projectionAmt || item.amount || 0;
                              }
                          });
                      }
                      setProjectionInputs(fetchedInputs);
                  } else {
                      setIsProjectionLodged(false);
                      setLodgedProjectionAmount(0);
                      setProjectionInputs({ Loan: 0, Insurance: 0, Forex: 0, Consultancy: 0, Investments: 0 });
                  }
              } else {
                  fetchCache.current[cacheKey] = { empty: true, items: [] };
                  setItems([]);
                  setHasExistingEntry(false);
                  setCurrentEntryId(null);
                  setEntryCreatedAt(null);
                  setIsProjectionLodged(false);
                  setLodgedProjectionAmount(0);
                  setProjectionInputs({ Loan: 0, Insurance: 0, Forex: 0, Consultancy: 0, Investments: 0 });
              }
          } catch (err: any) {
              console.error("Failed to load context", err);
              if (err.message === 'TIMEOUT') {
                  setFetchError(true);
              }
          } finally {
              setIsLoadingExisting(false);
          }
      };
      fetchContext();
  }, [activeBranchId, dateStr, entryMode, branches, refreshTrigger]);

  const processFile = async (file: File) => {
      setIsParsing(true);
      setUploadProgress(0);
      setError('');
      
      try {
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              reader.onprogress = (e) => {
                  if (e.lengthComputable) {
                      setUploadProgress(Math.round((e.loaded / e.total) * 30));
                  }
              };
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = () => reject(reader.error);
              reader.readAsArrayBuffer(file);
          });
          
          setUploadProgress(40);
          await new Promise(resolve => setTimeout(resolve, 50));

          const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
          setUploadProgress(50);
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const _rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });
          
          // Pre-process all dates and strings before filtering
          const rawJson = _rawJson.map((row: any) => {
             const newRow: any = {};
             for (const key in row) {
                 let val = row[key];
                 if (val instanceof Date) {
                     val.setHours(val.getHours() + 12); 
                     val = val.toISOString().split('T')[0];
                 } else if (typeof val === 'string') {
                     const match = val.trim().match(/^(\d{1,2})[-\/.\s](\d{1,2})[-\/.\s](\d{4})$/);
                     if (match) {
                          const d = match[1].padStart(2, '0');
                          const m = match[2].padStart(2, '0');
                          const y = match[3];
                          val = y + '-' + m + '-' + d;
                     }
                 }
                 newRow[key] = val;
             }
             return newRow;
          });

          const json = rawJson.filter((row: any) => {
              return Object.values(row).some(val => {
                  if (val === undefined || val === null) return false;
                  const str = String(val).trim();
                  return str !== "" && str !== "-";
              });
          });
          
          if (json.length === 0) {
              setError("The uploaded file appears to be empty or contains no valid data rows.");
              setIsParsing(false);
              return;
          }

          // Extract headers
          const headers = Array.from(new Set(json.flatMap((row: any) => Object.keys(row || {}))));
          setRawHeaders(headers);
          setRawJsonData(json);
          setStagedFile(file);
          setIsMappingDialogOpen(true);
          setIsParsing(false);
      } catch (e: any) {
          console.error("AI Parse Error:", e);
          setError(`Failed to read file. Error: ${e.message}`);
          setIsParsing(false);
      }
  };

  const handleMappingConfirm = async (mapping: ColumnMapping) => {
      setIsMappingDialogOpen(false);
      setIsParsing(true);
      setUploadProgress(60);

      try {
          // Transform raw data using mapping
          const mappedJson = rawJsonData.map((row: any) => {
              const mappedRow: any = {};
              for (const [sysKey, excelHeader] of Object.entries(mapping)) {
                  if (excelHeader && row[excelHeader] !== undefined) {
                      let val = row[excelHeader];
                      
                      // Handle Excel serial dates natively
                      if ((sysKey === 'date' || sysKey === 'customerDOB' || sysKey === 'disbursedDate' || sysKey === 'emiDate')) {
                          if (typeof val === 'number') {
                              const utc_days = Math.floor(val - 25569);
                              const date_info = new Date(utc_days * 86400 * 1000);
                              val = date_info.toISOString().split('T')[0];
                          } else if (typeof val === 'string') {
                              const str = val.trim();
                              // Check for DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
                              const match = str.match(/^(\d{1,2})[-\/.\s](\d{1,2})[-\/.\s](\d{4})$/);
                              if (match) {
                                  const d = match[1].padStart(2, '0');
                                  const m = match[2].padStart(2, '0');
                                  const y = match[3];
                                  val = `${y}-${m}-${d}`; // YYYY-MM-DD
                              }
                          }
                      }
                      mappedRow[sysKey] = val;
                  }
              }
              // Force projectionAmt to 0 if missing to prevent AI hallucination
              if (mappedRow['projectionAmt'] === undefined || mappedRow['projectionAmt'] === null || mappedRow['projectionAmt'] === '') {
                  mappedRow['projectionAmt'] = 0;
              }
              return mappedRow;
          });

          const prompt = `
            You are a strict data extraction AI. Extract financial entry data from the following JSON representing an uploaded Excel sheet.
            The user has ALREADY mapped the columns perfectly to your expected keys. Just clean the data, format the dates to YYYY-MM-DD, and map the enums correctly.
            Ignore junk rows like headers, footers, totals, or blank lines.
            
            Return ONLY a valid JSON array of objects without markdown formatting.
            Each object MUST represent a valid row and have these EXACT keys:
            - "date": string (Format strictly YYYY-MM-DD). Convert string dates (like dd-mm-yyyy) into valid YYYY-MM-DD format.
            - "staffName": string
            - "customerName": string
            - "category": Must be one of ["Loan", "Insurance", "Forex", "Consultancy", "Investments"].
            - "product": Must be one of: ${products.map((p: any) => p.name).join(', ')}
            - "relationshipManagerName": string
            - "fileLogin": string (e.g. WBO, EXPRESS LINK, ILENS) or empty
            - "trackingNumber": string or empty
            - "channel": Must be one of: ${channels.map((c: any) => c.name).join(', ')}. Or Bajaj Allianz, Aditya Birla, LIC, ICICI Lombard, Niva Bupa, Tata AIG, Manipal Cigna, Star Health, Care Health, SBI, Magma, Galaxy Health, SIROI, Bank of Baroda, Punjab & Sind Bank if Insurance.
            - "branchLocation": Map to Branch name exactly as: ${branches.map((b: any) => b.name).join(', ')}. Use the specific branch for the row.
            - "customerDOB": string
            - "phoneNumber": string
            - "emailId": string
            - "customerAddress": string
            - "firmName": string
            - "amount": number. (This is Login Amount) If missing, return 0.
            - "projectionAmt": number. If missing, return 0. Do NOT duplicate 'amount'.
            - "fileStatus": string. If Insurance: "Issued" or "Not Issued". If Loan/Other: "Login", "Underwriting", "Processing", "Sanctioned", "Disbursed", "Customer Reject", or "Rejected".
            - "sanctionedAmount": number
            - "disbursedAmount": number.
            - "disbursedDate": string
            - "emiDate": string
            - "repaymentBank": string
            - "managerName": string
            - "consultantName": string
            - "consultantEmail": string
            
            Mapped Spreadsheet JSON:
            ${JSON.stringify(mappedJson).substring(0, 50000)} // Limiting to ~50k chars
          `;
          
          let parsed: any[] = [];
          try {
              setUploadProgress(70);
              const { data, error: funcError } = await supabase.functions.invoke('parse-excel', {
                 body: { prompt }
              });
              
              if (funcError) {
                 throw new Error(funcError.message || "Failed to invoke Edge Function");
              }
              if (data?.error) {
                 throw new Error(data.error);
              }
              
              setUploadProgress(90);
              
              const text = data?.text || "[]";
              const _clean = text.replace(new RegExp('```json', 'g'), '').replace(new RegExp('```', 'g'), '').trim();
              parsed = JSON.parse(_clean);
          } catch (aiErr) {
              console.warn("AI parsing failed/timed out, falling back to local mapped parsing:", aiErr);
              parsed = mappedJson;
          }
          
          setUploadProgress(100);

          if (Array.isArray(parsed) && parsed.length > 0) {
              parsed = parsed.map((p: any) => {
                  let prod = p.product || '';
                  if (prod) {
                      const plMatch = prod.match(/^PL\s*(.*)$/i);
                      if (plMatch) {
                          prod = plMatch[1] ? `Personal Loan (${plMatch[1].trim()})` : "Personal Loan";
                      } else {
                          const blMatch = prod.match(/^BL\s*(.*)$/i);
                          if (blMatch) {
                              prod = blMatch[1] ? `Business Loan (${blMatch[1].trim()})` : "Business Loan";
                          }
                      }
                  }
                  let fsVal = p.fileStatus || '';
                  if (fsVal && typeof fsVal === 'string') {
                      fsVal = fsVal.trim().toLowerCase();
                      fsVal = fsVal.charAt(0).toUpperCase() + fsVal.slice(1);
                      if (fsVal === 'Under writing' || fsVal === 'Under-writing' || fsVal === 'Under_writing') fsVal = 'Underwriting';
                  }
                  return { ...p, product: prod, fileStatus: fsVal, isManual: true, projectionAmt: Number(p.projectionAmt) || 0, amount: Number(p.amount) || 0, disbursedAmount: Number(p.disbursedAmount) || 0 };
              });
              setPendingParsed(parsed);
              setIsResolutionDialogOpen(true);
          } else {
              setError("Could not extract valid entries from the file.");
          }
      } catch (e: any) {
          console.error("Parse Error:", e);
          setError(`Failed to process file. Error: ${e.message}`);
      } finally {
          setIsParsing(false);
          setTimeout(() => setUploadProgress(0), 1000);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processFile(file);
      e.target.value = ''; // Reset file input
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (canModify && !isParsing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (!canModify || isParsing) return;

      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      
      await processFile(file);
  };

  const handleAddItem = () => {
      setItems([...items, { 
          date: dateStr, 
          staffName: '', 
          customerName: '', 
          category: 'Loan', 
          product: '', 
          channel: '', 
          amount: 0, 
          status: '', 
          isManual: true, 
          projectionAmt: 0,
          fileLogin: '',
          trackingNumber: '',
          branchLocation: branchDetails?.name || '',
          customerDOB: '',
          phoneNumber: '',
          emailId: '',
          customerAddress: '',
          firmName: '',
          fileStatus: '',
          sanctionedAmount: 0,
          disbursedAmount: 0,
          disbursedDate: '',
          emiDate: '',
          repaymentBank: '',
          managerName: '',
          consultantName: '',
          consultantEmail: ''
      }]);
  };
  
  const handleUpdateItem = (index: number, key: string, val: string | number) => {
      setItems(prevItems => {
          const arr = [...prevItems];
          arr[index] = { ...arr[index], [key]: val };
          
          // Auto-update product if category changes
          if (key === 'category') {
              arr[index].product = ''; // reset
              if (val === 'Insurance') {
                  arr[index].fileStatus = '';
              } else {
                  if (['Issued', 'POLICY ISSUED', 'Not Issued'].includes(arr[index].fileStatus || '')) {
                      arr[index].fileStatus = '';
                  }
              }
              if (val === 'Forex') {
                  arr[index].fileLogin = 'Online';
                  arr[index].channel = 'SIROI';
              }
          }
          
          if (key === 'product') {
              if (arr[index].category === 'Loan' && (val === 'Housing Loan/LAP' || val === 'Mortgage' || val === 'Home Loan')) {
                  arr[index].fileLogin = 'lead force';
                  if (arr[index].channel !== 'Bank of Baroda' && arr[index].channel !== 'Punjab & Sind Bank') {
                      arr[index].channel = '';
                  }
              }
          }
          
          // Automatically update achievement for Insurance
          if (arr[index].category === 'Insurance') {
              if (key === 'fileStatus') {
                  if (val === 'Issued' || val === 'POLICY ISSUED') {
                      arr[index].disbursedAmount = arr[index].amount;
                  } else if (val === 'Not Issued') {
                      arr[index].disbursedAmount = 0;
                  }
              }
              if (key === 'amount' && (arr[index].fileStatus === 'Issued' || arr[index].fileStatus === 'POLICY ISSUED')) {
                  arr[index].disbursedAmount = Number(val) || 0;
              }
          }
          
          return arr;
      });
  };
  
  const handleRemoveItem = (index: number) => {
      setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
      if (isSunday && !isBackdoor) {
          setError("Tracking submission is restricted on Sundays. Enjoy your holiday!");
          return;
      }
      if (!activeBranchId) {
          setError("You do not have a branch assigned yet. Contact Administrator.");
          return;
      }
      
      // 11:00 AM restriction check for Projections (Post May 15, 2026)
      // 11:00 AM restriction check removed due to unified entry logic
      
      if (entryMode === 'monthly') {
          if (user?.role !== 'admin' && !isBackdoor) {
              setError("Branch users cannot lodge data in Monthly mode.");
              return;
          } else {
              const execName = window.prompt("WARNING: The Month tab should be a cumulative sum of the daily records.\n\nPlease enter your name to confirm and lodge this monthly data:");
              if (!execName || !execName.trim()) {
                  setError("Monthly entry cancelled. Name is required.");
                  return;
              }
              // Record in audit log
              supabase.from('upload_audit_logs').insert({
                  filename: 'Manual Monthly Lodge',
                  uploaded_by: execName.trim(),
                  email_id: user?.email,
                  file_url: 'N/A'
              }).then(({error}) => { if (error) console.error("Audit log error:", error); });
          }
      }
      
      if (items.length === 0) {
          setError("Please add at least one line item.");
          return;
      }
      
      for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.staffName || !item.staffName.trim()) {
              setError(`Row ${i + 1} is missing Staff Name. Please fill it before logging.`);
              return;
          }
          if (!item.category) {
              setError(`Row ${i + 1} is missing Category. Please select one before logging.`);
              return;
          }
          if (!item.customerName || !item.customerName.trim()) {
              setError(`Row ${i + 1} is missing Customer Name. Please fill it before logging.`);
              return;
          }
          if (!item.product) {
              setError(`Row ${i + 1} is missing Product. Please select one before logging.`);
              return;
          }
          if (!item.channel) {
              setError(`Row ${i + 1} is missing Bank Name / Channel. Please select one before logging.`);
              return;
          }
          if ((item.amount || 0) < 0 || (item.disbursedAmount || 0) < 0) {
              setError(`Row ${i + 1} requires valid amounts (>= 0).`);
              return;
          }
          if (!item.fileStatus || !item.fileStatus.trim()) {
              setError(`Row ${i + 1} is missing File Status. Please fill it before logging.`);
              return;
          }
      }

      setIsSaving(true);
      setError('');
      setSuccess('');
      
      try {
          const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          const payload = {
              branchId: activeBranchId,
              entryDate: dateStr,
              mode: entryMode,
              recordType: 'achievement',
              items: items,
              totalAmount,
              authorId: user?.id,
              authorEmail: user?.email,
              location: user?.latestLocation || null,
          };

          // Check if an entry already exists for this branch+date+mode+recordType
          const { data: existing } = await supabase
            .from('entries')
            .select('id, recordType')
            .eq('branchId', activeBranchId)
            .eq('entryDate', dateStr)
            .eq('mode', entryMode);

          const achievementRow = existing?.find(e => !e.recordType || e.recordType === 'achievement');
          let savedId: string | null = null;

          if (achievementRow) {
              // Update the existing achievement entry
              const { error: updateError } = await supabase
                .from('entries')
                .update({ items, totalAmount, recordType: 'achievement', authorId: user?.id, authorEmail: user?.email, location: user?.latestLocation || null })
                .eq('id', achievementRow.id);
              if (updateError) throw new Error(updateError.message);
              savedId = achievementRow.id;
          } else {
              // Insert new entry and capture the returned ID
              const { data: insertData, error: insertError } = await supabase
                .from('entries')
                .insert([{ ...payload, createdAt: new Date().toISOString() }])
                .select('id');
              if (insertError) throw new Error(insertError.message);
              savedId = insertData?.[0]?.id || null;
          }
          
          setSuccess("Tracking submitted successfully.");
          setShowSuccessModal(true);
          setHasExistingEntry(true);
          setCurrentEntryId(savedId);
      } catch (err: any) {
          console.error("Save error:", err);
          setError(err.message || "Failed to submit tracking data.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleLodgeProjection = async () => {
      if (!activeBranchId) {
          setError("You do not have a branch assigned yet. Contact Administrator.");
          return;
      }
      
      setIsLodgingProjection(true);
      setError('');
      setSuccess('');
      
      try {
          const totalProjectionAmtInput = Object.values(projectionInputs).reduce((sum, val) => sum + (val || 0), 0);
          
          const payload = {
              branchId: activeBranchId,
              entryDate: dateStr,
              mode: entryMode,
              recordType: 'projection',
              items: Object.entries(projectionInputs).map(([prod, amt]) => {
                  let cat = 'Loan';
                  if (prod.includes('Insurance') || prod.includes('Protector')) cat = 'Insurance';
                  else if (prod.includes('Mutual Fund') || prod.includes('SIP')) cat = 'Investments';
                  else if (prod.includes('Forex')) cat = 'Forex';
                  else if (prod.includes('filing') || prod.includes('Consult')) cat = 'Consultancy';
                  
                  return {
                      isManual: true,
                      category: cat,
                      product: prod,
                      projectionAmt: amt || 0,
                      amount: amt || 0,
                      reason: projectionReason
                  };
              }),
              totalAmount: totalProjectionAmtInput,
              authorId: user?.id,
              authorEmail: user?.email,
              location: user?.latestLocation || null,
          };
          
          const { data: existing } = await supabase
            .from('entries')
            .select('id')
            .eq('branchId', activeBranchId)
            .eq('entryDate', dateStr)
            .eq('recordType', 'projection')
            .limit(1);

          if (existing && existing.length > 0) {
              const { error: updateError } = await supabase
                .from('entries')
                .update({ ...payload })
                .eq('id', existing[0].id);
              if (updateError) throw new Error(updateError.message);
          } else {
              const { error: insertError } = await supabase
                .from('entries')
                .insert([{ ...payload, createdAt: new Date().toISOString() }]);
              if (insertError) throw new Error(insertError.message);
          }
          
          setSuccess("Daily Projection lodged successfully.");
          setIsProjectionLodged(true);
          setLodgedProjectionAmount(totalProjectionAmtInput);
          setIsProjectionModalOpen(false);

          try {
              // Notify the admins via Push Notifications
              const branchNameStr = activeBranchId === 'B-01' ? 'Imphal' :
                                 activeBranchId === 'B-02' ? 'Churachandpur' :
                                 activeBranchId === 'B-03' ? 'Senapati' :
                                 activeBranchId === 'B-04' ? 'Ukhrul' : 'Branch';

              await supabase.functions.invoke('notify', {
                  body: {
                      action: 'projection_updated',
                      payload: {
                          branchName: branchNameStr,
                          totalAmount: totalProjectionAmtInput,
                          authorName: user?.displayName || user?.email?.split('@')[0] || 'An executive'
                      }
                  }
              });
          } catch (notifyErr) {
              console.warn("Could not send push notification:", notifyErr);
          }
      } catch (err: any) {
          console.error("Projection error:", err);
          setError(err.message || "Failed to lodge projection.");
      } finally {
          setIsLodgingProjection(false);
      }
  };

  const handleDelete = async () => {
      if (!currentEntryId) return;
      
      setIsDeleting(true);
      setError('');
      setSuccess('');
      
      try {
          const selectedCount = selectedDeleteIndices.size;
          const totalCount = items.length;
          
          if (selectedCount === 0) {
              setError("Please select at least one line item to delete.");
              setIsDeleting(false);
              return;
          }
          
          if (selectedCount === totalCount) {
              // Delete entire entry
              const { error: deleteError } = await supabase
                  .from('entries')
                  .delete()
                  .eq('id', currentEntryId);
                  
              if (deleteError) throw new Error(deleteError.message);
              
              setSuccess("Entire record permanently deleted.");
              setHasExistingEntry(false);
              setItems([]);
              setCurrentEntryId(null);
              setEntryCreatedAt(null);
              setSmartPrompt('');
          } else {
              // Delete selected line items only — update the entry with remaining items
              const remainingItems = items.filter((_, idx) => !selectedDeleteIndices.has(idx));
              const newTotal = remainingItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              
              const { error: updateError } = await supabase
                  .from('entries')
                  .update({ items: remainingItems, totalAmount: newTotal })
                  .eq('id', currentEntryId);
                  
              if (updateError) throw new Error(updateError.message);
              
              setSuccess(`${selectedCount} line item${selectedCount > 1 ? 's' : ''} permanently deleted. ${remainingItems.length} remaining.`);
              setItems(remainingItems);
          }
          
          setSelectedDeleteIndices(new Set());
          setShowDeleteModal(false);
      } catch (err: any) {
          console.error("Delete error:", err);
          setError(err.message || "Failed to delete record.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handleBulkSubmit = async () => {
        if (isSunday && !isBackdoor) {
            setError("Bulk upload is restricted on Sundays. Enjoy your holiday!");
            return;
        }
        
        if (!stagedFile || stagedItems.length === 0) return;
      if (!activeBranchId) {
          setError("You do not have a branch assigned yet. Contact Administrator.");
          return;
      }
      
      setIsBulkSubmitting(true);
      setError('');
      setSuccess('');
      
      try {
          const fileExt = stagedFile.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
              .from('bulk_uploads')
              .upload(fileName, stagedFile);
              
          if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);
          
          const fileUrl = uploadData.path;
          
          const { error: auditError } = await supabase
              .from('upload_audit_logs')
              .insert({
                  filename: stagedFile.name,
                  uploaded_by: lodgeName,
                  email_id: lodgeEmail,
                  file_url: fileUrl
              });
              
          if (auditError) throw new Error(`Audit log failed: ${auditError.message}`);
          
          const itemsByDate = new Map<string, EntryItem[]>();
          stagedItems.forEach(item => {
              const d = item.date || dateStr;
              if (!itemsByDate.has(d)) itemsByDate.set(d, []);
              itemsByDate.get(d)!.push(item);
          });
          
          for (const [rowDate, rItems] of itemsByDate.entries()) {
              const { data: existing } = await supabase
                .from('entries')
                .select('id, items, recordType')
                .eq('branchId', activeBranchId)
                .eq('entryDate', rowDate)
                .eq('mode', entryMode);
                
              const achievementRow = existing?.find(e => !e.recordType || e.recordType === 'achievement');
              let mergedItems = rItems;
              let existingId = undefined;

              if (achievementRow) {
                  existingId = achievementRow.id;
                  const existingItems = achievementRow.items || [];
                  const existingPhones = new Set(existingItems.map((i: any) => i.phoneNumber).filter(Boolean));
                  const duplicateFound = rItems.some((i: any) => i.phoneNumber && existingPhones.has(i.phoneNumber));
                  
                  if (duplicateFound) {
                      if (!window.confirm(`Duplicate records found for ${rowDate}. Proceeding will overwrite existing data. Continue?`)) {
                          continue;
                      }
                  }
                  
                  mergedItems = [...existingItems];
                  rItems.forEach((newItem: any) => {
                      let replaced = false;
                      for (let i = 0; i < mergedItems.length; i++) {
                          const existingItem = mergedItems[i];
                          if (newItem.phoneNumber && existingItem.phoneNumber === newItem.phoneNumber) {
                              mergedItems[i] = newItem;
                              replaced = true;
                              break;
                          }
                      }
                      if (!replaced) {
                          mergedItems.push(newItem);
                      }
                  });
              }
              
              const mergedTotal = mergedItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
              const payload = {
                  branchId: activeBranchId,
                  entryDate: rowDate,
                  mode: entryMode,
                  recordType: 'achievement',
                  items: mergedItems,
                  totalAmount: mergedTotal,
                  authorId: user?.id,
                  authorEmail: user?.email,
                  location: user?.latestLocation || null,
              };

              if (existingId) {
                  const { error: upsertError } = await supabase
                    .from('entries')
                    .upsert({ ...payload, id: existingId }, { onConflict: 'id' });
                  if (upsertError) throw new Error(upsertError.message);
              } else {
                  const { error: upsertError } = await supabase
                    .from('entries')
                    .upsert({ ...payload, createdAt: new Date().toISOString() });
                  if (upsertError) throw new Error(upsertError.message);
              }
          }
          
          fetchCache.current = {}; setRefreshTrigger(prev => prev + 1);
          setSuccess("Bulk upload successfully lodged to respective dates.");
          setIsStagingModalOpen(false);
          setStagedItems([]);
          setStagedFile(null);
          
      } catch(e: any) {
          console.error("Bulk submit error:", e);
          setError(e.message || "Failed to lodge bulk upload.");
      } finally {
          setIsBulkSubmitting(false);
      }
  };

  if (!isInitialized || !user) {
      return <div className="min-h-screen flex items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Initializing Identity...</div>;
  }

  const allowedProducts = (category: string) => products.filter((p: any) => p.category === category);
  
  const getFileStatusColor = (status: string) => {
      switch (status) {
          case 'Login': return 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30';
          case 'Processing': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
          case 'Underwriting': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
          case 'Sanctioned': return 'bg-amber-100 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-400 border-amber-200 dark:border-yellow-500/30';
          case 'Disbursed': return 'bg-emerald-100 dark:bg-green-500/20 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-500/30 font-semibold';
          case 'Customer Reject': return 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 font-semibold';
          case 'Rejected': return 'bg-rose-100 dark:bg-red-500/20 text-rose-700 dark:text-red-400 border-rose-200 dark:border-red-500/30';
          case 'Issued': return 'bg-emerald-100 dark:bg-green-500/20 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-500/30';
          case 'Not Issued': return 'bg-amber-100 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-400 border-amber-200 dark:border-yellow-500/30';
          default: return 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      }
  };

  
    const isFieldMissing = (item: any, field: string) => {
        if (!item.isManual) return false;
        if (field === 'staffName' && !item.staffName) return true;
        if (field === 'category' && !item.category) return true;
        if (field === 'product' && !item.product) return true;
        if (field === 'channel' && !item.channel) return true;
        if (field === 'customerName' && !item.customerName) return true;
        if (field === 'amount' && (item.amount === undefined || item.amount === null)) return true;
        if (field === 'fileStatus' && !item.fileStatus) return true;
        return false;
    };

  // Calculate dynamic metrics based on the current items and selected metricCategory
  let metricLogin = 0;
  let metricDisbursed = 0;
  let insuranceIssued = 0;
  let insuranceNotIssued = 0;

  items.forEach((item: any) => {
      if (metricCategory === 'All' || item.category === metricCategory) {
          metricLogin += (Number(item.amount) || 0);
          metricDisbursed += (Number(item.disbursedAmount) || 0);
          
          if (item.category === 'Insurance') {
              if (item.fileStatus === 'Issued') insuranceIssued += (Number(item.amount) || 0);
              if (item.fileStatus === 'Not Issued') insuranceNotIssued += (Number(item.amount) || 0);
          }
      }
  });

  return (
      <div className="min-h-screen p-3 md:p-8 flex flex-col w-full">
          <header className="glass px-4 py-4 md:px-6 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-4 mb-4 md:mb-6 rounded-xl shadow-sm">
              <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
                      {user.role === 'admin' ? 'Admin Access Terminal' : 'State Head Terminal'}
                  </h1>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                     {branchDetails ? branchDetails.name : (user.role === 'admin' || user.role === 'statehead' ? 'Global Access' : 'Unknown Branch')} • {user.email}
                  </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs h-9 px-3 bg-slate-100/50 hover:bg-slate-200/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 rounded-lg" onClick={() => { setIsAuditModalOpen(true); fetchExecutiveAuditLogs(); }}>
                      Audit Logs
                  </Button>
                  <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs h-9 px-3 bg-slate-100/50 hover:bg-slate-200/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 rounded-lg" onClick={() => { logout(); navigate(Capacitor.isNativePlatform() ? '/' : '/login'); }}>
                      <LogOut size={14} className="mr-1.5 hidden sm:block" /> Log Out
                  </Button>
              </div>
          </header>

          {(isExecutive || isMIS) && (
              <ExecutivePerformanceWidget dateStr={dateStr} branchId={activeBranchId} mode={entryMode} />
          )}

          {/* Sticky Top Control Bar */}
          <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 mb-4 md:mb-6 rounded-2xl shadow-sm flex flex-col gap-5 md:gap-4 transition-all">
              
              {/* Unified Command Center Bar */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 xl:gap-4">
                  {/* Left Section: Context */}
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-5 overflow-x-auto pb-1 hide-scrollbar w-full xl:w-auto">
                      {/* Branch Override */}
                      {(user.role === 'admin' || isBackdoor) && (
                      <div className="flex flex-col w-full md:w-auto">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              Branch Context
                              {user.role === 'admin' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                          </label>
                          <ThemeSelect 
                              variant="pill"
                              value={adminSelectedBranch || ''}
                              onChange={(val) => {
                                  if (isDirty && !window.confirm("You have unsaved rows. Switching branch will discard them. Continue?")) return;
                                  setAdminSelectedBranch(val);
                              }}
                              options={branches.filter(b => b.name !== 'HO' && b.name !== 'Test Branch').map(b => ({
                                  value: b.id,
                                  label: b.name,
                                  indicatorColor: b.name === 'Guwahati' ? '#818cf8' : b.name === 'Manipur' ? '#34d399' : b.name === 'Itanagar' ? '#38bdf8' : b.name === 'Nagaland & Mizoram' ? '#fbbf24' : '#6366f1'
                              }))}
                          />
                      </div>
                      )}

                      {/* Divider */}
                      {(user.role === 'admin' || isBackdoor) && <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>}

                      {/* Mode Toggle (only MIS/Exec/Admin) */}
                      {(isMIS || isBackdoor || isExecutive) && (
                      <div className="flex flex-col w-full md:w-auto">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              Data Mode
                          </label>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full w-full md:w-[220px]">
                              <button 
                                  className={`flex-1 text-[10px] font-bold rounded-full uppercase tracking-widest transition-all flex items-center justify-center ${entryMode === 'monthly' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 py-1.5' : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1.5'}`}
                                  onClick={() => {
                                      if (isDirty && !window.confirm("You have unsaved rows. Switching mode will discard them. Continue?")) return;
                                      setEntryMode('monthly');
                                      const today = new Date().toISOString().split('T')[0];
                                      setDateStr(today >= '2026-01-01' ? today.substring(0, 7) + '-01' : '2026-01-01');
                                  }}
                              >
                                  Month
                              </button>
                              <button 
                                  className={`flex-1 text-[10px] font-bold rounded-full uppercase tracking-widest transition-all flex items-center justify-center ${entryMode === 'daily' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 py-1.5' : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-1.5'}`}
                                  onClick={() => {
                                      if (isDirty && !window.confirm("You have unsaved rows. Switching mode will discard them. Continue?")) return;
                                      setEntryMode('daily');
                                      const today = new Date().toISOString().split('T')[0];
                                      setDateStr(today >= '2026-01-01' ? today : '2026-01-01');
                                  }}
                              >
                                  Daily
                              </button>
                          </div>
                      </div>
                      )}
                      
                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

                    {/* Date Context */}
                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            Date Context
                        </label>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 md:gap-4 w-full md:w-auto">
                            <div className="w-full sm:w-auto">
                            {entryMode === 'monthly' ? (
                                <MonthPicker 
                                    value={dateStr.substring(0, 7)}
                                    onChange={(val) => {
                                        if (isDirty && !window.confirm("You have unsaved rows. Changing date will discard them. Continue?")) return;
                                        setDateStr(val + '-01');
                                    }}
                                    buttonClassName="h-[36px] w-full sm:w-auto px-4 rounded-full border-slate-200 dark:border-white/10 shadow-sm"
                                />
                            ) : (
                                <div className="flex items-center h-[36px] w-full sm:w-auto px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full hover:border-slate-300 dark:hover:border-white/20 transition-colors shadow-sm">
                                    <Calendar className="w-4 h-4 text-slate-500 mr-2.5" />
                                    <div 
                                        className="bg-transparent text-xs text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer flex-1 min-w-[100px] flex items-center select-none"
                                        onClick={() => setShowDatePicker(true)}
                                    >
                                        {format(new Date(dateStr), 'dd MMM yyyy')}
                                    </div>
                                </div>
                            )}
                            </div>
                            
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 h-[36px] rounded-full border border-slate-200 dark:border-white/5 shadow-inner">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold font-mono tracking-tight">{currentTime.split(',')[0]}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Section: Metrics */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-3 md:px-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner w-full xl:w-auto">
                    {/* Target */}
                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            Target ({dateStr.substring(0, 7)})
                        </label>
                        <div className="text-sm md:text-base font-black text-slate-800 dark:text-slate-200 font-mono tracking-tight bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block w-fit">
                            ₹{((branchTargets?.find(t => t.branchId === activeBranchId && t.monthYear === dateStr.substring(0, 7))?.targetAmount) || branchDetails?.monthlyTarget || 0).toLocaleString('en-IN')}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-12 bg-slate-200 dark:bg-slate-800 mx-2"></div>
                    <div className="md:hidden h-px w-full bg-slate-200 dark:bg-slate-800 my-1"></div>

                    {/* Totals */}
                    <div className="flex flex-col w-full md:min-w-[220px]">
                        <div className="flex justify-between items-center mb-1.5 gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Totals ({entryMode === 'daily' ? 'Daily' : 'Monthly'})
                            </label>
                            <ThemeSelect
                                variant="inline"
                                dropdownAlign="right"
                                value={metricCategory}
                                onChange={setMetricCategory}
                                options={[
                                    { value: 'Loan', label: 'Loan' },
                                    { value: 'Insurance', label: 'Insurance' },
                                    { value: 'Forex', label: 'Forex' },
                                    { value: 'Consultancy', label: 'Consulting' },
                                    { value: 'Investments', label: 'Investments' },
                                    { value: 'All', label: 'All' }
                                ]}
                            />
                        </div>
                        <div className="flex items-center text-xs md:text-sm font-mono font-bold tracking-tight text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {metricCategory === 'Insurance' ? (
                                <>
                                    <div className="flex items-center gap-1.5 mr-6 flex-1">
                                        <span className="text-[10px] text-slate-400 font-sans tracking-wider">ISS</span>
                                        ₹{insuranceIssued.toLocaleString('en-IN')}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-1">
                                        <span className="text-[10px] text-slate-400 font-sans tracking-wider">NOT</span>
                                        ₹{insuranceNotIssued.toLocaleString('en-IN')}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1.5 mr-6 flex-1">
                                        <span className="text-[10px] text-slate-400 font-sans tracking-wider">LOG</span>
                                        ₹{metricLogin.toLocaleString('en-IN')}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-1">
                                        <span className="text-[10px] text-slate-400 font-sans tracking-wider">DISB</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">₹{metricDisbursed.toLocaleString('en-IN')}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex flex-row overflow-x-auto pb-2 md:pb-0 hide-scrollbar items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
                    {!isMIS && (
                        <label 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex items-center justify-center gap-2 h-[36px] px-5 text-[10px] font-bold tracking-wide uppercase rounded-full border transition-all cursor-pointer shadow-sm
                            ${!canModify || isParsing ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed' : isDragging ? 'bg-indigo-50 border-indigo-500 text-indigo-700 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'}`}
                        >
                            {isParsing ? <Loader2 className="animate-spin w-4 h-4" /> : <UploadCloud className="w-4 h-4 text-indigo-500" />}
                            <span>{isParsing ? `Processing ${uploadProgress}%` : isDragging ? 'Drop Here' : 'Bulk Upload'}</span>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls, .csv" 
                                className="hidden" 
                                disabled={!canModify || isParsing}
                                onChange={handleFileUpload}
                            />
                        </label>
                    )}

                    <button 
                        onClick={() => setIsProjectionModalOpen(true)}
                        className={`h-[36px] px-6 rounded-full border shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isSunday 
                            ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-400 cursor-not-allowed'
                            : isProjectionLodged
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                                : isTimeLocked
                                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 border-transparent text-white shadow-[0_2px_10px_rgba(79,70,229,0.2)]'
                        }`}
                    >
                        Project
                        <span className="font-mono text-[13px] ml-1 tracking-tight">₹{(isProjectionLodged ? lodgedProjectionAmount : (branchDetails?.dailyProjection || 0)).toLocaleString('en-IN')}</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Data Grid Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-sm">
            {/* Toolbar Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3.5 gap-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
               <div className="flex flex-wrap items-center gap-2.5">
                   <div className="flex items-center gap-2">
                       <Layers className="w-4 h-4 text-indigo-500" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                           Line Items
                       </h3>
                       <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                           {filteredItemsWithIndex.length}{filteredItemsWithIndex.length !== items.length ? ` of ${items.length}` : ''}
                       </span>
                   </div>
                   
                   {hasExistingEntry && (
                       <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/30 flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3" />
                           Locked & Processed
                       </span>
                   )}

                   {/* Quick Status Filter Chips */}
                   <div className="hidden sm:flex items-center gap-1 ml-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'Login', label: 'Login' },
                        { id: 'Sanctioned', label: 'Sanctioned' },
                        { id: 'Disbursed', label: 'Disbursed' },
                        { id: 'Customer Reject', label: 'Cust Reject' },
                        { id: 'Rejected', label: 'Bank Rejected' },
                      ].map((chip) => {
                         const count = chip.id === 'ALL' 
                           ? items.length 
                           : items.filter(i => chip.id === 'Disbursed' ? (i.fileStatus === 'Disbursed' || i.fileStatus === 'Issued' || i.fileStatus === 'POLICY ISSUED') : i.fileStatus === chip.id).length;
                         if (count === 0 && chip.id !== 'ALL' && statusFilter !== chip.id) return null;
                         
                         const isActive = statusFilter === chip.id;
                         return (
                           <button
                             type="button"
                             key={chip.id}
                             onClick={() => setStatusFilter(chip.id)}
                             className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                               isActive
                                 ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 scale-[1.02]'
                                 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                             }`}
                           >
                             <span>{chip.label}</span>
                             <span className={`text-[9px] px-1 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                               {count}
                             </span>
                           </button>
                         );
                      })}
                   </div>
               </div>

               {/* Live Search Bar */}
               <div className="flex items-center gap-2 w-full lg:w-auto">
                   <div className="relative flex-1 lg:w-72">
                       <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       <Input
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder="Search customer, tracking #, RM..."
                           className="h-[34px] pl-9 pr-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
                       />
                       {searchQuery && (
                           <button
                               type="button"
                               onClick={() => setSearchQuery('')}
                               className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                           >
                               <X className="w-3 h-3" />
                           </button>
                       )}
                   </div>
                   
                   {/* Mobile Dropdown Filter */}
                   <div className="sm:hidden">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-[34px] text-xs px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none font-bold"
                      >
                         <option value="ALL">All Status</option>
                         <option value="Login">Login</option>
                         <option value="Sanctioned">Sanctioned</option>
                         <option value="Disbursed">Disbursed</option>
                         <option value="Customer Reject">Customer Reject</option>
                         <option value="Rejected">Rejected</option>
                      </select>
                   </div>
               </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto">
                {isLoadingExisting ? (
                    <div className="flex justify-center items-center h-full min-h-[200px]"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : (
                    <Table className="min-w-max border-collapse data-grid-table" containerClassName="flex-1 relative">
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 box-border border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
                            <TableRow>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[230px]">1. Staff Name</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">2. Projection (₹)</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[200px]">3. Login Date</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">4. Category</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">5. Product</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[250px]">6. Relationship Manager Name</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">7. File Login</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">8. Tracking Number</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">9. Channel Partner</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">10. Branch</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">11. Customer Name</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[210px]">12. DOB</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[210px]">13. Phone No.</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">14. Email ID</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[280px]">15. Customer Address</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">16. Firm Name</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">17. File Status</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">18. Sanctioned (₹)</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">19. Disbursed (₹)</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[210px]">20. Disbursed Dt</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[210px]">21. EMI Date</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[240px]">22. Repayment Bank</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[230px]">23. Manager Name</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px]">24. Consultant Name</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[260px]">25. Consultant Email ID</TableHead>
                                <TableHead className="text-[11px] font-bold py-4 px-4 uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[180px] sticky right-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md z-20 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-slate-200 dark:border-slate-800">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItemsWithIndex.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={26} className="p-0 border-0 h-0">
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-slate-400 text-xs font-medium z-0 pointer-events-none gap-1.5" style={{ top: '50px' }}>
                                            {items.length === 0 ? (
                                                <span>No items formulated for {dateStr}</span>
                                            ) : (
                                                <>
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">No matching line items found</span>
                                                    <span className="text-[11px] text-slate-400">Clear search query or status filter to view all {items.length} items</span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredItemsWithIndex.map(({ item, originalIndex }) => (
                                <TableRow key={originalIndex} className="hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border-b border-slate-900/5 dark:border-white/5">
                                    {/* 1. Staff Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        {branchStaff.length > 0 ? (
                                            <select
                                                disabled={!canModify && !item.isManual}
                                                value={item.staffName || ''}
                                                onChange={(e) => handleUpdateItem(originalIndex, 'staffName', e.target.value)}
                                                className={`h-[34px] w-full text-xs rounded-md px-2 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 disabled:opacity-50 border outline-none focus:ring-1 focus:ring-indigo-500 ${
                                                    isFieldMissing(item, 'staffName')
                                                        ? 'border-red-500/50'
                                                        : 'border-slate-200 dark:border-white/10'
                                                }`}
                                            >
                                                <option value="">— Select Staff —</option>
                                                {branchStaff.map(m => (
                                                    <option key={m.id} value={m.name}>{m.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                disabled={!canModify && !item.isManual}
                                                type="text"
                                                className={`h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:text-slate-100 disabled:opacity-50 ${
                                                    isFieldMissing(item, 'staffName') ? 'border-red-500/50 focus:border-red-500 border' : 'dark:border-white/10 border-transparent'
                                                }`}
                                                value={item.staffName || ''}
                                                onChange={(e) => handleUpdateItem(originalIndex, 'staffName', e.target.value)}
                                            />
                                        )}
                                    </TableCell>

                                    {/* 2. Projection (₹) */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <NumericFormat 
                                            customInput={Input}
                                            disabled={!canModify && !item.isManual}
                                            className={`h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:text-slate-100 disabled:opacity-50 ${isFieldMissing(item, 'amount') ? 'border-red-500/50 focus:border-red-500 border' : 'dark:border-white/10 border-transparent'}`}
                                            value={item.amount === 0 ? '' : item.amount}
                                            onValueChange={(values) => handleUpdateItem(originalIndex, 'amount', values.floatValue || 0)}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                        />
                                    </TableCell>

                                    {/* 3. Login Date */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <div className="h-[34px] px-3 py-2 text-xs bg-transparent text-slate-500 dark:text-slate-400 flex items-center">
                                            {item.date}
                                        </div>
                                    </TableCell>

                                    {/* 2. Category */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className={`w-full h-[34px] bg-white dark:bg-slate-900/50 border px-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 ${isFieldMissing(item, 'category') ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-white/10'}`}
                                            value={item.category || 'Loan'}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'category', e.target.value)}
                                        >
                                            <option value="Loan">Loan</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Forex">Forex</option>
                                            <option value="Consultancy">Consulting</option>
                                            <option value="Investments">Investments</option>
                                        </select>
                                    </TableCell>

                                    {/* 3. Product */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className={`w-full h-[34px] bg-white dark:bg-slate-900/50 border px-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 ${isFieldMissing(item, 'product') ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-white/10'}`}
                                            value={item.product || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'product', e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {allowedProducts(item.category || 'Loan').map((p: any) => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </TableCell>

                                    
                                    {/* 4. Relationship Manager Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.relationshipManagerName || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'relationshipManagerName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 5. File Login */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={(!canModify && !item.isManual) || item.category === 'Forex'}
                                            className="w-full h-[34px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 px-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50"
                                            value={item.fileLogin || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'fileLogin', e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {item.category === 'Insurance' || item.category === 'Forex' ? (
                                                <option value="Online">Online</option>
                                            ) : (item.category === 'Loan' && (item.product === 'Housing Loan/LAP' || item.product === 'Mortgage' || item.product === 'Home Loan')) ? (
                                                <option value="lead force">lead force</option>
                                            ) : (
                                                <>
                                                    <option value="WBO">WBO</option>
                                                    <option value="EXPRESS LINK">EXPRESS LINK</option>
                                                    <option value="ILENS">ILENS</option>
                                                    <option value="Online">Online</option>
                                                    <option value="Branch walkin">Branch walkin</option>
                                                    <option value="lead force">lead force</option>
                                                </>
                                            )}
                                        </select>
                                    </TableCell>

                                    {/* 6. Tracking Number */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={(!canModify && !item.isManual) || (item.category !== 'Loan' && item.category !== 'Insurance')}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.trackingNumber || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'trackingNumber', e.target.value)}
                                            placeholder={item.category !== 'Loan' && item.category !== 'Insurance' ? 'N/A' : 'Tracking #'}
                                        />
                                    </TableCell>

                                    {/* 6. Channel Partner */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className={`w-full h-[34px] bg-white dark:bg-slate-900/50 border px-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 ${isFieldMissing(item, 'channel') ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-white/10'}`}
                                            value={item.channel || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'channel', e.target.value)}
                                        >
                                            <option value="">Select Channel...</option>
                                            {item.category === 'Insurance' ? (
                                                <>
                                                    <option value="Bajaj Allianz">Bajaj Allianz</option>
                                                    <option value="Aditya Birla">Aditya Birla</option>
                                                    <option value="LIC">LIC</option>
                                                    <option value="ICICI Lombard">ICICI Lombard</option>
                                                    <option value="Niva Bupa">Niva Bupa</option>
                                                    <option value="Tata AIG">Tata AIG</option>
                                                    <option value="Manipal Cigna">Manipal Cigna</option>
                                                    <option value="Star Health">Star Health</option>
                                                    <option value="Care Health">Care Health</option>
                                                    <option value="SBI">SBI</option>
                                                    <option value="Magma">Magma</option>
                                                    <option value="Galaxy Health">Galaxy Health</option>
                                                    <option value="SIROI">SIROI</option>
                                                    <option value="Bank of Baroda">Bank of Baroda</option>
                                                    <option value="Punjab & Sind Bank">Punjab & Sind Bank</option>
                                                </>
                                            ) : item.category === 'Forex' ? (
                                                <option value="SIROI">SIROI</option>
                                            ) : (item.category === 'Loan' && (item.product === 'Housing Loan/LAP' || item.product === 'Mortgage' || item.product === 'Home Loan')) ? (
                                                <>
                                                    <option value="Bank of Baroda">Bank of Baroda</option>
                                                    <option value="Punjab & Sind Bank">Punjab & Sind Bank</option>
                                                </>
                                            ) : (
                                                channels.map((c: any) => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))
                                            )}
                                        </select>
                                    </TableCell>

                                    {/* 6. Branch Location */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <div className="h-[34px] px-3 py-2 text-xs bg-transparent text-slate-500 dark:text-slate-400 flex items-center truncate">
                                            {branchDetails?.name || ''}
                                        </div>
                                    </TableCell>

                                    {/* 8. Customer Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className={`h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:text-slate-100 disabled:opacity-50 ${isFieldMissing(item, 'customerName') ? 'border-red-500/50 focus:border-red-500 border' : 'dark:border-white/10 border-transparent'}`}
                                            value={item.customerName || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'customerName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 8. Customer DOB */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <InlineDatePicker 
                                            disabled={!canModify && !item.isManual}
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.customerDOB || ''}
                                            onChange={(val: string) => handleUpdateItem(originalIndex, 'customerDOB', val)}
                                        />
                                    </TableCell>

                                    {/* 9. Phone Number */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.phoneNumber || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'phoneNumber', e.target.value.replace(/\D/g,''))}
                                        />
                                    </TableCell>

                                    {/* 11. Email ID */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="email"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.emailId || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'emailId', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 12. Customer Address */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.customerAddress || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'customerAddress', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 16. Firm Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.firmName || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'firmName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 17. File Status */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className={`w-full h-[34px] border px-2 text-xs font-semibold rounded shadow-none disabled:opacity-50 outline-none appearance-none ${item.fileStatus ? getFileStatusColor(item.fileStatus) : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200'} ${isFieldMissing(item, 'fileStatus') ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' : ''}`}
                                            value={item.fileStatus || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'fileStatus', e.target.value)}
                                        >
                                            <option value="" className="bg-slate-800 text-white">Select...</option>
                                            {item.category === 'Insurance' ? (
                                                <>
                                                    <option value="Issued" className="bg-slate-800 text-green-400">Issued</option>
                                                    <option value="POLICY ISSUED" className="bg-slate-800 text-green-400">POLICY ISSUED</option>
                                                    <option value="Not Issued" className="bg-slate-800 text-yellow-400">Not Issued</option>
                                                </>
                                            ) : item.category === 'Loan' ? (
                                                <>
                                                    <option value="Login" className="bg-slate-800 text-slate-300">Login</option>
                                                    <option value="Underwriting" className="bg-slate-800 text-blue-400">Underwriting</option>
                                                    <option value="Sanctioned" className="bg-slate-800 text-yellow-400">Sanctioned</option>
                                                    <option value="Disbursed" className="bg-slate-800 text-green-400">Disbursed</option>
                                                    <option value="Customer Reject" className="bg-slate-800 text-amber-400">Customer Reject</option>
                                                    <option value="Rejected" className="bg-slate-800 text-red-400">Rejected</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Login" className="bg-slate-800 text-slate-300">Login</option>
                                                    <option value="Processing" className="bg-slate-800 text-blue-400">Processing</option>
                                                    <option value="Sanctioned" className="bg-slate-800 text-yellow-400">Sanctioned</option>
                                                    <option value="Disbursed" className="bg-slate-800 text-green-400">Disbursed</option>
                                                    <option value="Customer Reject" className="bg-slate-800 text-amber-400">Customer Reject</option>
                                                    <option value="Rejected" className="bg-slate-800 text-red-400">Rejected</option>
                                                </>
                                            )}
                                        </select>
                                    </TableCell>

                                    {/* 15. Sanctioned Amount */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <NumericFormat 
                                            customInput={Input}
                                            disabled={!canModify && !item.isManual}
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.sanctionedAmount === 0 ? '' : item.sanctionedAmount}
                                            onValueChange={(values) => handleUpdateItem(originalIndex, 'sanctionedAmount', values.floatValue || 0)}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                        />
                                    </TableCell>

                                    {/* 16. Disbursed Amount */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <NumericFormat 
                                            customInput={Input}
                                            disabled={!canModify && !item.isManual}
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.disbursedAmount === 0 ? '' : item.disbursedAmount}
                                            onValueChange={(values) => handleUpdateItem(originalIndex, 'disbursedAmount', values.floatValue || 0)}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                        />
                                    </TableCell>

                                    {/* 17. Disbursed Date */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <InlineDatePicker 
                                            disabled={!canModify && !item.isManual}
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.disbursedDate || ''}
                                            onChange={(val: string) => handleUpdateItem(originalIndex, 'disbursedDate', val)}
                                        />
                                    </TableCell>

                                    {/* 19. EMI Date */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <InlineDatePicker 
                                            disabled={!canModify && !item.isManual}
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.emiDate || ''}
                                            onChange={(val: string) => handleUpdateItem(originalIndex, 'emiDate', val)}
                                        />
                                    </TableCell>

                                    {/* 20. Repayment Bank */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            list="repayment-banks"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.repaymentBank || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'repaymentBank', e.target.value)}
                                            placeholder="Enter or select..."
                                        />
                                        <datalist id="repayment-banks">
                                            <option value="State Bank of India (SBI)" />
                                            <option value="Punjab National Bank (PNB)" />
                                            <option value="Bank of Baroda (BOB)" />
                                            <option value="Canara Bank" />
                                            <option value="Union Bank of India" />
                                            <option value="Bank of India (BOI)" />
                                            <option value="Indian Bank" />
                                            <option value="Central Bank of India" />
                                            <option value="Indian Overseas Bank" />
                                            <option value="UCO Bank" />
                                            <option value="Bank of Maharashtra" />
                                            <option value="Punjab & Sind Bank" />
                                            <option value="HDFC Bank" />
                                            <option value="ICICI Bank" />
                                            <option value="Axis Bank" />
                                        </datalist>
                                    </TableCell>

                                    {/* 23. Manager Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.managerName || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'managerName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 22. Consultant Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className="w-full h-[34px] border px-2 text-xs font-semibold rounded shadow-none disabled:opacity-50 outline-none appearance-none bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200"
                                            value={item.consultantName || ''}
                                            onChange={(e) => {
                                                handleUpdateItem(originalIndex, 'consultantName', e.target.value);
                                                const consultant = consultants.find(c => c.name === e.target.value);
                                                if (consultant) {
                                                    handleUpdateItem(originalIndex, 'consultantEmail', consultant.email);
                                                } else {
                                                    handleUpdateItem(originalIndex, 'consultantEmail', '');
                                                }
                                            }}
                                        >
                                            <option value="" className="bg-slate-800 text-slate-400">Select...</option>
                                            {consultants
                                                .filter(c => !c.associated_branch || c.associated_branch === activeBranchName)
                                                .map(c => (
                                                <option key={c.id} value={c.name} className="bg-slate-800 text-white">{c.name}</option>
                                            ))}
                                        </select>
                                    </TableCell>

                                    {/* 25. Consultant Email ID */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="email"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.consultantEmail || ''}
                                            onChange={(e) => handleUpdateItem(originalIndex, 'consultantEmail', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* Actions & Quick Shortcuts */}
                                    <TableCell className="py-2 px-3 align-middle sticky right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 border-l border-slate-200 dark:border-white/10 shadow-[-5px_0_10px_rgba(0,0,0,0.03)]">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {canModify && item.category !== 'Insurance' && item.fileStatus !== 'Disbursed' && (
                                                <button
                                                    type="button"
                                                    title="Quick Disburse: Mark as Disbursed and fill date"
                                                    onClick={() => {
                                                        handleUpdateItem(originalIndex, 'fileStatus', 'Disbursed');
                                                        if (!item.disbursedAmount && item.amount) {
                                                            handleUpdateItem(originalIndex, 'disbursedAmount', item.amount);
                                                        }
                                                        if (!item.disbursedDate) {
                                                            handleUpdateItem(originalIndex, 'disbursedDate', dateStr);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs hover:scale-[1.02]"
                                                >
                                                    <Check className="w-2.5 h-2.5" /> Disburse
                                                </button>
                                            )}

                                            {canModify && item.category !== 'Insurance' && item.fileStatus !== 'Customer Reject' && item.fileStatus !== 'Disbursed' && (
                                                <button
                                                    type="button"
                                                    title="Mark as Customer Reject"
                                                    onClick={() => {
                                                        handleUpdateItem(originalIndex, 'fileStatus', 'Customer Reject');
                                                    }}
                                                    className="px-2 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-700/50 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs hover:scale-[1.02]"
                                                >
                                                    Reject
                                                </button>
                                            )}

                                            {canModify && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveItem(originalIndex)} 
                                                    title="Delete entry" 
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                >
                                                    <X size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
            
            {items.length > 0 && (
                <div className="border-t border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 p-4 shrink-0 flex justify-end">
                    <div className="flex gap-4 items-center">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Login Amount:</span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            ₹ {items.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* Sticky Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 z-30 pointer-events-none">
            <div className="max-w-7xl mx-auto flex justify-end items-center gap-4 pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl">
                <div className="flex-1 max-w-[400px]">
                    {error && <div className="text-xs text-red-500 font-bold bg-white dark:bg-slate-900 border border-red-500/20 px-4 py-2 rounded shadow-sm">{error}</div>}
                    {success && <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 border border-emerald-500/20 px-4 py-2 rounded shadow-sm">{success}</div>}
                </div>
                
                {hasExistingEntry && ((allowDeletion || isExecutive)) && (
                     <Button 
                        variant="danger" 
                        onClick={() => { 
                          setSelectedDeleteIndices(new Set(items.map((_, i) => i)));
                          setShowDeleteModal(true); 
                        }} 
                        disabled={isDeleting}
                        className="shadow-sm h-[38px] px-6 font-bold"
                     >
                         <Trash2 className="w-4 h-4 mr-2" />
                         Delete
                     </Button>
                )}
                
                {hasExistingEntry && entryMode === 'monthly' && (user?.role === 'admin' || isBackdoor) && (
                      <Button variant="secondary" onClick={() => setIsTransferModalOpen(true)} className="h-[38px] px-6 font-bold shadow-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors">
                          Transfer to Daily
                      </Button>
                 )}
                
                {canModify && (
                     <Button variant="secondary" onClick={() => {
                         if (items.length === 0) {
                             setShowContextModal(true);
                         } else {
                             handleAddItem();
                         }
                     }} className="h-[38px] px-6 font-bold shadow-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors">
                         + Manual Row
                     </Button>
                )}
                
                {canModify && (
                    <Button 
                        disabled={isSaving || items.length === 0} 
                        onClick={handleSubmit} 
                        className="h-[38px] px-8 font-bold bg-[#6b21a8] hover:bg-[#581c87] text-white shadow-md transition-all active:scale-95"
                    >
                        {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {hasExistingEntry ? 'Update Record' : 'Permanently Lodge Record'}
                    </Button>
                )}
            </div>
        </div>

        {/* Padding to allow scrolling past sticky footer */}
        <div className="h-24"></div>

        {/* Transfer to Daily Modal */}
        {isTransferModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" onClick={() => setIsTransferModalOpen(false)}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div className="relative bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Transfer to Daily</h2>
                        <p className="text-sm text-slate-500 mt-1">Select a specific date to transfer these monthly entries into Daily mode.</p>
                    </div>
                    <div className="p-6 flex flex-col gap-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                Daily Date
                            </label>
                            <input 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-sm rounded-md text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                value={transferDate}
                                onChange={(e) => setTransferDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handleTransferToDaily} disabled={!transferDate || isTransferring} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                            {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (() => {
          const selectedTotal = items.reduce((s, item, idx) => s + (selectedDeleteIndices.has(idx) ? (Number(item.amount) || 0) : 0), 0);
          const selectedCount = selectedDeleteIndices.size;
          const allSelected = selectedCount === items.length;
          const noneSelected = selectedCount === 0;

          return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" onClick={() => setShowDeleteModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div 
              className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-red-50 dark:bg-red-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-900 dark:text-red-100 uppercase tracking-wider">Select Items to Delete</h3>
                  </div>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 pt-3 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {selectedCount} selected
                </p>
                <button
                  onClick={() => {
                    if (allSelected) setSelectedDeleteIndices(new Set());
                    else setSelectedDeleteIndices(new Set(items.map((_, i) => i)));
                  }}
                  className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="px-5 pt-3 pb-2 flex-1 overflow-auto">
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const isSelected = selectedDeleteIndices.has(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const next = new Set(selectedDeleteIndices);
                          if (isSelected) next.delete(idx); else next.add(idx);
                          setSelectedDeleteIndices(next);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left ${isSelected ? 'bg-red-50 dark:bg-red-950/20 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                      >
                         <span className="text-sm ml-3">₹{Number(item.amount).toLocaleString('en-IN')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 flex gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
                <Button variant="danger" onClick={handleDelete} disabled={isDeleting || noneSelected} className="flex-1">Delete</Button>
              </div>
            </div>
          </div>
          );
        })()}

        
        {/* Staff Name Resolution Dialog (Bulk Upload) */}
        
        <ColumnMappingDialog
            open={isMappingDialogOpen}
            headers={rawHeaders}
            onConfirm={handleMappingConfirm}
            onCancel={() => { setIsMappingDialogOpen(false); setIsParsing(false); setUploadProgress(0); }}
        />

        {/* Staff Name Resolution Dialog (Bulk Upload) */}
        {isResolutionDialogOpen && (
            <StaffNameResolutionDialog
                rawItems={pendingParsed}
                orgMembers={orgMembers}
                branches={branches}
                activeBranchName={activeBranchName}
                onConfirm={(_mappings, resolvedItems) => {
                    setIsResolutionDialogOpen(false);
                    setStagedItems(resolvedItems);
                    setIsStagingModalOpen(true);
                }}
                onCancel={() => {
                    setIsResolutionDialogOpen(false);
                    setPendingParsed([]);
                    setStagedFile(null);
                }}
            />
        )}

        {/* Staging Modal */}
        {isStagingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-auto bg-black/80 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-slate-900 rounded-xl w-full max-w-[95vw] h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="text-indigo-500" /> Data Staging & Review
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Review and correct the extracted data. Rows will be saved to their specific Login Date.
                        </p>
                    </div>
                    <button onClick={() => { setIsStagingModalOpen(false); setStagedItems([]); setStagedFile(null); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm backdrop-blur-md">
                            <TableRow className="border-b border-slate-200 dark:border-white/10 hover:bg-transparent">
                                <TableHead className="min-w-[260px] font-bold text-[10px] uppercase tracking-wider text-slate-500">1. Staff Name *</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">2. Projection (₹)</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">2b. Login Amount (₹) *</TableHead>
                                <TableHead className="min-w-[200px] font-bold text-[10px] uppercase tracking-wider text-slate-500">3. Login Date</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">4. Category *</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">5. Product *</TableHead>
                                <TableHead className="min-w-[250px] font-bold text-[10px] uppercase tracking-wider text-slate-500">6. Relationship Manager Name</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">7. File Login</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">8. Tracking Number</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">9. Channel Partner *</TableHead>
                                <TableHead className="min-w-[200px] font-bold text-[10px] uppercase tracking-wider text-slate-500">10. Branch Location</TableHead>
                                <TableHead className="min-w-[260px] font-bold text-[10px] uppercase tracking-wider text-slate-500">11. Customer Name *</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">12. DOB</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">13. Phone No.</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">14. Email ID</TableHead>
                                <TableHead className="min-w-[280px] font-bold text-[10px] uppercase tracking-wider text-slate-500">15. Customer Address</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">16. Firm Name</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">17. File Status *</TableHead>
                                <TableHead className="min-w-[220px] font-bold text-[10px] uppercase tracking-wider text-slate-500">18. Sanctioned (₹)</TableHead>
                                <TableHead className="min-w-[220px] font-bold text-[10px] uppercase tracking-wider text-slate-500">19. Disbursed (₹)</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">20. Disbursed Dt</TableHead>
                                <TableHead className="min-w-[210px] font-bold text-[10px] uppercase tracking-wider text-slate-500">21. EMI Date</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">22. Repayment Bank</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">23. Manager Name</TableHead>
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">24. Consultant</TableHead>
                                <TableHead className="min-w-[240px] font-bold text-[10px] uppercase tracking-wider text-slate-500">25. Consultant Email ID</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stagedItems.map((item, index) => {
                                const handleUpdate = (key: string, val: any) => {
                                    const arr = [...stagedItems];
                                    arr[index] = { ...arr[index], [key]: val };
                                    if (key === 'category') {
                                        arr[index].product = '';
                                        if (val === 'Insurance') {
                                            arr[index].fileStatus = '';
                                        } else {
                                            if (['Issued', 'POLICY ISSUED', 'Not Issued'].includes(arr[index].fileStatus || '')) {
                                                arr[index].fileStatus = '';
                                            }
                                        }
                                        if (val === 'Forex') {
                                            arr[index].fileLogin = 'Online';
                                            arr[index].channel = 'SIROI';
                                        }
                                    }
                                    
                                    if (key === 'product') {
                                        if (arr[index].category === 'Loan' && (val === 'Housing Loan/LAP' || val === 'Mortgage' || val === 'Home Loan')) {
                                            arr[index].fileLogin = 'lead force';
                                            if (arr[index].channel !== 'Bank of Baroda' && arr[index].channel !== 'Punjab & Sind Bank') {
                                                arr[index].channel = '';
                                            }
                                        }
                                    }
                                    
                                    if (arr[index].category === 'Insurance') {
                                        if (key === 'fileStatus') {
                                            if (val === 'Issued') {
                                                arr[index].disbursedAmount = arr[index].amount;
                                            } else if (val === 'Not Issued') {
                                                arr[index].disbursedAmount = 0;
                                            }
                                        }
                                        if (key === 'amount' && arr[index].fileStatus === 'Issued') {
                                            arr[index].disbursedAmount = Number(val) || 0;
                                        }
                                    }
                                    
                                    setStagedItems(arr);
                                };
                                const handleRemove = () => setStagedItems(stagedItems.filter((_, i) => i !== index));
                                
                                return (
                                <TableRow key={index} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <TableCell className="p-2">
                                        {(() => {
                                            const rowBranchName = item.branchLocation || activeBranchName;
                                            const rowStaff = orgMembers.filter(m => {
                                                if (!m.branch) return false;
                                                const mB = m.branch.toLowerCase();
                                                const rB = rowBranchName.toLowerCase();
                                                return mB.includes(rB) || rB.includes(mB);
                                            });
                                            return rowStaff.length > 0 ? (
                                                <select
                                                    value={item.staffName || ''}
                                                    onChange={e => handleUpdate('staffName', e.target.value)}
                                                    className={`w-full h-8 text-xs rounded-md px-2 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white border outline-none focus:ring-1 focus:ring-indigo-500 ${
                                                        !item.staffName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <option value="">— Select Staff —</option>
                                                    {rowStaff.map(m => (
                                                        <option key={m.id} value={m.name}>{m.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Input
                                                    value={item.staffName || ''}
                                                    onChange={e => handleUpdate('staffName', e.target.value)}
                                                    placeholder="Staff Name..."
                                                    className={`h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700 ${!item.staffName ? 'border-red-500 border' : ''}`}
                                                />
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.projectionAmt === 0 ? '' : item.projectionAmt}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('projectionAmt', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className="h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.amount === 0 ? '' : item.amount}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('amount', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className={`h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700 ${!item.amount ? 'border-red-500 border' : ''}`}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2"><InlineDatePicker value={item.date || ''} onChange={(val: string) => handleUpdate('date', val)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.category || ''} 
                                            onChange={val => handleUpdate('category', val)} 
                                            options={['Loan', 'Insurance', 'Forex', 'Consultancy', 'Investments'].map(c => ({id: c, name: c === 'Consultancy' ? 'Consulting' : c}))}
                                            placeholder="Category"
                                            buttonClassName={`w-full flex items-center justify-between h-8 px-2 text-xs rounded-md bg-transparent border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!item.category ? 'border border-red-500' : 'border'}`}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.product || ''} 
                                            onChange={val => handleUpdate('product', val)} 
                                            options={allowedProducts(item.category).map((p: any) => ({id: p.name, name: p.name}))}
                                            placeholder="Product"
                                            buttonClassName={`w-[100px] flex items-center justify-between h-8 px-2 text-xs rounded-md bg-transparent border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!item.product ? 'border border-red-500' : 'border'}`}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2"><Input value={item.relationshipManagerName || ''} onChange={e => handleUpdate('relationshipManagerName', e.target.value)} placeholder="RM Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.fileLogin || ''} 
                                            onChange={val => handleUpdate('fileLogin', val)} 
                                            options={(item.category === 'Insurance' || item.category === 'Forex')
                                                ? [{id: 'Online', name: 'Online'}]
                                                : (item.category === 'Loan' && (item.product === 'Housing Loan/LAP' || item.product === 'Mortgage' || item.product === 'Home Loan'))
                                                ? [{id: 'lead force', name: 'lead force'}]
                                                : ['WBO', 'EXPRESS LINK', 'ILENS', 'Online', 'Branch walkin', 'lead force'].map(c => ({id: c, name: c}))
                                            }
                                            placeholder="File Login"
                                            buttonClassName={`w-[100px] flex items-center justify-between h-8 px-2 text-xs rounded-md bg-transparent border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white border`}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2"><Input value={item.trackingNumber || ''} onChange={e => handleUpdate('trackingNumber', e.target.value)} placeholder="Track No..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.channel || ''} 
                                            onChange={val => handleUpdate('channel', val)} 
                                            options={item.category === 'Insurance' 
                                                ? ['Bajaj Allianz', 'Aditya Birla', 'LIC', 'ICICI Lombard', 'Niva Bupa', 'Tata AIG', 'Manipal Cigna', 'Star Health', 'Care Health', 'SBI', 'Magma', 'Galaxy Health', 'SIROI', 'Bank of Baroda', 'Punjab & Sind Bank'].map(c => ({id: c, name: c}))
                                                : item.category === 'Forex' ? [{id: 'SIROI', name: 'SIROI'}]
                                                : (item.category === 'Loan' && (item.product === 'Housing Loan/LAP' || item.product === 'Mortgage' || item.product === 'Home Loan')) ? ['Bank of Baroda', 'Punjab & Sind Bank'].map(c => ({id: c, name: c}))
                                                : channels.map((c: any) => ({id: c.name, name: c.name}))
                                            }
                                            placeholder="Channel"
                                            buttonClassName={`w-[100px] flex items-center justify-between h-8 px-2 text-xs rounded-md bg-transparent border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!item.channel ? 'border border-red-500' : 'border'}`}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <BranchSelect 
                                            value={item.branchLocation || ''} 
                                            onChange={val => handleUpdate('branchLocation', val)} 
                                            branches={branches}
                                            valueField="name"
                                            className="w-[120px]"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2"><Input value={item.customerName || ''} onChange={e => handleUpdate('customerName', e.target.value)} placeholder="Customer..." className={`h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700 ${!item.customerName ? 'border-red-500 border' : ''}`} /></TableCell>
                                    <TableCell className="p-2"><InlineDatePicker value={item.customerDOB || ''} onChange={(val: string) => handleUpdate('customerDOB', val)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.phoneNumber || ''} onChange={e => handleUpdate('phoneNumber', e.target.value.replace(/\D/g,''))} placeholder="Phone..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input type="email" value={item.emailId || ''} onChange={e => handleUpdate('emailId', e.target.value)} placeholder="Email..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.customerAddress || ''} onChange={e => handleUpdate('customerAddress', e.target.value)} placeholder="Address..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.firmName || ''} onChange={e => handleUpdate('firmName', e.target.value)} placeholder="Firm Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.fileStatus || ''} 
                                            onChange={val => handleUpdate('fileStatus', val)} 
                                            options={item.category === 'Insurance' 
                                                ? ['Issued', 'Not Issued'].map(c => ({id: c, name: c}))
                                                : item.category === 'Loan'
                                                ? ['Login', 'Underwriting', 'Sanctioned', 'Disbursed', 'Customer Reject', 'Rejected'].map(c => ({id: c, name: c}))
                                                : ['Login', 'Processing', 'Sanctioned', 'Disbursed', 'Customer Reject', 'Rejected'].map(c => ({id: c, name: c}))
                                            }
                                            placeholder="Status"
                                            buttonClassName={`w-[90px] flex items-center justify-between h-8 px-2 text-xs rounded-md bg-transparent border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!item.fileStatus ? 'border border-red-500' : 'border'}`}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.sanctionedAmount === 0 ? '' : item.sanctionedAmount}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('sanctionedAmount', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className="h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.disbursedAmount === 0 ? '' : item.disbursedAmount}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('disbursedAmount', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className="h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2"><InlineDatePicker value={item.disbursedDate || ''} onChange={(val: string) => handleUpdate('disbursedDate', val)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><InlineDatePicker value={item.emiDate || ''} onChange={(val: string) => handleUpdate('emiDate', val)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.repaymentBank || ''} onChange={e => handleUpdate('repaymentBank', e.target.value)} placeholder="Bank..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.managerName || ''} onChange={e => handleUpdate('managerName', e.target.value)} placeholder="Manager..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <select
                                            value={item.consultantName || ''}
                                            onChange={e => {
                                                handleUpdate('consultantName', e.target.value);
                                                const consultant = consultants.find(c => c.name === e.target.value);
                                                if (consultant) {
                                                    handleUpdate('consultantEmail', consultant.email);
                                                } else {
                                                    handleUpdate('consultantEmail', '');
                                                }
                                            }}
                                            className="w-full h-8 text-xs rounded-md px-2 bg-transparent text-slate-900 dark:text-white border outline-none focus:ring-1 focus:ring-indigo-500 border-slate-200 dark:border-slate-700"
                                        >
                                            <option value="">— Select —</option>
                                            {consultants.map(c => (
                                                <option key={c.id} value={c.name} className="bg-slate-800 text-white">{c.name}</option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2"><Input type="email" value={item.consultantEmail || ''} onChange={e => handleUpdate('consultantEmail', e.target.value)} placeholder="Consultant Email..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2 text-right">
                                        <button onClick={handleRemove} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                    </TableCell>
                                </TableRow>

                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="p-6 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Input 
                            placeholder="Your Name *" 
                            value={lodgeName} 
                            onChange={e => setLodgeName(e.target.value)} 
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs w-full md:w-48"
                        />
                        <Input 
                            placeholder="Your @siroiforex.com Email *" 
                            value={lodgeEmail} 
                            onChange={e => setLodgeEmail(e.target.value)} 
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs w-full md:w-56"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                    {error && <div className="text-xs text-red-500 font-bold bg-white dark:bg-slate-900 border border-red-500/20 px-4 py-2 rounded shadow-sm w-full mb-3">{error}</div>}
                    <Button variant="secondary" onClick={() => { setIsStagingModalOpen(false); setStagedItems([]); setStagedFile(null); }}>Discard</Button>
                    <Button onClick={handleBulkSubmit} disabled={isBulkSubmitting || stagedItems.length === 0 || !lodgeName || !lodgeEmail.endsWith('@siroiforex.com')} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px]">
                        {isBulkSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lodging...</> : <><Save className="w-4 h-4 mr-2" /> Approve & Lodge</>}
                    </Button>
                </div>
            </div>
          </div>
          </div>
        )}

        {/* Context Modal */}
        {showContextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" onClick={() => setShowContextModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white">Start New Entry</h2>
                   <p className="text-sm text-slate-500 mt-1">Please confirm your session parameters before logging data.</p>
               </div>
               <div className="p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-900/50">
                   {/* Branch Selector (Admin Only) */}
                   {user?.role === 'admin' && (
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                               Branch Name
                           </label>
                           <select 
                               className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-sm rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                               value={adminSelectedBranch}
                               onChange={(e) => setAdminSelectedBranch(e.target.value)}
                           >
                               {branches.filter(b => b.name !== 'HO' && b.name !== 'Test Branch').map(b => (
                                   <option key={b.id} value={b.id}>{b.name}</option>
                               ))}
                           </select>
                       </div>
                   )}

                   {/* Tracking Mode */}
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                           Tracking Mode
                       </label>
                       <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
                           <button 
                               className={`flex-1 text-xs font-bold py-2 rounded-md uppercase tracking-widest transition-colors ${entryMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                               onClick={() => {
                                   setEntryMode('monthly');
                                   setDateStr('2026-04-01');
                               }}
                           >
                               Monthly
                           </button>
                           <button 
                               className={`flex-1 text-xs font-bold py-2 rounded-md uppercase tracking-widest transition-colors ${entryMode === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                               onClick={() => {
                                   setEntryMode('daily');
                                   const today = new Date().toISOString().split('T')[0];
                                   setDateStr(today >= '2026-01-01' ? today : '2026-01-01');
                               }}
                           >
                               Daily
                           </button>
                       </div>
                   </div>

                   {/* Date Context */}
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                           Date
                       </label>
                       {entryMode === 'monthly' ? (
                            <MonthPicker 
                                value={dateStr.substring(0, 7)}
                                onChange={(val) => setDateStr(val + '-01')}
                                buttonClassName="w-full h-10 px-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            />
                        ) : (
                            <InlineDatePicker 
                                min="2026-01-01"
                                value={dateStr}
                                onChange={setDateStr}
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full"
                            />
                        )}
                   </div>

                   </div>
               <div className="p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Button variant="secondary" onClick={() => setShowContextModal(false)} className="flex-1">Cancel</Button>
                  <Button onClick={() => { setShowContextModal(false); if(items.length===0) handleAddItem(); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30">Start Entry</Button>
               </div>
            </div>
          </div>
        )}

        {/* Projection Modal */}
        {isProjectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" onClick={() => setIsProjectionModalOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white">Lodge Daily Projection</h2>
                   <p className="text-sm text-slate-500 mt-1">Set the expected business projection for {dateStr}. This cannot be modified after 11 AM.</p>
               </div>
               <div className="p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-900/50">
                    {isProjectionLodged && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                            <span className="font-bold uppercase tracking-wider block mb-1">Projection Already Set</span>
                            The target projection for today was previously lodged as ₹{lodgedProjectionAmount.toLocaleString('en-IN')}. You can override this by entering a new amount below.
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block border-b border-slate-200 dark:border-slate-700 pb-2">
                            {isProjectionLodged ? 'Override Category Projections (₹)' : 'Category Projections (₹)'}
                        </label>
                        <div className="flex flex-col gap-3">
                            {Object.keys(projectionInputs).map((cat) => (
                                <div key={cat} className="flex items-center gap-3">
                                    <span className="w-28 text-sm font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                                    <NumericFormat
                                        value={projectionInputs[cat]}
                                        onValueChange={(values) => setProjectionInputs(prev => ({ ...prev, [cat]: values.floatValue || 0 }))}
                                        thousandSeparator=","
                                        thousandsGroupStyle="lakh"
                                        prefix="₹ "
                                        className={`flex-1 bg-white dark:bg-slate-900 border ${isProjectionLodged ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-indigo-500'} p-2 text-md font-bold rounded-md focus:ring-2 outline-none transition-colors`}
                                    />
                                </div>
                            ))}
                            <div className="flex items-center gap-3 pt-3 mt-1 border-t border-slate-200 dark:border-slate-700">
                                <span className="w-28 text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Total</span>
                                <div className="flex-1 p-2 text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800/50">
                                    ₹ {Object.values(projectionInputs).reduce((a, b) => a + (b || 0), 0).toLocaleString('en-IN')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                            Reason / Remarks
                        </label>
                        <select 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-sm rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={projectionReason}
                            onChange={(e) => setProjectionReason(e.target.value)}
                        >
                            <option value="Business as Usual">Business as Usual</option>
                            <option value="Holiday">Holiday</option>
                            <option value="Low Walk-ins Expected">Low Walk-ins Expected</option>
                            <option value="High Walk-ins Expected">High Walk-ins Expected</option>
                            <option value="Special Drive">Special Drive</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
               </div>
               <div className="p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Button variant="secondary" onClick={() => setIsProjectionModalOpen(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleLodgeProjection} disabled={isLodgingProjection || Object.values(projectionInputs).reduce((a, b) => a + (b || 0), 0) < 0} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30">
                      {isLodgingProjection ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lodging...</> : 'Lodge Projection'}
                  </Button>
               </div>
            </div>
          </div>
        )}
        
        {/* Success Modal */}
        {showSuccessModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Save className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Record Lodged Successfully
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            Your entries have been successfully saved to the database.
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 mb-6 text-left">
                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-1 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Important Rule
                            </h4>
                            <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                                Please remember that these entries will remain fully <strong>editable for up to 60 days</strong> from their creation date. You can always come back to modify details, add missing manual rows, or update the file status.
                            </p>
                        </div>
                        <Button 
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold py-3"
                        >
                            Acknowledge
                        </Button>
                    </div>
                </div>
            </div>
        )}
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto" onClick={() => setIsAuditModalOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div 
              className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Upload Audit Logs
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Your recent bulk upload history and source files.</p>
                  </div>
                  <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                      <X size={20} />
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                  <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200 dark:border-white/10 hover:bg-transparent">
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[220px] pl-4">Upload Date & Time</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[180px] text-center">Uploaded By</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[250px] text-center">Email ID</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 text-center">Original Filename</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 text-center w-[150px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingAuditLogs ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                                            Loading logs...
                                        </TableCell>
                                    </TableRow>
                                ) : executiveAuditLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    executiveAuditLogs.map((log) => (
                                        <TableRow key={log.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {format(new Date(log.uploaded_at), "dd MMM yyyy, hh:mm a")}
                                            </TableCell>
                                            <TableCell className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap text-center">
                                                {log.uploaded_by}
                                            </TableCell>
                                            <TableCell className="p-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap text-center">
                                                {log.email_id}
                                            </TableCell>
                                            <TableCell className="p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap text-center">
                                                {log.filename}
                                            </TableCell>
                                            <TableCell className="p-4 text-center whitespace-nowrap">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    onClick={async () => {
                                                        try {
                                                            const { data, error } = await supabase.storage.from("bulk_uploads").download(log.file_url);
                                                            if (error) throw error;
                                                            const url = URL.createObjectURL(data);
                                                            const a = document.createElement("a");
                                                            a.href = url;
                                                            a.download = log.filename;
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                        } catch (err) {
                                                            alert("Failed to download file.");
                                                        }
                                                    }}
                                                    className="gap-2 text-xs h-8 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <Download size={14} />
                                                    Download File
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                  </div>
              </div>
            </div>
          </div>
        )}

      {showDatePicker && (
        <CustomDatePicker 
          selectedDate={dateStr}
          onChange={(date) => {
              if (isDirty && !window.confirm("You have unsaved rows. Changing date will discard them. Continue?")) return;
              setDateStr(date);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}





