const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

const newCode = `const getBankLogoUrl = (bankName: string) => {
    const name = (bankName || '').toLowerCase().trim();
    
    // Explicit overrides for common shorthand names and collisions
    if (name.includes('state bank') || name.includes('sbi')) return '/banks/sbin/symbol.svg';
    if (name.includes('pnb') || name.includes('punjab national')) return '/banks/punb/symbol.svg';
    if (name.includes('hdfc')) return '/banks/hdfc/symbol.svg';
    if (name.includes('icici')) return '/banks/icic/symbol.svg';
    if (name.includes('axis')) return '/banks/utib/symbol.svg';
    if (name.includes('kotak')) return '/banks/kkbk/symbol.svg';
    if (name.includes('yes')) return '/banks/yesb/symbol.svg';
    if (name.includes('canara')) return '/banks/cnrb/symbol.svg';
    if (name.includes('bank of baroda')) return '/banks/barb/symbol.svg';
    if (name.includes('union bank')) return '/banks/ubin/symbol.svg';
    if (name.includes('central bank')) return '/banks/cbin/symbol.svg';
    if (name.includes('maharashtra')) return '/banks/mahb/symbol.svg';
    if (name === 'bank of india' || name.includes('bank of india')) return '/banks/bkid/symbol.svg';

    // Reverse lookup, sort by length descending to avoid substring bugs
    const sortedBanks = Object.entries(BANK_MAP).sort((a, b) => b[1].length - a[1].length);
    for (const [slug, fullName] of sortedBanks) {
        if (name.includes(fullName.toLowerCase()) || fullName.toLowerCase().includes(name)) {
            return \`/banks/\${slug}/symbol.svg\`;
        }
    }
    return null;
};

const BankIcon = ({ bankName, className }: { bankName: string, className?: string }) => {
    const logoUrl = getBankLogoUrl(bankName);
    const [error, setError] = useState(false);

    if (logoUrl && !error) {
        return <img src={logoUrl} alt={bankName} className={\`\${className || ''} object-contain rounded bg-white p-[2px] shadow-sm ring-1 ring-slate-900/5\`} onError={() => setError(true)} />;
    }
    return <CreditCard className={\`\${className || ''} text-slate-400\`} />;
};`;

content = content.replace(/const getBankLogoUrl = [\s\S]*?return <CreditCard[\s\S]*?};\n/, newCode + '\n');
content = content.replaceAll('<BankIcon bankName={consultant.bank_name} className="w-4 h-4 shadow-sm" />', '<BankIcon bankName={consultant.bank_name} className="w-6 h-6 shrink-0" />');
fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Fixed Logic and Size');
