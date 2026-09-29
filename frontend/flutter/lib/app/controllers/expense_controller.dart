import 'package:get/get.dart';

import '../core/network/api_client.dart';
import '../data/models/expense.dart';
import '../data/repositories/expense_repository.dart';

/// Administra el listado y las mutaciones de gastos del usuario autenticado.
class ExpenseController extends GetxController {
  ExpenseController(this._repository, this._apiClient);

  final ExpenseRepository _repository;
  final ApiClient _apiClient;
  final expenses = <Expense>[].obs;
  final isLoading = false.obs;
  final errorMessage = ''.obs;

  double get monthlyTotal {
    final today = DateTime.now();
    return expenses
        .where(
          (expense) =>
              expense.date.year == today.year &&
              expense.date.month == today.month,
        )
        .fold(0, (total, expense) => total + expense.amount);
  }

  int get monthlyMovements {
    final today = DateTime.now();
    return expenses
        .where(
          (expense) =>
              expense.date.year == today.year &&
              expense.date.month == today.month,
        )
        .length;
  }

  Future<void> load() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      expenses.assignAll(await _repository.list());
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> create({
    required double amount,
    required String category,
    required DateTime date,
    String? description,
    required String paymentMethod,
  }) async {
    try {
      final expense = await _repository.create(
        amount: amount,
        category: category,
        date: date,
        description: description,
        paymentMethod: paymentMethod,
      );
      expenses.insert(0, expense);
      return true;
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
      return false;
    }
  }

  Future<void> remove(String id) async {
    try {
      await _repository.delete(id);
      expenses.removeWhere((expense) => expense.id == id);
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
    }
  }
}
