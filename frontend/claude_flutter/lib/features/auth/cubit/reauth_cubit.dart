import '../../../core/data/auth_repository.dart';
import '../../../shared/forms/form_submit_cubit.dart';

/// Diálogo de sesión expirada: solo pide la contraseña; el correo sale de la sesión.
class ReauthCubit extends FormSubmitCubit {
  ReauthCubit(this._auth);

  final AuthRepository _auth;

  Future<bool> reauthenticate(String password) => submit(() => _auth.reauthenticate(password));
}
