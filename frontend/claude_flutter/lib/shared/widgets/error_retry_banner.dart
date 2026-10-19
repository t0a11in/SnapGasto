import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Error de carga de una pantalla con botón "Reintentar".
class ErrorRetryBanner extends StatelessWidget {
  const ErrorRetryBanner({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
      decoration: BoxDecoration(color: AppColors.dangerSubtle, borderRadius: BorderRadius.circular(10)),
      child: Row(
        children: [
          Expanded(child: Text(message, style: const TextStyle(color: Color(0xFF842029)))),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.danger,
              side: const BorderSide(color: AppColors.danger),
              minimumSize: const Size(0, 36),
            ),
            onPressed: onRetry,
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }
}
