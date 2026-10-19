import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Contenido de la alerta superior: título, detalle y barra de tiempo restante.
class TopAlertContent extends StatelessWidget {
  const TopAlertContent({super.key, required this.title, required this.duration, this.text});

  final String title;
  final String? text;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
        if (text != null && text!.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(text!, style: theme.textTheme.bodySmall),
        ],
        const SizedBox(height: 8),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 1, end: 0),
          duration: duration,
          builder: (context, value, _) => LinearProgressIndicator(
            value: value,
            minHeight: 3,
            color: AppColors.danger,
            backgroundColor: AppColors.danger.withValues(alpha: 0.15),
          ),
        ),
      ],
    );
  }
}
