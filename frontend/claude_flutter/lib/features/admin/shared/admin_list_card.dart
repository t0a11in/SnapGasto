import 'package:flutter/material.dart';

import '../../../shared/widgets/state_message.dart';

/// Tarjeta con el listado de un mantenedor o su estado (cargando / error / vacío).
class AdminListCard<T> extends StatelessWidget {
  const AdminListCard({
    super.key,
    required this.items,
    required this.itemBuilder,
    required this.loading,
    required this.error,
    required this.emptyText,
    required this.onRetry,
  });

  final List<T> items;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final bool loading;
  final String? error;
  final String emptyText;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: items.isEmpty
          ? StateMessage(loading: loading, error: error, emptyText: emptyText, onRetry: onRetry)
          : Column(
              children: [
                for (var i = 0; i < items.length; i++) ...[
                  if (i > 0) const Divider(height: 1),
                  itemBuilder(context, items[i]),
                ],
              ],
            ),
    );
  }
}
