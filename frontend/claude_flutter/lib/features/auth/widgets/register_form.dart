import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/forms/form_submit_cubit.dart';
import '../../../shared/widgets/password_field.dart';
import '../../../shared/widgets/server_error_banner.dart';
import '../auth_validators.dart';
import '../cubit/register_cubit.dart';
import 'submit_button.dart';

/// Formulario de registro. Debe estar bajo un `BlocProvider<RegisterCubit>`.
class RegisterForm extends StatefulWidget {
  const RegisterForm({super.key});

  @override
  State<RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends State<RegisterForm> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    FocusScope.of(context).unfocus();
    final ok = await context.read<RegisterCubit>().register(
          fullName: _name.text,
          email: _email.text,
          password: _password.text,
        );
    if (ok && mounted) {
      _password.clear();
      _confirm.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RegisterCubit, FormSubmitState>(
      builder: (context, state) => Form(
        key: _formKey,
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (state.serverError != null) ...[
                ServerErrorBanner(message: state.serverError!),
                const SizedBox(height: 16),
              ],
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                autofillHints: const [AutofillHints.name],
                textInputAction: TextInputAction.next,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                validator: AuthValidators.fullName,
                decoration: const InputDecoration(labelText: 'Nombre completo'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.next,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                validator: AuthValidators.loginEmail,
                decoration: const InputDecoration(labelText: 'Correo electrónico'),
              ),
              const SizedBox(height: 16),
              PasswordField(
                controller: _password,
                newPassword: true,
                hint: 'Mínimo $passwordMin caracteres.',
                validator: AuthValidators.registerPassword,
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),
              PasswordField(
                controller: _confirm,
                label: 'Repite la contraseña',
                newPassword: true,
                validator: AuthValidators.confirmPassword(() => _password.text),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 24),
              SubmitButton(label: 'Crear cuenta', submitting: state.submitting, onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
