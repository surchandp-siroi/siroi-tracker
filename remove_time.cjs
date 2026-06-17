const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetRegex = /<div className="flex flex-col justify-end shrink-0 min-w-\[150px\]">\s*<label className="text-\[10px\] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1\.5 block">\s*Server Time\s*<\/label>\s*<div className="flex items-center h-\[30px\] px-3 bg-slate-900\/5 dark:bg-black\/40 border border-slate-200 dark:border-white\/10 rounded-md text-\[10px\] font-mono text-slate-500">\s*\{currentTime\}\s*<\/div>\s*<\/div>/;

if(targetRegex.test(content)) {
    content = content.replace(targetRegex, '');
    fs.writeFileSync('src/pages/EntryPage.tsx', content);
    console.log("Removed Server Time block successfully!");
} else {
    console.log("Could not find the Server Time block string!");
}
