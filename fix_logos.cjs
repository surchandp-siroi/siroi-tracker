const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

const newCode = `const getBankLogoUrl = (bankName: string) => {
    const name = (bankName || '').toLowerCase();
    if (name.includes('state bank') || name.includes('sbi')) return 'https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg';
    if (name.includes('hdfc')) return 'https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg';
    if (name.includes('icici')) return 'https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg';
    if (name.includes('axis')) return 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Axis_Bank_logo.svg';
    if (name.includes('punjab national') || name.includes('pnb')) return 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Punjab_National_Bank_logo.svg';
    if (name.includes('kotak')) return 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Kotak_Mahindra_Bank_logo.svg';
    if (name.includes('yes')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Yes_Bank_Logo.svg';
    if (name.includes('canara')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Canara_Bank_Logo.svg/1200px-Canara_Bank_Logo.svg.png';
    if (name.includes('bank of baroda')) return 'https://upload.wikimedia.org/wikipedia/commons/1/14/Bank_Of_Baroda_Logo.svg';
    if (name.includes('bank of india')) return 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Bank_of_India_logo.svg';
    if (name.includes('union bank')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Union_Bank_of_India_Logo.svg/1200px-Union_Bank_of_India_Logo.svg.png';
    return null;
};

const BankIcon = ({ bankName, className }: { bankName: string, className?: string }) => {
    const logoUrl = getBankLogoUrl(bankName);
    const [error, setError] = useState(false);

    if (logoUrl && !error) {
        return <img src={logoUrl} alt={bankName} className={\`\${className || ''} object-contain rounded-sm bg-white p-[1px] shadow-sm\`} onError={() => setError(true)} />;
    }
    return <CreditCard className={\`\${className || ''} text-slate-400\`} />;
};`;

content = content.replace(/const getBankDomain = [\s\S]*?const BankIcon = [\s\S]*?return <CreditCard[\s\S]*?};\n/, newCode + '\n');
fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Fixed Bank Logos');
