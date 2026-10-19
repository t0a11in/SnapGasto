import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../domain/expense_stats.dart';
import 'category_breakdown_row.dart';

/// Lista de gastos por categoría. Muestra `visibleRows` filas y el resto con scroll;
/// "Ver todas" pide abrir el detalle completo. Cada fila abre sus gastos.
class CategoryBreakdown extends StatelessWidget {
  const CategoryBreakdown({
    super.key,
    required this.rows,
    required this.colors,
    required this.onSelectCategory,
    this.onExpand,
    this.visibleRows = 3,
    this.showHeader = true,
  });

  final List<CategoryTotal> rows;

  /// Colores por categoría (mismos del gráfico de torta).
  final Map<String, Color> colors;
  final ValueChanged<String> onSelectCategory;
  final VoidCallback? onExpand;

  /// Filas visibles antes del scroll; null = sin límite (p. ej. dentro de una hoja).
  final int? visibleRows;
  final bool showHeader;

  bool get _hasMore => visibleRows != null && rows.length > visibleRows!;

  Color _color(BuildContext context, CategoryTotal row) =>
      colors[row.category] ?? Theme.of(context).colorScheme.outline;

  Widget _row(BuildContext context, CategoryTotal row) => CategoryBreakdownRow(
        row: row,
        color: _color(context, row),
        onTap: () => onSelectCategory(row.category),
      );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText);

    final Widget list;
    if (rows.isEmpty) {
      list = Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text('Sin gastos en este mes.', style: muted));
    } else if (visibleRows == null) {
      list = Column(children: [for (final r in rows) _row(context, r)]);
    } else {
      list = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: breakdownRowHeight * (_hasMore ? visibleRows! : rows.length),
            child: ListView.builder(
              padding: EdgeInsets.zero,
              itemCount: rows.length,
              itemBuilder: (context, i) => _row(context, rows[i]),
            ),
          ),
          if (_hasMore)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 8),
              child: Text('Desliza para ver ${rows.length - visibleRows!} más', style: muted),
            ),
        ],
      );
    }

    if (!showHeader) {
      return list;
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: [
                  Expanded(child: Text('Por categoría', style: muted)),
                  if (rows.isNotEmpty && onExpand != null)
                    TextButton.icon(
                      onPressed: onExpand,
                      icon: const Icon(Icons.open_in_full, size: 16),
                      label: Text('Ver todas (${rows.length})'),
                    ),
                ],
              ),
            ),
            list,
          ],
        ),
      ),
    );
  }
}
