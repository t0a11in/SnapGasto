import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/api_config.dart';
import '../core/data/admin_crud_api.dart';
import '../core/data/auth_api.dart';
import '../core/data/auth_repository.dart';
import '../core/data/categories_api.dart';
import '../core/data/expenses_api.dart';
import '../core/data/incomes_api.dart';
import '../core/http/api_client.dart';
import '../core/session/reauth_coordinator.dart';
import '../core/session/session_cubit.dart';
import '../core/storage/key_value_store.dart';
import '../features/auth/widgets/reauth_dialog.dart';
import '../shared/feedback/toast_service.dart';
import '../shared/feedback/top_alert_service.dart';
import 'router/app_router.dart';

/// Contenedor de dependencias (equivalente a los providers de app.config.ts).
class AppDependencies {
  AppDependencies._({
    required this.navigatorKey,
    required this.messengerKey,
    required this.session,
    required this.reauth,
    required this.apiClient,
    required this.authRepository,
    required this.incomesApi,
    required this.expensesApi,
    required this.categoriesApi,
    required this.adminUsersApi,
    required this.adminCategoriesApi,
    required this.adminExpensesApi,
    required this.adminNotificationsApi,
    required this.toast,
    required this.topAlert,
    required this.router,
  });

  final GlobalKey<NavigatorState> navigatorKey;
  final GlobalKey<ScaffoldMessengerState> messengerKey;
  final SessionCubit session;
  final ReauthCoordinator reauth;
  final ApiClient apiClient;
  final AuthRepository authRepository;
  final IncomesApi incomesApi;
  final ExpensesApi expensesApi;
  final CategoriesApi categoriesApi;
  final AdminUsersApi adminUsersApi;
  final AdminCategoriesApi adminCategoriesApi;
  final AdminExpensesApi adminExpensesApi;
  final AdminNotificationsApi adminNotificationsApi;
  final ToastService toast;
  final TopAlertService topAlert;
  final GoRouter router;

  static Future<AppDependencies> create({KeyValueStore? store, String? baseUrl}) async {
    final kv = store ?? SharedPrefsStore(await SharedPreferences.getInstance());
    final navigatorKey = GlobalKey<NavigatorState>();
    final messengerKey = GlobalKey<ScaffoldMessengerState>();

    final session = SessionCubit(kv);
    final reauth = ReauthCoordinator(session: session)
      ..prompt = () => showReauthDialog(navigatorKey);

    final apiClient = ApiClient.create(
      baseUrl: baseUrl ?? ApiConfig.baseUrl,
      tokenProvider: () => session.token,
      reauthenticate: reauth.reauthenticate,
      onUnauthorized: session.clear,
    );

    final authRepository = AuthRepository(api: AuthApi(apiClient), session: session, store: kv);

    return AppDependencies._(
      navigatorKey: navigatorKey,
      messengerKey: messengerKey,
      session: session,
      reauth: reauth,
      apiClient: apiClient,
      authRepository: authRepository,
      incomesApi: IncomesApi(apiClient),
      expensesApi: ExpensesApi(apiClient),
      categoriesApi: CategoriesApi(apiClient),
      adminUsersApi: AdminUsersApi(apiClient),
      adminCategoriesApi: AdminCategoriesApi(apiClient),
      adminExpensesApi: AdminExpensesApi(apiClient),
      adminNotificationsApi: AdminNotificationsApi(apiClient),
      toast: ToastService(messengerKey),
      topAlert: TopAlertService(messengerKey),
      router: createAppRouter(session: session, navigatorKey: navigatorKey),
    );
  }
}
