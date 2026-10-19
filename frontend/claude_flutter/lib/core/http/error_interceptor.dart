import 'package:dio/dio.dart';

import 'error_utils.dart';
import 'request_flags.dart';

/// Último interceptor en la cadena de errores: normaliza a `AppHttpError`
/// (queda en `DioException.error`) y ante un 401 (fuera de login/registro) cierra la sesión.
class ErrorInterceptor extends Interceptor {
  ErrorInterceptor({required this.onUnauthorized});

  final void Function() onUnauthorized;

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final appError = toAppHttpError(err);
    if (appError.status == 401 && !RequestFlags.isSet(err.requestOptions, RequestFlags.skipAutoLogout)) {
      onUnauthorized();
    }
    handler.next(err.copyWith(error: appError));
  }
}
