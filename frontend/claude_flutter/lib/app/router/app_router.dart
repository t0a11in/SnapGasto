import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/session/session_cubit.dart';
import '../../features/admin/categories/view/admin_categories_page.dart';
import '../../features/admin/expenses/view/admin_expenses_page.dart';
import '../../features/admin/notifications/view/admin_notifications_page.dart';
import '../../features/admin/users/view/admin_users_page.dart';
import '../../features/auth/view/login_page.dart';
import '../../features/auth/view/register_page.dart';
import '../../features/expenses/view/expenses_page.dart';
import '../../features/incomes/view/incomes_page.dart';
import '../../features/shell/app_shell.dart';
import 'app_routes.dart';
import 'go_router_refresh_stream.dart';
import 'route_guards.dart';

GoRouter createAppRouter({
  required SessionCubit session,
  required GlobalKey<NavigatorState> navigatorKey,
}) {
  NoTransitionPage<void> page(Widget child) => NoTransitionPage<void>(child: child);

  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: AppRoutes.home,
    refreshListenable: GoRouterRefreshStream(session.stream),
    redirect: (context, state) => resolveRedirect(session: session.state, uri: state.uri),
    onException: (context, state, router) => router.go(AppRoutes.home),
    routes: [
      GoRoute(path: AppRoutes.login, builder: (context, state) => const LoginPage()),
      GoRoute(path: AppRoutes.register, builder: (context, state) => const RegisterPage()),
      GoRoute(path: '/', redirect: (context, state) => AppRoutes.home),
      GoRoute(path: AppRoutes.admin, redirect: (context, state) => AppRoutes.adminUsers),
      ShellRoute(
        builder: (context, state, child) => AppShell(location: state.uri.path, child: child),
        routes: [
          GoRoute(path: AppRoutes.incomes, pageBuilder: (context, state) => page(const IncomesPage())),
          GoRoute(path: AppRoutes.expenses, pageBuilder: (context, state) => page(const ExpensesPage())),
          GoRoute(path: AppRoutes.adminUsers, pageBuilder: (context, state) => page(const AdminUsersPage())),
          GoRoute(
            path: AppRoutes.adminCategories,
            pageBuilder: (context, state) => page(const AdminCategoriesPage()),
          ),
          GoRoute(
            path: AppRoutes.adminExpenses,
            pageBuilder: (context, state) => page(const AdminExpensesPage()),
          ),
          GoRoute(
            path: AppRoutes.adminNotifications,
            pageBuilder: (context, state) => page(const AdminNotificationsPage()),
          ),
        ],
      ),
    ],
  );
}
