import '../http/api_client.dart';
import '../models/models.dart';

class ExpensesApi {
  ExpensesApi(this._client);

  final ApiClient _client;

  static const String _url = '/expenses/v1';

  Future<List<ExpenseResponse>> list(String month) async =>
      readList(await _client.get('$_url/listar', query: {'month': month}), ExpenseResponse.fromJson);

  Future<ExpenseResponse> create(ExpenseRequest body) async =>
      ExpenseResponse.fromJson(readMap(await _client.post('$_url/crear', body.toJson())));

  Future<ExpenseResponse> update(String id, ExpenseRequest body) async => ExpenseResponse.fromJson(
        readMap(await _client.put('$_url/${Uri.encodeComponent(id)}/actualizar', body.toJson())),
      );

  /// Crear si `id` es null; actualizar en caso contrario.
  Future<ExpenseResponse> save(String? id, ExpenseRequest body) => id == null ? create(body) : update(id, body);

  Future<void> remove(String id) => _client.delete('$_url/${Uri.encodeComponent(id)}/eliminar');
}
