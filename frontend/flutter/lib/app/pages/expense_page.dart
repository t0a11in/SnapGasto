import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../controllers/expense_controller.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_strings.dart';
import '../core/widgets/app_loading_view.dart';
import '../data/models/expense.dart';

/// Mantenedor móvil de gastos propios equivalente al módulo personal Angular.
class ExpensePage extends StatelessWidget {
  const ExpensePage({super.key, required this.controller});

  final ExpenseController controller;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: controller.load,
    child: Obx(() {
      if (controller.isLoading.value && controller.expenses.isEmpty) {
        return const AppLoadingView();
      }

      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          _MonthSelector(
            month: controller.selectedMonth.value,
            onChanged: (month) => controller.load(month: month),
          ),
          const SizedBox(height: 16),
          _ExpenseSummary(
            total: controller.monthlyTotal,
            movements: controller.monthlyMovements,
          ),
          const SizedBox(height: 24),
          Text(
            AppStrings.expenseRecords,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          if (controller.errorMessage.isNotEmpty)
            _ErrorMessage(
              message: controller.errorMessage.value,
              onRetry: controller.load,
            )
          else if (controller.expenses.isEmpty)
            const _EmptyExpenses()
          else
            ...controller.expenses.map(
              (expense) => _ExpenseTile(
                expense: expense,
                onEdit: () => showExpenseEditor(
                  context,
                  controller: controller,
                  expense: expense,
                ),
                onDelete: () => _confirmDeletion(context, expense),
                onViewReceipt: () => _showReceipt(context, expense),
              ),
            ),
        ],
      );
    }),
  );

  Future<void> _confirmDeletion(BuildContext context, Expense expense) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(AppStrings.deleteExpenseTitle),
        content: const Text(AppStrings.deleteExpenseBody),
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
    if (shouldDelete ?? false) await controller.remove(expense.id);
  }

  Future<void> _showReceipt(BuildContext context, Expense expense) async {
    final receiptPath = expense.receiptLocalPath;
    if (receiptPath == null) return;
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(AppStrings.localReceipt),
        content: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520, maxHeight: 560),
          child: Image.file(
            File(receiptPath),
            fit: BoxFit.contain,
            errorBuilder: (_, _, _) =>
                const Text(AppStrings.receiptUnavailable),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(AppStrings.close),
          ),
        ],
      ),
    );
  }
}

/// Abre el formulario de creación o edición conservando el mes seleccionado.
Future<void> showExpenseEditor(
  BuildContext context, {
  required ExpenseController controller,
  Expense? expense,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  builder: (_) => _ExpenseEditorSheet(controller: controller, expense: expense),
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

class _ExpenseSummary extends StatelessWidget {
  const _ExpenseSummary({required this.total, required this.movements});

  final double total;
  final int movements;

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 12,
    runSpacing: 12,
    children: [
      _SummaryCard(
        label: AppStrings.monthlyExpense,
        value: _currency(total),
        icon: Icons.account_balance_wallet_outlined,
        color: AppColors.danger,
      ),
      _SummaryCard(
        label: AppStrings.movements,
        value: movements.toString(),
        icon: Icons.receipt_long_outlined,
        color: AppColors.primary,
      ),
    ],
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
  final String value;
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
              value,
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

class _ExpenseTile extends StatelessWidget {
  const _ExpenseTile({
    required this.expense,
    required this.onEdit,
    required this.onDelete,
    required this.onViewReceipt,
  });

  final Expense expense;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onViewReceipt;

  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.danger.withValues(alpha: .13),
        foregroundColor: AppColors.danger,
        child: const Icon(Icons.trending_down_outlined),
      ),
      title: Text(_currency(expense.amount)),
      subtitle: Text(
        '${expense.category} · ${expense.paymentMethod.label}\n'
        '${DateFormat.yMMMd('es_CL').format(expense.date)}'
        '${expense.description == null ? '' : ' · ${expense.description}'}',
      ),
      isThreeLine: true,
      trailing: PopupMenuButton<_ExpenseAction>(
        onSelected: (action) {
          switch (action) {
            case _ExpenseAction.edit:
              onEdit();
            case _ExpenseAction.receipt:
              onViewReceipt();
            case _ExpenseAction.delete:
              onDelete();
          }
        },
        itemBuilder: (context) => [
          const PopupMenuItem(
            value: _ExpenseAction.edit,
            child: Text(AppStrings.edit),
          ),
          if (expense.receiptLocalPath != null)
            const PopupMenuItem(
              value: _ExpenseAction.receipt,
              child: Text(AppStrings.viewReceipt),
            ),
          const PopupMenuItem(
            value: _ExpenseAction.delete,
            child: Text(AppStrings.delete),
          ),
        ],
      ),
    ),
  );
}

enum _ExpenseAction { edit, receipt, delete }

class _EmptyExpenses extends StatelessWidget {
  const _EmptyExpenses();

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 44),
    child: Column(
      children: [
        Icon(Icons.receipt_long_outlined, size: 56, color: AppColors.mutedText),
        SizedBox(height: 12),
        Text(AppStrings.emptyExpenses),
        SizedBox(height: 4),
        Text(AppStrings.emptyExpensesDetail, textAlign: TextAlign.center),
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

class _ExpenseEditorSheet extends StatefulWidget {
  const _ExpenseEditorSheet({required this.controller, this.expense});

  final ExpenseController controller;
  final Expense? expense;

  @override
  State<_ExpenseEditorSheet> createState() => _ExpenseEditorSheetState();
}

class _ExpenseEditorSheetState extends State<_ExpenseEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  final _imagePicker = ImagePicker();
  late final TextEditingController _amountController;
  late final TextEditingController _categoryController;
  late final TextEditingController _descriptionController;
  late DateTime _date;
  late ExpensePaymentMethod _paymentMethod;
  XFile? _receipt;

  bool get _isEditing => widget.expense != null;

  @override
  void initState() {
    super.initState();
    final expense = widget.expense;
    _amountController = TextEditingController(
      text: expense?.amount.toStringAsFixed(0) ?? '',
    );
    _categoryController = TextEditingController(text: expense?.category ?? '');
    _descriptionController = TextEditingController(
      text: expense?.description ?? '',
    );
    _date = expense?.date ?? _defaultDateForSelectedMonth();
    _paymentMethod = expense?.paymentMethod ?? ExpensePaymentMethod.tarjeta;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _categoryController.dispose();
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
        ? await widget.controller.updateExpense(
            expense: widget.expense!,
            amount: amount,
            category: _categoryController.text.trim(),
            date: _date,
            description: description.isEmpty ? null : description,
            paymentMethod: _paymentMethod.apiValue,
          )
        : await widget.controller.create(
            amount: amount,
            category: _categoryController.text.trim(),
            date: _date,
            description: description.isEmpty ? null : description,
            paymentMethod: _paymentMethod.apiValue,
            receipt: _receipt,
          );
    if (!mounted) return;
    if (didSave) {
      Navigator.pop(context);
    } else {
      Get.snackbar(AppStrings.expenses, widget.controller.errorMessage.value);
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
              _isEditing ? AppStrings.editExpense : AppStrings.addExpense,
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
            TextFormField(
              controller: _categoryController,
              decoration: const InputDecoration(
                labelText: AppStrings.category,
                hintText: 'Ej.: Alimentación',
              ),
              maxLength: 80,
              textCapitalization: TextCapitalization.sentences,
              validator: (value) => (value == null || value.trim().isEmpty)
                  ? AppStrings.requiredField
                  : null,
            ),
            const SizedBox(height: 4),
            DropdownButtonFormField<ExpensePaymentMethod>(
              initialValue: _paymentMethod,
              decoration: const InputDecoration(
                labelText: AppStrings.paymentMethod,
              ),
              items: ExpensePaymentMethod.values
                  .map(
                    (method) => DropdownMenuItem(
                      value: method,
                      child: Text(method.label),
                    ),
                  )
                  .toList(),
              onChanged: (method) => setState(() => _paymentMethod = method!),
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
            if (!_isEditing) ...[
              const SizedBox(height: 4),
              _ReceiptPicker(
                receipt: _receipt,
                onPick: _selectReceipt,
                onRemove: () => setState(() => _receipt = null),
              ),
            ],
            const SizedBox(height: 12),
            Obx(
              () => FilledButton(
                onPressed: widget.controller.isSaving.value ? null : _save,
                child: Text(
                  widget.controller.isSaving.value
                      ? AppStrings.saving
                      : AppStrings.saveExpense,
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

  Future<void> _selectReceipt() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text(AppStrings.takePhoto),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text(AppStrings.chooseFromDevice),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;
    final receipt = await _imagePicker.pickImage(
      source: source,
      imageQuality: 88,
    );
    if (receipt != null && mounted) setState(() => _receipt = receipt);
  }
}

class _ReceiptPicker extends StatelessWidget {
  const _ReceiptPicker({
    required this.receipt,
    required this.onPick,
    required this.onRemove,
  });

  final XFile? receipt;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    if (receipt == null) {
      return OutlinedButton.icon(
        onPressed: onPick,
        icon: const Icon(Icons.add_a_photo_outlined),
        label: const Text(AppStrings.attachReceipt),
      );
    }
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: Image.file(
          File(receipt!.path),
          width: 52,
          height: 52,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => const Icon(Icons.broken_image_outlined),
        ),
      ),
      title: const Text(AppStrings.receiptAttached),
      subtitle: const Text(AppStrings.receiptLocalOnly),
      trailing: IconButton(
        tooltip: AppStrings.removeReceipt,
        onPressed: onRemove,
        icon: const Icon(Icons.close),
      ),
      onTap: onPick,
    );
  }
}

String _currency(double amount) =>
    NumberFormat.currency(locale: 'es_CL', symbol: '\$').format(amount);
