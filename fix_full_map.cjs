const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultantApprovalPage.tsx', 'utf-8');

const newCode = `const BANK_MAP: Record<string, string> = {
  "airp": "Airtel Payments Bank",
  "aubl": "AU Small Finance Bank Limited",
  "barb": "Bank of Baroda",
  "bdbl": "Bandhan Bank",
  "bkid": "Bank of India",
  "cbin": "Central Bank of India",
  "ciub": "City Union Bank",
  "cnrb": "Canara Bank",
  "csbk": "CSB Bank Limited",
  "dcbl": "DCB Bank Limited",
  "dlxb": "Dhanalakshmi Bank",
  "esmf": "ESAF Small Finance Bank",
  "fdrl": "Federal Bank",
  "fino": "FINO Payments Bank",
  "hdfc": "HDFC Bank",
  "ibkl": "IDBI Bank",
  "icic": "ICICI Bank Limited",
  "idfb": "IDFC First Bank Limited",
  "idib": "Indian Bank",
  "indb": "IndusInd Bank",
  "ioba": "Indian Overseas Bank",
  "jaka": "Jammu and Kashmir Bank",
  "jiop": "Jio Payments Bank",
  "karb": "Karnataka Bank Limited",
  "kkbk": "Kotak Mahindra Bank Limited",
  "kvbl": "Karur Vysya Bank",
  "mahb": "Bank of Maharashtra",
  "ntbl": "The Nainital Bank Limited",
  "psib": "Punjab and Sind Bank",
  "punb": "Punjab National Bank",
  "pytm": "Paytm Payments Bank",
  "ratn": "RBL Bank Limited",
  "sbin": "State Bank of India",
  "scbl": "Standard Chartered Bank",
  "sibl": "South Indian Bank",
  "tmbl": "Tamilnad Mercantile Bank Limited",
  "ubin": "Union Bank of India",
  "ucba": "UCO Bank",
  "ujvn": "Ujjivan Small Finance Bank Ltd",
  "utib": "Axis Bank",
  "yesb": "Yes Bank"
};

const getBankLogoUrl = (bankName: string) => {
    const name = (bankName || '').toLowerCase();
    
    // Explicit overrides for common shorthand names
    if (name.includes('sbi')) return '/banks/sbin/symbol.svg';
    if (name.includes('pnb')) return '/banks/punb/symbol.svg';
    if (name.includes('hdfc')) return '/banks/hdfc/symbol.svg';
    if (name.includes('icici')) return '/banks/icic/symbol.svg';

    // Reverse lookup
    for (const [slug, fullName] of Object.entries(BANK_MAP)) {
        if (name.includes(fullName.toLowerCase()) || fullName.toLowerCase().includes(name)) {
            return \`/banks/\${slug}/symbol.svg\`;
        }
    }
    return null;
};`;

content = content.replace(/const getBankLogoUrl = [\s\S]*?return null;\n};\n/, newCode + '\n');
fs.writeFileSync('src/pages/ConsultantApprovalPage.tsx', content, 'utf-8');
console.log('Fixed full map');
