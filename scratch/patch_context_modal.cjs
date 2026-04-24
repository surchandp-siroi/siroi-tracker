const fs = require('fs');

function patchContextModal() {
    let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

    const modalRegex = /{\/\* Context Modal \*\/}[\s\S]*?{showContextModal && \([\s\S]*?<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" onClick={\(\) => setShowContextModal\(false\)}>[\s\S]*?<div className="absolute inset-0 bg-black\/60 backdrop-blur-sm" \/>[\s\S]*?<div className="relative bg-white dark:bg-slate-900 rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl" onClick={\(e\) => e.stopPropagation\(\)}>[\s\S]*?<div className="p-5 flex gap-3">[\s\S]*?<Button variant="secondary" onClick={\(\) => setShowContextModal\(false\)} className="flex-1">Cancel<\/Button>[\s\S]*?<Button onClick={\(\) => { setShowContextModal\(false\); if\(items.length===0\) handleAddItem\(\); }} className="flex-1 bg-indigo-600 text-white">Start<\/Button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)}/;

    const match = content.match(modalRegex);
    if (!match) {
        console.error("Could not find Context Modal block");
        return;
    }

    const newModal = `{/* Context Modal */}
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
                               className={\`flex-1 text-xs font-bold py-2 rounded-md uppercase tracking-widest transition-colors \${entryMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                               onClick={() => {
                                   setEntryMode('monthly');
                                   setDateStr('2026-04-01');
                               }}
                           >
                               Monthly
                           </button>
                           <button 
                               className={\`flex-1 text-xs font-bold py-2 rounded-md uppercase tracking-widest transition-colors \${entryMode === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
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

                   {/* Record Type */}
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                           Record Type
                       </label>
                       <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
                           <button 
                               className={\`flex-1 text-xs font-bold px-3 py-2 rounded-md uppercase tracking-widest transition-colors \${recordType === 'projection' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                               onClick={() => setRecordType('projection')}
                           >Projection</button>
                           <button 
                               className={\`flex-1 text-xs font-bold px-3 py-2 rounded-md uppercase tracking-widest transition-colors \${recordType === 'achievement' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                               onClick={() => setRecordType('achievement')}
                           >Achievement</button>
                       </div>
                   </div>
               </div>
               <div className="p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Button variant="secondary" onClick={() => setShowContextModal(false)} className="flex-1">Cancel</Button>
                  <Button onClick={() => { setShowContextModal(false); if(items.length===0) handleAddItem(); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30">Start Entry</Button>
               </div>
            </div>
          </div>
        )}`;

    content = content.replace(modalRegex, newModal);
    fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
    console.log("Context Modal patched successfully!");
}

patchContextModal();
