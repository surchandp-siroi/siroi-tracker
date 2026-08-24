const fs = require('fs');
const path = 'C:/Users/tomas/.gemini/antigravity-ide/brain/82395fb4-9dc3-4811-b863-cdac7147a307/.system_generated/steps/1808/output.txt';
const dataStr = fs.readFileSync(path, 'utf8');

const resultObj = JSON.parse(dataStr);
const resultStr = resultObj.result;

const untrustedStart = '<untrusted-data-62e58e90-bc1c-4854-b674-c9a8420bed6c>';
const parts = resultStr.split(untrustedStart);
const jsonStr = parts[2].trim(); // The data is between the two tags, which is parts[2] if there are two tags.
// Let's actually find the first '[' and last ']'
const firstBracket = resultStr.indexOf('[');
const lastBracket = resultStr.lastIndexOf(']');
const actualJson = resultStr.substring(firstBracket, lastBracket + 1);

const results = JSON.parse(actualJson);

let modifiedEntries = [];
let queryUpdates = [];
for (const row of results) {
  let modified = false;
  let items = row.items;
  if (typeof items === 'string') items = JSON.parse(items);
  
  const newItems = items.map(item => {
    if (item.consultantEmail === 'KIMI' || item.consultantName === 'KIMI') {
      modified = true;
      return { ...item, consultantName: 'Vanlal Hmangaihkimi', consultantEmail: 'ateyie@gmail.com' };
    }
    return item;
  });
  
  if (modified) {
    modifiedEntries.push({ id: row.id, items: newItems });
    queryUpdates.push(`UPDATE entries SET items = '${JSON.stringify(newItems).replace(/'/g, "''")}'::jsonb WHERE id = '${row.id}';`);
  }
}
fs.writeFileSync('C:/Users/tomas/.gemini/antigravity-ide/brain/82395fb4-9dc3-4811-b863-cdac7147a307/scratch/update_kimi.sql', queryUpdates.join('\n'));
console.log('Modified', modifiedEntries.length, 'entries');
