import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/data/admin_crud_api.dart';
import '../../../../core/http/error_utils.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/money_format.dart';
import '../../../../core/utils/money_utils.dart';
import '../../../../shared/feedback/toast_service.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../shared/admin_cubits.dart';
import '../../shared/admin_list_card.dart';
import '../../shared/admin_page_header.dart';
import '../../shared/admin_resource_cubit.dart';
import '../../shared/admin_scaffold.dart';
import '../widgets/admin_expense_filters.dart';
import '../widgets/admin_expense_form_sheet.dart';
import '../widgets/admin_expense_tile.dart';

class AdminExpensesPage extends StatelessWidget {
  const AdminExpensesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => AdminExpensesCubit(context.read<AdminExpensesApi>())..load()),
        BlocProvider(create: (context) => AdminUsersCubit(context.read<AdminUsersApi>())..load()),
        BlocProvider(create: (context) => AdminCategoriesCubit(context.read<AdminCategoriesApi>())..load()),
      ],
      child: const AdminExpensesView(),
    );
  }
}

class AdminExpensesView extends StatefulWidget {
  const AdminExpensesView({super.key});

  @override
  State<AdminExpensesView> createState() => _AdminExpensesViewState();
}

class _AdminExpensesViewState extends State<AdminExpensesView> {
  String _userFilter = '';
  String _monthFilter = '';

  List<AdminExpenseResponse> _filtered(List<AdminExpenseResponse> items) {
    return items
        .where((e) => (_userFilter.isEmpty || e.userId == _userFilter) &&
            (_monthFilter.isEmpty || e.date.startsWith(_monthFilter)))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  Future<void> _reload() async {
    await Future.wait([
      context.read<AdminExpensesCubit>().load(),
      context.read<AdminUsersCubit>().load(),
      context.read<AdminCategoriesCubit>().load(),
    ]);
  }

  Future<void> _openForm([AdminExpenseResponse? expense]) async {
    final cubit = context.read<AdminExpensesCubit>();
    final toast = context.read<ToastService>();
    final saved = await showAdminExpenseFormSheet(
      context,
      expense: expense,
      users: context.read<AdminUsersCubit>().state.items,
      categories: context.read<AdminCategoriesCubit>().state.items,
    );
    if (saved) {
      toast.success(expense != null ? 'Gasto actualizado.' : 'Gasto creado.');
      await cubit.load(); // refresca userName calculado por el backend
    }
  }

  Future<void> _remove(AdminExpenseResponse expense) async {
    final cubit = context.read<AdminExpensesCubit>();
    final toast = context.read<ToastService>();
    final ok = await showConfirmDialog(
      context,
      title: 'Eliminar gasto',
      message: '¿Eliminar el gasto de ${expense.userName}?',
      confirmText: 'Eliminar',
    );
    if (!ok) {
      return;
    }
    try {
      await cubit.remove(expense.id);
      toast.success('Gasto eliminado.');
    } on Object catch (e) {
      toast.error(errorMessage(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final users = context.watch<AdminUsersCubit>().state.items;
    return BlocBuilder<AdminExpensesCubit, AdminResourceState<AdminExpenseResponse>>(
      builder: (context, state) {
        final cubit = context.read<AdminExpensesCubit>();
        final filtered = _filtered(state.items);
        return AdminScaffold(
          onRefresh: _reload,
          children: [
            AdminPageHeader(
              title: 'Gastos de usuarios',
              subtitle: 'Todos los gastos registrados en la plataforma.',
              createLabel: 'Nuevo gasto',
              onCreate: _openForm,
              onRefresh: _reload,
              filters: [
                AdminExpenseFilters(
                  users: users,
                  userId: _userFilter,
                  month: _monthFilter,
                  onUserChanged: (v) => setState(() => _userFilter = v),
                  onMonthChanged: (v) => setState(() => _monthFilter = v),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${filtered.length} gasto(s) · Total ${formatMoney(sumAmounts(filtered))}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 8),
            AdminListCard<AdminExpenseResponse>(
              items: filtered,
              loading: state.loading,
              error: state.error,
              emptyText: 'No hay gastos para el filtro seleccionado.',
              onRetry: cubit.load,
              itemBuilder: (context, e) => AdminExpenseTile(
                expense: e,
                onEdit: () => _openForm(e),
                onDelete: () => _remove(e),
              ),
            ),
          ],
        );
      },
    );
  }
}
