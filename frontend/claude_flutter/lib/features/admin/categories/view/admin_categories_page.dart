import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/data/admin_crud_api.dart';
import '../../../../core/http/error_utils.dart';
import '../../../../core/models/models.dart';
import '../../../../core/utils/text_utils.dart';
import '../../../../shared/feedback/toast_service.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../shared/admin_cubits.dart';
import '../../shared/admin_list_card.dart';
import '../../shared/admin_page_header.dart';
import '../../shared/admin_resource_cubit.dart';
import '../../shared/admin_scaffold.dart';
import '../widgets/category_form_sheet.dart';
import '../widgets/category_tile.dart';

class AdminCategoriesPage extends StatelessWidget {
  const AdminCategoriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => AdminCategoriesCubit(context.read<AdminCategoriesApi>())..load(),
      child: const AdminCategoriesView(),
    );
  }
}

class AdminCategoriesView extends StatelessWidget {
  const AdminCategoriesView({super.key});

  Future<void> _openForm(BuildContext context, [CategoryResponse? category]) async {
    final toast = context.read<ToastService>();
    if (await showCategoryFormSheet(context, category: category)) {
      toast.success(category != null ? 'Categoría actualizada.' : 'Categoría creada.');
    }
  }

  Future<void> _remove(BuildContext context, CategoryResponse category) async {
    final cubit = context.read<AdminCategoriesCubit>();
    final toast = context.read<ToastService>();
    final ok = await showConfirmDialog(
      context,
      title: 'Eliminar categoría',
      message: '¿Eliminar la categoría "${category.name}"?',
      confirmText: 'Eliminar',
    );
    if (!ok) {
      return;
    }
    try {
      await cubit.remove(category.id);
      toast.success('Categoría eliminada.');
    } on Object catch (e) {
      toast.error(errorMessage(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminCategoriesCubit, AdminResourceState<CategoryResponse>>(
      builder: (context, state) {
        final cubit = context.read<AdminCategoriesCubit>();
        final sorted = [...state.items]..sort((a, b) => compareEs(a.name, b.name));
        return AdminScaffold(
          onRefresh: cubit.load,
          children: [
            AdminPageHeader(
              title: 'Categorías',
              subtitle: 'Clasificación disponible para los gastos.',
              createLabel: 'Nueva categoría',
              onCreate: () => _openForm(context),
              onRefresh: cubit.load,
            ),
            const SizedBox(height: 16),
            AdminListCard<CategoryResponse>(
              items: sorted,
              loading: state.loading,
              error: state.error,
              emptyText: 'No hay categorías.',
              onRetry: cubit.load,
              itemBuilder: (context, c) => CategoryTile(
                category: c,
                onEdit: () => _openForm(context, c),
                onDelete: () => _remove(context, c),
              ),
            ),
          ],
        );
      },
    );
  }
}
