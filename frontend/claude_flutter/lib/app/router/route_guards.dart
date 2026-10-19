import '../../core/session/session_cubit.dart';
import 'app_routes.dart';

/// Lógica de guards (authGuard, adminGuard, guestGuard) como función pura.
/// Devuelve la ruta a la que redirigir o null para permitir la navegación.
String? resolveRedirect({required SessionState session, required Uri uri}) {
  final path = uri.path;
  final isGuestRoute = path == AppRoutes.login || path == AppRoutes.register;

  if (!session.isAuthenticated) {
    if (isGuestRoute) {
      return null;
    }
    // authGuard: a /login conservando la URL solicitada.
    final target = uri.toString();
    final keepReturn = target != '/' && target != AppRoutes.home;
    return Uri(
      path: AppRoutes.login,
      queryParameters: keepReturn ? {'returnUrl': target} : null,
    ).toString();
  }

  if (isGuestRoute) {
    // guestGuard: con sesión se sale del login (respetando returnUrl tras iniciar sesión).
    final returnUrl = uri.queryParameters['returnUrl'];
    final safe = returnUrl != null && returnUrl.startsWith('/') && !returnUrl.startsWith('//');
    return safe ? returnUrl : AppRoutes.home;
  }

  // adminGuard: un USER autenticado vuelve a su inicio.
  if ((path == AppRoutes.admin || path.startsWith('${AppRoutes.admin}/')) && !session.isAdmin) {
    return AppRoutes.home;
  }
  return null;
}
