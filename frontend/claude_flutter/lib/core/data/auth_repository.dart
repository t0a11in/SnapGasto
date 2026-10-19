import '../config/api_config.dart';
import '../models/models.dart';
import '../session/session_cubit.dart';
import '../storage/key_value_store.dart';
import 'auth_api.dart';

/// Fachada de autenticación: coordina API, sesión y correo recordado.
/// La navegación la resuelve el router al escuchar la sesión.
class AuthRepository {
  AuthRepository({
    required AuthApi api,
    required SessionCubit session,
    required KeyValueStore store,
  })  : _api = api,
        _session = session,
        _store = store;

  final AuthApi _api;
  final SessionCubit _session;
  final KeyValueStore _store;

  Future<AuthResponse> login(AuthRequest credentials, {required bool rememberEmail}) async {
    final auth = await _api.login(credentials);
    _session.setSession(auth);
    if (rememberEmail) {
      await _store.setString(StorageKeys.rememberedEmail, credentials.email);
    } else {
      await _store.remove(StorageKeys.rememberedEmail);
    }
    return auth;
  }

  Future<AuthResponse> register(RegisterRequest data) async {
    final auth = await _api.register(data);
    _session.setSession(auth);
    return auth;
  }

  /// Reautentica al usuario actual con su contraseña (diálogo de sesión expirada).
  Future<AuthResponse> reauthenticate(String password) async {
    final email = _session.state.user?.email;
    if (email == null) {
      throw const AppHttpError(-1, 'No hay usuario en sesión para reautenticar.');
    }
    final auth = await _api.login(AuthRequest(email: email, password: password));
    _session.setSession(auth);
    return auth;
  }

  String? rememberedEmail() => _store.getString(StorageKeys.rememberedEmail);

  /// Valida la sesión persistida contra /auth/v1/token-status al iniciar la app.
  /// Si el token ya no está vivo se limpia la sesión. Ante un error de red se conserva.
  Future<void> validateStoredSession() async {
    if (!_session.state.isAuthenticated) {
      return;
    }
    bool alive;
    try {
      alive = (await _api.tokenStatus()).tokenAlive;
    } on AppHttpError catch (e) {
      alive = e.status == 0;
    } on Object {
      alive = false;
    }
    if (!alive) {
      _session.clear();
    }
  }

  void logout() => _session.clear();
}
