import 'package:flutter/material.dart';

/// Etiqueta redondeada (equivalente a `.badge` de Bootstrap).
class PillBadge extends StatelessWidget {
  const PillBadge({super.key, required this.label, this.color, this.background, this.outlined = false});

  final String label;
  final Color? color;
  final Color? background;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fg = color ?? scheme.onSurfaceVariant;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: background ?? scheme.surfaceContainerHighest.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(999),
        border: outlined ? Border.all(color: scheme.outlineVariant) : null,
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: fg, fontWeight: FontWeight.w600),
      ),
    );
  }
}
