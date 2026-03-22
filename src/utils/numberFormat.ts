// numberFormat.ts - Helper pour formater les nombres avec protection null/undefined

/**
 * Formate un nombre avec toFixed, gère null/undefined
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 1,
  fallback: string = "—"
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Number(value).toFixed(decimals);
}

/**
 * Formate un nombre avec signe (+/-)
 */
export function formatNumberWithSign(
  value: number | null | undefined,
  decimals: number = 1,
  fallback: string = "—"
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  const num = Number(value);
  return (num > 0 ? "+" : "") + num.toFixed(decimals);
}

/**
 * Formate un pourcentage
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1,
  fallback: string = "—"
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Number(value).toFixed(decimals) + "%";
}

/**
 * Formate un entier (arrondi)
 */
export function formatInteger(
  value: number | null | undefined,
  fallback: string = "—"
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return Math.round(Number(value)).toString();
}

/**
 * Vérifie si une valeur est un nombre valide
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}