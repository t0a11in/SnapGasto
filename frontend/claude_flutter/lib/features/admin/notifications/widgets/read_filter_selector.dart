import 'package:flutter/material.dart';

enum ReadFilter {
  all('Todas'),
  unread('No leídas'),
  read('Leídas');

  const ReadFilter(this.label);

  final String label;
}

/// Filtro por estado de lectura.
class ReadFilterSelector extends StatelessWidget {
  const ReadFilterSelector({super.key, required this.value, required this.onChanged});

  final ReadFilter value;
  final ValueChanged<ReadFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<ReadFilter>(
      segments: [for (final f in ReadFilter.values) ButtonSegment(value: f, label: Text(f.label))],
      selected: {value},
      showSelectedIcon: false,
      onSelectionChanged: (s) => onChanged(s.first),
    );
  }
}
