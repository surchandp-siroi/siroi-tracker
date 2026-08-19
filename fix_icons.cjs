const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

// 1. Bank Icon fix: clearbit to google favicons
content = content.replace(
    /return <img src=\{`https:\/\/logo\.clearbit\.com\/\$\{domain\}`\} alt=\{bankName\} className=\{`\$\{className \|\| ''\} object-contain rounded-sm bg-white p-\[1px\]`\} onError=\{\(\) => setError\(true\)\} \/>;/,
    "return <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt={bankName} className={`${className || ''} object-contain rounded-sm bg-white p-[1px] shadow-sm`} onError={() => setError(true)} />;"
);

// Fallback CreditCard fix
content = content.replaceAll(
    '<CreditCard className={`${className || \'\'}`} fill="currentColor" />',
    '<CreditCard className={`${className || \'\'} text-slate-400`} />'
);

// 2. Remove all fill="currentColor" globally
content = content.replaceAll(' fill="currentColor"', '');

// 3. UserCircle
content = content.replaceAll(
    '<div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 shrink-0">\n                                                        <UserCircle className="w-5 h-5 text-blue-500" />',
    '<div className="p-2 rounded-full bg-blue-500 dark:bg-blue-600 shrink-0 shadow-sm">\n                                                        <UserCircle className="w-5 h-5 text-white" />'
);

// 4. Mail
content = content.replaceAll(
    '<Mail className="w-3 h-3 text-cyan-500" />',
    '<span className="bg-cyan-500 rounded-full p-[3px] shadow-sm"><Mail className="w-2.5 h-2.5 text-white" /></span>'
);

// 5. Phone
content = content.replaceAll(
    '<Phone className="w-3 h-3 text-violet-500" />',
    '<span className="bg-violet-500 rounded-full p-[3px] shadow-sm"><Phone className="w-2.5 h-2.5 text-white" /></span>'
);

// 6. MapPin
content = content.replaceAll(
    '<MapPin className="w-3.5 h-3.5 text-emerald-500" />',
    '<span className="bg-emerald-500 rounded-full p-1 shadow-sm"><MapPin className="w-2.5 h-2.5 text-white" /></span>'
);

// 7. Building2
content = content.replaceAll(
    '<Building2 className="w-3 h-3" />',
    '<span className="bg-indigo-500/10 text-indigo-500 rounded-full p-1 flex items-center justify-center shrink-0"><Building2 className="w-3 h-3" /></span>'
);
// Building2 needs a different fix because it's inside an indigo pill. 
// Original: 
// <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium text-xs mb-2">
//     <Building2 className="w-3 h-3" /> {consultant.associated_branch} Branch
// </div>
// If we just wrap it, the spacing might be odd, but wait, the pill is already colored. So Building2 doesn't need a wrapper, just the icon itself is fine. So let's restore Building2.
content = content.replaceAll(
    '<span className="bg-indigo-500/10 text-indigo-500 rounded-full p-1 flex items-center justify-center shrink-0"><Building2 className="w-3 h-3" /></span>',
    '<Building2 className="w-3 h-3" />'
);

fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log("Icons fixed");
