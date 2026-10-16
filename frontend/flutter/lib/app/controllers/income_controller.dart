import 'package:get/get.dart';

import '../core/network/api_client.dart';
import '../data/models/income.dart';
import '../data/repositories/income_repository.dart';

/// Administra el mantenedor y el resumen mensual de ingresos propios.
class IncomeController extends GetxController {
  IncomeController(this._repository, this._apiClient);

  final IncomeRepository _repository;
  final ApiClient _apiClient;
  final incomes = <Income>[].obs;
  final summary = Rxn<IncomeMonthlySummary>();
  final isLoading = false.obs;
  final isSaving = false.obs;
  final errorMessage = ''.obs;
  final selectedMonth = _firstDayOfMonth(DateTime.now()).obs;

  double get monthlyTotal => summary.value?.total ?? 0;

  Future<void> load({DateTime? month}) async {
    if (month != null) selectedMonth.value = _firstDayOfMonth(month);
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final monthToLoad = selectedMonth.value;
      final results = await Future.wait<Object>([
        _repository.list(monthToLoad),
        _repository.summary(monthToLoad),
      ]);
      incomes.assignAll(results[0] as List<Income>);
      summary.value = results[1] as IncomeMonthlySummary;
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> create({
    required double amount,
    required IncomeType type,
    required DateTime date,
    String? description,
  }) async {
    isSaving.value = true;
    errorMessage.value = '';
    try {
      await _repository.create(
        amount: amount,
        type: type,
        date: date,
        description: description,
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

  Future<bool> updateIncome({
    required Income income,
    required double amount,
    required IncomeType type,
    required DateTime date,
    String? description,
  }) async {
    isSaving.value = true;
    errorMessage.value = '';
    try {
      await _repository.update(
        id: income.id,
        amount: amount,
        type: type,
        date: date,
        description: description,
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
    errorMessage.value = '';
    try {
      await _repository.delete(id);
      await load();
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
    }
  }

  static DateTime _firstDayOfMonth(DateTime value) =>
      DateTime(value.year, value.month);
}
