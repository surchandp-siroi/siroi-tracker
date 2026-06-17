const XLSX = require('xlsx');

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet([
  ['Login Date', 'Number', 'String Date'],
  [new Date(2025, 11, 19), 1234.56, "19-12-2025"]
]);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

const wb2 = XLSX.read(buf, { type: 'buffer', cellDates: true });
const ws2 = wb2.Sheets[wb2.SheetNames[0]];
const rawJson = XLSX.utils.sheet_to_json(ws2, { raw: true });

const json = rawJson.map(row => {
   const newRow = {};
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

console.log(json);
