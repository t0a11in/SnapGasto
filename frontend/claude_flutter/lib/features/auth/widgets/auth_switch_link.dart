import 'package:flutter/material.dart';

/// "¿No tienes cuenta? Regístrate" / "¿Ya tienes cuenta? Inicia sesión".
class AuthSwitchLink extends StatelessWidget {
  const AuthSwitchLink({super.key, required this.question, required this.action, required this.onTap});

  final String question;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(question),
        TextButton(onPressed: onTap, child: Text(action)),
      ],
    );
  }
}
