import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/data/admin_crud_api.dart';
import '../../../../core/http/error_utils.dart';
import '../../../../core/models/models.dart';
import '../../../../core/session/session_cubit.dart';
import '../../../../core/utils/text_utils.dart';
import '../../../../shared/feedback/toast_service.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../shared/admin_cubits.dart';
import '../../shared/admin_list_card.dart';
import '../../shared/admin_page_header.dart';
import '../../shared/admin_resource_cubit.dart';
import '../../shared/admin_scaffold.dart';
import '../widgets/user_form_sheet.dart';
import '../widgets/user_search_field.dart';
import '../widgets/user_tile.dart';

class AdminUsersPage extends StatelessWidget {
  const AdminUsersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => AdminUsersCubit(context.read<AdminUsersApi>())..load(),
      child: const AdminUsersView(),
    );
  }
}

class AdminUsersView extends StatefulWidget {
  const AdminUsersView({super.key});

  @override
  State<AdminUsersView> createState() => _AdminUsersViewState();
}

class _AdminUsersViewState extends State<AdminUsersView> {
  String _query = '';

  List<AdminUserResponse> _filtered(List<AdminUserResponse> items) {
    final q = foldText(_query.trim());
    final sorted = [...items]..sort((a, b) => compareEs(a.fullName, b.fullName));
    return q.isEmpty ? sorted : sorted.where((u) => foldText('${u.fullName} ${u.email}').contains(q)).toList();
  }

  Future<void> _openForm([AdminUserResponse? user]) async {
    final toast = context.read<ToastService>();
    if (await showUserFormSheet(context, user: user)) {
      toast.success(user != null ? 'Usuario actualizado.' : 'Usuario creado.');
    }
  }

  Future<void> _remove(AdminUserResponse user) async {
    final cubit = context.read<AdminUsersCubit>();
    final toast = context.read<ToastService>();
    final ok = await showConfirmDialog(
      context,
      title: 'Eliminar usuario',
      message: '¿Eliminar a ${user.fullName}?',
      confirmText: 'Eliminar',
    );
    if (!ok) {
      return;
    }
    try {
      await cubit.remove(user.id);
      toast.success('Usuario eliminado.');
    } on Object catch (e) {
      toast.error(errorMessage(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = context.select<SessionCubit, String?>((s) => s.state.user?.id);
    return BlocBuilder<AdminUsersCubit, AdminResourceState<AdminUserResponse>>(
      builder: (context, state) {
        final cubit = context.read<AdminUsersCubit>();
        return AdminScaffold(
          onRefresh: cubit.load,
          children: [
            AdminPageHeader(
              title: 'Usuarios',
              subtitle: 'Cuentas registradas y sus roles.',
              createLabel: 'Nuevo usuario',
              onCreate: _openForm,
              onRefresh: cubit.load,
              filters: [UserSearchField(onChanged: (q) => setState(() => _query = q))],
            ),
            const SizedBox(height: 16),
            AdminListCard<AdminUserResponse>(
              items: _filtered(state.items),
              loading: state.loading,
              error: state.error,
              emptyText: 'No hay usuarios.',
              onRetry: cubit.load,
              itemBuilder: (context, user) => UserTile(
                user: user,
                onEdit: () => _openForm(user),
                onDelete: user.id == currentUserId ? null : () => _remove(user),
              ),
            ),
          ],
        );
      },
    );
  }
}
