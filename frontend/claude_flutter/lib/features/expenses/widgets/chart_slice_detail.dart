import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/utils/money_format.dart';
import '../domain/expense_stats.dart';

/// Detalle del sector tocado (equivalente al tooltip del gráfico web).
class ChartSliceDetail extends StatelessWidget {
  const ChartSliceDetail({super.key, required this.row, required this.color});

  final CategoryTotal row;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: theme.colorScheme.outlineVariant),
        boxShadow: const [BoxShadow(color: Color(0x1F0F172A), blurRadius: 18, offset: Offset(0, 6))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
              ),
              const SizedBox(width: 6),
              Text(row.category, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
          Text('${formatMoney(row.total)} · ${formatPercent(row.share)}', style: theme.textTheme.bodySmall),
          Text(
            '${formatNumber(row.count)} gasto(s)',
            style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText),
          ),
        ],
      ),
    );
  }
}
