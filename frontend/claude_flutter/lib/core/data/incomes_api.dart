import '../http/api_client.dart';
import '../models/models.dart';

class IncomesApi {
  IncomesApi(this._client);

  final ApiClient _client;

  static const String _url = '/incomes/v1';

  Future<List<IncomeResponse>> list(String month) async =>
      readList(await _client.get('$_url/listar', query: {'month': month}), IncomeResponse.fromJson);

  Future<IncomeMonthlySummaryResponse> summary(String month) async => IncomeMonthlySummaryResponse.fromJson(
        readMap(await _client.get('$_url/resumen', query: {'month': month})),
      );

  Future<IncomeResponse> create(IncomeRequest body) async =>
      IncomeResponse.fromJson(readMap(await _client.post('$_url/crear', body.toJson())));

  Future<IncomeResponse> update(String id, IncomeRequest body) async => IncomeResponse.fromJson(
        readMap(await _client.put('$_url/${Uri.encodeComponent(id)}/actualizar', body.toJson())),
      );

  /// Crear si `id` es null; actualizar en caso contrario.
  Future<IncomeResponse> save(String? id, IncomeRequest body) => id == null ? create(body) : update(id, body);

  Future<void> remove(String id) => _client.delete('$_url/${Uri.encodeComponent(id)}/eliminar');
}
