const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

// For the main table header
content = content.replace(/className="text-\[10px\] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 w-\[(\d+)px\]/g, (match, width) => {
    return `className="text-[10px] font-semibold py-3 px-3 uppercase tracking-wider text-slate-700 dark:text-slate-300 min-w-[${parseInt(width) + 80}px]`;
});

// For the staging modal table header
content = content.replace(/className="w-\[(\d+)px\] font-bold text-\[10px\] uppercase tracking-wider text-slate-500"/g, (match, width) => {
    return `className="min-w-[${parseInt(width) + 80}px] font-bold text-[10px] uppercase tracking-wider text-slate-500"`;
});

// For Consultant -> Relationship Manager Name
content = content.replace(/>22\. Consultant</g, '>22. Relationship Manager Name<');
content = content.replace(/>Consultant</g, '>Relationship Manager Name<');

// For placeholder Consultant... -> RM Name...
content = content.replace(/placeholder="Consultant..."/g, 'placeholder="RM Name..."');

fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
console.log("Replaced widths and Consultant name");
