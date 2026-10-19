import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/utils/chart_palette.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/money_format.dart';
import '../domain/expense_stats.dart';
import 'chart_legend_item.dart';
import 'chart_slice_detail.dart';

/// Torta de distribución del gasto mensual por categoría.
/// Sectores de mayor a menor con la paleta categórica validada, separación de 2 px,
/// leyenda con montos y porcentajes. Tocar un sector o la leyenda abre los gastos
/// de esa categoría ("Otras" abre el listado completo).
class ExpenseDistributionChart extends StatefulWidget {
  const ExpenseDistributionChart({
    super.key,
    required this.rows,
    required this.colors,
    required this.total,
    required this.month,
    required this.onSelectCategory,
    required this.onShowAll,
  });

  final List<CategoryTotal> rows;
  final Map<String, Color> colors;
  final double total;
  final String month;
  final ValueChanged<String> onSelectCategory;
  final VoidCallback onShowAll;

  @override
  State<ExpenseDistributionChart> createState() => _ExpenseDistributionChartState();
}

class _ExpenseDistributionChartState extends State<ExpenseDistributionChart> {
  static const double _radius = 92;
  static const double _activeRadius = 100;

  int _active = -1;

  Color _colorOf(CategoryTotal row) =>
      widget.colors[row.category] ?? (row.category == otherCategory ? otherColor : categoricalPalette.first);

  void _open(CategoryTotal row) {
    if (row.category == otherCategory) {
      widget.onShowAll();
    } else {
      widget.onSelectCategory(row.category);
    }
  }

  void _onTouch(FlTouchEvent event, PieTouchResponse? response) {
    final index = response?.touchedSection?.touchedSectionIndex ?? -1;
    if (!event.isInterestedForInteractions || index < 0 || index >= widget.rows.length) {
      if (_active != -1 && event is FlTapUpEvent) {
        setState(() => _active = -1);
      }
      return;
    }
    if (index != _active) {
      setState(() => _active = index);
    }
    if (event is FlTapUpEvent) {
      _open(widget.rows[index]);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final rows = widget.rows;
    final sum = rows.fold(0.0, (a, r) => a + r.total);
    final active = _active >= 0 && _active < rows.length ? rows[_active] : null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Distribución de gastos por categoría',
              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 2),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: 'Total ${formatMonthLabel(widget.month)}: '),
                  TextSpan(
                    text: formatMoney(widget.total),
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                  ),
                ],
              ),
              style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 12),
            if (sum <= 0)
              Text(
                'Aún no hay gastos para graficar en este mes.',
                style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText),
              )
            else ...[
              Semantics(
                label: 'Gráfico de torta con ${rows.length} categorías. El detalle está en la leyenda.',
                child: SizedBox(
                  height: 220,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      PieChart(
                        PieChartData(
                          startDegreeOffset: -90,
                          sectionsSpace: 2,
                          centerSpaceRadius: 0,
                          pieTouchData: PieTouchData(touchCallback: _onTouch),
                          sections: [
                            for (var i = 0; i < rows.length; i++)
                              PieChartSectionData(
                                value: rows[i].total,
                                color: _activeColor(i, rows[i]),
                                radius: i == _active ? _activeRadius : _radius,
                                showTitle: false,
                              ),
                          ],
                        ),
                      ),
                      if (active != null)
                        Positioned(
                          top: 0,
                          right: 0,
                          child: ChartSliceDetail(row: active, color: _colorOf(active)),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              for (var i = 0; i < rows.length; i++)
                ChartLegendItem(
                  row: rows[i],
                  color: _colorOf(rows[i]),
                  active: i == _active,
                  onTap: () => _open(rows[i]),
                ),
            ],
          ],
        ),
      ),
    );
  }

  /// Con un sector activo, el resto se atenúa.
  Color _activeColor(int index, CategoryTotal row) {
    final color = _colorOf(row);
    return _active == -1 || _active == index ? color : color.withValues(alpha: 0.45);
  }
}
