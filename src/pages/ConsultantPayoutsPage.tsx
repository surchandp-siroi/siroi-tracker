import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '@/components/ui';
import { BranchSelect } from '@/components/BranchSelect';

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
};

export default function ConsultantPayoutsPage() {
  const { user } = useAuthStore();
  const { entries, branches, updateCommission } = useDataStore();
  
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterLocation, setFilterLocation] = useState('all');
  const [commissions, setCommissions] = useState<Record<string, string>>({});
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const handleCommissionChange = (itemId: string, value: string) => {
    setCommissions(prev => ({ ...prev, [itemId]: value }));
  };

  const filteredItems = useMemo(() => {
    let items = entries.flatMap(entry => 
      entry.items.map((item, itemIdx) => ({ 
        ...item, 
        _uniqueId: `${entry.id}-${itemIdx}`,
        _entryId: entry.id,
        _itemIdx: itemIdx,
        _entryDate: entry.entryDate, 
        _branchId: entry.branchId 
      }))
    );
    
    // Only include rows where a consultant is mentioned
    items = items.filter(item => item.consultantName?.trim() || item.consultantEmail?.trim());

    if (filterMonth) {
      items = items.filter(item => {
        const dateToCheck = item.disbursedDate || item._entryDate;
        return dateToCheck?.startsWith(filterMonth);
      });
    }

    if (filterLocation !== 'all') {
      const selectedBranch = branches.find(b => b.id === filterLocation || b.name === filterLocation);
      const branchIdMatch = selectedBranch ? selectedBranch.id : filterLocation;
      const branchNameMatch = selectedBranch ? selectedBranch.name : filterLocation;

      items = items.filter(item => 
        item._branchId === branchIdMatch || 
        item.branchLocation === branchNameMatch ||
        item.branchLocation === branchIdMatch
      );
    }
    
    return items;
  }, [entries, filterMonth, filterLocation, branches]);

  const pendingSaves = useMemo(() => {
    return filteredItems.filter(item => {
      const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined;
      return isEditing && commissions[item._uniqueId] !== undefined && commissions[item._uniqueId] !== '';
    });
  }, [filteredItems, editingIds, commissions]);

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    
    for (const item of pendingSaves) {
      const val = parseFloat(commissions[item._uniqueId]);
      if (!isNaN(val)) {
        const success = await updateCommission(item._entryId, item._itemIdx, val);
        if (success) {
          setEditingIds(prev => ({ ...prev, [item._uniqueId]: false }));
        }
      }
    }
    
    setIsSavingAll(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            Consultant Payouts
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
            Financial Management
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Toolbar / Filters */}
        <div className="flex flex-wrap items-center gap-6 bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="w-48 relative">
              <label className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-2 block">
                Filter by Month
              </label>
              <Input 
                type="month" 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value)} 
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm font-semibold text-slate-700 dark:text-slate-300 h-10"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Filter by Location</label>
                <BranchSelect 
                  value={filterLocation}
                  onChange={setFilterLocation}
                  branches={branches}
                  includeAllOption
                  allOptionText="All Locations"
                  valueField="name"
                  className="w-48 [&>button]:h-10 [&>button]:bg-white dark:[&>button]:bg-slate-950 [&>button]:border-slate-200 dark:[&>button]:border-slate-800 [&>button]:rounded-md [&>button]:shadow-sm"
                />
            </div>
            
            <div className="ml-auto">
              {pendingSaves.length > 0 && (
                <button
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  className="h-10 px-4 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100 dark:border-indigo-500/20"
                >
                  {isSavingAll ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      Save All Changes ({pendingSaves.length})
                    </>
                  )}
                </button>
              )}
            </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <Table>
            <TableHeader className="bg-indigo-50/80 dark:bg-indigo-500/10 border-b border-indigo-100 dark:border-indigo-500/20">
              <TableRow>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Entry Date</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Disbursed Date</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Consultant Name</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Consultant Email</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-right">Disbursed Amount</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-right">Commission (%)</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-right">Settlement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="text-slate-400">!</span>
                      </div>
                      <p>No consultant payouts found for the selected period.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, idx) => {
                  const initial = (item.consultantName || '?').charAt(0).toUpperCase();
                  return (
                    <TableRow key={idx} className="border-b last:border-0 border-slate-100 dark:border-slate-800/50">
                      <TableCell className="px-5 py-4 text-slate-500 text-sm font-medium whitespace-nowrap">
                        {formatDate(item._entryDate)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-slate-500 text-sm font-medium whitespace-nowrap">
                        {formatDate(item.disbursedDate)}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{item.consultantName || 'Unknown'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{branches.find(b => b.id === item._branchId)?.name || 'Unknown Branch'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">
                        {item.consultantEmail || '-'}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          {item.disbursedAmount ? `₹${item.disbursedAmount.toLocaleString('en-IN')}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(() => {
                            const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined;
                            const draftValue = commissions[item._uniqueId] !== undefined ? commissions[item._uniqueId] : (item.commissionPercentage?.toString() || '');
                            
                            if (isEditing) {
                              return (
                                <>
                                  <Input
                                    type="number"
                                    min="0.1"
                                    max="5"
                                    step="0.1"
                                    value={draftValue}
                                    onChange={(e) => handleCommissionChange(item._uniqueId, e.target.value)}
                                    className="w-16 text-right font-medium h-8 bg-slate-50 dark:bg-slate-800/50 px-2"
                                    placeholder="0.0"
                                  />
                                  <button 
                                    onClick={async () => {
                                      const val = parseFloat(draftValue);
                                      if (!isNaN(val)) {
                                        const success = await updateCommission(item._entryId, item._itemIdx, val);
                                        if (success) {
                                          setEditingIds(prev => ({ ...prev, [item._uniqueId]: false }));
                                        }
                                      }
                                    }}
                                    className="h-8 px-3 text-xs font-semibold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-colors"
                                  >
                                    Save
                                  </button>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <span className="font-semibold text-slate-900 dark:text-white mr-1">{item.commissionPercentage}%</span>
                                  <button 
                                    onClick={() => setEditingIds(prev => ({ ...prev, [item._uniqueId]: true }))}
                                    className="h-8 px-3 text-xs font-medium rounded text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors"
                                  >
                                    Edit
                                  </button>
                                </>
                              );
                            }
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg inline-block min-w-[80px]">
                          {(() => {
                            const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined;
                            const draftValue = commissions[item._uniqueId] !== undefined ? commissions[item._uniqueId] : (item.commissionPercentage?.toString() || '');
                            const commNum = isEditing ? parseFloat(draftValue) : item.commissionPercentage;
                            
                            if (commNum && !isNaN(commNum) && commNum >= 0.1 && commNum <= 5 && item.disbursedAmount) {
                              const gross = item.disbursedAmount * (commNum / 100);
                              const net = gross * 0.98; // Deduct 2% TDS
                              return `₹${net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
                            }
                            return '-';
                          })()}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
