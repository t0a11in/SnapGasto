import 'package:flutter/material.dart';

import '../../../core/models/models.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/money_format.dart';
import '../../../core/utils/money_utils.dart';
import 'expenses_list.dart';
import 'sheet_header.dart';

/// Detalle de todos los gastos del mes de una categoría.
Future<void> showCategoryExpensesSheet(
  BuildContext context, {
  required String category,
  required String month,
  required List<ExpenseResponse> items,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => CategoryExpensesSheet(category: category, month: month, items: items),
  );
}

class CategoryExpensesSheet extends StatelessWidget {
  const CategoryExpensesSheet({super.key, required this.category, required this.month, required this.items});

  final String category;
  final String month;
  final List<ExpenseResponse> items;

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (context, controller) => Column(
        children: [
          SheetHeader(
            title: category,
            summary: TextSpan(
              children: [
                TextSpan(text: '${formatMonthLabel(month)} · ${formatNumber(items.length)} gasto(s) · Total '),
                TextSpan(
                  text: formatMoney(sumAmounts(items)),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: SingleChildScrollView(
              controller: controller,
              padding: const EdgeInsets.only(bottom: 24),
              child: ExpensesList(items: items, showActions: false, showCategory: false),
            ),
          ),
        ],
      ),
    );
  }
}
