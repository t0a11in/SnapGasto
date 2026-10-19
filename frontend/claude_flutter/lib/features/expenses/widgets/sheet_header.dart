import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';

/// Encabezado de las hojas de detalle: título, resumen y botón cerrar.
class SheetHeader extends StatelessWidget {
  const SheetHeader({super.key, required this.title, required this.summary});

  final String title;
  final InlineSpan summary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 8, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text.rich(summary, style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText)),
              ],
            ),
          ),
          IconButton(tooltip: 'Cerrar', icon: const Icon(Icons.close), onPressed: () => Navigator.of(context).pop()),
        ],
      ),
    );
  }
}
