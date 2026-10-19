import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/expenses_api.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/text_utils.dart';
import '../../../shared/forms/form_submit_cubit.dart';
import '../../../shared/forms/validators.dart';
import '../../../shared/widgets/amount_field.dart';
import '../../../shared/widgets/category_autocomplete_field.dart';
import '../../../shared/widgets/date_field.dart';
import '../../../shared/widgets/description_field.dart';
import '../../../shared/widgets/form_sheet.dart';
import '../../../shared/widgets/payment_method_dropdown.dart';

/// Abre el formulario de gasto (crear o editar). Resuelve `true` si se guardó.
Future<bool> showExpenseFormSheet(
  BuildContext context, {
  ExpenseResponse? expense,
  required String month,
  required List<String> knownCategories,
}) async {
  final api = context.read<ExpensesApi>();
  final saved = await showFormSheet<bool>(
    context,
    (_) => BlocProvider(
      create: (_) => FormSubmitCubit(),
      child: ExpenseFormSheet(api: api, expense: expense, month: month, knownCategories: knownCategories),
    ),
  );
  return saved ?? false;
}

class ExpenseFormSheet extends StatefulWidget {
  const ExpenseFormSheet({
    super.key,
    required this.api,
    required this.month,
    required this.knownCategories,
    this.expense,
  });

  final ExpensesApi api;
  final ExpenseResponse? expense;
  final String month;

  /// Sugerencias: catálogo + categorías ya usadas en el mes.
  final List<String> knownCategories;

  @override
  State<ExpenseFormSheet> createState() => _ExpenseFormSheetState();
}

class _ExpenseFormSheetState extends State<ExpenseFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amount;
  late final TextEditingController _category;
  late final TextEditingController _description;
  late String _date;
  late PaymentMethod _paymentMethod;

  @override
  void initState() {
    super.initState();
    final e = widget.expense;
    _amount = TextEditingController(text: e == null ? '' : _amountText(e.amount));
    _category = TextEditingController(text: e?.category ?? '');
    _description = TextEditingController(text: e?.description ?? '');
    _date = e?.date ?? defaultDateForMonth(widget.month);
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

  /// Incluye la categoría original del gasto editado aunque ya no exista en el catálogo.
  List<String> get _categoryOptions {
    final original = widget.expense?.category;
    final names = widget.knownCategories;
    return original != null && original.isNotEmpty && !names.contains(original) ? [original, ...names] : names;
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final request = ExpenseRequest(
      amount: parseAmountInput(_amount.text)!,
      category: _category.text.trim(),
      date: _date,
      description: optionalText(_description.text),
      paymentMethod: _paymentMethod.value,
    );
    final ok = await context.read<FormSubmitCubit>().submit(() => widget.api.save(widget.expense?.id, request));
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
        AmountField(controller: _amount, autofocus: widget.expense == null),
        DateField(value: _date, onChanged: (v) => setState(() => _date = v)),
        CategoryAutocompleteField(controller: _category, options: _categoryOptions),
        PaymentMethodDropdown(value: _paymentMethod, onChanged: (v) => setState(() => _paymentMethod = v)),
        DescriptionField(controller: _description),
      ],
    );
  }
}
