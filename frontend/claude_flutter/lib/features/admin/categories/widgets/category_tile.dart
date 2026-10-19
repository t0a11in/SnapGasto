import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/models/models.dart';
import '../../../../shared/widgets/category_icon.dart';
import '../../../../shared/widgets/row_actions.dart';

class CategoryTile extends StatelessWidget {
  const CategoryTile({super.key, required this.category, required this.onEdit, required this.onDelete});

  final CategoryResponse category;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.secondaryText);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 4, 10),
      child: Row(
        children: [
          CategoryChip(icon: category.icon, colorHex: category.colorHex),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(category.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(
                  'Ícono: ${category.icon ?? '—'} · Color: ${category.colorHex ?? '—'}',
                  style: muted,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          RowActions(
            editLabel: 'Editar ${category.name}',
            deleteLabel: 'Eliminar ${category.name}',
            onEdit: onEdit,
            onDelete: onDelete,
          ),
        ],
      ),
    );
  }
}
