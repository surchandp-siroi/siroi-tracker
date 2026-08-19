const fs = require('fs');

let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

// Chunk 1: Pending shell
content = content.replace(
`            <div className="p-2 bg-slate-900/5 dark:bg-white/5 ring-1 ring-inset ring-slate-900/10 dark:ring-white/10 rounded-[2rem]">
                <div className="bg-white dark:bg-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-[calc(2rem-0.5rem)] overflow-hidden">
                    <div className="flex flex-col space-y-1.5 p-6 md:p-8 border-b border-slate-900/5 dark:border-white/5">`,
`            <div className="bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] ring-1 ring-slate-200/50 dark:ring-white/10 rounded-3xl overflow-hidden">
                <div className="flex flex-col space-y-1.5 p-6 md:p-8 border-b border-slate-100 dark:border-white/5">`
);

// Chunk 2: Table headers (Pending & Approved)
content = content.split(
`<thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">`
).join(
`<thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50">`
);

// Chunk 3 & 10: User Icons (Pending & Approved)
content = content.split(
`                                                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
                                                        <UserCircle className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white text-base">{consultant.name}</div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {consultant.email}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {consultant.phone}</div>
                                                    </div>`
).join(
`                                                    <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 shrink-0">
                                                        <UserCircle className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white text-base">{consultant.name}</div>
                                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Mail className="w-3 h-3 text-cyan-500" /> {consultant.email}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Phone className="w-3 h-3 text-violet-500" /> {consultant.phone}</div>
                                                    </div>`
);

// Chunk 4 & 11: MapPin and CreditCard (Pending & Approved)
content = content.split(
`                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {consultant.state}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{consultant.address}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{consultant.pincode}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" /> {consultant.bank_name}
                                                </div>`
).join(
`                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {consultant.state}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{consultant.address}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{consultant.pincode}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-slate-900 dark:text-white font-medium text-sm flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-amber-500" /> {consultant.bank_name}
                                                </div>`
);

// Chunk 5: Documents (Pending only)
content = content.replace(
`                                                    <button 
                                                        className="h-8 text-xs flex items-center justify-start px-3 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all duration-300 active:scale-[0.98] border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                                                        onClick={() => handleDownload(consultant.pan_file_url, 'PAN_Card')}
                                                    >
                                                        <FileText className="w-3.5 h-3.5 mr-2" /> PAN: {consultant.pan_number}
                                                    </button>
                                                    <button 
                                                        className="h-8 text-xs flex items-center justify-start px-3 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all duration-300 active:scale-[0.98] border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                                                        onClick={() => handleDownload(consultant.aadhar_file_url, 'Aadhar_Card')}
                                                    >
                                                        <FileText className="w-3.5 h-3.5 mr-2" /> Aadhar: {consultant.aadhar_number}
                                                    </button>`,
`                                                    <button 
                                                        className="h-8 text-xs flex items-center justify-start px-3 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-all duration-300 active:scale-[0.98] border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                                                        onClick={() => handleDownload(consultant.pan_file_url, 'PAN_Card')}
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-indigo-500 mr-2" /> PAN: {consultant.pan_number}
                                                    </button>
                                                    <button 
                                                        className="h-8 text-xs flex items-center justify-start px-3 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-all duration-300 active:scale-[0.98] border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                                                        onClick={() => handleDownload(consultant.aadhar_file_url, 'Aadhar_Card')}
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-indigo-500 mr-2" /> Aadhar: {consultant.aadhar_number}
                                                    </button>`
);

// Chunk 6 & 12: Extra closing divs removal
content = content.split(
`                    )}
                    </div>
                </div>
            </div>`
).join(
`                    )}
                </div>
            </div>`
);

// Chunk 7: Approved Shell
content = content.replace(
`            <div className="p-2 bg-slate-900/5 dark:bg-white/5 ring-1 ring-inset ring-slate-900/10 dark:ring-white/10 rounded-[2rem]">
                <div className="bg-white dark:bg-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-[calc(2rem-0.5rem)] overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border-b border-slate-900/5 dark:border-white/5 gap-4">`,
`            <div className="bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] ring-1 ring-slate-200/50 dark:ring-white/10 rounded-3xl overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-white/5 gap-4">`
);

// Chunk 8: Approved Filters
content = content.replace(
`<div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700/50">`,
`<div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm">`
);

fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
