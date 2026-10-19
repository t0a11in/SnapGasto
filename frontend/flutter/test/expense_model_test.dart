import 'package:flutter_test/flutter_test.dart';
import 'package:snap_gasto/app/data/models/expense.dart';

void main() {
  test('convierte un gasto versionado y su medio de pago', () {
    final expense = Expense.fromJson({
      'id': 'expense-1',
      'amount': 15990,
      'category': 'Alimentación',
      'date': '2026-10-18',
      'description': 'Compra semanal',
      'paymentMethod': 'TARJETA',
    });

    expect(expense.id, 'expense-1');
    expect(expense.amount, 15990);
    expect(expense.category, 'Alimentación');
    expect(expense.paymentMethod, ExpensePaymentMethod.tarjeta);
    expect(expense.paymentMethod.label, 'Tarjeta');
  });

  test('tolera las etiquetas de medios de pago de clientes anteriores', () {
    expect(
      ExpensePaymentMethod.fromApiValue('Efectivo'),
      ExpensePaymentMethod.efectivo,
    );
  });
}
