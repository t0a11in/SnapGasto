import 'package:flutter/material.dart';

import '../../../shared/widgets/page_header.dart';

/// Encabezado de mantenedor: título, filtros, recargar y crear.
class AdminPageHeader extends StatelessWidget {
  const AdminPageHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.createLabel,
    required this.onCreate,
    required this.onRefresh,
    this.filters = const [],
  });

  final String title;
  final String subtitle;
  final String createLabel;
  final VoidCallback onCreate;
  final VoidCallback onRefresh;
  final List<Widget> filters;

  @override
  Widget build(BuildContext context) {
    return PageHeader(
      title: title,
      subtitle: subtitle,
      actions: [
        ...filters,
        IconButton.outlined(tooltip: 'Recargar', icon: const Icon(Icons.refresh), onPressed: onRefresh),
        FilledButton.icon(onPressed: onCreate, icon: const Icon(Icons.add), label: Text(createLabel)),
      ],
    );
  }
}
