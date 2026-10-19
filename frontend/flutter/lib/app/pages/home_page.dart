import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../controllers/auth_controller.dart';
import '../controllers/expense_controller.dart';
import '../controllers/income_controller.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_strings.dart';
import '../core/widgets/app_loading_view.dart';
import '../data/models/expense.dart';
import 'income_page.dart';
import 'expense_page.dart';

/// Presenta el dashboard, el listado de gastos y el perfil del usuario autenticado.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _expenseController = Get.find<ExpenseController>();
  final _incomeController = Get.find<IncomeController>();
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _expenseController.load();
    _incomeController.load();
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      _Dashboard(
        expenseController: _expenseController,
        incomeController: _incomeController,
      ),
      ExpensePage(controller: _expenseController),
      IncomePage(controller: _incomeController),
      const _Profile(),
    ];
    return Scaffold(
      appBar: AppBar(title: Text(_titleForIndex(_selectedIndex))),
      body: pages[_selectedIndex],
      floatingActionButton: switch (_selectedIndex) {
        1 => FloatingActionButton.extended(
          onPressed: () =>
              showExpenseEditor(context, controller: _expenseController),
          icon: const Icon(Icons.add),
          label: const Text(AppStrings.addExpense),
        ),
        2 => FloatingActionButton.extended(
          onPressed: () =>
              showIncomeEditor(context, controller: _incomeController),
          icon: const Icon(Icons.add),
          label: const Text(AppStrings.addIncome),
        ),
        _ => null,
      },
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
            icon: Icon(Icons.savings_outlined),
            selectedIcon: Icon(Icons.savings),
            label: AppStrings.incomes,
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

  String _titleForIndex(int index) => [
    AppStrings.dashboard,
    AppStrings.expenses,
    AppStrings.incomes,
    AppStrings.profile,
  ][index];
}

class _Dashboard extends StatelessWidget {
  const _Dashboard({
    required this.expenseController,
    required this.incomeController,
  });

  final ExpenseController expenseController;
  final IncomeController incomeController;

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: () async {
      await Future.wait([expenseController.load(), incomeController.load()]);
    },
    child: Obx(() {
      if (expenseController.isLoading.value &&
          expenseController.expenses.isEmpty) {
        return const AppLoadingView();
      }
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _MetricCard(
            title: AppStrings.monthlyIncome,
            value: _currency(incomeController.monthlyTotal),
            icon: Icons.savings_outlined,
          ),
          const SizedBox(height: 12),
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
  const _ExpenseTile({required this.expense});

  final Expense expense;

  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      leading: const CircleAvatar(child: Icon(Icons.receipt)),
      title: Text(expense.category),
      subtitle: Text(
        '${DateFormat.yMMMd('es_CL').format(expense.date)} · ${expense.description ?? expense.paymentMethod.label}',
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _currency(expense.amount),
            style: const TextStyle(fontWeight: FontWeight.bold),
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

String _currency(double amount) =>
    NumberFormat.currency(locale: 'es_CL', symbol: '\$').format(amount);
