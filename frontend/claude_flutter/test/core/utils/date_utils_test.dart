import 'package:claude_flutter/core/utils/date_utils.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final now = DateTime(2026, 3, 7);

  test('todayIso y currentMonth', () {
    expect(todayIso(now), '2026-03-07');
    expect(currentMonth(now), '2026-03');
  });

  test('shiftMonth cruza años', () {
    expect(shiftMonth('2026-01', -1), '2025-12');
    expect(shiftMonth('2025-12', 1), '2026-01');
    expect(shiftMonth('2026-05', 0), '2026-05');
  });

  test('isValidMonth', () {
    expect(isValidMonth('2026-10'), isTrue);
    expect(isValidMonth('2026-13'), isFalse);
    expect(isValidMonth('2026-1'), isFalse);
  });

  test('isFutureDate compara YYYY-MM-DD', () {
    expect(isFutureDate('2026-03-08', '2026-03-07'), isTrue);
    expect(isFutureDate('2026-03-07', '2026-03-07'), isFalse);
  });

  test('defaultDateForMonth', () {
    expect(defaultDateForMonth('2026-03', '2026-03-07'), '2026-03-07');
    expect(defaultDateForMonth('2026-02', '2026-03-07'), '2026-02-01');
  });

  test('formatos de visualización', () {
    expect(formatDateDisplay('2026-10-18'), '18-10-2026');
    expect(formatMonthLabel('2026-10'), 'Octubre 2026');
  });
}
