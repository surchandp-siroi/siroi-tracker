import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardContent, CardHeader, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { UploadCloud, FileSpreadsheet, Loader2, Save, LogOut, CheckCircle2, Trash2, IndianRupee, Layers, Tag, Network, AlertTriangle, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useDataStore, EntryItem } from '@/store/useDataStore';
import * as XLSX from 'xlsx';
import { NumericFormat } from 'react-number-format';
import { BranchSelect } from '@/components/BranchSelect';
import { AppSelect } from '@/components/AppSelect';

export default function DataEntryTerminal() {
  const { user, isInitialized, logout } = useAuthStore();
  const navigate = useNavigate();
  const { products, channels, branches, branchTargets } = useDataStore();

  const [entryMode, setEntryMode] = useState<'daily'|'monthly'>(
      new Date() >= new Date('2026-01-01T00:00:00Z') ? 'daily' : 'monthly'
  );
  const [dateStr, setDateStr] = useState<string>(() => {
      const today = new Date().toISOString().split('T')[0];
      return today >= '2026-01-01' ? today : '2026-01-01';
  });
  
  const [items, setItems] = useState<EntryItem[]>([]);
  const [smartPrompt, setSmartPrompt] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [stagedItems, setStagedItems] = useState<EntryItem[]>([]);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [lodgeName, setLodgeName] = useState('');
  const [lodgeEmail, setLodgeEmail] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  // Projection states
  const [isProjectionLodged, setIsProjectionLodged] = useState(false);
  const [lodgedProjectionAmount, setLodgedProjectionAmount] = useState(0);
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState(false);
  const [projectionInputs, setProjectionInputs] = useState<Record<string, number>>({
      Loan: 0, Insurance: 0, Forex: 0, Consultancy: 0, Investments: 0
  });
  const [projectionReason, setProjectionReason] = useState<string>('Business as Usual');
  const [isLodgingProjection, setIsLodgingProjection] = useState(false);
  
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [entryCreatedAt, setEntryCreatedAt] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [branchDetails, setBranchDetails] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [selectedDeleteIndices, setSelectedDeleteIndices] = useState<Set<number>>(new Set());
  
  // Admin Context
  const [adminSelectedBranch, setAdminSelectedBranch] = useState<string>('');
  
  const fetchCache = useRef<Record<string, any>>({});
  const [fetchError, setFetchError] = useState(false);

  // 60-day deletion window from entry creation date
  const daysSinceCreation = entryCreatedAt
    ? Math.floor((Date.now() - new Date(entryCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const allowDeletion = hasExistingEntry && (user?.role === 'admin' || daysSinceCreation < 60);
  const daysRemaining = Math.max(0, 60 - daysSinceCreation);

  const isBackdoor = user?.role === 'admin' || user?.email === 'executive@siroiforex.com';
  const isExecutive = user?.email === 'executive@siroiforex.com';
  const isExecutiveOverride = hasExistingEntry && isExecutive;
  
  // Projection logic
  const currentJsDate = new Date();
  const isSunday = currentJsDate.getDay() === 0;
  const isPastMay1 = currentJsDate >= new Date('2026-05-01T00:00:00');
  const isPast11AM = currentJsDate.getHours() >= 11;
  const isTimeLocked = isPastMay1 && isPast11AM;
  const isProjectionLocked = isSunday || isTimeLocked || isProjectionLodged;
  const isGridBlocked = entryMode === 'daily' && !isSunday && !isProjectionLodged && user?.role !== 'admin' && !isBackdoor;

  const canModify = (!hasExistingEntry || isExecutiveOverride) && !isGridBlocked;
  const activeBranchId = isBackdoor ? adminSelectedBranch : user?.branchId;

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
      navigate('/login');
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
                  setTimeout(() => reject(new Error('TIMEOUT')), 3000)
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
  }, [activeBranchId, dateStr, entryMode, branches]);

  const processFile = async (file: File) => {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
          setError("Smart upload unavailable. Contact admin to set Gemini API key.");
          return;
      }
      
      setIsParsing(true);
      setUploadProgress(0);
      setError('');
      
      try {
          // Asynchronous reading to unblock UI thread
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              reader.onprogress = (e) => {
                  if (e.lengthComputable) {
                      const percent = Math.round((e.loaded / e.total) * 30); // Reading is 30%
                      setUploadProgress(percent);
                  }
              };
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = () => reject(reader.error);
              reader.readAsArrayBuffer(file);
          });
          
          setUploadProgress(40);
          await new Promise(resolve => setTimeout(resolve, 50)); // Yield thread to allow UI to update

          const workbook = XLSX.read(buffer, { type: 'array' });
          setUploadProgress(50);
          await new Promise(resolve => setTimeout(resolve, 50)); // Yield thread
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (json.length === 0) {
              setError("The uploaded file appears to be empty.");
              setIsParsing(false);
              return;
          }

          setUploadProgress(60);
          
          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
          const prompt = `
            You are a strict data extraction AI. Extract financial entry data from the following raw JSON representing an uploaded Excel/CSV file.
            Ignore junk rows like headers, footers, totals, or blank lines.
            
            Return ONLY a valid JSON array of objects without markdown formatting.
            Each object MUST represent a valid row and have these EXACT keys:
            - "date": Map to Login Date (format YYYY-MM-DD). Use the specific date for the row. Do NOT assume a global date.
            - "staffName": string
            - "customerName": string
            - "category": Must be one of ["Loan", "Insurance", "Forex", "Consultancy", "Investments"].
            - "product": Must be one of: ${products.map((p: any) => p.name).join(', ')}
            - "rmName": string (Extract Relationship Manager Name)
            - "fileLogin": string (e.g. WBO, EXPRESS LINK, ILENS) or empty if not applicable.
            - "trackingNumber": string or empty if not applicable.
            - "channel": Must be one of: ${channels.map((c: any) => c.name).join(', ')}. Or Bajaj Allianz, Aditya Birla, LIC if Insurance.
            - "branchLocation": Map to Branch name exactly as: ${branches.map((b: any) => b.name).join(', ')}. Use the specific branch for the row.
            - "customerDOB": string
            - "phoneNumber": string
            - "emailId": string
            - "customerAddress": string
            - "firmName": string
            - "amount": Positive number. Extract directly from the "Projection" or "Login Amt" column. This serves as the Projection.
            - "fileStatus": string
            - "sanctionedAmount": number
            - "disbursedAmount": Positive number. Extract directly from the "Disbursed Amount" or "Disbursed Amt" column. This serves as the Achievement.
            - "disbursedDate": string
            - "emiDate": string
            - "repaymentBank": string
            - "managerName": string
            - "consultantName": string
            
            Raw Spreadsheet JSON:
            ${JSON.stringify(json).substring(0, 50000)} // Limiting to ~50k chars to avoid token limits
          `;
          
          setUploadProgress(70);
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
          });
          setUploadProgress(90);
          
          const text = response.text || "[]";
          const _clean = text.replace(new RegExp('```json', 'g'), '').replace(new RegExp('```', 'g'), '').trim();
          let parsed = JSON.parse(_clean);
          
          setUploadProgress(100);

          if (Array.isArray(parsed) && parsed.length > 0) {
              // STRICT SEPARATION: Set staged items and open modal
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
                  return { ...p, product: prod, isManual: true, projectionAmt: Number(p.amount) || 0, amount: Number(p.disbursedAmount) || 0 };
              });
              setStagedItems(parsed);
              setStagedFile(file);
              setIsStagingModalOpen(true);
          } else {
              setError("Could not extract valid entries from the file.");
          }
      } catch (e: any) {
          console.error("AI Parse Error:", e);
          setError("Failed to process file. Ensure it's a valid Excel/CSV with readable data.");
      } finally {
          setIsParsing(false);
          // Wait briefly before resetting progress so user sees 100%
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
          consultantName: ''
      }]);
  };
  
  const handleUpdateItem = (index: number, key: string, val: string | number) => {
      const arr = [...items];
      arr[index] = { ...arr[index], [key]: val };
      
      // Auto-update product if category changes
      if (key === 'category') {
          arr[index].product = ''; // reset
          if (val !== 'Loan') {
              arr[index].fileLogin = ''; // reset if not Loan
          }
      }
      
      setItems(arr);
  };
  
  const handleRemoveItem = (index: number) => {
      setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
      if (!activeBranchId) {
          setError("You do not have a branch assigned yet. Contact Administrator.");
          return;
      }
      
      // 11:00 AM restriction check for Projections (Post May 15, 2026)
      // 11:00 AM restriction check removed due to unified entry logic
      
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
              
              items: items,
              totalAmount,
              authorId: user?.id,
              authorEmail: user?.email,
              location: user?.latestLocation || null,
          };

          // Check if an entry already exists for this branch+date+mode+recordType
          const { data: existing } = await supabase
            .from('entries')
            .select('id')
            .eq('branchId', activeBranchId)
            .eq('entryDate', dateStr)
            .eq('mode', entryMode)
            
            .limit(1);

          let savedId: string | null = null;

          if (existing && existing.length > 0) {
              // Update the existing entry
              const { error: updateError } = await supabase
                .from('entries')
                .update({ items, totalAmount, authorId: user?.id, authorEmail: user?.email, location: user?.latestLocation || null })
                .eq('id', existing[0].id);
              if (updateError) throw new Error(updateError.message);
              savedId = existing[0].id;
          } else {
              // Insert new entry and capture the returned ID
              const { data: insertData, error: insertError } = await supabase
                .from('entries')
                .insert([{ ...payload, createdAt: new Date().toISOString() }])
                .select('id');
              if (insertError) throw new Error(insertError.message);
              savedId = insertData?.[0]?.id || null;
          }
          
          setSuccess("Tracking submitted successfully. Record locked.");
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
              items: Object.entries(projectionInputs).map(([cat, amt]) => ({
                  isManual: true,
                  category: cat,
                  product: 'Grouped',
                  projectionAmt: amt || 0,
                  amount: amt || 0,
                  reason: projectionReason
              })),
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
                .select('id, items')
                .eq('branchId', activeBranchId)
                .eq('entryDate', rowDate)
                .eq('mode', entryMode)
                
                .limit(1);
                
              let mergedItems = rItems;
              let existingId = undefined;

              if (existing && existing.length > 0) {
                  existingId = existing[0].id;
                  const existingItems = existing[0].items || [];
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
          case 'Login': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
          case 'Processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
          case 'Sanctioned': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
          case 'Disbursed': return 'bg-green-500/20 text-green-400 border-green-500/30';
          case 'Rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
          default: return 'bg-slate-900/50 text-slate-300 border-slate-700';
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

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col w-full">
        <header className="glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 rounded-xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
                    {user.role === 'admin' ? 'Admin Access Terminal' : 'State Head Terminal'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                   {branchDetails ? branchDetails.name : 'Unknown Branch'} • {user.email}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs" onClick={() => navigate('/audit-logs')}>
                    Audit Logs
                </Button>
                <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs" onClick={() => { logout(); navigate('/login'); }}>
                    <LogOut size={14} className="mr-2" /> Log Out
                </Button>
            </div>
        </header>
             {/* Sticky Top Control Bar */}
        <div className="sticky top-0 z-20 glass bg-slate-900/80 dark:bg-black/80 backdrop-blur-md border border-slate-900/10 dark:border-white/10 p-4 mb-6 rounded-xl shadow-lg flex flex-col gap-4">
            
            {/* Row 1: Context Controls */}
            <div className="flex flex-wrap items-end gap-4">
                {(user.role === 'admin' || isBackdoor) && (
                    <div className="w-[150px] shrink-0">
                        <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 block">
                            {isBackdoor ? 'Branch Override (Test)' : 'Admin Branch Override'}
                        </label>
                        <BranchSelect 
                            value={adminSelectedBranch || ''}
                            onChange={(val) => {
                                if (isDirty && !window.confirm("You have unsaved rows. Switching branch will discard them. Continue?")) return;
                                setAdminSelectedBranch(val);
                            }}
                            branches={branches.filter(b => b.name !== 'HO' && b.name !== 'Test Branch')}
                        />
                    </div>
                )}

                <div className="w-[140px] shrink-0">
                    <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 block">
                        Tracking Mode
                    </label>
                    <div className="flex bg-slate-900/10 dark:bg-black/40 rounded-lg p-0.5 border border-slate-900/10 dark:border-white/10">
                        <button 
                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md uppercase tracking-widest transition-colors ${entryMode === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            onClick={() => {
                                if (isDirty && !window.confirm("You have unsaved rows. Switching mode will discard them. Continue?")) return;
                                setEntryMode('monthly');
                                const today = new Date().toISOString().split('T')[0];
                                setDateStr(today >= '2026-01-01' ? today.substring(0, 7) + '-01' : '2026-01-01');
                            }}
                        >
                            Monthly
                        </button>
                        <button 
                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md uppercase tracking-widest transition-colors ${entryMode === 'daily' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
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
                
                <div className="w-[130px] shrink-0">
                    <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 block">
                        Date Context
                    </label>
                    <div>
                    {entryMode === 'monthly' ? (
                        <Input 
                            type="month" 
                            max="2026-04"
                            value={dateStr.substring(0, 7)}
                            onChange={(e) => {
                                if (isDirty && !window.confirm("You have unsaved rows. Changing date will discard them. Continue?")) return;
                                setDateStr(e.target.value + '-01');
                            }}
                            className="bg-slate-900/5 dark:bg-black/40 text-xs h-[30px] border-slate-200 dark:border-white/10 w-full"
                        />
                    ) : (
                        <Input 
                            type="date" 
                            min="2026-01-01"
                            value={dateStr}
                            onChange={(e) => {
                                if (isDirty && !window.confirm("You have unsaved rows. Changing date will discard them. Continue?")) return;
                                setDateStr(e.target.value);
                            }}
                            className="bg-slate-900/5 dark:bg-black/40 text-xs h-[30px] border-slate-200 dark:border-white/10 w-full"
                        />
                    )}
                    </div>
                </div>

                {/* Target */}
                <div className="flex flex-col justify-end shrink-0 min-w-[150px]">
                    <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 block">
                        Target ({dateStr.substring(0, 7)})
                    </label>
                    <div className="flex items-center h-[30px] px-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs font-extrabold text-emerald-700 dark:text-emerald-400 shadow-sm">
                        ₹{((branchTargets?.find(t => t.branchId === activeBranchId && t.monthYear === dateStr.substring(0, 7))?.targetAmount) || branchDetails?.monthlyTarget || 0).toLocaleString('en-IN')}
                    </div>
                </div>

                {/* Current Time Clock */}
                <div className="flex flex-col justify-end shrink-0 min-w-[120px]">
                    <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 block">
                        Live Time
                    </label>
                    <div className="flex items-center h-[30px] px-3 bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-md text-[10px] font-mono text-slate-500">
                        {currentTime}
                    </div>
                </div>
            </div>

            {/* Row 2: Actions & Projection */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-3">
                <div className="w-[160px] shrink-0">
                    <label className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <UploadCloud size={12} /> Bulk Upload (AI)
                    </label>
                    <label 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex items-center justify-center gap-2 h-[30px] px-2 text-[10px] font-medium rounded-md border border-dashed transition-colors cursor-pointer truncate
                        ${!canModify || isParsing ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 opacity-50 cursor-not-allowed' : isDragging ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 text-indigo-800 dark:text-indigo-200 shadow-sm scale-[1.02]' : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                    >
                        {isParsing ? <Loader2 className="animate-spin w-3 h-3 shrink-0" /> : <FileSpreadsheet className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{isParsing ? `Processing... ${uploadProgress}%` : isDragging ? 'Drop Here' : 'Upload Excel/CSV'}</span>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            className="hidden" 
                            disabled={!canModify || isParsing}
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>

                {/* Projection */}
                <div className="flex-1 flex justify-end items-center gap-4 min-w-[250px]">
                    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
                        <div className="text-slate-500 flex items-center">
                            <button 
                                onClick={() => setIsProjectionModalOpen(true)}
                                className={`px-4 py-1.5 rounded border shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                    isSunday 
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 cursor-not-allowed'
                                    : isProjectionLodged
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                        : isTimeLocked
                                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40'
                                }`}
                            >
                                Projection: <span className="text-sm font-extrabold">₹{(isProjectionLodged ? lodgedProjectionAmount : (branchDetails?.dailyProjection || 0)).toLocaleString('en-IN')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Data Grid Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 shrink-0">
               <div className="flex items-center gap-3">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                       Line Items ({items.length})
                   </h3>
                   {hasExistingEntry && (
                       <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/30">
                           Locked & Processed
                       </span>
                   )}
               </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto">
                {isLoadingExisting ? (
                    <div className="flex justify-center items-center h-full min-h-[200px]"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : (
                    <Table className="min-w-max border-collapse">
                        <TableHeader className="bg-indigo-600 dark:bg-indigo-800 sticky top-0 z-10 box-border shadow-sm">
                            <TableRow>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[230px]">1. Staff Name</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[220px]">2. Projection (₹)</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[200px]">3. Login Date</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[220px]">4. Category</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[240px]">5. Product</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[250px]">6. Relationship Manager Name</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[220px]">7. File Login</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[240px]">8. Tracking Number</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[240px]">9. Channel Partner</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[220px]">10. Branch</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[240px]">11. Customer Name</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[210px]">12. DOB</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[210px]">13. Phone No.</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[240px]">14. Email ID</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[280px]">15. Customer Address</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[240px]">16. Firm Name</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[220px]">17. File Status</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[220px]">18. Sanctioned (₹)</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[220px]">19. Disbursed (₹)</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[210px]">20. Disbursed Dt</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[210px]">21. EMI Date</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[240px]">22. Repayment Bank</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[230px]">23. Manager Name</TableHead>
                                <TableHead className="text-[10px] font-bold py-3 px-3 uppercase tracking-wider text-white min-w-[230px]">24. Consultant</TableHead>
                                <TableHead className="w-[50px] px-2 sticky right-0 bg-indigo-600 dark:bg-indigo-800 z-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={24} className="text-center py-12 text-slate-500 text-[10px] uppercase tracking-widest border-b-0">
                                        No items formulated for {dateStr}
                                    </TableCell>
                                </TableRow>
                            ) : items.map((item, index) => (
                                <TableRow key={index} className="hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border-b border-slate-900/5 dark:border-white/5">
                                    {/* 1. Staff Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className={`h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:text-slate-100 disabled:opacity-50 ${isFieldMissing(item, 'staffName') ? 'border-red-500/50 focus:border-red-500 border' : 'dark:border-white/10 border-transparent'}`}
                                            value={item.staffName || ''}
                                            onChange={(e) => handleUpdateItem(index, 'staffName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 2. Projection (₹) */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <NumericFormat 
                                            customInput={Input}
                                            disabled={!canModify && !item.isManual}
                                            className={`h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:text-slate-100 disabled:opacity-50 ${isFieldMissing(item, 'amount') ? 'border-red-500/50 focus:border-red-500 border' : 'dark:border-white/10 border-transparent'}`}
                                            value={item.amount === 0 ? '' : item.amount}
                                            onValueChange={(values) => handleUpdateItem(index, 'amount', values.floatValue || 0)}
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
                                            onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                                        >
                                            <option value="Loan">Loan</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Forex">Forex</option>
                                            <option value="Consultancy">Consultancy</option>
                                            <option value="Investments">Investments</option>
                                        </select>
                                    </TableCell>

                                    {/* 3. Product */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className={`w-full h-[34px] bg-white dark:bg-slate-900/50 border px-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 ${isFieldMissing(item, 'product') ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-white/10'}`}
                                            value={item.product || ''}
                                            onChange={(e) => handleUpdateItem(index, 'product', e.target.value)}
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
                                            onChange={(e) => handleUpdateItem(index, 'relationshipManagerName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 5. File Login */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={(!canModify && !item.isManual) || item.category !== 'Loan'}
                                            className="w-full h-[34px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 px-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50"
                                            value={item.fileLogin || ''}
                                            onChange={(e) => handleUpdateItem(index, 'fileLogin', e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            <option value="WBO">WBO</option>
                                            <option value="EXPRESS LINK">EXPRESS LINK</option>
                                            <option value="ILENS">ILENS</option>
                                        </select>
                                    </TableCell>

                                    {/* 6. Tracking Number */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={(!canModify && !item.isManual) || (item.category !== 'Loan' && item.category !== 'Insurance')}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.trackingNumber || ''}
                                            onChange={(e) => handleUpdateItem(index, 'trackingNumber', e.target.value)}
                                            placeholder={item.category !== 'Loan' && item.category !== 'Insurance' ? 'N/A' : 'Tracking #'}
                                        />
                                    </TableCell>

                                    {/* 6. Channel Partner */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className={`w-full h-[34px] bg-white dark:bg-slate-900/50 border px-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 ${isFieldMissing(item, 'channel') ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-white/10'}`}
                                            value={item.channel || ''}
                                            onChange={(e) => handleUpdateItem(index, 'channel', e.target.value)}
                                        >
                                            <option value="">Select Channel...</option>
                                            {item.category === 'Insurance' ? (
                                                <>
                                                    <option value="Bajaj Allianz">Bajaj Allianz</option>
                                                    <option value="Aditya Birla">Aditya Birla</option>
                                                    <option value="LIC">LIC</option>
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
                                            onChange={(e) => handleUpdateItem(index, 'customerName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 8. Customer DOB */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="date"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            style={{ colorScheme: 'dark' }}
                                            value={item.customerDOB || ''}
                                            onChange={(e) => handleUpdateItem(index, 'customerDOB', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 9. Phone Number */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.phoneNumber || ''}
                                            onChange={(e) => handleUpdateItem(index, 'phoneNumber', e.target.value.replace(/\D/g,''))}
                                        />
                                    </TableCell>

                                    {/* 11. Email ID */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="email"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.emailId || ''}
                                            onChange={(e) => handleUpdateItem(index, 'emailId', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 12. Customer Address */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.customerAddress || ''}
                                            onChange={(e) => handleUpdateItem(index, 'customerAddress', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 16. Firm Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.firmName || ''}
                                            onChange={(e) => handleUpdateItem(index, 'firmName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 17. File Status */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <select 
                                            disabled={!canModify && !item.isManual}
                                            className={`w-full h-[34px] border px-2 text-xs font-semibold rounded shadow-none disabled:opacity-50 outline-none appearance-none ${item.fileStatus ? getFileStatusColor(item.fileStatus) : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200'} ${isFieldMissing(item, 'fileStatus') ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' : ''}`}
                                            value={item.fileStatus || ''}
                                            onChange={(e) => handleUpdateItem(index, 'fileStatus', e.target.value)}
                                        >
                                            <option value="" className="bg-slate-800 text-white">Select...</option>
                                            <option value="Login" className="bg-slate-800 text-slate-300">Login</option>
                                            <option value="Processing" className="bg-slate-800 text-blue-400">Processing</option>
                                            <option value="Sanctioned" className="bg-slate-800 text-yellow-400">Sanctioned</option>
                                            <option value="Disbursed" className="bg-slate-800 text-green-400">Disbursed</option>
                                            <option value="Rejected" className="bg-slate-800 text-red-400">Rejected</option>
                                        </select>
                                    </TableCell>

                                    {/* 15. Sanctioned Amount */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <NumericFormat 
                                            customInput={Input}
                                            disabled={!canModify && !item.isManual}
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.sanctionedAmount === 0 ? '' : item.sanctionedAmount}
                                            onValueChange={(values) => handleUpdateItem(index, 'sanctionedAmount', values.floatValue || 0)}
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
                                            onValueChange={(values) => handleUpdateItem(index, 'disbursedAmount', values.floatValue || 0)}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                        />
                                    </TableCell>

                                    {/* 17. Disbursed Date */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="date"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            style={{ colorScheme: 'dark' }}
                                            value={item.disbursedDate || ''}
                                            onChange={(e) => handleUpdateItem(index, 'disbursedDate', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 19. EMI Date */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="date"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            style={{ colorScheme: 'dark' }}
                                            value={item.emiDate || ''}
                                            onChange={(e) => handleUpdateItem(index, 'emiDate', e.target.value)}
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
                                            onChange={(e) => handleUpdateItem(index, 'repaymentBank', e.target.value)}
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
                                            onChange={(e) => handleUpdateItem(index, 'managerName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* 22. Consultant Name */}
                                    <TableCell className="py-2 px-2 align-top">
                                        <Input 
                                            disabled={!canModify && !item.isManual}
                                            type="text"
                                            className="h-[34px] text-xs bg-white dark:bg-slate-900/50 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                            value={item.consultantName || ''}
                                            onChange={(e) => handleUpdateItem(index, 'consultantName', e.target.value)}
                                        />
                                    </TableCell>

                                    {/* Remove Button */}
                                    <TableCell className="py-2 px-2 align-top text-right sticky right-0 bg-white dark:bg-slate-900/90 backdrop-blur z-10 border-l border-slate-900/10 dark:border-white/10">
                                        {canModify && (
                                            <button onClick={() => handleRemoveItem(index)} className="mt-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                                                <X size={16} />
                                            </button>
                                        )}
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
                        {isExecutiveOverride ? 'Update Record' : 'Permanently Lodge Record'}
                    </Button>
                )}
            </div>
        </div>

        {/* Padding to allow scrolling past sticky footer */}
        <div className="h-24"></div>

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
                                <TableHead className="min-w-[230px] font-bold text-[10px] uppercase tracking-wider text-slate-500">2. Projection (₹) *</TableHead>
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
                                        if (val !== 'Loan') arr[index].fileLogin = '';
                                    }
                                    setStagedItems(arr);
                                };
                                const handleRemove = () => setStagedItems(stagedItems.filter((_, i) => i !== index));
                                
                                return (
                                <TableRow key={index} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <TableCell className="p-2"><Input value={item.staffName || ''} onChange={e => handleUpdate('staffName', e.target.value)} placeholder="Staff Name..." className={`h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700 ${!item.staffName ? 'border-red-500 border' : ''}`} /></TableCell>
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
                                    <TableCell className="p-2"><Input type="date" value={item.date || ''} onChange={e => handleUpdate('date', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.category || ''} 
                                            onChange={val => handleUpdate('category', val)} 
                                            options={['Loan', 'Insurance', 'Forex', 'Consultancy'].map(c => ({id: c, name: c}))}
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
                                    <TableCell className="p-2"><Input value={item.rmName || ''} onChange={e => handleUpdate('rmName', e.target.value)} placeholder="RM Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.fileLogin || ''} onChange={e => handleUpdate('fileLogin', e.target.value)} disabled={item.category !== 'Loan'} placeholder="e.g. WBO" className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.trackingNumber || ''} onChange={e => handleUpdate('trackingNumber', e.target.value)} placeholder="Track No..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.channel || ''} 
                                            onChange={val => handleUpdate('channel', val)} 
                                            options={item.category === 'Insurance' 
                                                ? ['Bajaj Allianz', 'Aditya Birla', 'LIC'].map(c => ({id: c, name: c}))
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
                                    <TableCell className="p-2"><Input type="date" value={item.customerDOB || ''} onChange={e => handleUpdate('customerDOB', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.phoneNumber || ''} onChange={e => handleUpdate('phoneNumber', e.target.value.replace(/\D/g,''))} placeholder="Phone..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input type="email" value={item.emailId || ''} onChange={e => handleUpdate('emailId', e.target.value)} placeholder="Email..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.customerAddress || ''} onChange={e => handleUpdate('customerAddress', e.target.value)} placeholder="Address..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.firmName || ''} onChange={e => handleUpdate('firmName', e.target.value)} placeholder="Firm Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2">
                                        <AppSelect 
                                            value={item.fileStatus || ''} 
                                            onChange={val => handleUpdate('fileStatus', val)} 
                                            options={['Login', 'Processing', 'Sanctioned', 'Disbursed', 'Rejected'].map(c => ({id: c, name: c}))}
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
                                    <TableCell className="p-2"><Input type="date" value={item.disbursedDate || ''} onChange={e => handleUpdate('disbursedDate', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input type="date" value={item.emiDate || ''} onChange={e => handleUpdate('emiDate', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.repaymentBank || ''} onChange={e => handleUpdate('repaymentBank', e.target.value)} placeholder="Bank..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.managerName || ''} onChange={e => handleUpdate('managerName', e.target.value)} placeholder="Manager..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
                                    <TableCell className="p-2"><Input value={item.consultantName || ''} onChange={e => handleUpdate('consultantName', e.target.value)} placeholder="Consultant..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" /></TableCell>
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
                           <Input 
                               type="month" 
                               max="2026-04"
                               value={dateStr.substring(0, 7)}
                               onChange={(e) => setDateStr(e.target.value + '-01')}
                               className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full"
                               style={{ colorScheme: 'dark' }}
                           />
                       ) : (
                           <Input 
                               type="date" 
                               min="2026-01-01"
                               value={dateStr}
                               onChange={(e) => setDateStr(e.target.value)}
                               className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full"
                               style={{ colorScheme: 'dark' }}
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
    </div>
  );
}
