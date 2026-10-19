import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/utils/money_format.dart';
import '../../../shared/widgets/stat_card.dart';

/// Total gastado con cantidad de movimientos y categorías.
class ExpenseSummaryCard extends StatelessWidget {
  const ExpenseSummaryCard({super.key, required this.total, required this.count, this.categories = 0});

  final double total;
  final int count;
  final int categories;

  @override
  Widget build(BuildContext context) {
    return StatCard(
      label: 'Total gastado',
      value: formatMoney(total),
      valueColor: AppColors.danger,
      large: true,
      caption: '${formatNumber(count)} movimiento(s) · ${formatNumber(categories)} categoría(s)',
    );
  }
}
