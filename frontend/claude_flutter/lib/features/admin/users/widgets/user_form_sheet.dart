import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/models/models.dart';
import '../../../../shared/forms/form_submit_cubit.dart';
import '../../../../shared/forms/validators.dart';
import '../../../../shared/widgets/form_sheet.dart';
import '../../../../shared/widgets/password_field.dart';
import '../../shared/admin_cubits.dart';

/// Abre el formulario de usuario. Resuelve `true` si se guardó.
Future<bool> showUserFormSheet(BuildContext context, {AdminUserResponse? user}) async {
  final cubit = context.read<AdminUsersCubit>();
  final saved = await showFormSheet<bool>(
    context,
    (_) => BlocProvider(
      create: (_) => FormSubmitCubit(),
      child: UserFormSheet(cubit: cubit, user: user),
    ),
  );
  return saved ?? false;
}

class UserFormSheet extends StatefulWidget {
  const UserFormSheet({super.key, required this.cubit, this.user});

  final AdminUsersCubit cubit;
  final AdminUserResponse? user;

  @override
  State<UserFormSheet> createState() => _UserFormSheetState();
}

class _UserFormSheetState extends State<UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name = TextEditingController(text: widget.user?.fullName ?? '');
  late final TextEditingController _email = TextEditingController(text: widget.user?.email ?? '');
  final TextEditingController _password = TextEditingController();
  late Role _role = widget.user?.role ?? Role.user;

  bool get _editing => widget.user != null;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  /// Obligatoria al crear; opcional al editar (si viene, mínimo 8).
  String? _validatePassword(String? value) {
    final v = value ?? '';
    if (v.isEmpty) {
      return _editing ? null : 'Ingresa una contraseña.';
    }
    return v.length < 8 ? 'Mínimo 8 caracteres.' : null;
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final request = AdminUserRequest(
      fullName: _name.text.trim(),
      email: _email.text.trim(),
      role: _role,
      password: _password.text.isEmpty ? null : _password.text,
    );
    final ok = await context.read<FormSubmitCubit>().submit(() => widget.cubit.save(widget.user?.id, request));
    if (ok && mounted) {
      _password.clear();
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormSheet(
      title: _editing ? 'Editar usuario' : 'Nuevo usuario',
      formKey: _formKey,
      onSave: _save,
      children: [
        TextFormField(
          controller: _name,
          textCapitalization: TextCapitalization.words,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: Validators.compose([Validators.required('Ingresa el nombre.'), Validators.maxLength(120)]),
          decoration: const InputDecoration(labelText: 'Nombre completo'),
        ),
        TextFormField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: Validators.compose([Validators.required('Ingresa el correo.'), Validators.email()]),
          decoration: const InputDecoration(labelText: 'Correo'),
        ),
        DropdownButtonFormField<Role>(
          initialValue: _role,
          decoration: const InputDecoration(labelText: 'Rol'),
          items: const [
            DropdownMenuItem(value: Role.user, child: Text('Usuario')),
            DropdownMenuItem(value: Role.admin, child: Text('Administrador')),
          ],
          onChanged: (v) => setState(() => _role = v ?? Role.user),
        ),
        PasswordField(
          controller: _password,
          newPassword: true,
          label: _editing ? 'Nueva contraseña (opcional)' : 'Contraseña',
          hint: _editing ? 'Déjala vacía para mantener la actual. Mínimo 8 caracteres.' : 'Mínimo 8 caracteres.',
          validator: _validatePassword,
        ),
      ],
    );
  }
}
