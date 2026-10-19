import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Botones editar / eliminar de una fila.
class RowActions extends StatelessWidget {
  const RowActions({
    super.key,
    required this.onEdit,
    required this.onDelete,
    this.editLabel = 'Editar',
    this.deleteLabel = 'Eliminar',
  });

  final VoidCallback? onEdit;

  /// null deshabilita el botón (p. ej. no eliminar al propio usuario).
  final VoidCallback? onDelete;
  final String editLabel;
  final String deleteLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: editLabel,
          visualDensity: VisualDensity.compact,
          icon: const Icon(Icons.edit_outlined, size: 20),
          onPressed: onEdit,
        ),
        IconButton(
          tooltip: deleteLabel,
          visualDensity: VisualDensity.compact,
          color: AppColors.danger,
          icon: const Icon(Icons.delete_outline, size: 20),
          onPressed: onDelete,
        ),
      ],
    );
  }
}
