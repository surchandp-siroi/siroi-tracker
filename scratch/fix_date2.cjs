const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

// Replace the Date Context label
const labelRegex = /<label className=\"text-\[10px\] font-bold text-slate-500 uppercase tracking-wider mb-1\.5 flex justify-between items-center\">[\s\S]*?<\/label>/;
const labelReplacement = `<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Date Context
                </label>
                <div className="relative">`;
content = content.replace(labelRegex, labelReplacement);

// Replace the monthly input
const monthlyRegex = /className=\"bg-slate-900\/5 dark:bg-black\/40 text-xs h-\[34px\] border-slate-200 dark:border-white\/10\"\s*style={{ colorScheme: 'dark' }}\s*\/>\s*\) : \(/;
const monthlyReplacement = `className="bg-slate-900/5 dark:bg-black/40 text-xs h-[34px] border-slate-200 dark:border-white/10 w-full pr-28"
                        style={{ colorScheme: 'dark' }}
                    />
                ) : (`;
content = content.replace(monthlyRegex, monthlyReplacement);

// Replace the daily input and add the absolute span
const dailyRegex = /className=\"bg-slate-900\/5 dark:bg-black\/40 text-xs h-\[34px\] border-slate-200 dark:border-white\/10\"\s*style={{ colorScheme: 'dark' }}\s*\/>\s*\)\}\s*<\/div>/;
const dailyReplacement = `className="bg-slate-900/5 dark:bg-black/40 text-xs h-[34px] border-slate-200 dark:border-white/10 w-full pr-28"
                        style={{ colorScheme: 'dark' }}
                    />
                )}
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 pointer-events-none">
                        {currentTime}
                    </span>
                </div>
            </div>`;
content = content.replace(dailyRegex, dailyReplacement);

fs.writeFileSync('src/pages/EntryPage.tsx', content);
console.log('Update complete');
