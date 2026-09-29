import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:get_storage/get_storage.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../../config/app_config.dart';
import '../constants/app_strings.dart';

/// Encapsula Dio, agrega el JWT y traduce errores HTTP a mensajes de dominio.
class ApiClient {
  ApiClient(this._storage)
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
          final token = _storage.read<String>(_tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
    if (kDebugMode) {
      dio.interceptors.add(
        PrettyDioLogger(requestHeader: false, requestBody: true),
      );
    }
  }

  static const _tokenKey = 'access_token';
  final GetStorage _storage;
  final Dio dio;

  Future<void> saveToken(String token) => _storage.write(_tokenKey, token);
  Future<void> clearToken() => _storage.remove(_tokenKey);
  String? get token => _storage.read<String>(_tokenKey);
  bool get hasToken => (token ?? '').isNotEmpty;

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
