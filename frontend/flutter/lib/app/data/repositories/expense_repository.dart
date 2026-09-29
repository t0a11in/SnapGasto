import '../../core/network/api_client.dart';
import '../models/expense.dart';

/// Aísla la lectura y escritura de gastos contra la API REST.
class ExpenseRepository {
  const ExpenseRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<Expense>> list() async {
    final response = await _apiClient.dio.get<List<dynamic>>('/expenses');
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
      '/expenses',
      data: {
        'amount': amount,
        'category': category,
        'date': date.toIso8601String().split('T').first,
        'description': description,
        'paymentMethod': paymentMethod,
      },
    );
    return Expense.fromJson(response.data!);
  }

  Future<void> delete(String id) =>
      _apiClient.dio.delete<void>('/expenses/$id');
}
