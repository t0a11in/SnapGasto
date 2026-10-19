import 'dart:async';
import 'dart:convert';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../config/api_config.dart';
import '../models/auth_models.dart';
import '../storage/key_value_store.dart';

class SessionState extends Equatable {
  const SessionState({this.token, this.user});

  final String? token;
  final UserResponse? user;

  bool get isAuthenticated => token != null && user != null;

  bool get isAdmin => user?.role == Role.admin;

  @override
  List<Object?> get props => [token, user];
}

/// Estado de sesión (token + usuario) persistido en el almacenamiento local.
class SessionCubit extends Cubit<SessionState> {
  SessionCubit(this._store) : super(_restore(_store));

  final KeyValueStore _store;

  String? get token => state.token;

  /// Carga la sesión persistida (si es válida); si está corrupta la elimina.
  static SessionState _restore(KeyValueStore store) {
    final raw = store.getString(StorageKeys.session);
    if (raw == null) {
      return const SessionState();
    }
    try {
      final json = jsonDecode(raw);
      if (json is Map) {
        final token = json['accessToken'];
        final user = UserResponse.tryFromJson(json['user']);
        if (token is String && token.isNotEmpty && user != null) {
          return SessionState(token: token, user: user);
        }
      }
    } on FormatException {
      // se elimina abajo
    }
    unawaited(store.remove(StorageKeys.session));
    return const SessionState();
  }

  void setSession(AuthResponse auth) {
    emit(SessionState(token: auth.accessToken, user: auth.user));
    unawaited(
      _store.setString(
        StorageKeys.session,
        jsonEncode({'accessToken': auth.accessToken, 'user': auth.user.toJson()}),
      ),
    );
  }

  void clear() {
    emit(const SessionState());
    unawaited(_store.remove(StorageKeys.session));
  }
}
