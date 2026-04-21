

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardContent, CardHeader, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { Sparkles, Loader2, Save, LogOut, CheckCircle2, Trash2, IndianRupee, Layers, Tag, Network } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useDataStore } from '@/store/useDataStore';

export default function DataEntryTerminal() {
  const { user, isInitialized, logout } = useAuthStore();
  const navigate = useNavigate();
  const { products, channels, branches } = useDataStore();

  const [entryMode, setEntryMode] = useState<'daily'|'monthly'>(
      new Date() >= new Date('2026-05-01T00:00:00Z') ? 'daily' : 'monthly'
  );
  const [dateStr, setDateStr] = useState<string>(() => {
      const today = new Date().toISOString().split('T')[0];
      return today >= '2026-05-01' ? today : '2026-04-01';
  });
  const [items, setItems] = useState<Array<{category: string, product: string, channel: string, amount: number}>>([]);
  const [smartPrompt, setSmartPrompt] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [branchDetails, setBranchDetails] = useState<any>(null);
  
  // Admin Context
  const [adminSelectedBranch, setAdminSelectedBranch] = useState<string>('');

  // Global delete cutoff
  const allowDeletion = user?.role === 'admin' || new Date() < new Date('2026-05-16T00:00:00Z');

  const activeBranchId = user?.role === 'admin' ? adminSelectedBranch : user?.branchId;

  // Unsaved Guard
  const isDirty = !hasExistingEntry && items.length > 0;

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/login');
    }
    // Auto-select first branch for admin
    if (user?.role === 'admin' && branches.length > 0 && !adminSelectedBranch) {
       setAdminSelectedBranch(branches[0].id);
    }
  }, [user, isInitialized, navigate, branches, adminSelectedBranch]);

  // Derived mode
  const isDailyMode = entryMode === 'daily';
  const modeLabel = isDailyMode ? 'Daily Direct Tracking' : 'Monthly Batch Tracking';

  useEffect(() => {
      if (!activeBranchId) return;
      
      const fetchContext = async () => {
          setIsLoadingExisting(true);
          setHasExistingEntry(false);
          
          try {
              // Get branch info
              const b = branches.find(br => br.id === activeBranchId);
              if (b) setBranchDetails(b);
              
              // Check if entry already exists for this exact date AND mode
              const { data: snap } = await supabase
                .from('entries')
                .select('*')
                .eq('branchId', activeBranchId)
                .eq('entryDate', dateStr)
                .eq('mode', entryMode);
              
              if (snap && snap.length > 0) {
                  setHasExistingEntry(true);
                  // Load items to show them what they saved
                  const data = snap[0];
                  setItems(data.items || []);
                  setCurrentEntryId(data.id);
              } else {
                  setHasExistingEntry(false);
                  setItems([]);
                  setCurrentEntryId(null);
              }
          } catch (err: any) {
              console.error("Failed to load context", err);
          } finally {
              setIsLoadingExisting(false);
          }
      };
      fetchContext();
  }, [activeBranchId, dateStr, entryMode, branches]);

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
      setItems([...items, { category: 'Loan', product: '', channel: '', amount: 0 }]);
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
      
      if (items.length === 0) {
          setError("Please add at least one line item.");
          return;
      }
      
      if (items.some(i => !i.category || !i.product || !i.channel || i.amount <= 0)) {
          setError("Please ensure all items have a valid category, product, channel and amount > 0.");
          return;
      }

      setIsSaving(true);
      setError('');
      setSuccess('');
      
      try {
          const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          
          const { error: insertError } = await supabase.from('entries').insert([{
              branchId: activeBranchId,
              entryDate: dateStr,
              mode: entryMode,
              items: items,
              totalAmount,
              authorId: user?.id,
              authorEmail: user?.email,
              location: user?.latestLocation || null,
              createdAt: new Date().toISOString()
          }]);
          
          if (insertError) throw new Error(insertError.message);
          
          setSuccess("Tracking submitted successfully. Record locked.");
          setHasExistingEntry(true);
      } catch (err: any) {
          console.error("Save error:", err);
          setError(err.message || "Failed to submit tracking data.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleDelete = async () => {
      if (!currentEntryId) return;
      if (!window.confirm("Are you sure you want to permanently delete this logged record?")) return;
      
      setIsDeleting(true);
      setError('');
      setSuccess('');
      
      try {
          const { error: deleteError } = await supabase
              .from('entries')
              .delete()
              .eq('id', currentEntryId);
              
          if (deleteError) throw new Error(deleteError.message);
          
          setSuccess("Record permanently deleted.");
          setHasExistingEntry(false);
          setItems([]);
          setCurrentEntryId(null);
          setSmartPrompt('');
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-5xl mx-auto">
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
                       {user.role === 'admin' && (
                           <div className="mb-4">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between mb-2">
                                   Admin Branch Override
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
                                       setDateStr(today >= '2026-05-01' ? today : '2026-05-01');
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
                                   min="2026-05-01"
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
                   <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 shrink-0">Line Items</h3>
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
                                    <TableHead className="text-xs font-semibold py-3 pl-4 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap"><Layers size={14} className="opacity-70" /> Category</div>
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap"><Tag size={14} className="opacity-70" /> Product</div>
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap"><Network size={14} className="opacity-70" /> Channel</div>
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold py-3 px-2 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5 whitespace-nowrap"><IndianRupee size={14} className="opacity-70" /> Amount</div>
                                    </TableHead>
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
                                            <select 
                                                disabled={hasExistingEntry}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50"
                                                value={item.category}
                                                onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                                            >
                                                <option value="Loan">Loan</option>
                                                <option value="Insurance">Insurance</option>
                                                <option value="Forex">Forex</option>
                                                <option value="Consultancy">Consultancy</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="py-2 px-2 align-top">
                                            <select 
                                                disabled={hasExistingEntry}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50"
                                                value={item.product}
                                                onChange={(e) => handleUpdateItem(index, 'product', e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {allowedProducts(item.category).map((p: any) => (
                                                    <option key={p.id} value={p.name}>{p.name}</option>
                                                ))}
                                            </select>
                                        </TableCell>
                                        <TableCell className="py-2 px-2 align-top">
                                            <select 
                                                disabled={hasExistingEntry}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded shadow-none text-slate-900 dark:text-slate-200 disabled:opacity-50"
                                                value={item.channel}
                                                onChange={(e) => handleUpdateItem(index, 'channel', e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {channels.map((c: any) => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </TableCell>
                                        <TableCell className="py-2 px-2 align-top">
                                            <Input 
                                                disabled={hasExistingEntry}
                                                type="number"
                                                className="h-[34px] text-xs bg-white dark:bg-slate-900 dark:border-white/10 dark:text-slate-100 disabled:opacity-50"
                                                value={item.amount === 0 ? '' : item.amount}
                                                onChange={(e) => handleUpdateItem(index, 'amount', parseInt(e.target.value) || 0)}
                                            />
                                        </TableCell>
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
                                        <TableCell colSpan={3} className="text-right p-4 text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest">
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
                                onClick={handleDelete} 
                                disabled={isDeleting}
                                className="flex-1 sm:flex-none text-white font-medium shadow-none"
                             >
                                 {isDeleting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                 Delete Record
                             </Button>
                        )}
                        {!hasExistingEntry && (
                             <Button variant="secondary" onClick={handleAddItem} className="flex-1 sm:flex-none border-slate-900/20 dark:border-white/20 text-xs font-medium">
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
    </div>
  );
}
