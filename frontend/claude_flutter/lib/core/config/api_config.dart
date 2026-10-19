import 'package:flutter/foundation.dart';

/// Configuración de la API Java.
///
/// Se puede sobrescribir al compilar:
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8080/api`
abstract final class ApiConfig {
  static const String _fromEnvironment = String.fromEnvironment('API_BASE_URL');

  /// URL base. En el emulador de Android `localhost` del PC es `10.0.2.2`.
  static String get baseUrl {
    if (_fromEnvironment.isNotEmpty) {
      return _fromEnvironment;
    }
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8080/api';
    }
    return 'http://localhost:8080/api';
  }
}

/// Claves de almacenamiento local. Nunca se persiste la contraseña.
abstract final class StorageKeys {
  static const String session = 'snapgasto.session';
  static const String rememberedEmail = 'snapgasto.rememberedEmail';
}
