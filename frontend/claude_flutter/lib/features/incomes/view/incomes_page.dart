import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/expenses_api.dart';
import '../../../core/data/incomes_api.dart';
import '../../../core/models/models.dart';
import '../../../shared/feedback/toast_service.dart';
import '../../../shared/widgets/confirm_dialog.dart';
import '../../../shared/widgets/error_retry_banner.dart';
import '../../../shared/widgets/month_balance.dart';
import '../../../shared/widgets/month_picker.dart';
import '../../../shared/widgets/page_header.dart';
import '../bloc/incomes_bloc.dart';
import '../widgets/income_form_sheet.dart';
import '../widgets/income_summary_cards.dart';
import '../widgets/incomes_list.dart';

/// Página contenedora: crea el BLoC y coordina hojas, diálogos y componentes.
class IncomesPage extends StatelessWidget {
  const IncomesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => IncomesBloc(
        incomesApi: context.read<IncomesApi>(),
        expensesApi: context.read<ExpensesApi>(),
      )..add(const IncomesStarted()),
      child: const IncomesView(),
    );
  }
}

class IncomesView extends StatelessWidget {
  const IncomesView({super.key});

  Future<void> _openForm(BuildContext context, [IncomeResponse? income]) async {
    final bloc = context.read<IncomesBloc>();
    final toast = context.read<ToastService>();
    final saved = await showIncomeFormSheet(context, income: income, month: bloc.state.month);
    if (saved) {
      toast.success(income != null ? 'Ingreso actualizado.' : 'Ingreso registrado.');
      bloc.add(const IncomesReloadRequested());
    }
  }

  Future<void> _remove(BuildContext context, IncomeResponse income) async {
    final bloc = context.read<IncomesBloc>();
    final ok = await showConfirmDialog(
      context,
      title: 'Eliminar ingreso',
      message: '¿Seguro que quieres eliminar este ingreso? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
    );
    if (ok) {
      bloc.add(IncomeDeleteRequested(income.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<IncomesBloc, IncomesState>(
      listenWhen: (prev, curr) => curr.message != null && prev.message != curr.message,
      listener: (context, state) => context.read<ToastService>().show(state.message!),
      builder: (context, state) {
        final bloc = context.read<IncomesBloc>();
        return Scaffold(
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _openForm(context),
            icon: const Icon(Icons.add),
            label: const Text('Nuevo ingreso'),
          ),
          body: RefreshIndicator(
            onRefresh: () async => bloc.add(const IncomesStarted()),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              children: [
                PageHeader(
                  title: 'Ingresos',
                  subtitle: 'Lo que entró este mes.',
                  actions: [
                    MonthPicker(month: state.month, onChanged: (m) => bloc.add(IncomesMonthChanged(m))),
                  ],
                ),
                const SizedBox(height: 16),
                MonthBalance(income: state.loading ? null : state.incomeTotal, expense: state.expenseTotal),
                const SizedBox(height: 12),
                IncomeSummaryCards(summary: state.summary),
                const SizedBox(height: 16),
                if (state.error != null) ...[
                  ErrorRetryBanner(
                    message: state.error!,
                    onRetry: () => bloc.add(const IncomesReloadRequested()),
                  ),
                  const SizedBox(height: 12),
                ],
                Card(
                  clipBehavior: Clip.antiAlias,
                  child: IncomesList(
                    items: state.sortedItems,
                    loading: state.loading,
                    onEdit: (income) => _openForm(context, income),
                    onDelete: (income) => _remove(context, income),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
