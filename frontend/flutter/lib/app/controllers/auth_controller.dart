import 'package:get/get.dart';

import '../core/network/api_client.dart';
import '../data/models/auth_user.dart';
import '../data/repositories/auth_repository.dart';

/// Mantiene el estado de sesión y coordina las operaciones de autenticación.
class AuthController extends GetxController {
  AuthController(this._repository, this._apiClient);

  final AuthRepository _repository;
  final ApiClient _apiClient;
  final user = Rxn<AuthUser>();
  final isLoading = false.obs;
  final errorMessage = ''.obs;

  bool get isAuthenticated => user.value != null;

  Future<void> restoreSession() async {
    if (!_apiClient.hasToken) return;
    isLoading.value = true;
    try {
      user.value = await _repository.me();
    } catch (_) {
      await _repository.logout();
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> login({required String email, required String password}) async {
    return _run(() => _repository.login(email: email, password: password));
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
  }) {
    return _run(
      () => _repository.register(
        fullName: fullName,
        email: email,
        password: password,
      ),
    );
  }

  Future<bool> _run(Future<AuthUser> Function() action) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      user.value = await action();
      return true;
    } catch (error) {
      errorMessage.value = _apiClient.errorMessage(error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    user.value = null;
  }
}
