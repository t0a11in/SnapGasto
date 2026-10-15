import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../core/network/api_client.dart';
import '../data/models/expense.dart';
import '../data/repositories/expense_repository.dart';
import '../data/storage/local_receipt_store.dart';

/// Administra el listado y las mutaciones de gastos del usuario autenticado.
class ExpenseController extends GetxController {
  ExpenseController(this._repository, this._apiClient, this._receiptStore);

  final ExpenseRepository _repository;
  final ApiClient _apiClient;
  final LocalReceiptStore _receiptStore;
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
      final remoteExpenses = await _repository.list();
      expenses.assignAll(
        remoteExpenses.map(
          (expense) => expense.copyWith(
            receiptLocalPath: _receiptStore.pathFor(expense.id),
          ),
        ),
      );
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
    XFile? receipt,
  }) async {
    String? localReceiptPath;
    try {
      if (receipt != null) localReceiptPath = await _receiptStore.save(receipt);
      final expense = await _repository.create(
        amount: amount,
        category: category,
        date: date,
        description: description,
        paymentMethod: paymentMethod,
      );
      if (localReceiptPath != null) {
        await _receiptStore.associate(expense.id, localReceiptPath);
      }
      expenses.insert(0, expense.copyWith(receiptLocalPath: localReceiptPath));
      return true;
    } catch (error) {
      await _receiptStore.deleteUnassociated(localReceiptPath);
      errorMessage.value = _apiClient.errorMessage(error);
      return false;
    }
  }

  Future<void> remove(String id) async {
    try {
      await _repository.delete(id);
      await _receiptStore.deleteFor(id);
      expenses.removeWhere((expense) => expense.id == id);
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
    }
  }
}
