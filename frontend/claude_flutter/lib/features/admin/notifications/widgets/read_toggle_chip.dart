import 'package:flutter/material.dart';

/// Estado "Leída / No leída" que al tocarlo alterna el valor.
class ReadToggleChip extends StatelessWidget {
  const ReadToggleChip({super.key, required this.read, required this.onToggle});

  final bool read;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Tooltip(
      message: read ? 'Marcar como no leída' : 'Marcar como leída',
      child: ActionChip(
        onPressed: onToggle,
        avatar: Icon(read ? Icons.drafts_outlined : Icons.mark_email_unread_outlined, size: 18),
        label: Text(read ? 'Leída' : 'No leída'),
        side: BorderSide(color: read ? scheme.outlineVariant : scheme.primary),
        labelStyle: TextStyle(color: read ? scheme.onSurfaceVariant : scheme.primary),
      ),
    );
  }
}
