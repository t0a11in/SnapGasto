import 'package:flutter/material.dart';

import '../../../core/models/models.dart';

/// Selector de usuario (destinatario / dueño del gasto).
class UserDropdown extends StatelessWidget {
  const UserDropdown({
    super.key,
    required this.users,
    required this.value,
    required this.onChanged,
    required this.label,
    required this.requiredMessage,
  });

  final List<AdminUserResponse> users;
  final String? value;
  final ValueChanged<String> onChanged;
  final String label;
  final String requiredMessage;

  @override
  Widget build(BuildContext context) {
    final known = users.any((u) => u.id == value);
    return DropdownButtonFormField<String>(
      initialValue: known ? value : null,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      hint: const Text('Selecciona…'),
      autovalidateMode: AutovalidateMode.onUserInteraction,
      validator: (v) => v == null || v.isEmpty ? requiredMessage : null,
      items: [
        for (final u in users)
          DropdownMenuItem(
            value: u.id,
            child: Text('${u.fullName} (${u.email})', overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: (v) {
        if (v != null) {
          onChanged(v);
        }
      },
    );
  }
}
