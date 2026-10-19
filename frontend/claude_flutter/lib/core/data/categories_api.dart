import '../http/api_client.dart';
import '../http/request_flags.dart';
import '../models/models.dart';

/// Lectura de categorías para usuarios USER y ADMIN.
/// PENDIENTE EN JAVA: `GET /api/categories` → List<CategoryResponse>.
/// Mientras no exista, el formulario de gastos cae a texto libre.
class CategoriesApi {
  CategoriesApi(this._client);

  final ApiClient _client;

  // Si el endpoint aún no existe (404/401/403) no debe cerrar la sesión.
  Future<List<CategoryResponse>> list() async => readList(
        await _client.get('/categories', extra: {RequestFlags.skipAutoLogout: true}),
        CategoryResponse.fromJson,
      );
}
