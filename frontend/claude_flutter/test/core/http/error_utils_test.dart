import 'package:claude_flutter/core/http/error_utils.dart';
import 'package:claude_flutter/core/models/models.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

DioException _http(int status, Object? body) {
  final options = RequestOptions(path: 'http://api.test/x');
  return DioException(
    requestOptions: options,
    response: Response<dynamic>(requestOptions: options, statusCode: status, data: body),
    type: DioExceptionType.badResponse,
  );
}

void main() {
  test('usa ApiError.message cuando existe', () {
    final e = toAppHttpError(_http(400, {'message': 'Monto inválido'}));
    expect(e.status, 400);
    expect(e.message, 'Monto inválido');
  });

  test('parsea cuerpos de texto JSON', () {
    expect(toAppHttpError(_http(409, '{"message":"Email ya registrado"}')).message, 'Email ya registrado');
  });

  test('usa mensajes por defecto según el estado', () {
    final noConnection = DioException(
      requestOptions: RequestOptions(path: 'http://api.test/x'),
      type: DioExceptionType.connectionError,
    );
    expect(toAppHttpError(noConnection).message, contains('conectar'));
    expect(toAppHttpError(_http(503, null)).message, contains('servidor'));
  });

  test('devuelve el mismo AppHttpError', () {
    const original = AppHttpError(404, 'x');
    expect(identical(toAppHttpError(original), original), isTrue);
  });
}
