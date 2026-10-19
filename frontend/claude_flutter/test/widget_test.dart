import 'package:claude_flutter/shared/widgets/month_balance.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: SingleChildScrollView(child: child)));

void main() {
  testWidgets('MonthBalance muestra el saldo positivo', (tester) async {
    await tester.pumpWidget(_wrap(const MonthBalance(income: 100000, expense: 25000)));
    expect(find.text(r'+$75.000'), findsOneWidget);
    expect(find.text(r'Te quedan $75.000 este mes.'), findsOneWidget);
    expect(find.text('Gastado 25,0 % de los ingresos'), findsOneWidget);
  });

  testWidgets('MonthBalance muestra el sobregasto', (tester) async {
    await tester.pumpWidget(_wrap(const MonthBalance(income: 10000, expense: 15000)));
    expect(find.text(r'-$5.000'), findsOneWidget);
    expect(find.text(r'Gastaste $5.000 más de lo que ingresaste.'), findsOneWidget);
  });

  testWidgets('MonthBalance mientras carga muestra guiones', (tester) async {
    await tester.pumpWidget(_wrap(const MonthBalance(income: null, expense: 15000)));
    expect(find.text('—'), findsOneWidget);
  });
}
