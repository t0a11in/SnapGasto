import '../../../core/data/auth_repository.dart';
import '../../../core/models/models.dart';
import '../../../shared/forms/form_submit_cubit.dart';

/// Registro: el router lleva al inicio cuando la sesión queda creada.
class RegisterCubit extends FormSubmitCubit {
  RegisterCubit(this._auth);

  final AuthRepository _auth;

  Future<bool> register({required String fullName, required String email, required String password}) => submit(
        () => _auth.register(RegisterRequest(fullName: fullName.trim(), email: email.trim(), password: password)),
      );
}
