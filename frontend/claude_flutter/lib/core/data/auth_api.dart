import '../http/api_client.dart';
import '../http/request_flags.dart';
import '../models/models.dart';

/// Login, registro y token-status viajan con `sessionRequestExtra()`: un 401/419
/// en ellos nunca abre el diálogo de reautenticación ni dispara logout automático,
/// lo que evita bucles.
class AuthApi {
  AuthApi(this._client);

  final ApiClient _client;

  Future<AuthResponse> login(AuthRequest body) async => AuthResponse.fromJson(
        readMap(await _client.post('/auth/login', body.toJson(), extra: sessionRequestExtra())),
      );

  Future<AuthResponse> register(RegisterRequest body) async => AuthResponse.fromJson(
        readMap(await _client.post('/auth/register', body.toJson(), extra: sessionRequestExtra())),
      );

  Future<TokenStatusResponse> tokenStatus() async => TokenStatusResponse.fromJson(
        readMap(await _client.get('/auth/v1/token-status', extra: sessionRequestExtra())),
      );
}
