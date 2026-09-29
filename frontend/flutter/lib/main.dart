import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

import 'app/controllers/auth_controller.dart';
import 'app/controllers/expense_controller.dart';
import 'app/core/constants/app_colors.dart';
import 'app/core/constants/app_strings.dart';
import 'app/core/network/api_client.dart';
import 'app/core/widgets/app_loading_view.dart';
import 'app/data/repositories/auth_repository.dart';
import 'app/data/repositories/expense_repository.dart';
import 'app/pages/auth_page.dart';
import 'app/pages/home_page.dart';

/// Inicializa dependencias globales y arranca la aplicación Flutter del MVP.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await GetStorage.init();

  Get.put(ApiClient(GetStorage()));
  Get.put(AuthRepository(Get.find()));
  Get.put(ExpenseRepository(Get.find()));
  final authController = Get.put(AuthController(Get.find(), Get.find()));
  Get.put(ExpenseController(Get.find(), Get.find()));
  await authController.restoreSession();

  runApp(const SnapGastoApp());
}

/// Configura tema, idioma y puerta de acceso de la aplicación.
class SnapGastoApp extends StatelessWidget {
  const SnapGastoApp({super.key});

  @override
  Widget build(BuildContext context) => GetMaterialApp(
    title: AppStrings.appName,
    debugShowCheckedModeBanner: false,
    locale: const Locale('es', 'CL'),
    supportedLocales: const [Locale('es', 'CL')],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    theme: ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
      scaffoldBackgroundColor: AppColors.surface,
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
    ),
    home: const _AuthGate(),
  );
}

class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    return Obx(() {
      if (auth.isLoading.value && !auth.isAuthenticated) {
        return const Scaffold(body: AppLoadingView());
      }
      return auth.isAuthenticated ? const HomePage() : const AuthPage();
    });
  }
}
