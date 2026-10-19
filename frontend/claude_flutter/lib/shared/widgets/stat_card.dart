import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Tarjeta de indicador: etiqueta, valor destacado y detalle opcional.
class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.caption,
    this.large = false,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final String? caption;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final valueStyle = (large ? theme.textTheme.headlineSmall : theme.textTheme.titleLarge)
        ?.copyWith(fontWeight: FontWeight.bold, color: valueColor);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText)),
            const SizedBox(height: 4),
            FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: Text(value, style: valueStyle)),
            if (caption != null) ...[
              const SizedBox(height: 2),
              Text(caption!, style: theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText)),
            ],
          ],
        ),
      ),
    );
  }
}
