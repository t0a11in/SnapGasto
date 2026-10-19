import 'package:flutter/material.dart';

/// Iniciales del usuario (máximo 2).
String initialsOf(String? fullName) {
  final words = (fullName ?? '?').trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).take(2);
  final initials = words.map((w) => w[0].toUpperCase()).join();
  return initials.isEmpty ? '?' : initials;
}

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.fullName, this.radius = 18});

  final String? fullName;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return CircleAvatar(
      radius: radius,
      backgroundColor: scheme.primary,
      child: Text(
        initialsOf(fullName),
        style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.w600, fontSize: radius * 0.75),
      ),
    );
  }
}
