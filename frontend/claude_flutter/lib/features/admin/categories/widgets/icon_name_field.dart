import 'package:flutter/material.dart';

import '../../../../shared/forms/validators.dart';
import '../../../../shared/widgets/category_icon.dart';

/// Nombre de ícono Feather con sugerencias y vista previa.
class IconNameField extends StatefulWidget {
  const IconNameField({super.key, required this.controller});

  final TextEditingController controller;

  @override
  State<IconNameField> createState() => _IconNameFieldState();
}

class _IconNameFieldState extends State<IconNameField> {
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    _focusNode.dispose();
    super.dispose();
  }

  void _onChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final preview = iconForFeatherName(widget.controller.text.trim());
    return RawAutocomplete<String>(
      textEditingController: widget.controller,
      focusNode: _focusNode,
      optionsBuilder: (value) {
        final q = value.text.trim().toLowerCase();
        return q.isEmpty ? featherIconNames : featherIconNames.where((n) => n.contains(q));
      },
      fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) => TextFormField(
        controller: controller,
        focusNode: focusNode,
        autocorrect: false,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        validator: Validators.maxLength(80),
        onFieldSubmitted: (_) => onFieldSubmitted(),
        decoration: InputDecoration(
          labelText: 'Ícono (opcional, nombre Feather)',
          hintText: 'shopping-cart',
          prefixIcon: Icon(preview ?? Icons.help_outline),
        ),
      ),
      optionsViewBuilder: (context, onSelected, options) => Align(
        alignment: Alignment.topLeft,
        child: Material(
          elevation: 4,
          borderRadius: BorderRadius.circular(10),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 240, maxWidth: 320),
            child: ListView(
              padding: EdgeInsets.zero,
              shrinkWrap: true,
              children: [
                for (final name in options)
                  ListTile(
                    dense: true,
                    leading: Icon(iconForFeatherName(name)),
                    title: Text(name),
                    onTap: () => onSelected(name),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
