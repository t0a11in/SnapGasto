import 'dart:convert';

import 'package:dio/dio.dart';

import '../models/app_http_error.dart';

const Map<int, String> _defaultMessages = {
  0: 'No fue posible conectar con el servidor. Revisa tu conexión.',
  400: 'La solicitud no es válida.',
  401: 'Credenciales inválidas o sesión no autorizada.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'El recurso entra en conflicto con uno existente.',
  419: 'Tu sesión expiró.',
  500: 'Ocurrió un error inesperado en el servidor.',
};

/// Extrae `ApiError.message` del cuerpo (objeto o texto JSON).
String? extractMessage(Object? body) {
  if (body is String) {
    final trimmed = body.trim();
    if (trimmed.isEmpty || body.length >= 500) {
      return null;
    }
    try {
      return extractMessage(jsonDecode(trimmed));
    } on FormatException {
      return body;
    }
  }
  if (body is Map) {
    final message = body['message'];
    if (message is String && message.trim().isNotEmpty) {
      return message;
    }
  }
  return null;
}

/// Convierte cualquier error en [AppHttpError] con un mensaje legible (prioriza ApiError.message).
AppHttpError toAppHttpError(Object? error) {
  if (error is AppHttpError) {
    return error;
  }
  if (error is DioException) {
    final inner = error.error;
    if (inner is AppHttpError) {
      return inner;
    }
    // Sin respuesta (timeout, sin red, servidor caído) se trata como status 0.
    final status = error.response?.statusCode ?? 0;
    final message = extractMessage(error.response?.data) ??
        _defaultMessages[status] ??
        (status >= 500 ? _defaultMessages[500]! : 'Error HTTP $status.');
    return AppHttpError(status, message, error.requestOptions.uri.toString());
  }
  return const AppHttpError(-1, 'Ocurrió un error inesperado.');
}

String errorMessage(Object? error) => toAppHttpError(error).message;
