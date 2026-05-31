/**
 * Formats a number as Philippine Peso price string with thousands separators.
 * e.g. 11199 → "11,199.00"  |  1000 → "1,000.00"
 */
export function fmtPrice(amount: number): string {
  const [intPart, decPart] = amount.toFixed(2).split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return withCommas + '.' + decPart;
}
