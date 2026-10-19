import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/date_utils.dart';
import '../../../../shared/widgets/row_actions.dart';
import '../../../shell/widgets/user_avatar.dart';
import 'role_badge.dart';

class UserTile extends StatelessWidget {
  const UserTile({super.key, required this.user, required this.onEdit, required this.onDelete});

  final AdminUserResponse user;
  final VoidCallback onEdit;

  /// null cuando es el propio usuario (no puede eliminarse a sí mismo).
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(color: AppColors.secondaryText);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 4, 10),
      child: Row(
        children: [
          UserAvatar(fullName: user.fullName),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(user.email, style: muted, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Row(
                  children: [
                    RoleBadge(role: user.role),
                    const SizedBox(width: 8),
                    Text('Creado ${formatDateDisplay(user.createdAt)}', style: muted),
                  ],
                ),
              ],
            ),
          ),
          RowActions(
            editLabel: 'Editar ${user.fullName}',
            deleteLabel: 'Eliminar ${user.fullName}',
            onEdit: onEdit,
            onDelete: onDelete,
          ),
        ],
      ),
    );
  }
}
