import 'package:flutter/material.dart';

import '../../../core/models/models.dart';
import '../../../shared/widgets/state_message.dart';
import 'expense_tile.dart';

/// Listado de gastos (equivalente a la tabla de Angular).
class ExpensesList extends StatelessWidget {
  const ExpensesList({
    super.key,
    required this.items,
    this.loading = false,
    this.showActions = true,
    this.showCategory = true,
    this.onEdit,
    this.onDelete,
  });

  final List<ExpenseResponse> items;
  final bool loading;

  /// false oculta editar/eliminar (p. ej. en la hoja de detalle).
  final bool showActions;
  final bool showCategory;
  final ValueChanged<ExpenseResponse>? onEdit;
  final ValueChanged<ExpenseResponse>? onDelete;

  @override
  Widget build(BuildContext context) {
    if (loading || items.isEmpty) {
      return StateMessage(loading: loading, emptyText: 'No hay gastos registrados en este mes.');
    }
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) const Divider(height: 1),
          ExpenseTile(
            expense: items[i],
            showCategory: showCategory,
            onEdit: showActions && onEdit != null ? () => onEdit!(items[i]) : null,
            onDelete: showActions && onDelete != null ? () => onDelete!(items[i]) : null,
          ),
        ],
      ],
    );
  }
}
