import 'package:dio/dio.dart';

/// Banderas por petición (equivalentes a los HttpContextToken de Angular).
abstract final class RequestFlags {
  /// Si es true, un 419 no abre el diálogo de reautenticación.
  static const String skipReauth = 'snapgasto.skipReauth';

  /// Si es true, un 401 no cierra la sesión automáticamente.
  static const String skipAutoLogout = 'snapgasto.skipAutoLogout';

  static bool isSet(RequestOptions options, String flag) => options.extra[flag] == true;
}

/// Peticiones de sesión (login, registro, token-status) que no deben encadenar recuperación.
Map<String, dynamic> sessionRequestExtra() => {
      RequestFlags.skipReauth: true,
      RequestFlags.skipAutoLogout: true,
    };
