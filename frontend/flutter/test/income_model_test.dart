import 'package:flutter_test/flutter_test.dart';
import 'package:snap_gasto/app/data/models/income.dart';

void main() {
  test('convierte un ingreso de la API y reconoce su tipo', () {
    final income = Income.fromJson({
      'id': 'income-1',
      'amount': 12500.50,
      'type': 'TARJETA',
      'date': '2026-10-16',
      'description': 'Pago parcial',
    });

    expect(income.id, 'income-1');
    expect(income.amount, 12500.50);
    expect(income.type, IncomeType.tarjeta);
    expect(income.type.label, 'Tarjeta');
  });

  test('convierte el resumen mensual separado por tarjeta y físico', () {
    final summary = IncomeMonthlySummary.fromJson({
      'month': '2026-10',
      'totalTarjeta': 15000,
      'totalFisico': 8000,
      'total': 23000,
    });

    expect(summary.month, '2026-10');
    expect(summary.totalTarjeta, 15000);
    expect(summary.totalFisico, 8000);
    expect(summary.total, 23000);
  });
}
