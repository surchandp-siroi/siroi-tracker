const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jybkjinujujlsvqsercv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YmtqaW51anVqbHN2cXNlcmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTUxMDMsImV4cCI6MjA5MjI3MTEwM30.rS2JwGhXgIXQccZXbPaYDr47zrmoXWn6EcAzoFZMKeI'
);

const BANK_MAP = {
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

const getFormattedBankName = (bankName) => {
    if (!bankName) return bankName;
    const name = bankName.toLowerCase().trim();
    
    if (name.includes('state bank') || name.includes('sbi')) return 'State Bank of India';
    if (name.includes('pnb') || name.includes('punjab national')) return 'Punjab National Bank';
    if (name.includes('hdfc')) return 'HDFC Bank';
    if (name.includes('icici')) return 'ICICI Bank';
    if (name.includes('axis')) return 'Axis Bank';
    if (name.includes('kotak')) return 'Kotak Mahindra Bank';
    if (name.includes('yes')) return 'Yes Bank';
    if (name.includes('canara')) return 'Canara Bank';
    if (name.includes('bank of baroda')) return 'Bank of Baroda';
    if (name.includes('union bank')) return 'Union Bank of India';
    if (name.includes('central bank')) return 'Central Bank of India';
    if (name.includes('maharashtra')) return 'Bank of Maharashtra';
    if (name === 'bank of india' || name.includes('bank of india')) return 'Bank of India';

    const sortedBanks = Object.entries(BANK_MAP).sort((a, b) => b[1].length - a[1].length);
    for (const [slug, fullName] of sortedBanks) {
        if (name.includes(fullName.toLowerCase()) || fullName.toLowerCase().includes(name)) {
            return fullName;
        }
    }
    
    return bankName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

async function formatAllBanks() {
    console.log('Fetching all consultants...');
    const { data, error } = await supabase.from('consultants').select('id, bank_name');
    if (error) {
        console.error('Error fetching consultants:', error);
        return;
    }

    console.log(`Found ${data.length} consultants. Formatting bank names...`);
    
    let updatedCount = 0;
    for (const consultant of data) {
        const currentName = consultant.bank_name;
        if (!currentName) continue;
        
        const formattedName = getFormattedBankName(currentName);
        if (currentName !== formattedName) {
            console.log(`Updating: "${currentName}" -> "${formattedName}"`);
            const { error: updateError } = await supabase
                .from('consultants')
                .update({ bank_name: formattedName })
                .eq('id', consultant.id);
                
            if (updateError) {
                console.error(`Failed to update consultant ${consultant.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }
    console.log(`Successfully formatted ${updatedCount} bank names!`);
}

formatAllBanks();
