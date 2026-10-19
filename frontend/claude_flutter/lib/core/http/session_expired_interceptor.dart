import 'dart:async';

import 'package:dio/dio.dart';

import '../models/app_http_error.dart';
import 'request_flags.dart';

typedef Reauthenticate = Future<bool> Function();

/// Ante un HTTP 419 abre (una sola vez) el diálogo de reautenticación y reintenta
/// la petición original con el token nuevo. Las peticiones de sesión (login,
/// token-status) y los reintentos llevan `skipReauth`, por lo que no hay bucles.
class SessionExpiredInterceptor extends Interceptor {
  SessionExpiredInterceptor({required this.dio, required this.reauthenticate});

  final Dio dio;
  final Reauthenticate reauthenticate;

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    unawaited(_handle(err, handler));
  }

  Future<void> _handle(DioException err, ErrorInterceptorHandler handler) async {
    final options = err.requestOptions;
    if (err.response?.statusCode != httpSessionExpired ||
        RequestFlags.isSet(options, RequestFlags.skipReauth)) {
      handler.next(err);
      return;
    }

    bool ok;
    try {
      ok = await reauthenticate();
    } on Object {
      ok = false;
    }
    if (!ok) {
      handler.next(err);
      return;
    }

    // Reintento único: si vuelve a fallar con 419 no se reabre el diálogo.
    options.extra[RequestFlags.skipReauth] = true;
    try {
      final response = await dio.fetch<dynamic>(options);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }
}
