const XLSX = require('xlsx');

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet([
  ['Login Date', 'Number'],
  [new Date(2025, 11, 19), 1234.56]
]);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];

console.log("With cellDates, raw:false, dateNF =>", XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' }));
