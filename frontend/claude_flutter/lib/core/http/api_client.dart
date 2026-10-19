import 'package:dio/dio.dart';

import 'auth_interceptor.dart';
import 'error_interceptor.dart';
import 'error_utils.dart';
import 'session_expired_interceptor.dart';

/// Cliente HTTP de la API Java. Todas las fallas se lanzan como `AppHttpError`.
///
/// Orden de interceptores (Dio los recorre en orden tanto al enviar como ante errores):
/// Bearer → 419 (reautenticar y reintentar) → normalización de errores / 401.
class ApiClient {
  ApiClient(this.dio, this.baseUrl);

  factory ApiClient.create({
    required String baseUrl,
    required String? Function() tokenProvider,
    required Reauthenticate reauthenticate,
    required void Function() onUnauthorized,
    HttpClientAdapter? adapter,
  }) {
    final dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        contentType: Headers.jsonContentType,
        responseType: ResponseType.json,
      ),
    );
    if (adapter != null) {
      dio.httpClientAdapter = adapter;
    }
    dio.interceptors.addAll([
      AuthInterceptor(baseUrl: baseUrl, tokenProvider: tokenProvider),
      SessionExpiredInterceptor(dio: dio, reauthenticate: reauthenticate),
      ErrorInterceptor(onUnauthorized: onUnauthorized),
    ]);
    return ApiClient(dio, baseUrl);
  }

  final Dio dio;
  final String baseUrl;

  /// URL absoluta: `/expenses/v1/listar` → `<baseUrl>/expenses/v1/listar`.
  String url(String path) => '$baseUrl$path';

  Future<dynamic> get(String path, {Map<String, dynamic>? query, Map<String, dynamic>? extra}) =>
      _send(() => dio.get<dynamic>(url(path), queryParameters: query, options: Options(extra: extra)));

  Future<dynamic> post(String path, Object? body, {Map<String, dynamic>? extra}) =>
      _send(() => dio.post<dynamic>(url(path), data: body, options: Options(extra: extra)));

  Future<dynamic> put(String path, Object? body, {Map<String, dynamic>? extra}) =>
      _send(() => dio.put<dynamic>(url(path), data: body, options: Options(extra: extra)));

  Future<dynamic> patch(String path, Object? body, {Map<String, dynamic>? extra}) =>
      _send(() => dio.patch<dynamic>(url(path), data: body, options: Options(extra: extra)));

  Future<void> delete(String path, {Map<String, dynamic>? extra}) =>
      _send(() => dio.delete<dynamic>(url(path), options: Options(extra: extra)));

  Future<dynamic> _send(Future<Response<dynamic>> Function() request) async {
    try {
      final response = await request();
      return response.data;
    } on DioException catch (e) {
      throw toAppHttpError(e);
    }
  }
}
