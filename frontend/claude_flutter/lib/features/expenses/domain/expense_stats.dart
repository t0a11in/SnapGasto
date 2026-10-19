import 'dart:ui';

import 'package:equatable/equatable.dart';

import '../../../core/models/models.dart';
import '../../../core/utils/chart_palette.dart';
import '../../../core/utils/money_utils.dart';
import '../../../core/utils/text_utils.dart';

/// Máximo de categorías individuales en el gráfico; el resto se agrupa en "Otras".
final int chartMaxCategories = categoricalPalette.length;
const String otherCategory = 'Otras';

class CategoryTotal extends Equatable {
  const CategoryTotal({
    required this.category,
    required this.total,
    required this.count,
    required this.share,
    this.colorHex,
  });

  final String category;
  final double total;
  final int count;

  /// Proporción del total del mes (0..1).
  final double share;
  final String? colorHex;

  @override
  List<Object?> get props => [category, total, count, share, colorHex];
}

/// Cálculos derivados de los gastos del mes (los `computed` del ExpensesStore de Angular).
class ExpenseStats {
  ExpenseStats(List<ExpenseResponse> items, List<CategoryResponse> categories)
      : sortedItems = [...items]..sort((a, b) => b.date.compareTo(a.date)),
        total = sumAmounts(items),
        byCategory = _byCategory(items, categories),
        knownCategories = _knownCategories(items, categories) {
    chartRows = _chartRows(byCategory);
    categoryColors = _categoryColors(byCategory);
  }

  /// Del más reciente al más antiguo.
  final List<ExpenseResponse> sortedItems;
  final double total;

  /// Totales por categoría, de mayor a menor.
  final List<CategoryTotal> byCategory;

  /// Categorías para autocompletar: catálogo + las ya usadas en el mes.
  final List<String> knownCategories;

  /// Datos del gráfico: top N categorías + "Otras" agrupadas.
  late final List<CategoryTotal> chartRows;

  /// Color de cada categoría según su posición en el gráfico (las agrupadas en "Otras", gris).
  late final Map<String, Color> categoryColors;

  /// Gastos de una categoría del mes, del más reciente al más antiguo.
  List<ExpenseResponse> itemsOfCategory(String category) =>
      sortedItems.where((e) => e.category == category).toList();

  static List<CategoryTotal> _byCategory(List<ExpenseResponse> items, List<CategoryResponse> categories) {
    final colors = {for (final c in categories) c.name: c.colorHex};
    final totals = <String, double>{};
    final counts = <String, int>{};
    for (final e in items) {
      totals[e.category] = (totals[e.category] ?? 0.0) + e.amount;
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    final grand = sumAmounts(items);
    final rows = [
      for (final entry in totals.entries)
        CategoryTotal(
          category: entry.key,
          total: entry.value,
          count: counts[entry.key] ?? 0,
          share: grand > 0 ? entry.value / grand : 0.0,
          colorHex: colors[entry.key],
        ),
    ];
    rows.sort((a, b) {
      final byTotal = b.total.compareTo(a.total);
      return byTotal != 0 ? byTotal : compareEs(a.category, b.category);
    });
    return rows;
  }

  static List<CategoryTotal> _chartRows(List<CategoryTotal> rows) {
    if (rows.length <= chartMaxCategories) {
      return rows;
    }
    final top = rows.sublist(0, chartMaxCategories);
    final rest = rows.sublist(chartMaxCategories);
    return [
      ...top,
      CategoryTotal(
        category: otherCategory,
        total: rest.fold(0.0, (a, r) => a + r.total),
        count: rest.fold(0, (a, r) => a + r.count),
        share: rest.fold(0.0, (a, r) => a + r.share),
      ),
    ];
  }

  static Map<String, Color> _categoryColors(List<CategoryTotal> rows) {
    final map = <String, Color>{};
    for (var i = 0; i < rows.length; i++) {
      map[rows[i].category] = i < chartMaxCategories ? categoricalPalette[i] : otherColor;
    }
    map[otherCategory] = otherColor;
    return map;
  }

  static List<String> _knownCategories(List<ExpenseResponse> items, List<CategoryResponse> categories) {
    final names = <String>{
      for (final c in categories) c.name,
      for (final e in items) e.category,
    }..removeWhere((n) => n.isEmpty);
    return names.toList()..sort(compareEs);
  }
}
