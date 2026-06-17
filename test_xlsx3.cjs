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

const data = XLSX.utils.sheet_to_json(ws2, { raw: true });
console.log("Output:", data);
console.log("Is Login Date a Date object?", data[0]['Login Date'] instanceof Date);
