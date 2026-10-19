import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../forms/form_submit_cubit.dart';
import 'server_error_banner.dart';

/// Abre un formulario como hoja inferior a pantalla completa (equivalente a los modales de Angular).
Future<T?> showFormSheet<T>(BuildContext context, WidgetBuilder builder) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: builder,
  );
}

/// Estructura común de los formularios en hoja: título, error del servidor,
/// campos con scroll y botones Cancelar / Guardar.
/// Debe estar bajo un `BlocProvider<FormSubmitCubit>`.
class FormSheet extends StatelessWidget {
  const FormSheet({
    super.key,
    required this.title,
    required this.formKey,
    required this.onSave,
    required this.children,
    this.saveLabel = 'Guardar',
  });

  final String title;
  final GlobalKey<FormState> formKey;
  final VoidCallback onSave;
  final List<Widget> children;
  final String saveLabel;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: BlocBuilder<FormSubmitCubit, FormSubmitState>(
        builder: (context, state) => Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 8, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Cerrar',
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (state.serverError != null) ...[
                        ServerErrorBanner(message: state.serverError!),
                        const SizedBox(height: 16),
                      ],
                      ..._spaced(children),
                    ],
                  ),
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Cancelar'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: state.submitting ? null : onSave,
                        child: state.submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Text(saveLabel),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static List<Widget> _spaced(List<Widget> children) => [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) const SizedBox(height: 16),
          children[i],
        ],
      ];
}
