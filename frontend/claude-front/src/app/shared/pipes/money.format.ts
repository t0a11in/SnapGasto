/**
 * Formato de montos chilenos: separador de miles con punto, sin decimales.
 * formatMoney(1234567) → "$1.234.567"
 */
export function formatMoney(value: number | string | null | undefined, withSymbol = true): string {
  const n = Math.round(Number(value ?? 0)) || 0;
  const digits = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}${withSymbol ? '$' : ''}${digits}`;
}

/** Porcentaje con coma decimal: formatPercent(0.1234) → "12,3 %" */
export function formatPercent(ratio: number, decimals = 1): string {
  const value = Number.isFinite(ratio) ? ratio * 100 : 0;
  return `${value.toFixed(decimals).replace('.', ',')} %`;
}

/** Número entero con separador de miles: formatNumber(12000) → "12.000" */
export function formatNumber(value: number | null | undefined): string {
  return formatMoney(value, false);
}
