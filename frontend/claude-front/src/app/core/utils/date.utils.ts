const pad = (n: number): string => String(n).padStart(2, '0');

/** Fecha local en formato YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Mes local en formato YYYY-MM. */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

const MONTH_RE = /^(\d{4})-(\d{2})$/;

export function isValidMonth(value: string): boolean {
  const m = MONTH_RE.exec(value);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

/** Suma (o resta) meses a un valor YYYY-MM. */
export function shiftMonth(month: string, delta: number): string {
  const m = MONTH_RE.exec(month);
  if (!m) {
    throw new Error(`Mes inválido: ${month}`);
  }
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

/** Las fechas YYYY-MM-DD se comparan lexicográficamente. */
export function isFutureDate(date: string, today: string = todayIso()): boolean {
  return date > today;
}

/** Primer día del mes si `today` no pertenece al mes; si pertenece, hoy. */
export function defaultDateForMonth(month: string, today: string = todayIso()): string {
  return today.startsWith(month) ? today : `${month}-01`;
}
