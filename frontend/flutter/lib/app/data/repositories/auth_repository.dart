import '../../core/network/api_client.dart';
import '../models/auth_user.dart';

/// Aísla las llamadas de autenticación para que la UI no conozca HTTP.
class AuthRepository {
  const AuthRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data!;
    await _apiClient.saveToken(data['accessToken'] as String);
    return AuthUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<AuthUser> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/auth/register',
      data: {'fullName': fullName, 'email': email, 'password': password},
    );
    final data = response.data!;
    await _apiClient.saveToken(data['accessToken'] as String);
    return AuthUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<AuthUser> me() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/users/me',
    );
    return AuthUser.fromJson(response.data!);
  }

  Future<void> logout() => _apiClient.clearToken();
}
