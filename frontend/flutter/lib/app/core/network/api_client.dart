import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../../config/backend_target.dart';
import '../../config/app_config.dart';
import '../constants/app_strings.dart';
import '../storage/secure_session_storage.dart';

/// Encapsula Dio, agrega el JWT y traduce errores HTTP a mensajes de dominio.
class ApiClient {
  ApiClient(this._sessionStorage)
    : dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 15),
          headers: const {'Content-Type': 'application/json'},
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _token;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
    if (kDebugMode) {
      dio.interceptors.add(
        // Los cuerpos de login y las respuestas contienen contraseña/JWT.
        PrettyDioLogger(
          requestHeader: false,
          requestBody: false,
          responseBody: false,
        ),
      );
    }
  }

  final SecureSessionStorage _sessionStorage;
  final Dio dio;
  String? _token;

  /// Carga el token desde el almacén cifrado una sola vez al iniciar la app.
  Future<void> restoreToken() async {
    _token = await _sessionStorage.readToken();
  }

  Future<void> saveToken(String token) async {
    _token = token;
    await _sessionStorage.writeToken(token);
  }

  Future<void> clearToken() async {
    _token = null;
    await _sessionStorage.deleteToken();
  }

  String? get token => _token;
  bool get hasToken => (token ?? '').isNotEmpty;

  /// Cambia el backend activo sin alterar host ni path definidos para el entorno.
  void configureBackend(BackendTarget target) {
    dio.options.baseUrl = AppConfig.apiBaseUrlForPort(target.port);
  }

  String errorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic> && data['message'] is String) {
        return data['message'] as String;
      }
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout) {
        return AppStrings.connectionError;
      }
    }
    return AppStrings.unexpectedError;
  }
}
