import { currentMonth, defaultDateForMonth, isFutureDate, isValidMonth, shiftMonth, todayIso } from './date.utils';

describe('date.utils', () => {
  it('formatea hoy y el mes actual en hora local', () => {
    const d = new Date(2026, 0, 5);
    expect(todayIso(d)).toBe('2026-01-05');
    expect(currentMonth(d)).toBe('2026-01');
  });

  it('desplaza meses cruzando años', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-10', 0)).toBe('2026-10');
  });

  it('valida el formato YYYY-MM', () => {
    expect(isValidMonth('2026-10')).toBeTrue();
    expect(isValidMonth('2026-13')).toBeFalse();
    expect(isValidMonth('26-10')).toBeFalse();
  });

  it('detecta fechas futuras', () => {
    expect(isFutureDate('2026-10-19', '2026-10-18')).toBeTrue();
    expect(isFutureDate('2026-10-18', '2026-10-18')).toBeFalse();
  });

  it('usa hoy si pertenece al mes, si no el día 1', () => {
    expect(defaultDateForMonth('2026-10', '2026-10-18')).toBe('2026-10-18');
    expect(defaultDateForMonth('2026-09', '2026-10-18')).toBe('2026-09-01');
  });
});
