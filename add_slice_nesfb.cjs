const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

const targetStr = "    if (name.includes('state bank') || name.includes('sbi'))";

const replacementStr1 = `    if (name.includes('slice')) return 'Slice Small Finance Bank';
    if (name.includes('north east small finance')) return 'North East Small Finance Bank';
    if (name.includes('state bank') || name.includes('sbi'))`;

const replacementStr2 = `    if (name.includes('slice')) return '/banks/slice.svg';
    if (name.includes('north east small finance')) return '/banks/nesfb.svg';
    if (name.includes('state bank') || name.includes('sbi'))`;

// first occurrence is in getFormattedBankName
content = content.replace(targetStr, replacementStr1);
// second occurrence is in getBankLogoUrl
content = content.replace(targetStr, replacementStr2);

fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Added Slice and NESFB');
