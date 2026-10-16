import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../controllers/income_controller.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_strings.dart';
import '../core/widgets/app_loading_view.dart';
import '../data/models/income.dart';

/// Pestaña del mantenedor de ingresos, separada de los gastos y las boletas.
class IncomePage extends StatelessWidget {
  const IncomePage({super.key, required this.controller});

  final IncomeController controller;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: controller.load,
    child: Obx(() {
      if (controller.isLoading.value && controller.incomes.isEmpty) {
        return const AppLoadingView();
      }

      final summary = controller.summary.value;
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          _MonthSelector(
            month: controller.selectedMonth.value,
            onChanged: (month) => controller.load(month: month),
          ),
          const SizedBox(height: 16),
          if (summary != null)
            _IncomeSummary(summary: summary)
          else
            const _IncomeSummaryPlaceholder(),
          const SizedBox(height: 24),
          Text(
            AppStrings.incomeRecords,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          if (controller.errorMessage.isNotEmpty)
            _ErrorMessage(
              message: controller.errorMessage.value,
              onRetry: controller.load,
            )
          else if (controller.incomes.isEmpty)
            const _EmptyIncomes()
          else
            ...controller.incomes.map(
              (income) => _IncomeTile(
                income: income,
                onEdit: () => showIncomeEditor(
                  context,
                  controller: controller,
                  income: income,
                ),
                onDelete: () => _confirmDeletion(context, income),
              ),
            ),
        ],
      );
    }),
  );

  Future<void> _confirmDeletion(BuildContext context, Income income) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(AppStrings.deleteIncomeTitle),
        content: const Text(AppStrings.deleteIncomeBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(AppStrings.cancel),
          ),
          FilledButton.tonal(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text(AppStrings.delete),
          ),
        ],
      ),
    );
    if (shouldDelete ?? false) {
      await controller.remove(income.id);
    }
  }
}

/// Abre el formulario para crear o editar un ingreso desde la pestaña o FAB.
Future<void> showIncomeEditor(
  BuildContext context, {
  required IncomeController controller,
  Income? income,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  builder: (_) => _IncomeEditorSheet(controller: controller, income: income),
);

class _MonthSelector extends StatelessWidget {
  const _MonthSelector({required this.month, required this.onChanged});

  final DateTime month;
  final ValueChanged<DateTime> onChanged;

  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      leading: const Icon(Icons.calendar_month_outlined),
      title: const Text(AppStrings.monthToQuery),
      subtitle: Text(DateFormat.yMMMM('es_CL').format(month)),
      trailing: const Icon(Icons.edit_calendar_outlined),
      onTap: () async {
        final selected = await showDatePicker(
          context: context,
          initialDate: month,
          firstDate: DateTime(2020),
          lastDate: DateTime.now(),
          helpText: AppStrings.monthToQuery,
        );
        if (selected != null) {
          onChanged(DateTime(selected.year, selected.month));
        }
      },
    ),
  );
}

class _IncomeSummary extends StatelessWidget {
  const _IncomeSummary({required this.summary});

  final IncomeMonthlySummary summary;

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 12,
    runSpacing: 12,
    children: [
      _SummaryCard(
        label: AppStrings.cardIncome,
        value: summary.totalTarjeta,
        icon: Icons.credit_card,
        color: AppColors.primary,
      ),
      _SummaryCard(
        label: AppStrings.cashIncome,
        value: summary.totalFisico,
        icon: Icons.payments_outlined,
        color: AppColors.success,
      ),
      _SummaryCard(
        label: AppStrings.incomeTotal,
        value: summary.total,
        icon: Icons.account_balance_wallet_outlined,
        color: const Color(0xFF7C3AED),
      ),
    ],
  );
}

class _IncomeSummaryPlaceholder extends StatelessWidget {
  const _IncomeSummaryPlaceholder();

  @override
  Widget build(BuildContext context) => const SizedBox(
    height: 108,
    child: Center(child: CircularProgressIndicator()),
  );
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final double value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 220,
    child: Card(
      color: color,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(color: Colors.white70)),
            Text(
              _currency(value),
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(color: Colors.white),
            ),
          ],
        ),
      ),
    ),
  );
}

class _IncomeTile extends StatelessWidget {
  const _IncomeTile({
    required this.income,
    required this.onEdit,
    required this.onDelete,
  });

  final Income income;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isCard = income.type == IncomeType.tarjeta;
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isCard
              ? AppColors.primary.withValues(alpha: .13)
              : AppColors.success.withValues(alpha: .13),
          foregroundColor: isCard ? AppColors.primary : AppColors.success,
          child: Icon(isCard ? Icons.credit_card : Icons.payments_outlined),
        ),
        title: Text(_currency(income.amount)),
        subtitle: Text(
          '${income.type.label} · ${DateFormat.yMMMd('es_CL').format(income.date)}${income.description == null ? '' : '\n${income.description}'}',
        ),
        isThreeLine: income.description != null,
        trailing: PopupMenuButton<_IncomeAction>(
          onSelected: (action) {
            if (action == _IncomeAction.edit) onEdit();
            if (action == _IncomeAction.delete) onDelete();
          },
          itemBuilder: (context) => const [
            PopupMenuItem(
              value: _IncomeAction.edit,
              child: Text(AppStrings.edit),
            ),
            PopupMenuItem(
              value: _IncomeAction.delete,
              child: Text(AppStrings.delete),
            ),
          ],
        ),
      ),
    );
  }
}

enum _IncomeAction { edit, delete }

class _EmptyIncomes extends StatelessWidget {
  const _EmptyIncomes();

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 44),
    child: Column(
      children: [
        Icon(Icons.savings_outlined, size: 56, color: AppColors.mutedText),
        SizedBox(height: 12),
        Text(AppStrings.emptyIncomes),
        SizedBox(height: 4),
        Text(AppStrings.emptyIncomesDetail, textAlign: TextAlign.center),
      ],
    ),
  );
}

class _ErrorMessage extends StatelessWidget {
  const _ErrorMessage({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 28),
    child: Column(
      children: [
        const Icon(Icons.cloud_off_outlined, size: 48, color: AppColors.danger),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        OutlinedButton(onPressed: onRetry, child: const Text(AppStrings.retry)),
      ],
    ),
  );
}

class _IncomeEditorSheet extends StatefulWidget {
  const _IncomeEditorSheet({required this.controller, this.income});

  final IncomeController controller;
  final Income? income;

  @override
  State<_IncomeEditorSheet> createState() => _IncomeEditorSheetState();
}

class _IncomeEditorSheetState extends State<_IncomeEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amountController;
  late final TextEditingController _descriptionController;
  late DateTime _date;
  late IncomeType _type;

  bool get _isEditing => widget.income != null;

  @override
  void initState() {
    super.initState();
    final income = widget.income;
    _amountController = TextEditingController(
      text: income?.amount.toStringAsFixed(0) ?? '',
    );
    _descriptionController = TextEditingController(
      text: income?.description ?? '',
    );
    _date = income?.date ?? _defaultDateForSelectedMonth();
    _type = income?.type ?? IncomeType.tarjeta;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  DateTime _defaultDateForSelectedMonth() {
    final selectedMonth = widget.controller.selectedMonth.value;
    final today = DateTime.now();
    if (selectedMonth.year == today.year &&
        selectedMonth.month == today.month) {
      return today;
    }
    return selectedMonth;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final description = _descriptionController.text.trim();
    final amount = double.parse(_amountController.text.replaceAll(',', '.'));
    final didSave = _isEditing
        ? await widget.controller.updateIncome(
            income: widget.income!,
            amount: amount,
            type: _type,
            date: _date,
            description: description.isEmpty ? null : description,
          )
        : await widget.controller.create(
            amount: amount,
            type: _type,
            date: _date,
            description: description.isEmpty ? null : description,
          );
    if (!mounted) return;
    if (didSave) {
      Navigator.pop(context);
    } else {
      Get.snackbar(AppStrings.incomes, widget.controller.errorMessage.value);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      24,
      24,
      24,
      MediaQuery.viewInsetsOf(context).bottom + 24,
    ),
    child: SingleChildScrollView(
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _isEditing ? AppStrings.editIncome : AppStrings.addIncome,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                labelText: AppStrings.amount,
                prefixText: '\$ ',
              ),
              validator: (value) =>
                  (double.tryParse((value ?? '').replaceAll(',', '.')) ?? 0) <=
                      0
                  ? AppStrings.invalidAmount
                  : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<IncomeType>(
              initialValue: _type,
              decoration: const InputDecoration(
                labelText: AppStrings.incomeSource,
              ),
              items: IncomeType.values
                  .map(
                    (type) =>
                        DropdownMenuItem(value: type, child: Text(type.label)),
                  )
                  .toList(),
              onChanged: (type) => setState(() => _type = type!),
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(AppStrings.date),
              subtitle: Text(DateFormat.yMMMd('es_CL').format(_date)),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: _selectDate,
            ),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: AppStrings.descriptionOptional,
              ),
              maxLength: 500,
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            Obx(
              () => FilledButton(
                onPressed: widget.controller.isSaving.value ? null : _save,
                child: Text(
                  widget.controller.isSaving.value
                      ? AppStrings.saving
                      : AppStrings.saveIncome,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Future<void> _selectDate() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (selected != null) setState(() => _date = selected);
  }
}

String _currency(double amount) =>
    NumberFormat.currency(locale: 'es_CL', symbol: '\$').format(amount);
