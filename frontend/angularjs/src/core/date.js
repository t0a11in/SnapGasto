/** Fecha local ISO, sin el desfase UTC que suele afectar a los inputs date. */
export function todayIso(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function monthFromDate(date = new Date()) {
  return todayIso(date).slice(0, 7);
}

export function defaultIncomeDate(month, currentMonth, currentDate) {
  return month === currentMonth ? currentDate : `${month}-01`;
}
