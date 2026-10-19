import 'package:flutter/material.dart';

import '../forms/validators.dart';

/// Descripción opcional (máx. 500 caracteres).
class DescriptionField extends StatelessWidget {
  const DescriptionField({super.key, required this.controller, this.maxLength = 500});

  final TextEditingController controller;
  final int maxLength;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      minLines: 2,
      maxLines: 4,
      textCapitalization: TextCapitalization.sentences,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      validator: Validators.maxLength(maxLength),
      decoration: const InputDecoration(labelText: 'Descripción (opcional)', alignLabelWithHint: true),
    );
  }
}
