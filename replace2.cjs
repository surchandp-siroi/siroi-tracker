const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetRegex = /<div className="shrink-0 flex items-end gap-3">[\s\S]*?<\/label>\s*<div className="flex items-center h-\[30px\] px-2 bg-slate-900\/5 dark:bg-black\/40 border border-slate-200 dark:border-white\/10 rounded-md hover:bg-slate-900\/10 dark:hover:bg-black\/60 transition-colors cursor-pointer group">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `<div className="shrink-0 flex items-end gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 block">
                            Date Context
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center h-[30px] px-2 bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-md hover:bg-slate-900/10 dark:hover:bg-black/60 transition-colors cursor-pointer group">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500 mr-2 group-hover:text-indigo-400 transition-colors" />
                                {entryMode === 'monthly' ? (
                                    <input 
                                        type="month" 
                                        className="bg-transparent text-xs text-slate-900 dark:text-white font-medium outline-none cursor-pointer w-[110px]"
                                        style={{ colorScheme: 'dark' }}
                                        value={dateStr.substring(0, 7)}
                                        onChange={(e) => {
                                            if (isDirty && !window.confirm("You have unsaved rows. Changing date will discard them. Continue?")) return;
                                            setDateStr(e.target.value + '-01');
                                        }}
                                    />
                                ) : (
                                    <input 
                                        type="date" 
                                        className="bg-transparent text-xs text-slate-900 dark:text-white font-medium outline-none cursor-pointer w-[110px]"
                                        style={{ colorScheme: 'dark' }}
                                        value={dateStr}
                                        onChange={(e) => {
                                            if (isDirty && !window.confirm("You have unsaved rows. Changing date will discard them. Continue?")) return;
                                            setDateStr(e.target.value);
                                        }}
                                    />
                                )}
                            </div>
                            <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{currentTime.split(',')[0]}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">{currentTime.split(',')[1]?.trim()}</div>
                            </div>
                        </div>
                    </div>
                </div>`;

if(targetRegex.test(content)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync('src/pages/EntryPage.tsx', content);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find the target string!");
}
