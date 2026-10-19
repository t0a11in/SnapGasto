import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/auth_repository.dart';
import '../../../core/http/error_utils.dart';
import '../../../core/models/models.dart';

enum LoginStatus { idle, submitting, success, failure }

class LoginState extends Equatable {
  const LoginState({this.status = LoginStatus.idle, this.error});

  final LoginStatus status;
  final AppHttpError? error;

  bool get submitting => status == LoginStatus.submitting;

  /// 400/401/403/404 → "Correo o contraseña incorrectos".
  bool get badCredentials => error != null && const [400, 401, 403, 404].contains(error!.status);

  @override
  List<Object?> get props => [status, error?.status, error?.message];
}

class LoginCubit extends Cubit<LoginState> {
  LoginCubit(this._auth) : super(const LoginState());

  final AuthRepository _auth;

  String? get rememberedEmail => _auth.rememberedEmail();

  Future<void> submit({required String email, required String password, required bool rememberEmail}) async {
    if (state.submitting) {
      return;
    }
    emit(const LoginState(status: LoginStatus.submitting));
    try {
      await _auth.login(AuthRequest(email: email.trim(), password: password), rememberEmail: rememberEmail);
      if (!isClosed) {
        emit(const LoginState(status: LoginStatus.success));
      }
    } on Object catch (e) {
      if (!isClosed) {
        emit(LoginState(status: LoginStatus.failure, error: toAppHttpError(e)));
      }
    }
  }
}
