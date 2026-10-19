import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

/// Respuesta simulada.
class FakeReply {
  const FakeReply(this.status, [this.body]);

  final int status;
  final Object? body;
}

/// Adaptador HTTP de pruebas: registra las peticiones y responde con `handler`.
class FakeAdapter implements HttpClientAdapter {
  FakeAdapter(this.handler);

  FutureOr<FakeReply> Function(RequestOptions options) handler;

  /// URLs pedidas, en orden.
  final List<String> urls = [];

  /// Header Authorization tal como salió en cada intento (copia, no referencia).
  final List<String?> authHeaders = [];

  int get count => urls.length;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    urls.add(options.uri.toString());
    authHeaders.add(options.headers['Authorization'] as String?);
    final reply = await handler(options);
    final body = reply.body;
    if (body == null) {
      return ResponseBody.fromString('', reply.status, headers: {
        Headers.contentTypeHeader: ['text/plain'],
      });
    }
    return ResponseBody.fromString(jsonEncode(body), reply.status, headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    });
  }

  @override
  void close({bool force = false}) {}
}
