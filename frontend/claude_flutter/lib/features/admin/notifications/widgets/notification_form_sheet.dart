import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/models/models.dart';
import '../../../../core/utils/text_utils.dart';
import '../../../../shared/forms/form_submit_cubit.dart';
import '../../../../shared/forms/validators.dart';
import '../../../../shared/widgets/form_sheet.dart';
import '../../shared/admin_cubits.dart';
import '../../shared/user_dropdown.dart';

/// Abre el formulario de notificación. Resuelve `true` si se guardó.
Future<bool> showNotificationFormSheet(
  BuildContext context, {
  NotificationResponse? notification,
  required List<AdminUserResponse> users,
}) async {
  final cubit = context.read<AdminNotificationsCubit>();
  final saved = await showFormSheet<bool>(
    context,
    (_) => BlocProvider(
      create: (_) => FormSubmitCubit(),
      child: NotificationFormSheet(cubit: cubit, notification: notification, users: users),
    ),
  );
  return saved ?? false;
}

class NotificationFormSheet extends StatefulWidget {
  const NotificationFormSheet({super.key, required this.cubit, required this.users, this.notification});

  final AdminNotificationsCubit cubit;
  final NotificationResponse? notification;
  final List<AdminUserResponse> users;

  @override
  State<NotificationFormSheet> createState() => _NotificationFormSheetState();
}

class _NotificationFormSheetState extends State<NotificationFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _title = TextEditingController(text: widget.notification?.title ?? '');
  late final TextEditingController _body = TextEditingController(text: widget.notification?.body ?? '');
  late String? _userId = widget.notification?.userId;
  late bool _read = widget.notification?.read ?? false;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final request = NotificationRequest(
      userId: _userId!,
      title: _title.text.trim(),
      body: _body.text.trim(),
      read: _read,
    );
    final ok = await context.read<FormSubmitCubit>().submit(
          () => widget.cubit.save(widget.notification?.id, request),
        );
    if (ok && mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final users = [...widget.users]..sort((a, b) => compareEs(a.fullName, b.fullName));
    return FormSheet(
      title: widget.notification == null ? 'Nueva notificación' : 'Editar notificación',
      formKey: _formKey,
      onSave: _save,
      children: [
        UserDropdown(
          users: users,
          value: _userId,
          label: 'Destinatario',
          requiredMessage: 'Selecciona el destinatario.',
          onChanged: (v) => setState(() => _userId = v),
        ),
        TextFormField(
          controller: _title,
          textCapitalization: TextCapitalization.sentences,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: Validators.compose([Validators.required('Ingresa un título.'), Validators.maxLength(140)]),
          decoration: const InputDecoration(labelText: 'Título'),
        ),
        TextFormField(
          controller: _body,
          minLines: 4,
          maxLines: 8,
          maxLength: 1000,
          textCapitalization: TextCapitalization.sentences,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: Validators.compose([Validators.required('Ingresa el mensaje.'), Validators.maxLength(1000)]),
          decoration: const InputDecoration(labelText: 'Mensaje', alignLabelWithHint: true),
        ),
        SwitchListTile(
          value: _read,
          onChanged: (v) => setState(() => _read = v),
          contentPadding: EdgeInsets.zero,
          title: const Text('Marcar como leída'),
        ),
      ],
    );
  }
}
