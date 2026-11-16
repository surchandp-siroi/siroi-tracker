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
