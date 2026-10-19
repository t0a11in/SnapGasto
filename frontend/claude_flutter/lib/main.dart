import 'package:flutter/material.dart';

import 'app/app_dependencies.dart';
import 'app/snapgasto_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final deps = await AppDependencies.create();
  // Valida la sesión persistida antes de resolver la primera ruta (provideAppInitializer en Angular).
  await deps.authRepository.validateStoredSession();
  runApp(SnapGastoApp(deps: deps));
}
