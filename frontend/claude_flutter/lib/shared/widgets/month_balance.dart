import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../core/utils/money_format.dart';
import 'skeleton_line.dart';

/// Diferencia del mes: ingresos − gastos, con la proporción gastada.
/// `income`/`expense` null = aún cargando o no disponible.
class MonthBalance extends StatelessWidget {
  const MonthBalance({super.key, required this.income, required this.expense});

  final double? income;
  final double? expense;

  bool get ready => income != null && expense != null;

  double get balance => (income ?? 0.0) - (expense ?? 0.0);

  bool get positive => balance >= 0;

  /// Proporción de los ingresos ya gastada (0..1+).
  double get spentRatio {
    final i = income ?? 0.0;
    final e = expense ?? 0.0;
    if (i > 0) {
      return e / i;
    }
    return e != 0 ? 1.0 : 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = !ready || positive ? AppColors.success : AppColors.danger;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: DecoratedBox(
        decoration: BoxDecoration(border: Border(left: BorderSide(color: accent, width: 4))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: _Amount(icon: Icons.trending_up, label: 'Ingresos', value: income)),
                  Expanded(child: _Amount(icon: Icons.trending_down, label: 'Gastos', value: expense)),
                ],
              ),
              const Divider(height: 24),
              Text('Diferencia del mes', style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText)),
              const SizedBox(height: 4),
              if (!ready)
                const SkeletonLine(widthFactor: 0.5, height: 28)
              else ...[
                Text(
                  '${positive ? '+' : ''}${formatMoney(balance)}',
                  style: theme.textTheme.headlineSmall?.copyWith(color: accent, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: math.min(1.0, spentRatio),
                    minHeight: 6,
                    color: positive ? theme.colorScheme.primary : AppColors.danger,
                    backgroundColor: theme.colorScheme.surfaceContainerHighest,
                    semanticsLabel: 'Proporción de ingresos gastada',
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Gastado ${formatPercent(spentRatio)} de los ingresos',
                  style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText),
                ),
                const SizedBox(height: 2),
                Text(
                  positive
                      ? 'Te quedan ${formatMoney(balance.abs())} este mes.'
                      : 'Gastaste ${formatMoney(balance.abs())} más de lo que ingresaste.',
                  style: theme.textTheme.bodySmall?.copyWith(color: accent),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Amount extends StatelessWidget {
  const _Amount({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final double? value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppColors.secondaryText),
            const SizedBox(width: 4),
            Text(label, style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText)),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          value == null ? '—' : formatMoney(value),
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
