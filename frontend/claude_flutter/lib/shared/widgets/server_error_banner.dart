import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Mensaje de error del servidor dentro de un formulario (`.alert-danger`).
class ServerErrorBanner extends StatelessWidget {
  const ServerErrorBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.dangerSubtle,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(message, style: const TextStyle(color: Color(0xFF842029)))),
          ],
        ),
      ),
    );
  }
}
