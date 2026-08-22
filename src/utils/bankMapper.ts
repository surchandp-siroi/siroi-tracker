export const BANK_LOGOS: Record<string, string> = {
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

/**
 * Returns the SVG path for a given bank name, or null if not found.
 */
export const getBankLogoPath = (bankName: string): string | null => {
  if (!bankName) return null;
  
  const normalizedInput = bankName.toLowerCase().trim();
  
  // Custom exact matches or synonyms for robustness
  const customMappings: Record<string, string> = {
    "au small finance bank": "aubl",
    "idfc first bank": "idfb",
    "icici bank": "icic",
    "kotak mahindra bank": "kkbk"
  };

  if (customMappings[normalizedInput]) {
    return `/banks/${customMappings[normalizedInput]}.svg`;
  }

  // 1. Try exact matches first
  for (const [key, name] of Object.entries(BANK_LOGOS)) {
    const normalizedName = name.toLowerCase().trim();
    if (normalizedName === normalizedInput) {
      return `/banks/${key}.svg`;
    }
  }

  // 2. Sort by length descending for partial matches to prevent generic names matching specific ones
  // e.g. "Bank of India" matching "State Bank of India"
  const sortedBanks = Object.entries(BANK_LOGOS).sort((a, b) => b[1].length - a[1].length);
  for (const [key, name] of sortedBanks) {
    const normalizedName = name.toLowerCase().trim();
    if (normalizedName.includes(normalizedInput) || normalizedInput.includes(normalizedName)) {
      return `/banks/${key}.svg`;
    }
  }

  return null;
};
