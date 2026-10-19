import 'package:flutter/material.dart';

import '../../../core/utils/date_utils.dart';
import '../../../core/utils/money_format.dart';
import '../domain/expense_stats.dart';
import 'category_breakdown.dart';
import 'sheet_header.dart';

/// Todas las categorías del mes. Resuelve con el nombre de la categoría elegida.
Future<String?> showCategoriesOverviewSheet(
  BuildContext context, {
  required List<CategoryTotal> rows,
  required Map<String, Color> colors,
  required String month,
  required double total,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => CategoriesOverviewSheet(rows: rows, colors: colors, month: month, total: total),
  );
}

class CategoriesOverviewSheet extends StatelessWidget {
  const CategoriesOverviewSheet({
    super.key,
    required this.rows,
    required this.colors,
    required this.month,
    required this.total,
  });

  final List<CategoryTotal> rows;
  final Map<String, Color> colors;
  final String month;
  final double total;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (context, controller) => Column(
        children: [
          SheetHeader(
            title: 'Gastos por categoría',
            summary: TextSpan(
              children: [
                TextSpan(text: '${formatMonthLabel(month)} · ${rows.length} categoría(s) · Total '),
                TextSpan(text: formatMoney(total), style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              controller: controller,
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
              child: CategoryBreakdown(
                rows: rows,
                colors: colors,
                visibleRows: null,
                showHeader: false,
                onSelectCategory: (category) => Navigator.of(context).pop(category),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
