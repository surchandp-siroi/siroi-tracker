const XLSX = require('xlsx');

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet([
  ['Login Date'],
  [new Date(2025, 11, 19)]
]);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets[wb.SheetNames[0]];

console.log("Without cellDates, raw:false =>", XLSX.utils.sheet_to_json(ws, { raw: false }));
console.log("Without cellDates, raw:true =>", XLSX.utils.sheet_to_json(ws, { raw: true }));

const wb2 = XLSX.read(buf, { type: 'buffer', cellDates: true });
const ws2 = wb2.Sheets[wb2.SheetNames[0]];

console.log("With cellDates, raw:false =>", XLSX.utils.sheet_to_json(ws2, { raw: false }));
console.log("With cellDates, raw:true =>", XLSX.utils.sheet_to_json(ws2, { raw: true }));
