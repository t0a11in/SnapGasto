import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_routes.dart';
import '../../../core/data/auth_repository.dart';
import '../cubit/register_cubit.dart';
import '../widgets/auth_layout.dart';
import '../widgets/auth_switch_link.dart';
import '../widgets/register_form.dart';

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => RegisterCubit(context.read<AuthRepository>()),
      child: AuthLayout(
        title: 'Crea tu cuenta',
        subtitle: 'Empieza a registrar tus movimientos en segundos.',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const RegisterForm(),
            const SizedBox(height: 16),
            AuthSwitchLink(
              question: '¿Ya tienes cuenta?',
              action: 'Inicia sesión',
              onTap: () => context.go(AppRoutes.login),
            ),
          ],
        ),
      ),
    );
  }
}
