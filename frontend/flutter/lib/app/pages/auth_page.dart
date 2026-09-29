import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_strings.dart';

/// Ofrece en una sola pantalla los flujos de inicio de sesión y registro del MVP.
class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmationController = TextEditingController();
  bool _isRegistering = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmationController.dispose();
    super.dispose();
  }

  Future<void> _submit(AuthController controller) async {
    if (!_formKey.currentState!.validate()) return;
    if (_isRegistering) {
      await controller.register(
        fullName: _fullNameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      return;
    }
    await controller.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Icon(
                          Icons.account_balance_wallet_rounded,
                          color: AppColors.primary,
                          size: 56,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          AppStrings.appName,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 28),
                        if (_isRegistering) ...[
                          TextFormField(
                            controller: _fullNameController,
                            textCapitalization: TextCapitalization.words,
                            decoration: const InputDecoration(
                              labelText: AppStrings.fullName,
                            ),
                            validator: _requiredValidator,
                          ),
                          const SizedBox(height: 16),
                        ],
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          autocorrect: false,
                          decoration: const InputDecoration(
                            labelText: AppStrings.email,
                          ),
                          validator: _emailValidator,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: AppStrings.password,
                          ),
                          validator: _passwordValidator,
                        ),
                        if (_isRegistering) ...[
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _confirmationController,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: AppStrings.passwordConfirmation,
                            ),
                            validator: (value) =>
                                value != _passwordController.text
                                ? AppStrings.passwordsDoNotMatch
                                : null,
                          ),
                        ],
                        const SizedBox(height: 20),
                        Obx(
                          () => auth.errorMessage.isEmpty
                              ? const SizedBox.shrink()
                              : Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Text(
                                    auth.errorMessage.value,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: AppColors.danger,
                                    ),
                                  ),
                                ),
                        ),
                        Obx(
                          () => FilledButton(
                            onPressed: auth.isLoading.value
                                ? null
                                : () => _submit(auth),
                            child: auth.isLoading.value
                                ? const SizedBox.square(
                                    dimension: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Text(
                                    _isRegistering
                                        ? AppStrings.signUp
                                        : AppStrings.signIn,
                                  ),
                          ),
                        ),
                        TextButton(
                          onPressed: () => setState(() {
                            _isRegistering = !_isRegistering;
                            auth.errorMessage.value = '';
                          }),
                          child: Text(
                            _isRegistering
                                ? AppStrings.existingAccount
                                : AppStrings.createAccount,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String? _requiredValidator(String? value) =>
      (value == null || value.trim().isEmpty) ? AppStrings.requiredField : null;

  String? _emailValidator(String? value) {
    if (value == null || !GetUtils.isEmail(value.trim())) {
      return AppStrings.invalidEmail;
    }
    return null;
  }

  String? _passwordValidator(String? value) =>
      (value == null || value.length < 8) ? AppStrings.invalidPassword : null;
}
