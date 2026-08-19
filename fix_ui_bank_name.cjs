const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

// Find the rendering of the bank name. It might be {consultant.bank_name}
// Let's replace {consultant.bank_name} with {getFormattedBankName(consultant.bank_name)}
content = content.replaceAll('{consultant.bank_name}', '{getFormattedBankName(consultant.bank_name)}');

fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Fixed UI Bank Name Display');
