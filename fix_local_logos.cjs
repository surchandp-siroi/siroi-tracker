const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

const newCode = `const getBankLogoUrl = (bankName: string) => {
    const name = (bankName || '').toLowerCase();
    if (name.includes('state bank') || name.includes('sbi')) return '/banks/sbin/symbol.svg';
    if (name.includes('hdfc')) return '/banks/hdfc/symbol.svg';
    if (name.includes('icici')) return '/banks/icic/symbol.svg';
    if (name.includes('axis')) return '/banks/utib/symbol.svg';
    if (name.includes('punjab national') || name.includes('pnb')) return '/banks/punb/symbol.svg';
    if (name.includes('kotak')) return '/banks/kkbk/symbol.svg';
    if (name.includes('yes')) return '/banks/yesb/symbol.svg';
    if (name.includes('canara')) return '/banks/cnrb/symbol.svg';
    if (name.includes('bank of baroda')) return '/banks/barb/symbol.svg';
    if (name.includes('bank of india')) return '/banks/bkid/symbol.svg';
    if (name.includes('union bank')) return '/banks/ubin/symbol.svg';
    return null;
};

const BankIcon = ({ bankName, className }: { bankName: string, className?: string }) => {
    const logoUrl = getBankLogoUrl(bankName);
    const [error, setError] = useState(false);

    if (logoUrl && !error) {
        return <img src={logoUrl} alt={bankName} className={\`\${className || ''} object-contain rounded-sm bg-white p-[2px] shadow-sm\`} onError={() => setError(true)} />;
    }
    return <CreditCard className={\`\${className || ''} text-slate-400\`} />;
};`;

content = content.replace(/const getBankLogoUrl = [\s\S]*?const BankIcon = [\s\S]*?return <CreditCard[\s\S]*?};\n/, newCode + '\n');
fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Fixed Bank Logos to Local indian-banks lib');
