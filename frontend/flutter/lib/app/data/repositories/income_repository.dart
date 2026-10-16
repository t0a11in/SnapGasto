import '../../core/network/api_client.dart';
import '../models/income.dart';

/// Aísla el consumo del mantenedor versionado de ingresos de la API REST.
class IncomeRepository {
  const IncomeRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<Income>> list(DateTime month) async {
    final response = await _apiClient.dio.get<List<dynamic>>(
      '/incomes/v1/listar',
      queryParameters: {'month': _monthKey(month)},
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(Income.fromJson)
        .toList(growable: false);
  }

  Future<IncomeMonthlySummary> summary(DateTime month) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/incomes/v1/resumen',
      queryParameters: {'month': _monthKey(month)},
    );
    return IncomeMonthlySummary.fromJson(response.data!);
  }

  Future<Income> create({
    required double amount,
    required IncomeType type,
    required DateTime date,
    String? description,
  }) => _save(
    '/incomes/v1/crear',
    amount: amount,
    type: type,
    date: date,
    description: description,
  );

  Future<Income> update({
    required String id,
    required double amount,
    required IncomeType type,
    required DateTime date,
    String? description,
  }) async {
    final response = await _apiClient.dio.put<Map<String, dynamic>>(
      '/incomes/v1/$id/actualizar',
      data: _payload(
        amount: amount,
        type: type,
        date: date,
        description: description,
      ),
    );
    return Income.fromJson(response.data!);
  }

  Future<void> delete(String id) =>
      _apiClient.dio.delete<void>('/incomes/v1/$id/eliminar');

  Future<Income> _save(
    String path, {
    required double amount,
    required IncomeType type,
    required DateTime date,
    String? description,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      path,
      data: _payload(
        amount: amount,
        type: type,
        date: date,
        description: description,
      ),
    );
    return Income.fromJson(response.data!);
  }

  Map<String, dynamic> _payload({
    required double amount,
    required IncomeType type,
    required DateTime date,
    String? description,
  }) => {
    'amount': amount,
    'type': type.apiValue,
    'date': _dateKey(date),
    'description': description,
  };

  String _monthKey(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}';

  String _dateKey(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
}
