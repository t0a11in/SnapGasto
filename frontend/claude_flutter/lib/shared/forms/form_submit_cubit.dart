import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/http/error_utils.dart';

class FormSubmitState extends Equatable {
  const FormSubmitState({this.submitting = false, this.serverError});

  final bool submitting;
  final String? serverError;

  @override
  List<Object?> get props => [submitting, serverError];
}

/// Envío de un formulario de entidad: estado "enviando" y error del servidor.
/// La acción concreta (crear/actualizar) la entrega el formulario.
class FormSubmitCubit extends Cubit<FormSubmitState> {
  FormSubmitCubit() : super(const FormSubmitState());

  /// Ejecuta `action`; devuelve true si terminó sin error.
  Future<bool> submit(Future<void> Function() action) async {
    if (state.submitting) {
      return false;
    }
    emit(const FormSubmitState(submitting: true));
    try {
      await action();
      if (!isClosed) {
        emit(const FormSubmitState());
      }
      return true;
    } on Object catch (e) {
      if (!isClosed) {
        emit(FormSubmitState(serverError: errorMessage(e)));
      }
      return false;
    }
  }
}
