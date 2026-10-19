import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/utils/money_format.dart';
import '../domain/expense_stats.dart';

/// Alto fijo de cada fila: permite calcular cuántas filas se ven antes del scroll.
const double breakdownRowHeight = 44;

/// Fila de una categoría: color, nombre, cantidad, % y total. Al tocarla abre sus gastos.
class CategoryBreakdownRow extends StatelessWidget {
  const CategoryBreakdownRow({super.key, required this.row, required this.color, required this.onTap});

  final CategoryTotal row;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText);
    return Semantics(
      button: true,
      label: 'Ver gastos de ${row.category}',
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: SizedBox(
          height: breakdownRowHeight,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: [
                Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Flexible(child: Text(row.category, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: 4),
                Text('(${row.count})', style: muted),
                const Spacer(),
                Text(formatPercent(row.share), style: muted),
                const SizedBox(width: 8),
                Text(formatMoney(row.total), style: const TextStyle(fontWeight: FontWeight.w600)),
                const Icon(Icons.chevron_right, size: 18, color: AppColors.secondaryText),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
