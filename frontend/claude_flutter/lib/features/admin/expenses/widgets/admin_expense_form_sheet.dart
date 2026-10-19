import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/models/models.dart';
import '../../../../core/utils/date_utils.dart';
import '../../../../core/utils/text_utils.dart';
import '../../../../shared/forms/form_submit_cubit.dart';
import '../../../../shared/forms/validators.dart';
import '../../../../shared/widgets/amount_field.dart';
import '../../../../shared/widgets/category_autocomplete_field.dart';
import '../../../../shared/widgets/date_field.dart';
import '../../../../shared/widgets/description_field.dart';
import '../../../../shared/widgets/form_sheet.dart';
import '../../../../shared/widgets/payment_method_dropdown.dart';
import '../../shared/admin_cubits.dart';
import '../../shared/user_dropdown.dart';

/// Abre el formulario de gasto de administración. Resuelve `true` si se guardó.
Future<bool> showAdminExpenseFormSheet(
  BuildContext context, {
  AdminExpenseResponse? expense,
  required List<AdminUserResponse> users,
  required List<CategoryResponse> categories,
}) async {
  final cubit = context.read<AdminExpensesCubit>();
  final saved = await showFormSheet<bool>(
    context,
    (_) => BlocProvider(
      create: (_) => FormSubmitCubit(),
      child: AdminExpenseFormSheet(cubit: cubit, expense: expense, users: users, categories: categories),
    ),
  );
  return saved ?? false;
}

class AdminExpenseFormSheet extends StatefulWidget {
  const AdminExpenseFormSheet({
    super.key,
    required this.cubit,
    required this.users,
    required this.categories,
    this.expense,
  });

  final AdminExpensesCubit cubit;
  final AdminExpenseResponse? expense;
  final List<AdminUserResponse> users;
  final List<CategoryResponse> categories;

  @override
  State<AdminExpenseFormSheet> createState() => _AdminExpenseFormSheetState();
}

class _AdminExpenseFormSheetState extends State<AdminExpenseFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amount;
  late final TextEditingController _category;
  late final TextEditingController _description;
  late String? _userId;
  late String _date;
  late PaymentMethod _paymentMethod;

  @override
  void initState() {
    super.initState();
    final e = widget.expense;
    _userId = e?.userId;
    _amount = TextEditingController(text: e == null ? '' : _amountText(e.amount));
    _category = TextEditingController(text: e?.category ?? '');
    _description = TextEditingController(text: e?.description ?? '');
    _date = e?.date ?? todayIso();
    _paymentMethod = e == null ? PaymentMethod.tarjeta : PaymentMethod.fromValue(e.paymentMethod);
  }

  @override
  void dispose() {
    _amount.dispose();
    _category.dispose();
    _description.dispose();
    super.dispose();
  }

  static String _amountText(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toString();

  List<AdminUserResponse> get _sortedUsers => [...widget.users]..sort((a, b) => compareEs(a.fullName, b.fullName));

  List<String> get _categoryOptions {
    final names = widget.categories.map((c) => c.name).toList()..sort(compareEs);
    final original = widget.expense?.category;
    return original != null && original.isNotEmpty && !names.contains(original) ? [original, ...names] : names;
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final request = AdminExpenseRequest(
      userId: _userId!,
      amount: parseAmountInput(_amount.text)!,
      category: _category.text.trim(),
      date: _date,
      description: optionalText(_description.text),
      paymentMethod: _paymentMethod.value,
    );
    final ok = await context.read<FormSubmitCubit>().submit(() => widget.cubit.save(widget.expense?.id, request));
    if (ok && mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormSheet(
      title: widget.expense == null ? 'Nuevo gasto' : 'Editar gasto',
      formKey: _formKey,
      onSave: _save,
      children: [
        UserDropdown(
          users: _sortedUsers,
          value: _userId,
          label: 'Usuario',
          requiredMessage: 'Selecciona el usuario.',
          onChanged: (v) => setState(() => _userId = v),
        ),
        AmountField(controller: _amount),
        DateField(value: _date, onChanged: (v) => setState(() => _date = v)),
        CategoryAutocompleteField(
          controller: _category,
          options: _categoryOptions,
          requiredMessage: 'Indica la categoría.',
        ),
        PaymentMethodDropdown(value: _paymentMethod, onChanged: (v) => setState(() => _paymentMethod = v)),
        DescriptionField(controller: _description),
      ],
    );
  }
}
