import 'package:flutter/material.dart';

import '../../../core/models/models.dart';

/// Tipo de ingreso: Tarjeta / Físico.
class IncomeTypeSelector extends StatelessWidget {
  const IncomeTypeSelector({super.key, required this.value, required this.onChanged});

  final IncomeType value;
  final ValueChanged<IncomeType> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Tipo', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        SegmentedButton<IncomeType>(
          segments: [
            for (final t in IncomeType.values) ButtonSegment(value: t, label: Text(t.label)),
          ],
          selected: {value},
          showSelectedIcon: false,
          onSelectionChanged: (selection) => onChanged(selection.first),
        ),
      ],
    );
  }
}
