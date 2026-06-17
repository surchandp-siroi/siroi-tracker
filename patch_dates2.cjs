const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetStr = "const workbook = XLSX.read(buffer, { type: 'array' });\n          setUploadProgress(50);\n          await new Promise(resolve => setTimeout(resolve, 50));\n          \n          const firstSheetName = workbook.SheetNames[0];\n          const worksheet = workbook.Sheets[firstSheetName];\n          const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: \"\", raw: false });\n          \n          const json = rawJson.filter((row: any) => {";

const replacementStr = "const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });\n          setUploadProgress(50);\n          await new Promise(resolve => setTimeout(resolve, 50));\n          \n          const firstSheetName = workbook.SheetNames[0];\n          const worksheet = workbook.Sheets[firstSheetName];\n          const _rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: \"\", raw: true });\n          \n          // Pre-process all dates and strings before filtering\n          const rawJson = _rawJson.map((row: any) => {\n             const newRow: any = {};\n             for (const key in row) {\n                 let val = row[key];\n                 if (val instanceof Date) {\n                     val.setHours(val.getHours() + 12); \n                     val = val.toISOString().split('T')[0];\n                 } else if (typeof val === 'string') {\n                     const match = val.trim().match(/^(\\d{1,2})[-\\/.\\s](\\d{1,2})[-\\/.\\s](\\d{4})$/);\n                     if (match) {\n                          const d = match[1].padStart(2, '0');\n                          const m = match[2].padStart(2, '0');\n                          const y = match[3];\n                          val = y + '-' + m + '-' + d;\n                     }\n                 }\n                 newRow[key] = val;\n             }\n             return newRow;\n          });\n\n          const json = rawJson.filter((row: any) => {";

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/EntryPage.tsx', content);
    console.log("Successfully patched processFile date handling!");
} else {
    console.log("Could not find targetStr to patch! Retrying with regex...");
    const regex = /const workbook = XLSX\.read\(buffer, \{ type: 'array' \}\);[\s\S]*?raw: false \}\);[\s\S]*?const json = rawJson\.filter\(\(row: any\) => \{/;
    if (regex.test(content)) {
        content = content.replace(regex, replacementStr);
        fs.writeFileSync('src/pages/EntryPage.tsx', content);
        console.log("Successfully patched processFile date handling with regex!");
    } else {
        console.log("Regex also failed.");
    }
}
