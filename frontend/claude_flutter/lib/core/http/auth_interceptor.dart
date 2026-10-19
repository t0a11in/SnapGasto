import 'package:dio/dio.dart';

/// Rutas públicas: no llevan Bearer.
const List<String> publicAuthPaths = ['/auth/login', '/auth/register'];

/// Agrega `Authorization: Bearer <token>` solo a peticiones hacia la API propia.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({required this.baseUrl, required this.tokenProvider});

  final String baseUrl;
  final String? Function() tokenProvider;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Se recalcula en cada intento: un reintento tras el 419 usa el token nuevo.
    options.headers.remove('Authorization');
    final token = tokenProvider();
    final url = options.uri.toString();
    if (token != null && url.startsWith(baseUrl)) {
      final path = url.substring(baseUrl.length).split('?').first;
      if (!publicAuthPaths.contains(path)) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }
}
