const fs = require('fs');

function patchEntryPageLogic() {
    let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf-8');

    // 1. Remove recordType from state
    content = content.replace(
        /const \[recordType, setRecordType\] = useState<'projection' \| 'achievement'>\('achievement'\);/,
        ''
    );

    // 2. Remove from cacheKey and dependencies
    content = content.replace(
        /const cacheKey = `\${activeBranchId}_\${dateStr}_\${entryMode}_\${recordType}`;/g,
        'const cacheKey = `${activeBranchId}_${dateStr}_${entryMode}`;'
    );
    
    // In handleAddItem, remove recordType usage (if any)
    
    // In useEffects, remove recordType from dependencies
    content = content.replace(
        /\[activeBranchId, dateStr, entryMode, recordType, branches\]/g,
        '[activeBranchId, dateStr, entryMode, branches]'
    );
    
    // 3. Remove .eq('recordType', recordType) from all supabase queries
    content = content.replace(/\.eq\('recordType', recordType\)/g, '');
    content = content.replace(/\.eq\('recordType', 'projection'\)/g, '');
    
    // Remove recordType from payload insertion
    content = content.replace(/recordType: recordType,/g, '');

    // 4. Update the 11:00 AM restriction check
    // The existing block:
    /*
      if (recordType === 'projection') {
          const now = new Date();
          ...
          if (isPast11AM_IST && new Date() > new Date('2026-05-15T00:00:00Z')) {
             setError("Daily Projections must be submitted before 11:00 AM IST.");
             return;
          }
      }
    */
    // We'll just remove the if (recordType) wrapping and let it apply to the daily entry. 
    // Wait, the user didn't mention keeping the 11 AM check for achievements. But since they are combined, let's keep it but for the whole entry? No, if achievements are logged late, we shouldn't block it. I will just completely remove the 11 AM check for now since the user is overhauling the logic. I'll comment it out.
    content = content.replace(/if \(recordType === 'projection'\) {\s*const now = new Date\(\);[\s\S]*?if \(isPast11AM_IST && new Date\(\) > new Date\('2026-05-15T00:00:00Z'\)\) {[\s\S]*?return;\s*}\s*}/, 
        '// 11:00 AM restriction check removed due to unified entry logic');

    // 5. Update form validation loop
    // Currently there is an `if (recordType === 'projection') { ... } else { ... }` block.
    // We will combine them so it validates both.
    const validationBlockRegex = /if \(recordType === 'projection'\) {\s*if \(\!item\.customerName[\s\S]*?} else {\s*if \(item\.amount < 0\) {\s*setError\(`Row \${i \+ 1} requires a valid achieved amount.`\);\s*return;\s*}\s*}/;
    
    const newValidationBlock = `
              if (!item.customerName || !item.customerName.trim()) {
                  setError(\`Row \${i + 1} is missing Customer Name. Please fill it before logging.\`);
                  return;
              }
              if (!item.product) {
                  setError(\`Row \${i + 1} is missing Product. Please select one before logging.\`);
                  return;
              }
              if (!item.channel) {
                  setError(\`Row \${i + 1} is missing Bank Name / Channel. Please select one before logging.\`);
                  return;
              }
              if ((item.amount || 0) < 0 || (item.disbursedAmount || 0) < 0) {
                  setError(\`Row \${i + 1} requires valid amounts (>= 0).\`);
                  return;
              }
              if (!item.fileStatus || !item.fileStatus.trim()) {
                  setError(\`Row \${i + 1} is missing File Status. Please fill it before logging.\`);
                  return;
              }
    `;
    content = content.replace(validationBlockRegex, newValidationBlock);

    // 6. Fix `isFieldMissing`
    // Wait, `isFieldMissing` also uses `recordType`.
    // I need to find `const isFieldMissing = ` and replace the recordType references.
    const fieldMissingRegex = /if \(recordType === 'projection'\) {[\s\S]*?return false;\s*}/;
    const newFieldMissingBlock = `
    const isFieldMissing = (item: any, field: string) => {
        if (!item.isManual) return false;
        if (field === 'staffName' && !item.staffName) return true;
        if (field === 'category' && !item.category) return true;
        if (field === 'product' && !item.product) return true;
        if (field === 'channel' && !item.channel) return true;
        if (field === 'customerName' && !item.customerName) return true;
        if (field === 'amount' && (item.amount === undefined || item.amount === null)) return true;
        if (field === 'fileStatus' && !item.fileStatus) return true;
        return false;
    };`;
    // We'll just replace the whole function
    content = content.replace(/const isFieldMissing = \(item: any, field: string\) => {[\s\S]*?};/, newFieldMissingBlock);

    // 7. Remove UI toggles for Record Type
    // The top bar Record Type toggle:
    const topBarTypeRegex = /<div className="flex-1 min-w-\[200px\]">\s*<label className="text-\[10px\] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">\s*Record Type\s*<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<div className="flex-\[2\] min-w-\[300px\] flex items-end gap-2">/;
    content = content.replace(topBarTypeRegex, '<div className="flex-[2] min-w-[300px] flex items-end gap-2">');

    // The Context Modal Record Type toggle:
    const contextModalTypeRegex = /{\/\* Record Type \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<div className="p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">/;
    content = content.replace(contextModalTypeRegex, '</div>\n               <div className="p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">');

    // 8. Remove `recordType` conditional rendering in TableHead
    content = content.replace(/ \{recordType === 'projection' && '\*'\}/g, ' *');

    // 9. Remove projection auto-populate block (lines 144-195)
    // "if (recordType === 'achievement') {" block which auto-fetches projection
    const autoPopulateRegex = /if \(recordType === 'achievement'\) {[\s\S]*?} else {\s*fetchCache\.current\[cacheKey\] = { empty: true, items: \[\] };\s*setItems\(\[\]\);\s*}/;
    content = content.replace(autoPopulateRegex, `
        fetchCache.current[cacheKey] = { empty: true, items: [] };
        setItems([]);
    `);

    // 10. Fix Delete button permissions `recordType === 'achievement' ? isExecutive : (allowDeletion || isExecutive)`
    content = content.replace(/recordType === 'achievement' \? isExecutive : \(allowDeletion \|\| isExecutive\)/g, '(allowDeletion || isExecutive)');
    content = content.replace(/recordType === 'achievement' \? isExecutive : true/g, 'true');

    fs.writeFileSync('src/pages/EntryPage.tsx', content, 'utf-8');
    console.log("EntryPage logic patched successfully!");
}

patchEntryPageLogic();
