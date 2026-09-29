import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../controllers/auth_controller.dart';
import '../controllers/expense_controller.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_strings.dart';
import '../core/widgets/app_loading_view.dart';
import '../data/models/expense.dart';

/// Presenta el dashboard, el listado de gastos y el perfil del usuario autenticado.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _expenseController = Get.find<ExpenseController>();
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _expenseController.load();
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      _Dashboard(expenseController: _expenseController),
      _ExpenseList(expenseController: _expenseController),
      const _Profile(),
    ];
    return Scaffold(
      appBar: AppBar(title: Text(_titleForIndex(_selectedIndex))),
      body: pages[_selectedIndex],
      floatingActionButton: _selectedIndex == 1
          ? FloatingActionButton.extended(
              onPressed: () => _showAddExpense(context),
              icon: const Icon(Icons.add),
              label: const Text(AppStrings.addExpense),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: AppStrings.dashboard,
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: AppStrings.expenses,
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: AppStrings.profile,
          ),
        ],
      ),
    );
  }

  String _titleForIndex(int index) =>
      [AppStrings.dashboard, AppStrings.expenses, AppStrings.profile][index];

  Future<void> _showAddExpense(BuildContext context) =>
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (_) => _AddExpenseSheet(controller: _expenseController),
      );
}

class _Dashboard extends StatelessWidget {
  const _Dashboard({required this.expenseController});

  final ExpenseController expenseController;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: expenseController.load,
    child: Obx(() {
      if (expenseController.isLoading.value &&
          expenseController.expenses.isEmpty) {
        return const AppLoadingView();
      }
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _MetricCard(
            title: AppStrings.monthlyExpense,
            value: _currency(expenseController.monthlyTotal),
            icon: Icons.account_balance_wallet_rounded,
          ),
          const SizedBox(height: 12),
          _MetricCard(
            title: AppStrings.movements,
            value: expenseController.monthlyMovements.toString(),
            icon: Icons.receipt_long_rounded,
          ),
          const SizedBox(height: 28),
          Text(
            AppStrings.recentExpenses,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          if (expenseController.errorMessage.isNotEmpty)
            _ErrorMessage(
              message: expenseController.errorMessage.value,
              onRetry: expenseController.load,
            )
          else if (expenseController.expenses.isEmpty)
            const _EmptyExpenses()
          else
            ...expenseController.expenses
                .take(5)
                .map((expense) => _ExpenseTile(expense: expense)),
        ],
      );
    }),
  );
}

class _ExpenseList extends StatelessWidget {
  const _ExpenseList({required this.expenseController});

  final ExpenseController expenseController;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: expenseController.load,
    child: Obx(() {
      if (expenseController.isLoading.value &&
          expenseController.expenses.isEmpty) {
        return const AppLoadingView();
      }
      if (expenseController.errorMessage.isNotEmpty) {
        return _ErrorMessage(
          message: expenseController.errorMessage.value,
          onRetry: expenseController.load,
        );
      }
      if (expenseController.expenses.isEmpty) return const _EmptyExpenses();
      return ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: expenseController.expenses.length,
        separatorBuilder: (_, _) => const SizedBox(height: 8),
        itemBuilder: (_, index) {
          final expense = expenseController.expenses[index];
          return _ExpenseTile(
            expense: expense,
            onDelete: () => _confirmDeletion(context, expense),
          );
        },
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
    if (shouldDelete ?? false) await expenseController.remove(expense.id);
  }
}

class _Profile extends StatelessWidget {
  const _Profile();

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Obx(() {
        final user = auth.user.value;
        if (user == null) return const AppLoadingView();
        return Column(
          children: [
            const CircleAvatar(radius: 40, child: Icon(Icons.person, size: 40)),
            const SizedBox(height: 16),
            Text(user.fullName, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              user.email,
              style: const TextStyle(color: AppColors.mutedText),
            ),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.admin_panel_settings_outlined),
              title: const Text(AppStrings.role),
              trailing: Text(user.role),
            ),
            const Spacer(),
            OutlinedButton.icon(
              onPressed: auth.logout,
              icon: const Icon(Icons.logout),
              label: const Text(AppStrings.logout),
            ),
          ],
        );
      }),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  final String title;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Card(
    color: AppColors.primary,
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 36),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white70)),
              Text(
                value,
                style: Theme.of(
                  context,
                ).textTheme.headlineSmall?.copyWith(color: Colors.white),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

class _ExpenseTile extends StatelessWidget {
  const _ExpenseTile({required this.expense, this.onDelete});

  final Expense expense;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      leading: const CircleAvatar(child: Icon(Icons.receipt)),
      title: Text(expense.category),
      subtitle: Text(
        '${DateFormat.yMMMd('es_CL').format(expense.date)} · ${expense.description ?? expense.paymentMethod}',
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _currency(expense.amount),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          if (onDelete != null)
            IconButton(
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline),
              tooltip: AppStrings.delete,
            ),
        ],
      ),
    ),
  );
}

class _EmptyExpenses extends StatelessWidget {
  const _EmptyExpenses();

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.receipt_long_outlined,
            size: 56,
            color: AppColors.mutedText,
          ),
          const SizedBox(height: 12),
          Text(
            AppStrings.emptyExpenses,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          const Text(
            AppStrings.emptyExpensesDetail,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}

class _ErrorMessage extends StatelessWidget {
  const _ErrorMessage({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.cloud_off_outlined,
            size: 48,
            color: AppColors.danger,
          ),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: onRetry,
            child: const Text(AppStrings.retry),
          ),
        ],
      ),
    ),
  );
}

class _AddExpenseSheet extends StatefulWidget {
  const _AddExpenseSheet({required this.controller});

  final ExpenseController controller;

  @override
  State<_AddExpenseSheet> createState() => _AddExpenseSheetState();
}

class _AddExpenseSheetState extends State<_AddExpenseSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime _date = DateTime.now();
  String _category = AppStrings.defaultCategory;
  String _paymentMethod = AppStrings.defaultPaymentMethod;

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final didSave = await widget.controller.create(
      amount: double.parse(_amountController.text.replaceAll(',', '.')),
      category: _category,
      date: _date,
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      paymentMethod: _paymentMethod,
    );
    if (!mounted) return;
    if (didSave) {
      Navigator.pop(context);
    } else {
      Get.snackbar(AppStrings.addExpense, widget.controller.errorMessage.value);
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
              AppStrings.addExpense,
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
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: AppStrings.category),
              items: AppStrings.categories
                  .map(
                    (value) =>
                        DropdownMenuItem(value: value, child: Text(value)),
                  )
                  .toList(),
              onChanged: (value) => setState(() => _category = value!),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _paymentMethod,
              decoration: const InputDecoration(
                labelText: AppStrings.paymentMethod,
              ),
              items: AppStrings.paymentMethods
                  .map(
                    (value) =>
                        DropdownMenuItem(value: value, child: Text(value)),
                  )
                  .toList(),
              onChanged: (value) => setState(() => _paymentMethod = value!),
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
                labelText: AppStrings.description,
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: _save, child: const Text(AppStrings.save)),
          ],
        ),
      ),
    ),
  );

  Future<void> _selectDate() async {
    final selectedDate = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (selectedDate != null) setState(() => _date = selectedDate);
  }
}

String _currency(double amount) =>
    NumberFormat.currency(locale: 'es_CL', symbol: '\$').format(amount);
