/// Código no estándar que usa la API para indicar sesión expirada.
const int httpSessionExpired = 419;

/// Error HTTP normalizado que recibe la capa de presentación.
///
/// `status` 0 = sin conexión; -1 = error no HTTP.
class AppHttpError implements Exception {
  const AppHttpError(this.status, this.message, [this.url]);

  final int status;
  final String message;
  final String? url;

  @override
  String toString() => message;
}
