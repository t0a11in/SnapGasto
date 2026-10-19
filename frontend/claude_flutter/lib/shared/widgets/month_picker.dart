import 'package:flutter/material.dart';

import '../../core/utils/date_utils.dart';
import 'month_picker_dialog.dart';

/// Selector de mes YYYY-MM con navegación anterior/siguiente.
class MonthPicker extends StatelessWidget {
  const MonthPicker({super.key, required this.month, required this.onChanged});

  final String month;
  final ValueChanged<String> onChanged;

  Future<void> _pick(BuildContext context) async {
    final picked = await showMonthPickerDialog(context, initialMonth: month);
    if (picked != null && isValidMonth(picked) && picked != month) {
      onChanged(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'Mes anterior',
            icon: const Icon(Icons.chevron_left),
            onPressed: () => onChanged(shiftMonth(month, -1)),
          ),
          TextButton.icon(
            onPressed: () => _pick(context),
            icon: const Icon(Icons.calendar_month_outlined, size: 18),
            label: Text(formatMonthLabel(month)),
          ),
          IconButton(
            tooltip: 'Mes siguiente',
            icon: const Icon(Icons.chevron_right),
            onPressed: () => onChanged(shiftMonth(month, 1)),
          ),
        ],
      ),
    );
  }
}
