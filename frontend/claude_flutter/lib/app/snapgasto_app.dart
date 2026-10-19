import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'app_dependencies.dart';
import 'theme/app_theme.dart';

/// Raíz de la app: expone repositorios/servicios y la sesión al árbol de widgets.
class SnapGastoApp extends StatelessWidget {
  const SnapGastoApp({super.key, required this.deps});

  final AppDependencies deps;

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: deps.authRepository),
        RepositoryProvider.value(value: deps.incomesApi),
        RepositoryProvider.value(value: deps.expensesApi),
        RepositoryProvider.value(value: deps.categoriesApi),
        RepositoryProvider.value(value: deps.adminUsersApi),
        RepositoryProvider.value(value: deps.adminCategoriesApi),
        RepositoryProvider.value(value: deps.adminExpensesApi),
        RepositoryProvider.value(value: deps.adminNotificationsApi),
        RepositoryProvider.value(value: deps.toast),
        RepositoryProvider.value(value: deps.topAlert),
      ],
      child: BlocProvider.value(
        value: deps.session,
        child: MaterialApp.router(
          title: 'SnapGasto',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          routerConfig: deps.router,
          scaffoldMessengerKey: deps.messengerKey,
          locale: const Locale('es', 'CL'),
          supportedLocales: const [Locale('es', 'CL'), Locale('es')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
        ),
      ),
    );
  }
}
