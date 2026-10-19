import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/data/admin_crud_api.dart';
import '../../../../core/http/error_utils.dart';
import '../../../../core/models/models.dart';
import '../../../../shared/feedback/toast_service.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../shared/admin_cubits.dart';
import '../../shared/admin_list_card.dart';
import '../../shared/admin_page_header.dart';
import '../../shared/admin_resource_cubit.dart';
import '../../shared/admin_scaffold.dart';
import '../widgets/notification_form_sheet.dart';
import '../widgets/notification_tile.dart';
import '../widgets/read_filter_selector.dart';

class AdminNotificationsPage extends StatelessWidget {
  const AdminNotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => AdminNotificationsCubit(context.read<AdminNotificationsApi>())..load()),
        BlocProvider(create: (context) => AdminUsersCubit(context.read<AdminUsersApi>())..load()),
      ],
      child: const AdminNotificationsView(),
    );
  }
}

class AdminNotificationsView extends StatefulWidget {
  const AdminNotificationsView({super.key});

  @override
  State<AdminNotificationsView> createState() => _AdminNotificationsViewState();
}

class _AdminNotificationsViewState extends State<AdminNotificationsView> {
  ReadFilter _filter = ReadFilter.all;

  List<NotificationResponse> _filtered(List<NotificationResponse> items) {
    return items
        .where((n) => switch (_filter) {
              ReadFilter.all => true,
              ReadFilter.read => n.read,
              ReadFilter.unread => !n.read,
            })
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  Future<void> _reload() async {
    await Future.wait([
      context.read<AdminNotificationsCubit>().load(),
      context.read<AdminUsersCubit>().load(),
    ]);
  }

  Future<void> _openForm([NotificationResponse? notification]) async {
    final cubit = context.read<AdminNotificationsCubit>();
    final toast = context.read<ToastService>();
    final saved = await showNotificationFormSheet(
      context,
      notification: notification,
      users: context.read<AdminUsersCubit>().state.items,
    );
    if (saved) {
      toast.success(notification != null ? 'Notificación actualizada.' : 'Notificación enviada.');
      await cubit.load();
    }
  }

  Future<void> _toggleRead(NotificationResponse n) async {
    final cubit = context.read<AdminNotificationsCubit>();
    final toast = context.read<ToastService>();
    try {
      await cubit.save(n.id, NotificationRequest(userId: n.userId, title: n.title, body: n.body, read: !n.read));
    } on Object catch (e) {
      toast.error(errorMessage(e));
    }
  }

  Future<void> _remove(NotificationResponse n) async {
    final cubit = context.read<AdminNotificationsCubit>();
    final toast = context.read<ToastService>();
    final ok = await showConfirmDialog(
      context,
      title: 'Eliminar notificación',
      message: '¿Eliminar "${n.title}"?',
      confirmText: 'Eliminar',
    );
    if (!ok) {
      return;
    }
    try {
      await cubit.remove(n.id);
      toast.success('Notificación eliminada.');
    } on Object catch (e) {
      toast.error(errorMessage(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminNotificationsCubit, AdminResourceState<NotificationResponse>>(
      builder: (context, state) {
        final cubit = context.read<AdminNotificationsCubit>();
        return AdminScaffold(
          onRefresh: _reload,
          children: [
            AdminPageHeader(
              title: 'Notificaciones',
              subtitle: 'Mensajes enviados a los usuarios.',
              createLabel: 'Nueva notificación',
              onCreate: _openForm,
              onRefresh: _reload,
              filters: [ReadFilterSelector(value: _filter, onChanged: (f) => setState(() => _filter = f))],
            ),
            const SizedBox(height: 16),
            AdminListCard<NotificationResponse>(
              items: _filtered(state.items),
              loading: state.loading,
              error: state.error,
              emptyText: 'No hay notificaciones.',
              onRetry: cubit.load,
              itemBuilder: (context, n) => NotificationTile(
                notification: n,
                onToggleRead: () => _toggleRead(n),
                onEdit: () => _openForm(n),
                onDelete: () => _remove(n),
              ),
            ),
          ],
        );
      },
    );
  }
}
