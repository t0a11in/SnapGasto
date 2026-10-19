import 'package:flutter/material.dart';

/// Búsqueda por nombre o correo.
class UserSearchField extends StatelessWidget {
  const UserSearchField({super.key, required this.onChanged});

  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 260,
      child: TextField(
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: const InputDecoration(
          hintText: 'Buscar…',
          prefixIcon: Icon(Icons.search),
          isDense: true,
        ),
      ),
    );
  }
}
