import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '@/components/ui';
import { BranchSelect } from '@/components/BranchSelect';
import { MonthPicker } from '@/components/ui/month-picker';
import { triggerNotification } from '@/lib/notifications';

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
  const [draftStatuses, setDraftStatuses] = useState<Record<string, 'Not Settled' | 'Settled'>>({});
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const handleCommissionChange = (itemId: string, value: string) => {
    setCommissions(prev => ({ ...prev, [itemId]: value }));
  };
  const handleStatusChange = (itemId: string, val: 'Not Settled' | 'Settled') => {
      setDraftStatuses(prev => ({ ...prev, [itemId]: val }));
  }
  const handleDateChange = (itemId: string, val: string) => {
      setDraftDates(prev => ({ ...prev, [itemId]: val }));
  }

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
      return isEditing && (
        (commissions[item._uniqueId] !== undefined && commissions[item._uniqueId] !== '') ||
        draftStatuses[item._uniqueId] !== undefined ||
        draftDates[item._uniqueId] !== undefined
      );
    });
  }, [filteredItems, editingIds, commissions, draftStatuses, draftDates]);

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    
    for (const item of pendingSaves) {
      const valStr = commissions[item._uniqueId];
      const val = valStr !== undefined ? parseFloat(valStr) : item.commissionPercentage;
      
      const newStatus = draftStatuses[item._uniqueId] ?? item.settlementStatus;
      const newDate = draftDates[item._uniqueId] ?? item.settlementDate;

      if (val !== undefined && !isNaN(val)) {
        const success = await updateCommission(item._entryId, item._itemIdx, { 
            commissionPercentage: val,
            settlementStatus: newStatus,
            settlementDate: newDate
        });
        if (success) {
          setEditingIds(prev => ({ ...prev, [item._uniqueId]: false }));

          if (newStatus === 'Settled' && item.settlementStatus !== 'Settled') {
            const settlementAmount = Math.round(Number(item.disbursedAmount) * (val / 100));
            triggerNotification('payout_settled', {
                email: item.consultantEmail,
                name: item.consultantName,
                amount: settlementAmount
            });
          }
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
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest block">
                Filter by Month
              </label>
              <MonthPicker 
                value={filterMonth} 
                onChange={setFilterMonth} 
                buttonClassName="h-10 px-4 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
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
                  className="min-w-[190px] [&>button]:h-10 [&>button]:bg-white dark:[&>button]:bg-slate-950 [&>button]:border-slate-200 dark:[&>button]:border-slate-800 [&>button]:rounded-xl [&>button]:shadow-sm"
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
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Entry Date</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Disbursed Date</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Consultant Name</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Consultant Email</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Customer Name</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Disbursed Amount</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Commission (%)</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Settlement (₹)</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center">Date of Settlement</TableHead>
                <TableHead className="px-5 py-4 font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
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
                      <TableCell className="px-5 py-4 text-slate-500 text-sm whitespace-nowrap">
                        {item.customerName || '-'}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          {item.disbursedAmount ? `₹${item.disbursedAmount.toLocaleString('en-IN')}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        {(() => {
                          const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined;
                          const draftValue = commissions[item._uniqueId] !== undefined ? commissions[item._uniqueId] : (item.commissionPercentage?.toString() || '');
                          if (isEditing) {
                            return (
                                <Input
                                  type="number"
                                  min="0.1"
                                  max="5"
                                  step="0.1"
                                  value={draftValue}
                                  onChange={(e) => handleCommissionChange(item._uniqueId, e.target.value)}
                                  className="w-16 text-center font-medium h-8 bg-slate-50 dark:bg-slate-800/50 px-2 mx-auto"
                                  placeholder="0.0"
                                />
                            );
                          } else {
                            return <span className="font-semibold text-slate-900 dark:text-white">{item.commissionPercentage}%</span>;
                          }
                        })()}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
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
                      <TableCell className="px-5 py-4 text-center">
                        {(() => {
                          const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined;
                          const draftStatus = draftStatuses[item._uniqueId] ?? (item.settlementStatus || 'Not Settled');
                          if (isEditing) {
                            return (
                                <select
                                  value={draftStatus}
                                  onChange={(e) => handleStatusChange(item._uniqueId, e.target.value as 'Not Settled' | 'Settled')}
                                  className={`h-8 rounded px-2 text-sm font-bold border outline-none focus:ring-2 focus:ring-indigo-500 mx-auto ${draftStatus === 'Settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                                >
                                  <option value="Not Settled" className="text-rose-700 bg-white font-bold">Not Settled</option>
                                  <option value="Settled" className="text-emerald-700 bg-white font-bold">Settled</option>
                                </select>
                            );
                          } else {
                            return (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${item.settlementStatus === 'Settled' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
                                  {item.settlementStatus || 'Not Settled'}
                                </span>
                            );
                          }
                        })()}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        {(() => {
                          const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined;
                          const draftStatus = draftStatuses[item._uniqueId] ?? (item.settlementStatus || 'Not Settled');
                          const draftDate = draftDates[item._uniqueId] ?? (item.settlementDate || '');
                          
                          if (isEditing && draftStatus === 'Settled') {
                            return (
                              <Input
                                type="date"
                                value={draftDate}
                                onChange={(e) => handleDateChange(item._uniqueId, e.target.value)}
                                className="w-32 h-8 text-sm font-medium bg-slate-50 dark:bg-slate-800/50 px-2 mx-auto"
                              />
                            );
                          } else {
                            return (
                              <span className="text-slate-500 text-sm whitespace-nowrap">
                                {item.settlementStatus === 'Settled' ? formatDate(item.settlementDate) : '-'}
                              </span>
                            );
                          }
                        })()}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        {(() => {
                          const isEditing = editingIds[item._uniqueId] || item.commissionPercentage === undefined;
                          const draftValue = commissions[item._uniqueId] !== undefined ? commissions[item._uniqueId] : (item.commissionPercentage?.toString() || '');
                          const draftStatus = draftStatuses[item._uniqueId] ?? (item.settlementStatus || 'Not Settled');
                          const draftDate = draftDates[item._uniqueId] ?? (item.settlementDate || '');
                          
                          if (isEditing) {
                            return (
                                <button 
                                  onClick={async () => {
                                    const val = parseFloat(draftValue);
                                    if (!isNaN(val)) {
                                      const success = await updateCommission(item._entryId, item._itemIdx, {
                                        commissionPercentage: val,
                                        settlementStatus: draftStatus,
                                        settlementDate: draftDate
                                      });
                                      if (success) {
                                        setEditingIds(prev => ({ ...prev, [item._uniqueId]: false }));
                                      }
                                    }
                                  }}
                                  className="h-8 px-3 text-xs font-semibold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-colors whitespace-nowrap"
                                >
                                  Save
                                </button>
                            );
                          } else {
                            return (
                                <button 
                                  onClick={() => setEditingIds(prev => ({ ...prev, [item._uniqueId]: true }))}
                                  className="h-8 px-3 text-xs font-medium rounded text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors whitespace-nowrap"
                                >
                                  Edit
                                </button>
                            );
                          }
                        })()}
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
