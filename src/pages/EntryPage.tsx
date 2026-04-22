

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardContent, CardHeader, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { Sparkles, Loader2, Save, LogOut, CheckCircle2, Trash2, IndianRupee, Layers, Tag, Network, AlertTriangle, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useDataStore } from '@/store/useDataStore';

export default function DataEntryTerminal() {
  const { user, isInitialized, logout } = useAuthStore();
  const navigate = useNavigate();
  const { products, channels, branches } = useDataStore();

  const [entryMode, setEntryMode] = useState<'daily'|'monthly'>(
      new Date() >= new Date('2026-01-01T00:00:00Z') ? 'daily' : 'monthly'
  );
  const [dateStr, setDateStr] = useState<string>(() => {
      const today = new Date().toISOString().split('T')[0];
      return today >= '2026-01-01' ? today : '2026-01-01';
  });
  const [recordType, setRecordType] = useState<'projection' | 'achievement'>('achievement');
  const [items, setItems] = useState<Array<{date: string, staffName: string, customerName: string, category: string, product: string, channel: string, amount: number, status: string, projectionAmt?: number, isManual?: boolean}>>([]);
  const [smartPrompt, setSmartPrompt] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
  const activeBranchId = isBackdoor ? adminSelectedBranch : user?.branchId;

  // Unsaved Guard
  const isDirty = !hasExistingEntry && items.length > 0;

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
      
      const cacheKey = `${activeBranchId}_${dateStr}_${entryMode}_${recordType}`;
      
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
                  setIsLoadingExisting(false);
                  return;
              }
              
              const fetchPromise = supabase
                .from('entries')
                .select('*')
                .eq('branchId', activeBranchId)
                .eq('entryDate', dateStr)
                .eq('mode', entryMode)
                .eq('recordType', recordType);
                
              const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('TIMEOUT')), 3000)
              );
              
              const { data: snap } = await Promise.race([fetchPromise, timeoutPromise]) as any;
              
              if (snap && snap.length > 0) {
                  setHasExistingEntry(true);
                  const data = snap[0];
                  fetchCache.current[cacheKey] = data;
                  setItems(data.items || []);
                  setCurrentEntryId(data.id);
                  setEntryCreatedAt(data.createdAt || null);
              } else {
                  // If it's an achievement and no entry exists, auto-populate from projection
                  if (recordType === 'achievement') {
                      const projKey = `${activeBranchId}_${dateStr}_${entryMode}_projection`;
                      let projData = fetchCache.current[projKey];
                      
                      if (!projData || projData.empty) {
                          const pFetchPromise = supabase
                            .from('entries')
                            .select('*')
                            .eq('branchId', activeBranchId)
                            .eq('entryDate', dateStr)
                            .eq('mode', entryMode)
                            .eq('recordType', 'projection');
                            
                          const { data: pSnap } = await Promise.race([pFetchPromise, timeoutPromise]) as any;
                          
                          if (pSnap && pSnap.length > 0) {
                              projData = pSnap[0];
                              fetchCache.current[projKey] = projData;
                          } else {
                              fetchCache.current[projKey] = { empty: true, items: [] };
                          }
                      }
                      
                      if (projData && !projData.empty && projData.items && projData.items.length > 0) {
                          const grouped = new Map<string, any>();
                          projData.items.forEach((pItem: any) => {
                              const key = `${pItem.staffName}_${pItem.category}`;
                              if (!grouped.has(key)) {
                                  grouped.set(key, {
                                      date: dateStr,
                                      staffName: pItem.staffName,
                                      customerName: 'Grouped', // dummy
                                      category: pItem.category,
                                      product: 'Grouped', // dummy
                                      channel: 'Grouped', // dummy
                                      amount: 0, // achievement starts at 0
                                      status: 'Grouped', // dummy
                                      projectionAmt: Number(pItem.amount) || 0
                                  });
                              } else {
                                  const existing = grouped.get(key);
                                  existing.projectionAmt += (Number(pItem.amount) || 0);
                              }
                          });
                          
                          const newItems = Array.from(grouped.values());
                          fetchCache.current[cacheKey] = { empty: true, items: newItems };
                          setItems(newItems);
                      } else {
                          fetchCache.current[cacheKey] = { empty: true, items: [] };
                          setItems([]);
                      }
                  } else {
                      fetchCache.current[cacheKey] = { empty: true, items: [] };
                      setItems([]);
                  }
                  
                  setHasExistingEntry(false);
                  setCurrentEntryId(null);
                  setEntryCreatedAt(null);
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
  }, [activeBranchId, dateStr, entryMode, recordType, branches]);

  const handleParse = async () => {
      if (!smartPrompt.trim()) return;
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
          setError("Smart fill unavailable. Contact admin to set Gemini API key.");
          return;
      }
      
      setIsParsing(true);
      setError('');
      
      try {
          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
          const prompt = `
            Extract the financial entry data from the following text and format it as a JSON array of objects.
            Each object MUST have these EXACT keys: "category", "product", "channel", and "amount".
            
            Valid Categories: "Loan", "Insurance", "Forex", "Consultancy"
            Valid Products: ${products.map(p => p.name).join(', ')}
            Valid Channels: ${channels.map(c => c.name).join(', ')}
            Amount MUST be a positive number.
            
            Text: "${smartPrompt}"
            
            Return ONLY the valid JSON array without markdown formatting. Example: [{"category": "Loan", "product": "Home Loan", "channel": "HDFC BANK", "amount": 200000}]
          `;
          
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
          });
          
          const text = response.text || "[]";
          const _clean = text.replace(new RegExp('```json', 'g'), '').replace(new RegExp('```', 'g'), '').trim();
          const parsed = JSON.parse(_clean);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
              setItems(prev => [...prev, ...parsed]);
              setSmartPrompt('');
          } else {
              setError("Could not extract numerical items. Try adjusting your phrasing.");
          }
      } catch (e: any) {
          console.error("AI Parse Error:", e);
          setError("Failed to process text. You can add items manually.");
      } finally {
          setIsParsing(false);
      }
  };

  const handleAddItem = () => {
      setItems([...items, { date: dateStr, staffName: '', customerName: '', category: 'Loan', product: '', channel: '', amount: 0, status: '', isManual: true, projectionAmt: 0 }]);
  };
  
  const handleUpdateItem = (index: number, key: string, val: string | number) => {
      const arr = [...items];
      arr[index] = { ...arr[index], [key]: val };
      
      // Auto-update product if category changes
      if (key === 'category') {
          arr[index].product = ''; // reset
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
      if (recordType === 'projection') {
          const now = new Date();
          // Convert to IST: UTC + 5:30
          const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
          const istTime = new Date(utcMs + (330 * 60000));
          const isPast11AM_IST = istTime.getHours() > 11 || (istTime.getHours() === 11 && istTime.getMinutes() > 0);
          
          if (isPast11AM_IST && new Date() > new Date('2026-05-15T00:00:00Z')) {
             setError("Daily Projections must be submitted before 11:00 AM IST.");
             return;
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
          if (recordType === 'projection') {
              if (!item.customerName || !item.customerName.trim()) {
                  setError(`Row ${i + 1} is missing Customer Name. Please fill it before logging.`);
                  return;
              }
              if (!item.product) {
                  setError(`Row ${i + 1} is missing Product. Please select one before logging.`);
                  return;
              }
              if (!item.channel) {
                  setError(`Row ${i + 1} is missing Channel. Please select one before logging.`);
                  return;
              }
              if (item.amount <= 0) {
                  setError(`Row ${i + 1} requires an amount greater than 0.`);
                  return;
              }
              if (!item.status || !item.status.trim()) {
                  setError(`Row ${i + 1} is missing Status. Please fill it before logging.`);
                  return;
              }
          } else {
              if (item.amount < 0) {
                  setError(`Row ${i + 1} requires a valid achieved amount.`);
                  return;
              }
              if (item.isManual && (item.projectionAmt === undefined || item.projectionAmt < 0)) {
                  setError(`Row ${i + 1} requires a valid projection amount.`);
                  return;
              }
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
              recordType: recordType,
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
            .eq('recordType', recordType)
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

  if (!isInitialized || !user) {
      return <div className="min-h-screen flex items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Initializing Identity...</div>;
  }

  const allowedProducts = (category: string) => products.filter((p: any) => p.category === category);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto">
        <header className="glass px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
                    {user.role === 'admin' ? 'Admin Access Terminal' : 'State Head Terminal'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                   {branchDetails ? branchDetails.name : 'Unknown Branch'} • {user.email}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs" onClick={() => { logout(); navigate('/login'); }}>
                    <LogOut size={14} className="mr-2" /> Log Out
                </Button>
            </div>
        </header>
        
        <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 glass border-slate-900/10 dark:border-white/10 self-start">
               <CardHeader className="border-b border-slate-900/10 dark:border-white/10 p-4 bg-slate-900/5 dark:bg-white/5">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Tracking Controls</h3>
               </CardHeader>
               <CardContent className="p-4 space-y-6">
                   <div className="space-y-4">
                       {(user.role === 'admin' || isBackdoor) && (
                           <div className="mb-4">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between mb-2">
                                   {isBackdoor ? 'Branch Override (Testing Mode)' : 'Admin Branch Override'}
                               </label>
                               <select 
                                   className="w-full bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200"
                                   value={adminSelectedBranch}
                                   onChange={(e) => {
                                       if (isDirty && !window.confirm("You have unsaved rows. Switching branch will discard them. Continue?")) return;
                                       setAdminSelectedBranch(e.target.value);
                                   }}
                               >
                                   {branches.filter(b => b.name !== 'HO' && b.name !== 'Test Branch').map(b => (
                                       <option key={b.id} value={b.id}>{b.name}</option>
                                   ))}
                               </select>
                           </div>
                       )}

                       <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between mb-2">
                               Tracking Mode
                           </label>
                           <div className="flex bg-slate-900/5 dark:bg-black/40 p-1 rounded-md">
                               <button 
                                   className={`flex-1 text-[10px] font-bold py-1.5 rounded uppercase tracking-widest transition-colors ${entryMode === 'monthly' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                   onClick={() => {
                                       if (isDirty && !window.confirm("You have unsaved rows. Switching mode will discard them. Continue?")) return;
                                       setEntryMode('monthly');
                                       setDateStr('2026-04-01');
                                   }}
                               >
                                   Monthly
                               </button>
                               <button 
                                   className={`flex-1 text-[10px] font-bold py-1.5 rounded uppercase tracking-widest transition-colors ${entryMode === 'daily' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
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
                       
                       <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between mb-2">
                               Date Context
                           </label>
                           {entryMode === 'monthly' ? (
                               <Input 
                                   type="month" 
                                   max="2026-04"
                                   value={dateStr.substring(0, 7)}
                                   onChange={(e) => {
                                       if (isDirty && !window.confirm("You have unsaved rows. Changing date will discard them. Continue?")) return;
                                       setDateStr(e.target.value + '-01');
                                   }}
                                   className="bg-slate-900/5 dark:bg-black/20 font-medium cursor-pointer"
                                   style={{ colorScheme: 'dark' }}
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
                                   className="bg-slate-900/5 dark:bg-black/20 font-medium cursor-pointer"
                                   style={{ colorScheme: 'dark' }}
                               />
                           )}
                           <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                               Selected mode: <strong className="text-indigo-600 dark:text-indigo-400">{modeLabel}</strong><br/>
                           </p>
                       </div>
                       
                       <div className="pt-2">
                           <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                               <div className="flex justify-between items-center mb-2 pb-2 border-b border-indigo-100 dark:border-indigo-500/20">
                                   <span className="text-[10px] font-bold text-indigo-800/70 dark:text-indigo-300/70 uppercase tracking-widest">Daily Projection</span>
                                   <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">₹ {(branchDetails?.dailyProjection || 0).toLocaleString('en-IN')}</span>
                               </div>
                               <div className="flex justify-between items-center">
                                   <span className="text-[10px] font-bold text-indigo-800/70 dark:text-indigo-300/70 uppercase tracking-widest">Monthly Target</span>
                                   <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">₹ {(branchDetails?.monthlyTarget || 0).toLocaleString('en-IN')}</span>
                               </div>
                           </div>
                       </div>
                   </div>
                   
                   {/* Gemini Component */}
                   <div className="pt-4 border-t border-slate-900/10 dark:border-white/10 space-y-3">
                       <div className="flex items-center gap-2">
                           <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                           <label className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Smart Assist</label>
                       </div>
                       <textarea 
                          disabled={hasExistingEntry}
                          value={smartPrompt}
                          onChange={(e) => setSmartPrompt(e.target.value)}
                          placeholder="E.g., Did 2 lakhs in Axis Home loans and 50k in GST filing..."
                          className="w-full h-24 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-500/20 rounded-md p-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-none disabled:opacity-50 text-slate-900 dark:text-white"
                       />
                       <Button disabled={hasExistingEntry || isParsing || !smartPrompt.trim()} onClick={handleParse} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm">
                           {isParsing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Extract Items from Text'}
                       </Button>
                   </div>
               </CardContent>
            </Card>
            
            <Card className="lg:col-span-2 glass border-slate-900/10 dark:border-white/10 overflow-hidden flex flex-col h-[600px]">
                <CardHeader className="border-b border-slate-900/10 dark:border-white/10 p-4 bg-slate-900/5 dark:bg-white/5 flex flex-row items-center justify-between">
                   <div className="flex items-center gap-4">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 shrink-0">Line Items</h3>
                       <div className="flex bg-slate-900/5 dark:bg-black/40 p-1 rounded-md">
                           <button 
                               className={`text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest transition-colors ${recordType === 'projection' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                               onClick={() => {
                                   if (isDirty && !window.confirm("You have unsaved rows. Switching type will discard them. Continue?")) return;
                                   setRecordType('projection');
                               }}
                           >Daily Projection</button>
                           <button 
                               className={`text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest transition-colors ${recordType === 'achievement' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                               onClick={() => {
                                   if (isDirty && !window.confirm("You have unsaved rows. Switching type will discard them. Continue?")) return;
                                   setRecordType('achievement');
                               }}
                           >Daily Achievement</button>
                       </div>
                   </div>
                   {hasExistingEntry && (
                       <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/30 shrink-0">
                           Locked & Processed
                       </span>
                   )}
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                    {isLoadingExisting ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-slate-300" /></div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-900/5 dark:bg-white/5 sticky top-0 z-10 box-border border-b border-slate-900/10 dark:border-white/10">
                                <TableRow>
                                    <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">Staff Name</div>
                                    </TableHead>
                                    {recordType === 'projection' && (
                                        <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">Customer Name</div>
                                        </TableHead>
                                    )}
                                    <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap"><Layers size={14} className="opacity-70" /> Category</div>
                                    </TableHead>
                                    {recordType === 'projection' && (
                                        <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap"><Tag size={14} className="opacity-70" /> Product</div>
                                        </TableHead>
                                    )}
                                    {recordType === 'projection' && (
                                        <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap"><Network size={14} className="opacity-70" /> Channel</div>
                                        </TableHead>
                                    )}
                                    {recordType === 'achievement' && (
                                        <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap"><IndianRupee size={14} className="opacity-70" /> Projection Amt</div>
                                        </TableHead>
                                    )}
                                    <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap"><IndianRupee size={14} className="opacity-70" /> {recordType === 'achievement' ? 'Achieved Amt' : 'Amount'}</div>
                                    </TableHead>
                                    {recordType === 'projection' && (
                                        <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">Status</div>
                                        </TableHead>
                                    )}
                                    <TableHead className="w-[40px] px-2"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-[10px] uppercase tracking-widest">
                                            No items formulated for {dateStr}
                                        </TableCell>
                                    </TableRow>
                                ) : items.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                        <TableCell className="py-2 pl-4 pr-2 align-top">
                                            <Input 
                                                disabled={hasExistingEntry || (recordType === 'achievement' && !item.isManual)}
                                                type="text"
                                                className="h-[34px] text-xs bg-white dark:bg-slate-900 dark:border-white/10 dark:text-slate-100 disabled:opacity-50 min-w-[120px]"
                                                value={item.staffName || ''}
                                                onChange={(e) => handleUpdateItem(index, 'staffName', e.target.value)}
                                            />
                                        </TableCell>
                                        {recordType === 'projection' && (
                                            <TableCell className="py-2 px-2 align-top">
                                                <Input 
                                                    disabled={hasExistingEntry}
                                                    type="text"
                                                    className="h-[34px] text-xs bg-white dark:bg-slate-900 dark:border-white/10 dark:text-slate-100 disabled:opacity-50 min-w-[120px]"
                                                    value={item.customerName || ''}
                                                    onChange={(e) => handleUpdateItem(index, 'customerName', e.target.value)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell className="py-2 px-2 align-top">
                                            <select 
                                                disabled={hasExistingEntry || (recordType === 'achievement' && !item.isManual)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 min-w-[120px]"
                                                value={item.category || 'Loan'}
                                                onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                                            >
                                                <option value="Loan">Loan</option>
                                                <option value="Insurance">Insurance</option>
                                                <option value="Forex">Forex</option>
                                                <option value="Consultancy">Consultancy</option>
                                            </select>
                                        </TableCell>
                                        {recordType === 'projection' && (
                                            <TableCell className="py-2 px-2 align-top">
                                                <select 
                                                    disabled={hasExistingEntry}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 min-w-[120px]"
                                                    value={item.product || ''}
                                                    onChange={(e) => handleUpdateItem(index, 'product', e.target.value)}
                                                >
                                                    <option value="">Select...</option>
                                                    {allowedProducts(item.category || 'Loan').map((p: any) => (
                                                        <option key={p.id} value={p.name}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                        )}
                                        {recordType === 'projection' && (
                                            <TableCell className="py-2 px-2 align-top">
                                                <select 
                                                    disabled={hasExistingEntry}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50 min-w-[120px]"
                                                    value={item.channel || ''}
                                                    onChange={(e) => handleUpdateItem(index, 'channel', e.target.value)}
                                                >
                                                    <option value="">Select...</option>
                                                    {channels.map((c: any) => (
                                                        <option key={c.id} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                        )}
                                        {recordType === 'achievement' && (
                                            <TableCell className="py-2 px-2 align-top">
                                                {item.isManual ? (
                                                    <Input 
                                                        disabled={hasExistingEntry}
                                                        type="number"
                                                        className="h-[34px] text-xs bg-white dark:bg-slate-900 dark:border-white/10 dark:text-slate-100 disabled:opacity-50 min-w-[100px]"
                                                        value={item.projectionAmt === 0 ? '' : item.projectionAmt}
                                                        onChange={(e) => handleUpdateItem(index, 'projectionAmt', parseInt(e.target.value) || 0)}
                                                    />
                                                ) : (
                                                    <div className="h-[34px] px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-md text-slate-600 dark:text-slate-300 min-w-[100px] flex items-center">
                                                        {item.projectionAmt?.toLocaleString('en-IN') || '0'}
                                                    </div>
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell className="py-2 px-2 align-top">
                                            <Input 
                                                disabled={hasExistingEntry}
                                                type="number"
                                                className="h-[34px] text-xs bg-white dark:bg-slate-900 dark:border-white/10 dark:text-slate-100 disabled:opacity-50 min-w-[100px]"
                                                value={item.amount === 0 ? '' : item.amount}
                                                onChange={(e) => handleUpdateItem(index, 'amount', parseInt(e.target.value) || 0)}
                                            />
                                        </TableCell>
                                        {recordType === 'projection' && (
                                            <TableCell className="py-2 px-2 align-top">
                                                <Input 
                                                    disabled={hasExistingEntry}
                                                    type="text"
                                                    className="h-[34px] text-xs bg-white dark:bg-slate-900 dark:border-white/10 dark:text-slate-100 disabled:opacity-50 min-w-[100px]"
                                                    value={item.status || ''}
                                                    onChange={(e) => handleUpdateItem(index, 'status', e.target.value)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell className="py-2 pr-4 pl-2 align-top text-right">
                                            {!hasExistingEntry && (
                                                <button onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-red-500 pt-2 px-1">
                                                    &times;
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length > 0 && (
                                    <TableRow className="bg-slate-900/5 dark:bg-white/5 font-bold hover:bg-slate-900/5 dark:hover:bg-white/5">
                                        <TableCell colSpan={recordType === 'achievement' ? 3 : 6} className="text-right p-4 text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                            Total Amount:
                                        </TableCell>
                                        <TableCell colSpan={2} className="p-4 text-sm text-indigo-600 dark:text-indigo-400">
                                            ₹ {items.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString('en-IN')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                
                {/* Footer Controls */}
                <div className="border-t border-slate-900/10 dark:border-white/10 p-4 bg-slate-900/5 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
                    <div className="w-full sm:w-auto flex-1">
                        {error && <span className="text-xs text-red-500 font-bold bg-red-500/10 px-3 py-2 rounded">{error}</span>}
                        {success && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2 rounded">{success}</span>}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto shrink-0 justify-end">
                        {hasExistingEntry && allowDeletion && (
                             <Button 
                                variant="danger" 
                                onClick={() => { 
                                  setSelectedDeleteIndices(new Set(items.map((_, i) => i)));
                                  setShowDeleteModal(true); 
                                }} 
                                disabled={isDeleting}
                                className="flex-1 sm:flex-none text-white font-medium shadow-none"
                             >
                                 <Trash2 className="w-4 h-4 mr-2" />
                                 Delete Record
                             </Button>
                        )}
                        {hasExistingEntry && !allowDeletion && daysSinceCreation >= 60 && (
                             <span className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-500/10 px-3 py-2 rounded">
                                 Deletion window expired (60 days)
                             </span>
                        )}
                        {!hasExistingEntry && (
                             <Button variant="secondary" onClick={() => {
                                 if (items.length === 0) {
                                     setShowContextModal(true);
                                 } else {
                                     handleAddItem();
                                 }
                             }} className="flex-1 sm:flex-none border-slate-900/20 dark:border-white/20 text-xs font-medium">
                                 + Manual Row
                             </Button>
                        )}
                        {!hasExistingEntry && (
                            <Button 
                                disabled={isSaving || items.length === 0} 
                                onClick={handleSubmit} 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-none font-medium"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Permanently Lodge Record
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (() => {
          const selectedTotal = items.reduce((s, item, idx) => s + (selectedDeleteIndices.has(idx) ? (Number(item.amount) || 0) : 0), 0);
          const selectedCount = selectedDeleteIndices.size;
          const allSelected = selectedCount === items.length;
          const noneSelected = selectedCount === 0;

          return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div 
              className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-red-50 dark:bg-red-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-900 dark:text-red-100 uppercase tracking-wider">Select Items to Delete</h3>
                    <p className="text-[10px] text-red-700/70 dark:text-red-300/60 uppercase tracking-widest mt-0.5">
                      {branchDetails?.name} • {dateStr} • {entryMode}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Warning Message */}
              <div className="px-5 pt-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    ⚠️ This action is <strong>irreversible</strong>. Select the line items you want to permanently erase. 
                    {allSelected 
                      ? <> Selecting all will delete the <strong>entire record</strong>.</>
                      : <> Unselected items will be preserved in the record.</>
                    }
                  </p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-400/60 mt-2 uppercase tracking-wider">
                    Deletion window: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining out of 60
                  </p>
                </div>
              </div>

              {/* Select All / Deselect All Toggle */}
              <div className="px-5 pt-3 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {selectedCount} of {items.length} item{items.length !== 1 ? 's' : ''} selected
                  {selectedCount > 0 && (
                    <span className="text-red-500 ml-2">
                      (₹{selectedTotal.toLocaleString('en-IN')})
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    if (allSelected) {
                      setSelectedDeleteIndices(new Set());
                    } else {
                      setSelectedDeleteIndices(new Set(items.map((_, i) => i)));
                    }
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Records Preview with Checkboxes */}
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
                          if (isSelected) { next.delete(idx); } else { next.add(idx); }
                          setSelectedDeleteIndices(next);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 text-left ${
                          isSelected 
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-500/30 ring-1 ring-red-500/20'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-red-500 border-red-500'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        
                        {/* Item Number */}
                        <span className="text-[10px] font-bold text-slate-400 w-5 text-center shrink-0">#{idx + 1}</span>
                        
                        {/* Item Details */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-red-900 dark:text-red-200 line-through' : 'text-slate-900 dark:text-white'}`}>{item.product}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.category} • {item.channel}</p>
                        </div>
                        
                        {/* Amount */}
                        <span className={`text-sm font-mono font-bold shrink-0 ml-3 ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 border-slate-300 dark:border-white/20 text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleDelete} 
                  disabled={isDeleting || noneSelected}
                  className="flex-1 text-white font-medium shadow-none"
                >
                  {isDeleting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {noneSelected 
                    ? 'Select items to delete'
                    : allSelected 
                      ? 'Delete Entire Record'
                      : `Delete ${selectedCount} Item${selectedCount > 1 ? 's' : ''}`
                  }
                </Button>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Context Confirmation Modal */}
        {showContextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowContextModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div 
              className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-indigo-50 dark:bg-indigo-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Confirm Entry Context</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Please review before adding manual rows.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                 {(user.role === 'admin' || isBackdoor) && (
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Active Branch</label>
                         <select 
                             className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-2 text-xs rounded text-slate-900 dark:text-white"
                             value={adminSelectedBranch}
                             onChange={(e) => setAdminSelectedBranch(e.target.value)}
                         >
                             {branches.filter(b => b.name !== 'HO' && b.name !== 'Test Branch').map(b => (
                                 <option key={b.id} value={b.id}>{b.name}</option>
                             ))}
                         </select>
                     </div>
                 )}
                 {(!isBackdoor && user.role !== 'admin') && (
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Active Branch</label>
                         <div className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2 text-xs rounded text-slate-500 dark:text-slate-400">
                             {branchDetails?.name || 'Unknown Branch'}
                         </div>
                     </div>
                 )}
                 <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Entry Date</label>
                     <Input 
                         type={entryMode === 'monthly' ? "month" : "date"}
                         value={entryMode === 'monthly' ? dateStr.substring(0, 7) : dateStr}
                         onChange={(e) => setDateStr(entryMode === 'monthly' ? e.target.value + '-01' : e.target.value)}
                         className="bg-slate-50 dark:bg-black/40 text-xs"
                         style={{ colorScheme: 'dark' }}
                     />
                 </div>
                 <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Record Type</label>
                     <select 
                         className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 p-2 text-xs rounded text-slate-900 dark:text-white"
                         value={recordType}
                         onChange={(e) => setRecordType(e.target.value as 'projection' | 'achievement')}
                     >
                         <option value="projection">Daily Projection</option>
                         <option value="achievement">Daily Achievement</option>
                     </select>
                 </div>
              </div>

              <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowContextModal(false)} 
                  className="flex-1 text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  disabled={isLoadingExisting}
                  onClick={() => {
                    setShowContextModal(false);
                    if (!hasExistingEntry && items.length === 0) {
                        handleAddItem();
                    }
                  }} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-none text-xs"
                >
                  {isLoadingExisting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirm & Start
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
