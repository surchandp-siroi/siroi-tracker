const fs = require('fs');
let file = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const target1 = `<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                     <span>Date Context</span>
                     <span className="text-[9px] font-mono text-slate-400 font-normal normal-case">{currentTime}</span>
                 </label>`;

const replacement1 = `<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Date Context
                </label>
                <div className="relative">`;

const target2 = `className="bg-slate-900/5 dark:bg-black/40 text-xs h-[34px] border-slate-200 dark:border-white/10"
                        style={{ colorScheme: 'dark' }}
                    />
                ) : (`;

const replacement2 = `className="bg-slate-900/5 dark:bg-black/40 text-xs h-[34px] border-slate-200 dark:border-white/10 w-full pr-28"
                        style={{ colorScheme: 'dark' }}
                    />
                ) : (`;

const target3 = `className="bg-slate-900/5 dark:bg-black/40 text-xs h-[34px] border-slate-200 dark:border-white/10"
                        style={{ colorScheme: 'dark' }}
                    />
                )}
            </div>`;

const replacement3 = `className="bg-slate-900/5 dark:bg-black/40 text-xs h-[34px] border-slate-200 dark:border-white/10 w-full pr-28"
                        style={{ colorScheme: 'dark' }}
                    />
                )}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 pointer-events-none">
                    {currentTime}
                </span>
                </div>
            </div>`;

// Using replace with normalized newlines
file = file.replace(target1.replace(/\r/g, ''), replacement1.replace(/\r/g, ''));
file = file.replace(target2.replace(/\r/g, ''), replacement2.replace(/\r/g, ''));
file = file.replace(target3.replace(/\r/g, ''), replacement3.replace(/\r/g, ''));

// We should also replace the target string allowing windows newlines.
// It's safer to just do string matching loosely or normalizing `file` first.
let normalizedFile = file.replace(/\r\n/g, '\n');
normalizedFile = normalizedFile.replace(target1, replacement1);
normalizedFile = normalizedFile.replace(target2, replacement2);
normalizedFile = normalizedFile.replace(target3, replacement3);

fs.writeFileSync('src/pages/EntryPage.tsx', normalizedFile);
console.log('Done');
