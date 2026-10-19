import 'package:claude_flutter/core/models/models.dart';
import 'package:claude_flutter/core/utils/chart_palette.dart';
import 'package:claude_flutter/features/expenses/domain/expense_stats.dart';
import 'package:flutter_test/flutter_test.dart';

ExpenseResponse _e(String id, String category, double amount, [String date = '2026-10-01']) => ExpenseResponse(
      id: id,
      amount: amount,
      category: category,
      date: date,
      paymentMethod: 'TARJETA',
    );

void main() {
  test('agrupa por categoría de mayor a menor con proporción', () {
    final stats = ExpenseStats([
      _e('1', 'Comida', 3000),
      _e('2', 'Transporte', 1000),
      _e('3', 'Comida', 1000),
    ], const []);

    expect(stats.total, 5000);
    expect(stats.byCategory.map((r) => r.category), ['Comida', 'Transporte']);
    expect(stats.byCategory.first.count, 2);
    expect(stats.byCategory.first.share, closeTo(0.8, 1e-9));
  });

  test('el gráfico agrupa desde la 7.ª categoría en "Otras"', () {
    final items = [for (var i = 0; i < 8; i++) _e('$i', 'Cat $i', (10 - i) * 100.0)];
    final stats = ExpenseStats(items, const []);

    expect(stats.chartRows.length, 7);
    expect(stats.chartRows.last.category, otherCategory);
    expect(stats.chartRows.last.total, 400 + 300);
    expect(stats.categoryColors['Cat 0'], categoricalPalette.first);
    expect(stats.categoryColors['Cat 7'], otherColor);
  });

  test('categorías conocidas: catálogo + usadas, sin duplicados y ordenadas', () {
    final stats = ExpenseStats(
      [_e('1', 'Ñandú', 10), _e('2', 'Árbol', 10)],
      const [CategoryResponse(id: 'c', name: 'Comida'), CategoryResponse(id: 'd', name: 'Árbol')],
    );
    expect(stats.knownCategories, ['Árbol', 'Comida', 'Ñandú']);
  });

  test('itemsOfCategory del más reciente al más antiguo', () {
    final stats = ExpenseStats([
      _e('1', 'Comida', 10, '2026-10-01'),
      _e('2', 'Comida', 10, '2026-10-05'),
      _e('3', 'Otro', 10, '2026-10-03'),
    ], const []);
    expect(stats.itemsOfCategory('Comida').map((e) => e.id), ['2', '1']);
  });
}
