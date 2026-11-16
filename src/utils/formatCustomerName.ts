/**
 * Formats a customer name so:
 * - The first letter of the name and the first letter after every space is capitalized.
 * - Words of 1 or 2 letters that are already in ALL CAPS (e.g. "MD", "KR", "SK", "OM", "RK") are preserved in CAPS and never downcased.
 * - Words of 3+ letters have their first letter capitalized and remaining letters lowercased.
 */
export function formatCustomerName(raw: string, trimEnds = false): string {
  if (!raw) return '';
  const formatted = raw.replace(/\S+/g, (word) => {
    const alphaOnly = word.replace(/[^a-zA-Z]/g, '');
    if (alphaOnly.length > 0 && alphaOnly.length <= 2 && word === word.toUpperCase()) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  return trimEnds ? formatted.replace(/\s+/g, ' ').trim() : formatted;
}

/**
 * Maps customer type string (e.g. "Loans", "Forex", "Consulting") to terminal product category.
 */
export function mapCustomerTypeToCategory(customerType?: string): string {
  if (!customerType) return '';
  const ct = customerType.trim().toLowerCase();
  if (ct === 'loans' || ct === 'loan') return 'Loan';
  if (ct === 'forex') return 'Forex';
  if (ct === 'insurance') return 'Insurance';
  if (ct === 'consulting' || ct === 'consultancy') return 'Consultancy';
  if (ct === 'investments' || ct === 'investment') return 'Investments';
  return customerType;
}

/**
 * Maps terminal product category (e.g. "Loan", "Consultancy") to customer type (e.g. "Loans", "Consulting").
 */
export function mapCategoryToCustomerType(category?: string): string {
  if (!category) return '';
  const cat = category.trim().toLowerCase();
  if (cat === 'loan' || cat === 'loans') return 'Loans';
  if (cat === 'forex') return 'Forex';
  if (cat === 'insurance') return 'Insurance';
  if (cat === 'consultancy' || cat === 'consulting') return 'Consulting';
  if (cat === 'investments' || cat === 'investment') return 'Investments';
  return category;
}
