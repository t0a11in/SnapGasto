import 'package:flutter/material.dart';

import '../../../core/models/models.dart';
import '../../../shared/widgets/state_message.dart';
import 'income_tile.dart';

/// Listado de ingresos del mes (equivalente a la tabla de Angular).
class IncomesList extends StatelessWidget {
  const IncomesList({
    super.key,
    required this.items,
    required this.loading,
    required this.onEdit,
    required this.onDelete,
  });

  final List<IncomeResponse> items;
  final bool loading;
  final ValueChanged<IncomeResponse> onEdit;
  final ValueChanged<IncomeResponse> onDelete;

  @override
  Widget build(BuildContext context) {
    if (loading || items.isEmpty) {
      return StateMessage(loading: loading, emptyText: 'No hay ingresos registrados en este mes.');
    }
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) const Divider(height: 1),
          IncomeTile(
            income: items[i],
            onEdit: () => onEdit(items[i]),
            onDelete: () => onDelete(items[i]),
          ),
        ],
      ],
    );
  }
}
