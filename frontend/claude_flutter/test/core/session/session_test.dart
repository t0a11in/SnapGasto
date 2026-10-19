import 'dart:async';
import 'dart:convert';

import 'package:claude_flutter/core/config/api_config.dart';
import 'package:claude_flutter/core/models/models.dart';
import 'package:claude_flutter/core/session/reauth_coordinator.dart';
import 'package:claude_flutter/core/session/session_cubit.dart';
import 'package:claude_flutter/core/storage/key_value_store.dart';
import 'package:flutter_test/flutter_test.dart';

const user = UserResponse(id: 'u1', fullName: 'Ana Pérez', email: 'ana@test.cl', role: Role.user);

void main() {
  group('SessionCubit', () {
    test('restaura una sesión persistida válida', () {
      final store = InMemoryStore({
        StorageKeys.session: jsonEncode({'accessToken': 't', 'user': user.toJson()}),
      });
      final cubit = SessionCubit(store);
      expect(cubit.state.isAuthenticated, isTrue);
      expect(cubit.state.user, user);
    });

    test('descarta una sesión corrupta', () {
      final store = InMemoryStore({StorageKeys.session: '{"accessToken": "", "user": {}}'});
      final cubit = SessionCubit(store);
      expect(cubit.state.isAuthenticated, isFalse);
      expect(store.values.containsKey(StorageKeys.session), isFalse);
    });

    test('setSession persiste y clear elimina', () {
      final store = InMemoryStore();
      final cubit = SessionCubit(store)..setSession(const AuthResponse(accessToken: 't', user: user));
      expect(store.values[StorageKeys.session], isNotNull);
      cubit.clear();
      expect(cubit.state.isAuthenticated, isFalse);
      expect(store.values[StorageKeys.session], isNull);
    });
  });

  group('ReauthCoordinator', () {
    test('varias peticiones simultáneas esperan una única reautenticación', () async {
      final session = SessionCubit(InMemoryStore())..setSession(const AuthResponse(accessToken: 't', user: user));
      final gate = Completer<bool>();
      var prompts = 0;
      final coordinator = ReauthCoordinator(
        session: session,
        prompt: () {
          prompts++;
          return gate.future;
        },
      );

      final a = coordinator.reauthenticate();
      final b = coordinator.reauthenticate();
      expect(coordinator.inProgress, isTrue);
      gate.complete(true);

      expect(await a, isTrue);
      expect(await b, isTrue);
      expect(prompts, 1);
      expect(coordinator.inProgress, isFalse);
    });

    test('si se cancela, cierra la sesión', () async {
      final session = SessionCubit(InMemoryStore())..setSession(const AuthResponse(accessToken: 't', user: user));
      final coordinator = ReauthCoordinator(session: session, prompt: () async => false);
      expect(await coordinator.reauthenticate(), isFalse);
      expect(session.state.isAuthenticated, isFalse);
    });

    test('sin usuario en sesión no abre el diálogo', () async {
      var prompts = 0;
      final coordinator = ReauthCoordinator(
        session: SessionCubit(InMemoryStore()),
        prompt: () async {
          prompts++;
          return true;
        },
      );
      expect(await coordinator.reauthenticate(), isFalse);
      expect(prompts, 0);
    });
  });
}
