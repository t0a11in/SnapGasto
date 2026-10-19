import 'package:flutter/material.dart';

import '../../../../core/utils/chart_palette.dart';

/// Colores sugeridos para categorías (#RRGGBB).
const List<String> suggestedCategoryColors = [
  '#2A78D6',
  '#EB6834',
  '#1BAF7A',
  '#EDA100',
  '#E87BA4',
  '#008300',
  '#22C55E',
  '#EF4444',
  '#8B5CF6',
  '#0EA5E9',
  '#F59E0B',
  '#6C757D',
];

/// Paleta de colores tocables (reemplaza al `<input type="color">` de la web).
class ColorSwatchPicker extends StatelessWidget {
  const ColorSwatchPicker({super.key, required this.selected, required this.onSelected});

  final String? selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final hex in suggestedCategoryColors)
          Semantics(
            button: true,
            selected: selected?.toUpperCase() == hex,
            label: 'Color $hex',
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () => onSelected(hex),
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: colorFromHex(hex),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: selected?.toUpperCase() == hex ? Colors.black87 : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: selected?.toUpperCase() == hex
                    ? const Icon(Icons.check, size: 18, color: Colors.white)
                    : null,
              ),
            ),
          ),
      ],
    );
  }
}
