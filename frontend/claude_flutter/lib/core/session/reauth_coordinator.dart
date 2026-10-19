import 'dart:async';

import 'session_cubit.dart';

/// Muestra la UI de reautenticación; resuelve `true` si el usuario volvió a ingresar.
typedef ReauthPrompt = Future<bool> Function();

/// Coordina la recuperación de sesión expirada (HTTP 419).
/// - Un único diálogo aunque fallen varias peticiones a la vez: todas esperan el mismo resultado.
/// - Si el usuario cancela o no hay usuario en sesión, se cierra la sesión.
class ReauthCoordinator {
  ReauthCoordinator({required SessionCubit session, this.prompt}) : _session = session;

  final SessionCubit _session;

  /// Se asigna al construir la app (necesita el Navigator).
  ReauthPrompt? prompt;

  Future<bool>? _pending;

  /// true mientras el diálogo de reautenticación está abierto.
  bool get inProgress => _pending != null;

  Future<bool> reauthenticate() {
    final pending = _pending;
    if (pending != null) {
      return pending;
    }
    final show = prompt;
    if (_session.state.user == null || show == null) {
      _session.clear();
      return Future.value(false);
    }
    final completer = Completer<bool>();
    _pending = completer.future;
    unawaited(_run(show, completer));
    return completer.future;
  }

  Future<void> _run(ReauthPrompt show, Completer<bool> completer) async {
    var ok = false;
    try {
      ok = await show();
    } on Object {
      ok = false;
    }
    if (!ok) {
      _session.clear();
    }
    _pending = null;
    completer.complete(ok);
  }
}
