import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persiste exclusivamente el token de sesión en el almacén cifrado del SO.
/// No almacena correo ni contraseña en el dispositivo.
class SecureSessionStorage {
  static const _tokenKey = 'snapgasto.session.access_token';

  final FlutterSecureStorage _storage;

  SecureSessionStorage({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> writeToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<void> deleteToken() => _storage.delete(key: _tokenKey);
}
