import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/categories_api.dart';
import '../../../core/data/expenses_api.dart';
import '../../../core/data/incomes_api.dart';
import '../../../core/models/models.dart';
import '../../../shared/feedback/toast_service.dart';
import '../../../shared/widgets/confirm_dialog.dart';
import '../../../shared/widgets/error_retry_banner.dart';
import '../../../shared/widgets/month_balance.dart';
import '../../../shared/widgets/month_picker.dart';
import '../../../shared/widgets/page_header.dart';
import '../bloc/expenses_bloc.dart';
import '../widgets/categories_overview_sheet.dart';
import '../widgets/category_breakdown.dart';
import '../widgets/category_expenses_sheet.dart';
import '../widgets/expense_distribution_chart.dart';
import '../widgets/expense_form_sheet.dart';
import '../widgets/expense_summary_card.dart';
import '../widgets/expenses_list.dart';

/// Página contenedora: crea el BLoC y coordina hojas, diálogos y componentes de presentación.
class ExpensesPage extends StatelessWidget {
  const ExpensesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => ExpensesBloc(
        expensesApi: context.read<ExpensesApi>(),
        incomesApi: context.read<IncomesApi>(),
        categoriesApi: context.read<CategoriesApi>(),
      )..add(const ExpensesStarted()),
      child: const ExpensesView(),
    );
  }
}

class ExpensesView extends StatelessWidget {
  const ExpensesView({super.key});

  Future<void> _openForm(BuildContext context, [ExpenseResponse? expense]) async {
    final bloc = context.read<ExpensesBloc>();
    final toast = context.read<ToastService>();
    final saved = await showExpenseFormSheet(
      context,
      expense: expense,
      month: bloc.state.month,
      knownCategories: bloc.state.stats.knownCategories,
    );
    if (saved) {
      toast.success(expense != null ? 'Gasto actualizado.' : 'Gasto registrado.');
      bloc.add(const ExpensesReloadRequested());
    }
  }

  Future<void> _openCategory(BuildContext context, String category) {
    final state = context.read<ExpensesBloc>().state;
    return showCategoryExpensesSheet(
      context,
      category: category,
      month: state.month,
      items: state.stats.itemsOfCategory(category),
    );
  }

  /// Hoja con todas las categorías; al elegir una se abre su detalle.
  Future<void> _openAllCategories(BuildContext context) async {
    final state = context.read<ExpensesBloc>().state;
    final category = await showCategoriesOverviewSheet(
      context,
      rows: state.stats.byCategory,
      colors: state.stats.categoryColors,
      month: state.month,
      total: state.stats.total,
    );
    if (category != null && category.isNotEmpty && context.mounted) {
      await _openCategory(context, category);
    }
  }

  Future<void> _remove(BuildContext context, ExpenseResponse expense) async {
    final bloc = context.read<ExpensesBloc>();
    final ok = await showConfirmDialog(
      context,
      title: 'Eliminar gasto',
      message: '¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
    );
    if (ok) {
      bloc.add(ExpenseDeleteRequested(expense.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ExpensesBloc, ExpensesState>(
      listenWhen: (prev, curr) => curr.message != null && prev.message != curr.message,
      listener: (context, state) => context.read<ToastService>().show(state.message!),
      builder: (context, state) {
        final bloc = context.read<ExpensesBloc>();
        final stats = state.stats;
        return Scaffold(
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _openForm(context),
            icon: const Icon(Icons.add),
            label: const Text('Nuevo gasto'),
          ),
          body: RefreshIndicator(
            onRefresh: () async => bloc.add(const ExpensesStarted()),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              children: [
                PageHeader(
                  title: 'Gastos',
                  subtitle: 'En qué se fue el dinero este mes.',
                  actions: [
                    MonthPicker(month: state.month, onChanged: (m) => bloc.add(ExpensesMonthChanged(m))),
                  ],
                ),
                const SizedBox(height: 16),
                MonthBalance(income: state.incomeTotal, expense: state.loading ? null : stats.total),
                const SizedBox(height: 12),
                ExpenseSummaryCard(
                  total: stats.total,
                  count: state.items.length,
                  categories: stats.byCategory.length,
                ),
                const SizedBox(height: 12),
                CategoryBreakdown(
                  rows: stats.byCategory,
                  colors: stats.categoryColors,
                  onSelectCategory: (c) => _openCategory(context, c),
                  onExpand: () => _openAllCategories(context),
                ),
                const SizedBox(height: 16),
                if (state.error != null) ...[
                  ErrorRetryBanner(
                    message: state.error!,
                    onRetry: () => bloc.add(const ExpensesReloadRequested()),
                  ),
                  const SizedBox(height: 12),
                ],
                Card(
                  clipBehavior: Clip.antiAlias,
                  child: ExpensesList(
                    items: stats.sortedItems,
                    loading: state.loading,
                    onEdit: (e) => _openForm(context, e),
                    onDelete: (e) => _remove(context, e),
                  ),
                ),
                const SizedBox(height: 16),
                ExpenseDistributionChart(
                  rows: stats.chartRows,
                  colors: stats.categoryColors,
                  total: stats.total,
                  month: state.month,
                  onSelectCategory: (c) => _openCategory(context, c),
                  onShowAll: () => _openAllCategories(context),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
