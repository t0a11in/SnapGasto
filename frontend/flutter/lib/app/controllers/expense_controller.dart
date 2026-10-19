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
  final isSaving = false.obs;
  final errorMessage = ''.obs;
  final selectedMonth = _firstDayOfMonth(DateTime.now()).obs;

  double get monthlyTotal =>
      expenses.fold(0, (total, expense) => total + expense.amount);

  int get monthlyMovements => expenses.length;

  Future<void> load({DateTime? month}) async {
    if (month != null) selectedMonth.value = _firstDayOfMonth(month);
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final remoteExpenses = await _repository.list(selectedMonth.value);
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
    isSaving.value = true;
    errorMessage.value = '';
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
      await load();
      return true;
    } catch (error) {
      await _receiptStore.deleteUnassociated(localReceiptPath);
      errorMessage.value = _apiClient.errorMessage(error);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  Future<bool> updateExpense({
    required Expense expense,
    required double amount,
    required String category,
    required DateTime date,
    String? description,
    required String paymentMethod,
  }) async {
    isSaving.value = true;
    errorMessage.value = '';
    try {
      await _repository.update(
        id: expense.id,
        amount: amount,
        category: category,
        date: date,
        description: description,
        paymentMethod: paymentMethod,
      );
      await load();
      return true;
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> remove(String id) async {
    try {
      await _repository.delete(id);
      await _receiptStore.deleteFor(id);
      await load();
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
    }
  }

  static DateTime _firstDayOfMonth(DateTime value) =>
      DateTime(value.year, value.month);
}
