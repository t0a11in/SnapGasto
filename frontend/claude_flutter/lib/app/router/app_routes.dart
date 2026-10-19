/// Rutas de la app (mismas URLs que Angular).
abstract final class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String incomes = '/incomes';
  static const String expenses = '/expenses';
  static const String admin = '/admin';
  static const String adminUsers = '/admin/users';
  static const String adminCategories = '/admin/categories';
  static const String adminExpenses = '/admin/expenses';
  static const String adminNotifications = '/admin/notifications';

  static const String home = incomes;
}
