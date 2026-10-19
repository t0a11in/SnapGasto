import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/date_utils.dart';
import '../../../../core/utils/money_format.dart';
import '../../../../shared/widgets/pill_badge.dart';
import '../../../../shared/widgets/row_actions.dart';

class AdminExpenseTile extends StatelessWidget {
  const AdminExpenseTile({super.key, required this.expense, required this.onEdit, required this.onDelete});

  final AdminExpenseResponse expense;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText);
    final description = expense.description;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 4, 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(expense.userName, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(
                  description == null || description.isEmpty ? '—' : description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text('${formatDateDisplay(expense.date)} · ${expense.category}', style: muted),
                    PillBadge(label: PaymentMethod.labelOf(expense.paymentMethod), outlined: true),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatMoney(expense.amount), style: const TextStyle(fontWeight: FontWeight.w600)),
              RowActions(editLabel: 'Editar gasto', deleteLabel: 'Eliminar gasto', onEdit: onEdit, onDelete: onDelete),
            ],
          ),
        ],
      ),
    );
  }
}
