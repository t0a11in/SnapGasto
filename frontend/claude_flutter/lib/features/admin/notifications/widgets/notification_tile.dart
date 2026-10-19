import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/date_utils.dart';
import '../../../../shared/widgets/row_actions.dart';
import 'read_toggle_chip.dart';

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    required this.onToggleRead,
    required this.onEdit,
    required this.onDelete,
  });

  final NotificationResponse notification;
  final VoidCallback onToggleRead;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.secondaryText);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 4, 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(notification.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(notification.body, style: muted, maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text('${notification.userName} · ${formatDateTimeDisplay(notification.createdAt)}', style: muted),
                const SizedBox(height: 6),
                ReadToggleChip(read: notification.read, onToggle: onToggleRead),
              ],
            ),
          ),
          RowActions(
            editLabel: 'Editar notificación',
            deleteLabel: 'Eliminar notificación',
            onEdit: onEdit,
            onDelete: onDelete,
          ),
        ],
      ),
    );
  }
}
