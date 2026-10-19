import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../core/utils/text_utils.dart';
import '../forms/validators.dart';
import 'pill_badge.dart';

/// Campo de categoría con autocompletado sobre las categorías existentes.
/// Si el texto no coincide con ninguna, se acepta como categoría nueva.
class CategoryAutocompleteField extends StatefulWidget {
  const CategoryAutocompleteField({
    super.key,
    required this.controller,
    required this.options,
    this.label = 'Categoría',
    this.hint = 'Escribe o elige una categoría',
    this.requiredMessage = 'Escribe o elige una categoría.',
  });

  final TextEditingController controller;
  final List<String> options;
  final String label;
  final String hint;
  final String requiredMessage;

  @override
  State<CategoryAutocompleteField> createState() => _CategoryAutocompleteFieldState();
}

class _CategoryAutocompleteFieldState extends State<CategoryAutocompleteField> {
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChanged);
  }

  @override
  void didUpdateWidget(covariant CategoryAutocompleteField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_onChanged);
      widget.controller.addListener(_onChanged);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    _focusNode.dispose();
    super.dispose();
  }

  void _onChanged() => setState(() {});

  String get _value => widget.controller.text.trim();

  /// true si el texto escrito no existe todavía (comparación sin distinguir mayúsculas ni tildes).
  bool get _isNew {
    final v = foldText(_value);
    return v.isNotEmpty && !widget.options.any((o) => foldText(o) == v);
  }

  Iterable<String> _filter(TextEditingValue value) {
    final query = foldText(value.text.trim());
    if (query.isEmpty) {
      return widget.options;
    }
    return widget.options.where((o) => foldText(o).contains(query));
  }

  @override
  Widget build(BuildContext context) {
    return RawAutocomplete<String>(
      textEditingController: widget.controller,
      focusNode: _focusNode,
      optionsBuilder: _filter,
      onSelected: (selection) => widget.controller.text = selection,
      fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) => TextFormField(
        controller: controller,
        focusNode: focusNode,
        textCapitalization: TextCapitalization.sentences,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        validator: Validators.compose([
          Validators.required(widget.requiredMessage),
          Validators.maxLength(80),
        ]),
        onFieldSubmitted: (_) => onFieldSubmitted(),
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          helperText: _isNew ? '"$_value" no existe todavía: se guardará como categoría nueva.' : null,
          helperMaxLines: 2,
          suffixIcon: _isNew
              ? const Padding(
                  padding: EdgeInsets.only(right: 10),
                  child: PillBadge(label: 'Nueva', color: AppColors.info, background: AppColors.infoSubtle),
                )
              : null,
          suffixIconConstraints: const BoxConstraints(minHeight: 24, minWidth: 24),
        ),
      ),
      optionsViewBuilder: (context, onSelected, options) => Align(
        alignment: Alignment.topLeft,
        child: Material(
          elevation: 4,
          borderRadius: BorderRadius.circular(10),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 240, maxWidth: 360),
            child: ListView(
              padding: EdgeInsets.zero,
              shrinkWrap: true,
              children: [
                for (final option in options)
                  ListTile(dense: true, title: Text(option), onTap: () => onSelected(option)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
