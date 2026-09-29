/// Centraliza la configuración que puede variar entre entornos de ejecución.
abstract final class AppConfig {
  /// Para Android Emulator usar: --dart-define=API_BASE_URL=http://10.0.2.2:8080/api
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080/api',
  );
}
