import '../http/api_client.dart';
import '../models/models.dart';

/// Cliente REST estándar para los mantenedores ADMIN:
///   GET    /{resource}        → TRes[] (array plano)
///   GET    /{resource}/{id}   → TRes
///   POST   /{resource}        → TRes
///   PATCH  /{resource}/{id}   → TRes
///   DELETE /{resource}/{id}   → 204
class AdminCrudApi<TReq extends JsonEncodable, TRes> {
  AdminCrudApi(this._client, this.resource, this._fromJson);

  final ApiClient _client;
  final String resource;
  final TRes Function(JsonMap json) _fromJson;

  Future<List<TRes>> list() async => readList(await _client.get(resource), _fromJson);

  Future<TRes> get(String id) async => _fromJson(readMap(await _client.get(_item(id))));

  Future<TRes> create(TReq body) async => _fromJson(readMap(await _client.post(resource, body.toJson())));

  Future<TRes> update(String id, TReq body) async =>
      _fromJson(readMap(await _client.patch(_item(id), body.toJson())));

  Future<void> remove(String id) => _client.delete(_item(id));

  String _item(String id) => '$resource/${Uri.encodeComponent(id)}';
}

class AdminUsersApi extends AdminCrudApi<AdminUserRequest, AdminUserResponse> {
  AdminUsersApi(ApiClient client) : super(client, '/admin/users', AdminUserResponse.fromJson);
}

class AdminCategoriesApi extends AdminCrudApi<CategoryRequest, CategoryResponse> {
  AdminCategoriesApi(ApiClient client) : super(client, '/admin/categories', CategoryResponse.fromJson);
}

class AdminExpensesApi extends AdminCrudApi<AdminExpenseRequest, AdminExpenseResponse> {
  AdminExpensesApi(ApiClient client) : super(client, '/admin/expenses', AdminExpenseResponse.fromJson);
}

class AdminNotificationsApi extends AdminCrudApi<NotificationRequest, NotificationResponse> {
  AdminNotificationsApi(ApiClient client) : super(client, '/admin/notifications', NotificationResponse.fromJson);
}
