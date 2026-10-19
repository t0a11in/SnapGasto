import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Estado de una lista: cargando / error con reintento / vacío.
class StateMessage extends StatelessWidget {
  const StateMessage({
    super.key,
    this.loading = false,
    this.error,
    this.emptyText = 'No hay registros.',
    this.onRetry,
  });

  final bool loading;
  final String? error;
  final String emptyText;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final Widget child;
    if (loading) {
      child = const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
          SizedBox(width: 10),
          Text('Cargando…'),
        ],
      );
    } else if (error != null) {
      child = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.danger)),
          if (onRetry != null) ...[
            const SizedBox(height: 8),
            OutlinedButton(onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ],
      );
    } else {
      child = Text(emptyText, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.secondaryText));
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
      child: Center(child: child),
    );
  }
}
