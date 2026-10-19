import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/utils/money_format.dart';
import '../domain/expense_stats.dart';

/// Elemento de la leyenda del gráfico: color, nombre, % y total.
class ChartLegendItem extends StatelessWidget {
  const ChartLegendItem({
    super.key,
    required this.row,
    required this.color,
    required this.active,
    required this.onTap,
  });

  final CategoryTotal row;
  final Color color;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: '${row.category}: ${formatMoney(row.total)}, ${formatPercent(row.share)}',
      child: Material(
        color: active ? scheme.surfaceContainerHighest : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(row.category, overflow: TextOverflow.ellipsis)),
                Text(formatPercent(row.share), style: const TextStyle(color: AppColors.secondaryText)),
                const SizedBox(width: 12),
                SizedBox(
                  width: 96,
                  child: Text(
                    formatMoney(row.total),
                    textAlign: TextAlign.right,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontFeatures: [FontFeature.tabularFigures()]),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
