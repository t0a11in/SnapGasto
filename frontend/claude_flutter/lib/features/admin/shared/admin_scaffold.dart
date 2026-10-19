import 'package:flutter/material.dart';

/// Contenido desplazable de una pantalla de administración con "tirar para recargar".
class AdminScaffold extends StatelessWidget {
  const AdminScaffold({super.key, required this.onRefresh, required this.children});

  final Future<void> Function() onRefresh;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: children,
      ),
    );
  }
}
