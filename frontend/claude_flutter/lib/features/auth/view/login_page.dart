import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_routes.dart';
import '../../../core/data/auth_repository.dart';
import '../cubit/login_cubit.dart';
import '../widgets/auth_layout.dart';
import '../widgets/auth_switch_link.dart';
import '../widgets/login_form.dart';

/// Inicio de sesión. Tras autenticarse, el router lleva a `returnUrl` o al inicio.
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => LoginCubit(context.read<AuthRepository>()),
      child: AuthLayout(
        title: 'Inicia sesión',
        subtitle: 'Controla tus ingresos y gastos del mes.',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const LoginForm(),
            const SizedBox(height: 16),
            AuthSwitchLink(
              question: '¿No tienes cuenta?',
              action: 'Regístrate',
              onTap: () => context.go(AppRoutes.register),
            ),
          ],
        ),
      ),
    );
  }
}
