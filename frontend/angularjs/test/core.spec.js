import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from '../src/core/api-error.js';
import { defaultIncomeDate, monthFromDate, todayIso } from '../src/core/date.js';

describe('utilidades del contrato SnapGasto', () => {
  it('prefiere el mensaje controlado de la API', () => {
    expect(apiErrorMessage({ message: 'No autorizado.' })).toBe('No autorizado.');
  });

  it('usa un mensaje seguro cuando la respuesta no está normalizada', () => {
    expect(apiErrorMessage({ error: 'unknown' })).toBe('No fue posible completar la operación.');
  });

  it('calcula una fecha local y el mes vigente sin desfase UTC', () => {
    const date = new Date('2026-10-16T23:30:00-03:00');
    expect(todayIso(date)).toBe('2026-10-16');
    expect(monthFromDate(date)).toBe('2026-10');
  });

  it('inicializa el ingreso en el día actual o al inicio del mes consultado', () => {
    expect(defaultIncomeDate('2026-10', '2026-10', '2026-10-16')).toBe('2026-10-16');
    expect(defaultIncomeDate('2026-09', '2026-10', '2026-10-16')).toBe('2026-09-01');
  });
});
