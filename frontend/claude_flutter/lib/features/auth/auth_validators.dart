import '../../shared/forms/validators.dart';

const int passwordMin = 8;

/// Reglas alineadas con AuthRequest / RegisterRequest (Java).
abstract final class AuthValidators {
  static final FieldValidator loginEmail = Validators.compose([
    Validators.required('Ingresa tu correo.'),
    Validators.email(),
  ]);

  static final FieldValidator loginPassword = Validators.required('Ingresa tu contraseña.');

  static final FieldValidator fullName = Validators.compose([
    Validators.required('Ingresa tu nombre completo.'),
    Validators.maxLength(120),
  ]);

  static final FieldValidator registerPassword = Validators.compose([
    Validators.required('Ingresa una contraseña.'),
    Validators.minLength(passwordMin, 'Mínimo $passwordMin caracteres.'),
  ]);

  static FieldValidator confirmPassword(String Function() password) => (value) {
        if (value == null || value.isEmpty) {
          return 'Repite la contraseña.';
        }
        return value != password() ? 'Las contraseñas no coinciden.' : null;
      };
}
