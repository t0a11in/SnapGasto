import 'package:flutter/material.dart';

/// Botón principal de ancho completo con spinner mientras se envía.
class SubmitButton extends StatelessWidget {
  const SubmitButton({super.key, required this.label, required this.submitting, required this.onPressed});

  final String label;
  final bool submitting;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: submitting ? null : onPressed,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (submitting) ...[
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            const SizedBox(width: 10),
          ],
          Text(label),
        ],
      ),
    );
  }
}
