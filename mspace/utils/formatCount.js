/**
 * Universal number formatter for social platforms.
 * Supports localization (Intl API) and classic 'K/M/B' suffixes fallback.
 *
 * @param {number} n - The number to format.
 * @param {string} [locale] - Optional locale, defaults to browser/user.
 * @param {boolean} [compact=true] - Use 'compact' (1K, 1M) notation.
 * @returns {string}
 */
export function formatCount(n, locale, compact = true) {
  if (typeof Intl !== "undefined" && Intl.NumberFormat) {
    try {
      // Try modern compact notation (e.g., 1.2K, 3M, 5B, works for many languages)
      return Intl.NumberFormat(locale || undefined, {
        notation: compact ? "compact" : "standard",
        compactDisplay: "short",
        maximumFractionDigits: n < 10000 ? 1 : 0,
      }).format(n);
    } catch (e) {
        return null
      // Fallback to manual
    }
  }

  // Fallback: classic social media suffixes
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '') + 'K';
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
}