import 'dart:async';

import 'package:claude_flutter/core/data/auth_api.dart';
import 'package:claude_flutter/core/http/api_client.dart';
import 'package:claude_flutter/core/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../helpers/fake_adapter.dart';

const String api = 'http://api.test/api';

class _Harness {
  _Harness({FutureOr<FakeReply> Function(dynamic options)? handler}) {
    adapter = FakeAdapter((o) => handler?.call(o) ?? const FakeReply(200, []));
    client = ApiClient.create(
      baseUrl: api,
      tokenProvider: () => token,
      reauthenticate: () {
        reauthCalls++;
        return reauth();
      },
      onUnauthorized: () => logoutCalls++,
      adapter: adapter,
    );
  }

  late final FakeAdapter adapter;
  late final ApiClient client;
  String? token = 'token-1';
  int reauthCalls = 0;
  int logoutCalls = 0;
  Future<bool> Function() reauth = () async => false;
}

void main() {
  group('Bearer', () {
    test('agrega Bearer a la API propia', () async {
      final h = _Harness();
      await h.client.get('/expenses/v1/listar');
      expect(h.adapter.authHeaders.single, 'Bearer token-1');
    });

    test('no agrega Bearer a login ni a otros dominios', () async {
      final h = _Harness(handler: (_) => const FakeReply(200, {}));
      await h.client.dio.get<dynamic>('https://otro.dominio/x');
      await h.client.post('/auth/login', {'email': 'a@b.cl', 'password': 'x'});
      expect(h.adapter.authHeaders, [null, null]);
    });

    test('no agrega header sin sesión', () async {
      final h = _Harness()..token = null;
      await h.client.get('/incomes/v1/listar');
      expect(h.adapter.authHeaders.single, isNull);
    });
  });

  group('errores', () {
    test('normaliza a AppHttpError con el mensaje de Java', () async {
      final h = _Harness(handler: (_) => const FakeReply(400, {'message': 'Categoría inválida'}));
      await expectLater(
        h.client.get('/x'),
        throwsA(isA<AppHttpError>().having((e) => e.message, 'message', 'Categoría inválida')),
      );
    });

    test('cierra sesión ante 401 en rutas protegidas', () async {
      final h = _Harness(handler: (_) => const FakeReply(401));
      await expectLater(h.client.get('/x'), throwsA(isA<AppHttpError>()));
      expect(h.logoutCalls, 1);
    });

    test('no cierra sesión ante 401 del login (credenciales inválidas)', () async {
      final h = _Harness(handler: (_) => const FakeReply(401, {'message': 'Credenciales inválidas'}));
      await expectLater(
        AuthApi(h.client).login(const AuthRequest(email: 'a@b.cl', password: 'mala')),
        throwsA(isA<AppHttpError>().having((e) => e.status, 'status', 401)),
      );
      expect(h.logoutCalls, 0);
    });
  });

  group('419 (sesión expirada)', () {
    test('reautentica y reintenta con el token nuevo', () async {
      var calls = 0;
      final h = _Harness(
        handler: (_) => ++calls == 1 ? const FakeReply(419) : const FakeReply(200, [{'id': '1'}]),
      )..token = 'viejo';
      h.reauth = () async {
        h.token = 'nuevo';
        return true;
      };

      final result = await h.client.get('/expenses/v1/listar');

      expect(h.adapter.authHeaders, ['Bearer viejo', 'Bearer nuevo']);
      expect(h.reauthCalls, 1);
      expect(result, [{'id': '1'}]);
    });

    test('propaga el error si se cancela la reautenticación', () async {
      final h = _Harness(handler: (_) => const FakeReply(419));
      await expectLater(
        h.client.get('/x'),
        throwsA(isA<AppHttpError>().having((e) => e.status, 'status', 419)),
      );
    });

    test('no entra en bucle si el reintento vuelve a responder 419', () async {
      final h = _Harness(handler: (_) => const FakeReply(419));
      h.reauth = () async => true;
      await expectLater(
        h.client.get('/x'),
        throwsA(isA<AppHttpError>().having((e) => e.status, 'status', 419)),
      );
      expect(h.reauthCalls, 1);
      expect(h.adapter.count, 2);
    });

    test('token-status nunca abre la reautenticación', () async {
      final h = _Harness(handler: (_) => const FakeReply(419));
      await expectLater(AuthApi(h.client).tokenStatus(), throwsA(isA<AppHttpError>()));
      expect(h.reauthCalls, 0);
    });
  });
}
