import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/money_format.dart';
import '../../../shared/widgets/pill_badge.dart';
import '../../../shared/widgets/row_actions.dart';

/// Fila de un ingreso: fecha, descripción, tipo, monto y acciones.
class IncomeTile extends StatelessWidget {
  const IncomeTile({super.key, required this.income, required this.onEdit, required this.onDelete});

  final IncomeResponse income;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final description = income.description;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 4, 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  description == null || description.isEmpty ? '—' : description,
                  style: theme.textTheme.bodyLarge,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      formatDateDisplay(income.date),
                      style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText),
                    ),
                    const SizedBox(width: 8),
                    PillBadge(label: income.type.label, outlined: true),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatMoney(income.amount),
                style: theme.textTheme.titleSmall?.copyWith(color: AppColors.success, fontWeight: FontWeight.w600),
              ),
              RowActions(
                editLabel: 'Editar ingreso del ${formatDateDisplay(income.date)}',
                deleteLabel: 'Eliminar ingreso del ${formatDateDisplay(income.date)}',
                onEdit: onEdit,
                onDelete: onDelete,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
