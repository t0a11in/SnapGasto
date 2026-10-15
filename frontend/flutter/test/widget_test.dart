import 'package:flutter_test/flutter_test.dart';
import 'package:snap_gasto/app/config/app_config.dart';
import 'package:snap_gasto/app/config/backend_target.dart';
import 'package:snap_gasto/app/core/constants/app_strings.dart';

/// Comprueba que las constantes principales de presentación estén disponibles.
void main() {
  test('la aplicación tiene un nombre visible', () {
    expect(AppStrings.appName, isNotEmpty);
  });

  test('cada backend usa su puerto de desarrollo esperado', () {
    expect(BackendTarget.java.port, 8080);
    expect(BackendTarget.dotNet.port, 5000);
    expect(BackendTarget.python.port, 8000);
    expect(BackendTarget.node.port, 3000);
    expect(AppConfig.apiBaseUrlForPort(3000), contains(':3000/'));
  });
}
