const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetStr = `<div className="flex items-center h-[30px] px-2 bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-md hover:bg-slate-900/10 dark:hover:bg-black/60 transition-colors cursor-pointer group">`;
const replacementStr = `<div className="flex items-center h-[30px] px-2 bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-md hover:bg-slate-900/10 dark:hover:bg-black/60 transition-colors cursor-pointer group" onClick={(e) => { try { e.currentTarget.querySelector('input')?.showPicker(); } catch(err) {} }}>`;

if(content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/EntryPage.tsx', content);
    console.log("Fixed picker trigger successfully!");
} else {
    console.log("Could not find the target string!");
}
