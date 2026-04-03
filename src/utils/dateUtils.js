/**
 * Normalizes date strings like "10-01-2026" or "2026-01-10" into a common format (DD/MM/YYYY).
 * Designed for reliability in the 2026 QUANTIFY environment.
 */
export const normalizeDate = (dateStr) => {
  if (!dateStr || dateStr === 'Unknown Date' || typeof dateStr !== 'string') return 'Unknown Date';
  
  // 1. Handle YYYY-MM-DD (ISO-ish)
  const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[3].padStart(2, '0')}/${isoMatch[2].padStart(2, '0')}/${isoMatch[1]}`;
  }
  
  // 2. Handle DD-MM-YYYY or DD/MM/YYYY
  const commonMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (commonMatch) {
    return `${commonMatch[1].padStart(2, '0')}/${commonMatch[2].padStart(2, '0')}/${commonMatch[3]}`;
  }
  
  // 3. Fallback: Clean up symbols but try to preserve a date-like structure
  const roughMatch = dateStr.replace(/[^0-9/.-]/g, ' ').trim().split(/\s+/)[0];
  if (roughMatch) {
    return roughMatch.replace(/[-.]/g, '/');
  }

  return 'Unknown Date';
};
