import '../../core/network/api_client.dart';
import '../models/expense.dart';

/// Aísla la lectura y escritura de gastos contra la API REST.
class ExpenseRepository {
  const ExpenseRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<Expense>> list(DateTime month) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/expenses/v1/listar',
      queryParameters: {'month': _monthKey(month)},
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(Expense.fromJson)
        .toList(growable: false);
  }

  Future<Expense> create({
    required double amount,
    required String category,
    required DateTime date,
    String? description,
    required String paymentMethod,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/expenses/v1/crear',
      data: _payload(
        amount: amount,
        category: category,
        date: date,
        description: description,
        paymentMethod: paymentMethod,
      ),
    );
    return Expense.fromJson(response.data!);
  }

  Future<Expense> update({
    required String id,
    required double amount,
    required String category,
    required DateTime date,
    String? description,
    required String paymentMethod,
  }) async {
    final response = await _apiClient.dio.put<Map<String, dynamic>>(
      '/expenses/v1/$id/actualizar',
      data: _payload(
        amount: amount,
        category: category,
        date: date,
        description: description,
        paymentMethod: paymentMethod,
      ),
    );
    return Expense.fromJson(response.data!);
  }

  Future<void> delete(String id) =>
      _apiClient.dio.delete<void>('/expenses/v1/$id/eliminar');

  Map<String, dynamic> _payload({
    required double amount,
    required String category,
    required DateTime date,
    String? description,
    required String paymentMethod,
  }) => {
    'amount': amount,
    'category': category.trim(),
    'date': _dateKey(date),
    'description': description,
    'paymentMethod': paymentMethod,
  };

  String _monthKey(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}';

  String _dateKey(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
}
