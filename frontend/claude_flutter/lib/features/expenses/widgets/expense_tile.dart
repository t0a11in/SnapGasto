import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/money_format.dart';
import '../../../shared/widgets/pill_badge.dart';
import '../../../shared/widgets/row_actions.dart';

/// Fila de un gasto: descripción, fecha, categoría, medio de pago, monto y acciones.
class ExpenseTile extends StatelessWidget {
  const ExpenseTile({
    super.key,
    required this.expense,
    this.showCategory = true,
    this.onEdit,
    this.onDelete,
  });

  final ExpenseResponse expense;
  final bool showCategory;

  /// Si ambos son null no se muestran acciones (p. ej. en el detalle por categoría).
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final description = expense.description;
    final date = formatDateDisplay(expense.date);
    final meta = showCategory ? '$date · ${expense.category}' : date;
    final hasActions = onEdit != null || onDelete != null;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 10, hasActions ? 4 : 16, 10),
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
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(meta, style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText)),
                    PillBadge(label: PaymentMethod.labelOf(expense.paymentMethod), outlined: true),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatMoney(expense.amount),
                style: theme.textTheme.titleSmall?.copyWith(color: AppColors.danger, fontWeight: FontWeight.w600),
              ),
              if (hasActions)
                RowActions(
                  editLabel: 'Editar gasto del $date',
                  deleteLabel: 'Eliminar gasto del $date',
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
