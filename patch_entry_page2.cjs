const fs = require('fs');

let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

const stagingModalCode = `
        {/* Staging Modal */}
        {isStagingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-auto bg-black/80 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-slate-900 rounded-xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                                <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Login Date</TableHead>
                                <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Staff Name *</TableHead>
                                <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Customer Name {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Category *</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Product {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Channel Partner {recordType === 'projection' && '*'}</TableHead>
                                <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-wider text-slate-500 min-w-[140px]">Branch Location</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">File Login</TableHead>
                                <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-wider text-slate-500">Amount *</TableHead>
                                <TableHead className="w-[130px] font-bold text-[10px] uppercase tracking-wider text-slate-500">File Status {recordType === 'projection' && '*'}</TableHead>
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
                                    <TableCell className="p-2">
                                        <Input type="date" value={item.date || ''} onChange={e => handleUpdate('date', e.target.value)} className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <Input value={item.staffName} onChange={e => handleUpdate('staffName', e.target.value)} placeholder="Name..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <Input value={item.customerName} onChange={e => handleUpdate('customerName', e.target.value)} placeholder="Customer..." className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.category} onChange={e => handleUpdate('category', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            <option value="Loan">Loan</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Forex">Forex</option>
                                            <option value="Consultancy">Consultancy</option>
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.product} onChange={e => handleUpdate('product', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            {allowedProducts(item.category).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.channel} onChange={e => handleUpdate('channel', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            {item.category === 'Insurance' 
                                                ? ['Bajaj Allianz', 'Aditya Birla', 'LIC'].map(c => <option key={c} value={c}>{c}</option>)
                                                : channels.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                                            }
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.branchLocation} onChange={e => handleUpdate('branchLocation', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Select</option>
                                            {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <Input value={item.fileLogin} onChange={e => handleUpdate('fileLogin', e.target.value)} disabled={item.category !== 'Loan'} placeholder="e.g. WBO" className="h-8 text-xs bg-transparent border-slate-200 dark:border-slate-700" />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <NumericFormat
                                            value={item.amount === 0 ? '' : item.amount}
                                            thousandSeparator=","
                                            thousandsGroupStyle="lakh"
                                            onValueChange={(vals) => handleUpdate('amount', vals.floatValue || 0)}
                                            customInput={Input}
                                            placeholder="₹"
                                            className="h-8 text-xs font-medium text-right bg-transparent border-slate-200 dark:border-slate-700"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <select value={item.fileStatus} onChange={e => handleUpdate('fileStatus', e.target.value)} className="w-full h-8 px-2 text-xs rounded-md bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <option value="" disabled>Status</option>
                                            <option value="Login">Login</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Sanctioned">Sanctioned</option>
                                            <option value="Disbursed">Disbursed</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </TableCell>
                                    <TableCell className="p-2 text-right">
                                        <button onClick={handleRemove} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                    <Button variant="secondary" onClick={() => { setIsStagingModalOpen(false); setStagedItems([]); setStagedFile(null); }}>Discard</Button>
                    <Button onClick={handleBulkSubmit} disabled={isBulkSubmitting || stagedItems.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px]">
                        {isBulkSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lodging...</> : <><Save className="w-4 h-4 mr-2" /> Approve & Lodge</>}
                    </Button>
                </div>
            </div>
          </div>
        )}
`;

content = content.replace("{/* Context Modal */}", stagingModalCode + "\n        {/* Context Modal */}");

fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
console.log("StagingModal Added");
