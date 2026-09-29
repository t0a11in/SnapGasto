import 'package:flutter_test/flutter_test.dart';
import 'package:snap_gasto/app/core/constants/app_strings.dart';

/// Comprueba que las constantes principales de presentación estén disponibles.
void main() {
  test('la aplicación tiene un nombre visible', () {
    expect(AppStrings.appName, isNotEmpty);
  });
}
