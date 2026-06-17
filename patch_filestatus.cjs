const fs = require('fs');
let content = fs.readFileSync('src/pages/EntryPage.tsx', 'utf8');

const targetRegex = /return \{ \.\.\.p, product: prod, isManual: true, projectionAmt: Number\(p\.projectionAmt\) \|\| 0, amount: Number\(p\.amount\) \|\| 0, disbursedAmount: Number\(p\.disbursedAmount\) \|\| 0 \};/;

const replacementStr = `let fsVal = p.fileStatus || '';
                  if (fsVal && typeof fsVal === 'string') {
                      fsVal = fsVal.trim().toLowerCase();
                      fsVal = fsVal.charAt(0).toUpperCase() + fsVal.slice(1);
                      if (fsVal === 'Under writing' || fsVal === 'Under-writing' || fsVal === 'Under_writing') fsVal = 'Underwriting';
                  }
                  return { ...p, product: prod, fileStatus: fsVal, isManual: true, projectionAmt: Number(p.projectionAmt) || 0, amount: Number(p.amount) || 0, disbursedAmount: Number(p.disbursedAmount) || 0 };`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacementStr);
    fs.writeFileSync('src/pages/EntryPage.tsx', content);
    console.log("Successfully patched fileStatus normalization!");
} else {
    console.log("Could not find target regex to patch!");
}
