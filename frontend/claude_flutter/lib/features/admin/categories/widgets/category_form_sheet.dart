import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/models/models.dart';
import '../../../../core/utils/text_utils.dart';
import '../../../../shared/forms/form_submit_cubit.dart';
import '../../../../shared/forms/validators.dart';
import '../../../../shared/widgets/category_icon.dart';
import '../../../../shared/widgets/form_sheet.dart';
import '../../shared/admin_cubits.dart';
import 'color_swatch_picker.dart';
import 'icon_name_field.dart';

final RegExp _hexOrEmpty = RegExp(r'^$|^#[0-9A-Fa-f]{6}$');

/// Abre el formulario de categoría. Resuelve `true` si se guardó.
Future<bool> showCategoryFormSheet(BuildContext context, {CategoryResponse? category}) async {
  final cubit = context.read<AdminCategoriesCubit>();
  final saved = await showFormSheet<bool>(
    context,
    (_) => BlocProvider(
      create: (_) => FormSubmitCubit(),
      child: CategoryFormSheet(cubit: cubit, category: category),
    ),
  );
  return saved ?? false;
}

class CategoryFormSheet extends StatefulWidget {
  const CategoryFormSheet({super.key, required this.cubit, this.category});

  final AdminCategoriesCubit cubit;
  final CategoryResponse? category;

  @override
  State<CategoryFormSheet> createState() => _CategoryFormSheetState();
}

class _CategoryFormSheetState extends State<CategoryFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name = TextEditingController(text: widget.category?.name ?? '');
  late final TextEditingController _icon = TextEditingController(text: widget.category?.icon ?? '');
  late final TextEditingController _color = TextEditingController(text: widget.category?.colorHex ?? '');

  @override
  void initState() {
    super.initState();
    _icon.addListener(_refresh);
    _color.addListener(_refresh);
  }

  @override
  void dispose() {
    _name.dispose();
    _icon.dispose();
    _color.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {});

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final request = CategoryRequest(
      name: _name.text.trim(),
      icon: optionalText(_icon.text),
      colorHex: optionalText(_color.text)?.toUpperCase(),
    );
    final ok = await context.read<FormSubmitCubit>().submit(() => widget.cubit.save(widget.category?.id, request));
    if (ok && mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormSheet(
      title: widget.category == null ? 'Nueva categoría' : 'Editar categoría',
      formKey: _formKey,
      onSave: _save,
      children: [
        Row(
          children: [
            CategoryChip(icon: _icon.text.trim(), colorHex: _color.text.trim(), size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.sentences,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                validator: Validators.compose([Validators.required('Ingresa el nombre.'), Validators.maxLength(80)]),
                decoration: const InputDecoration(labelText: 'Nombre'),
              ),
            ),
          ],
        ),
        IconNameField(controller: _icon),
        TextFormField(
          controller: _color,
          autocorrect: false,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: Validators.pattern(_hexOrEmpty, 'Usa el formato #RRGGBB.'),
          decoration: const InputDecoration(labelText: 'Color (opcional, #RRGGBB)', hintText: '#22C55E'),
        ),
        ColorSwatchPicker(
          selected: _color.text.trim(),
          onSelected: (hex) => _color.text = hex.toUpperCase(),
        ),
      ],
    );
  }
}
