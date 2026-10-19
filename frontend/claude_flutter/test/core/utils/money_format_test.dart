import 'package:claude_flutter/core/utils/money_format.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('formatMoney', () {
    test('miles con punto y sin decimales', () {
      expect(formatMoney(1234567), r'$1.234.567');
      expect(formatMoney(12000.4), r'$12.000');
      expect(formatMoney(999), r'$999');
      expect(formatMoney(0), r'$0');
      expect(formatMoney(null), r'$0');
    });

    test('negativos y sin símbolo', () {
      expect(formatMoney(-4500), r'-$4.500');
      expect(formatMoney(12000, withSymbol: false), '12.000');
      expect(formatNumber(1500), '1.500');
    });
  });

  test('formatPercent usa coma decimal', () {
    expect(formatPercent(0.1234), '12,3 %');
    expect(formatPercent(0.25), '25,0 %');
    expect(formatPercent(double.nan), '0,0 %');
  });
}
