import 'package:claude_flutter/shared/forms/validators.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parseAmountInput entiende formatos chilenos', () {
    expect(parseAmountInput('12000'), 12000);
    expect(parseAmountInput('12.000'), 12000);
    expect(parseAmountInput(r'$ 1.234.567'), 1234567);
    expect(parseAmountInput('12,5'), 12.5);
    expect(parseAmountInput('12.000,5'), 12000.5);
    expect(parseAmountInput('12.5'), 12.5);
    expect(parseAmountInput(''), isNull);
    expect(parseAmountInput('abc'), isNull);
  });

  test('positiveAmount', () {
    expect(Validators.positiveAmount(''), 'Ingresa un monto.');
    expect(Validators.positiveAmount('0'), 'El monto debe ser mayor a 0.');
    expect(Validators.positiveAmount('100'), isNull);
  });

  test('notFutureDate', () {
    expect(Validators.notFutureDate(''), 'Selecciona una fecha.');
    expect(Validators.notFutureDate('2999-01-01'), 'La fecha no puede ser futura.');
    expect(Validators.notFutureDate('2020-01-01'), isNull);
  });

  test('email y compose', () {
    final v = Validators.compose([Validators.required('Ingresa tu correo.'), Validators.email()]);
    expect(v(''), 'Ingresa tu correo.');
    expect(v('ana@'), 'Ingresa un correo válido.');
    expect(v('ana@test.cl'), isNull);
  });
}
