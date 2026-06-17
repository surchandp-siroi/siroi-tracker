const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetStr = `const workbook = XLSX.read(buffer, { type: 'array' });
          setUploadProgress(50);
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
          
          const json = rawJson.filter((row: any) => {`;

const replacementStr = `const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
          setUploadProgress(50);
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const _rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });
          
          // Pre-process all dates and strings before filtering
          const rawJson = _rawJson.map((row: any) => {
             const newRow: any = {};
             for (const key in row) {
                 let val = row[key];
                 if (val instanceof Date) {
                     val.setHours(val.getHours() + 12); 
                     val = val.toISOString().split('T')[0];
                 } else if (typeof val === 'string') {
                     const match = val.trim().match(/^(\d{1,2})[-\/.\s](\d{1,2})[-\/.\s](\d{4})$/);
                     if (match) {
                          const d = match[1].padStart(2, '0');
                          const m = match[2].padStart(2, '0');
                          const y = match[3];
                          val = `${y}-${m}-${d}`;
                     }
                 }
                 newRow[key] = val;
             }
             return newRow;
          });

          const json = rawJson.filter((row: any) => {`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/EntryPage.tsx', content);
    console.log("Successfully patched processFile date handling!");
} else {
    console.log("Could not find targetStr to patch!");
}
