import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/auth_repository.dart';
import '../../../core/session/session_cubit.dart';
import '../../../shared/forms/form_submit_cubit.dart';
import '../../../shared/forms/validators.dart';
import '../../../shared/widgets/password_field.dart';
import '../../../shared/widgets/server_error_banner.dart';
import '../cubit/reauth_cubit.dart';

/// Abre el diálogo de sesión expirada sobre el Navigator raíz.
/// Resuelve `true` al reautenticar o `false` si el usuario cierra sesión.
Future<bool> showReauthDialog(GlobalKey<NavigatorState> navigatorKey) async {
  final context = navigatorKey.currentContext;
  if (context == null) {
    return false;
  }
  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (_) => BlocProvider(
      create: (ctx) => ReauthCubit(ctx.read<AuthRepository>()),
      child: const ReauthDialog(),
    ),
  );
  return result ?? false;
}

/// Diálogo de sesión expirada (HTTP 419). Pide solo la contraseña.
class ReauthDialog extends StatefulWidget {
  const ReauthDialog({super.key});

  @override
  State<ReauthDialog> createState() => _ReauthDialogState();
}

class _ReauthDialogState extends State<ReauthDialog> {
  final _formKey = GlobalKey<FormState>();
  final _password = TextEditingController();

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final ok = await context.read<ReauthCubit>().reauthenticate(_password.text);
    if (ok && mounted) {
      _password.clear();
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = context.read<SessionCubit>().state.user?.email ?? '';
    return PopScope(
      canPop: false,
      child: BlocBuilder<ReauthCubit, FormSubmitState>(
        builder: (context, state) => AlertDialog(
          title: const Text('Tu sesión expiró'),
          content: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text.rich(
                  TextSpan(
                    children: [
                      const TextSpan(text: 'Por seguridad, vuelve a ingresar la contraseña de '),
                      TextSpan(text: email, style: const TextStyle(fontWeight: FontWeight.bold)),
                      const TextSpan(text: ' para continuar donde estabas.'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (state.serverError != null) ...[
                  ServerErrorBanner(message: state.serverError!),
                  const SizedBox(height: 12),
                ],
                PasswordField(
                  controller: _password,
                  autofocus: true,
                  validator: Validators.required('Ingresa tu contraseña.'),
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submit(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: state.submitting ? null : () => Navigator.of(context).pop(false),
              child: const Text('Cerrar sesión'),
            ),
            FilledButton(
              onPressed: state.submitting ? null : _submit,
              child: state.submitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Continuar'),
            ),
          ],
        ),
      ),
    );
  }
}
