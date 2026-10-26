import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/feedback/top_alert_service.dart';
import '../../../shared/widgets/password_field.dart';
import '../auth_validators.dart';
import '../cubit/login_cubit.dart';
import 'submit_button.dart';

/// Formulario de inicio de sesión. Debe estar bajo un `BlocProvider<LoginCubit>`.
class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _email;
  final TextEditingController _password = TextEditingController(text:'Cuatico1234*');
  late bool _rememberEmail;

  @override
  void initState() {
    super.initState();
    final remembered = context.read<LoginCubit>().rememberedEmail;
    _email = TextEditingController(text: remembered ?? 'test@uno.cl');
    _rememberEmail = remembered != null;
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    FocusScope.of(context).unfocus();
    context.read<LoginCubit>().submit(email: _email.text, password: _password.text, rememberEmail: _rememberEmail);
  }

  void _onState(BuildContext context, LoginState state) {
    final alerts = context.read<TopAlertService>();
    if (state.status == LoginStatus.success) {
      // La contraseña no se conserva en memoria más allá del envío.
      _password.clear();
      alerts.dismiss();
    } else if (state.status == LoginStatus.failure) {
      if (state.badCredentials) {
        alerts.error('Correo o contraseña incorrectos');
      } else {
        alerts.error('No fue posible iniciar sesión', text: state.error?.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<LoginCubit, LoginState>(
      listenWhen: (prev, curr) => prev.status != curr.status,
      listener: _onState,
      builder: (context, state) => Form(
        key: _formKey,
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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
                validator: AuthValidators.loginPassword,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 8),
              CheckboxListTile(
                value: _rememberEmail,
                onChanged: (v) => setState(() => _rememberEmail = v ?? false),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: const Text('Recordar mi correo'),
              ),
              const SizedBox(height: 16),
              SubmitButton(label: 'Ingresar', submitting: state.submitting, onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
