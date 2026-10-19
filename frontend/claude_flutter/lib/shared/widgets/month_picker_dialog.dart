import 'package:flutter/material.dart';

import '../../core/utils/date_utils.dart';

/// Diálogo para elegir un mes (YYYY-MM). Resuelve null si se cancela.
Future<String?> showMonthPickerDialog(BuildContext context, {required String initialMonth}) {
  return showDialog<String>(
    context: context,
    builder: (_) => MonthPickerDialog(initialMonth: initialMonth),
  );
}

class MonthPickerDialog extends StatefulWidget {
  const MonthPickerDialog({super.key, required this.initialMonth});

  final String initialMonth;

  @override
  State<MonthPickerDialog> createState() => _MonthPickerDialogState();
}

class _MonthPickerDialogState extends State<MonthPickerDialog> {
  late int _year;
  late final int _selectedYear;
  late final int _selectedMonth;

  @override
  void initState() {
    super.initState();
    final month = isValidMonth(widget.initialMonth) ? widget.initialMonth : currentMonth();
    _selectedYear = int.parse(month.substring(0, 4));
    _selectedMonth = int.parse(month.substring(5, 7));
    _year = _selectedYear;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AlertDialog(
      title: Row(
        children: [
          IconButton(
            tooltip: 'Año anterior',
            icon: const Icon(Icons.chevron_left),
            onPressed: () => setState(() => _year--),
          ),
          Expanded(child: Text('$_year', textAlign: TextAlign.center)),
          IconButton(
            tooltip: 'Año siguiente',
            icon: const Icon(Icons.chevron_right),
            onPressed: () => setState(() => _year++),
          ),
        ],
      ),
      content: SizedBox(
        width: 300,
        child: GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          childAspectRatio: 2,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          children: [
            for (var m = 1; m <= 12; m++)
              _MonthCell(
                label: monthShortNames[m - 1],
                selected: _year == _selectedYear && m == _selectedMonth,
                color: scheme.primary,
                onTap: () => Navigator.of(context).pop('$_year-${m.toString().padLeft(2, '0')}'),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(currentMonth()), child: const Text('Este mes')),
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
      ],
    );
  }
}

class _MonthCell extends StatelessWidget {
  const _MonthCell({required this.label, required this.selected, required this.color, required this.onTap});

  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? color : Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : null,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}
