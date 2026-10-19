import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Encabezado de pantalla: título, subtítulo y acciones (se acomodan en varias líneas).
class PageHeader extends StatelessWidget {
  const PageHeader({super.key, required this.title, this.subtitle, this.actions = const []});

  final String title;
  final String? subtitle;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600)),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Text(subtitle!, style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.secondaryText)),
        ],
        if (actions.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: actions),
        ],
      ],
    );
  }
}
