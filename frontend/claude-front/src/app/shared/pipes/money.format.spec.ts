import { formatMoney, formatNumber, formatPercent } from './money.format';

describe('money.format', () => {
  it('separa miles con punto y redondea a entero', () => {
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney(999)).toBe('$999');
    expect(formatMoney(1000)).toBe('$1.000');
    expect(formatMoney(1234567.6)).toBe('$1.234.568');
    expect(formatMoney(-25000)).toBe('-$25.000');
    expect(formatMoney('15000')).toBe('$15.000');
    expect(formatMoney(null)).toBe('$0');
  });

  it('permite omitir el símbolo', () => {
    expect(formatMoney(1500000, false)).toBe('1.500.000');
    expect(formatNumber(12000)).toBe('12.000');
  });

  it('formatea porcentajes con coma decimal', () => {
    expect(formatPercent(0.1234)).toBe('12,3 %');
    expect(formatPercent(1, 0)).toBe('100 %');
    expect(formatPercent(Number.NaN)).toBe('0,0 %');
  });
});
