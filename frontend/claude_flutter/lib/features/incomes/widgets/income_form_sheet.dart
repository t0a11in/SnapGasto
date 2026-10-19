import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/incomes_api.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/text_utils.dart';
import '../../../shared/forms/form_submit_cubit.dart';
import '../../../shared/forms/validators.dart';
import '../../../shared/widgets/amount_field.dart';
import '../../../shared/widgets/date_field.dart';
import '../../../shared/widgets/description_field.dart';
import '../../../shared/widgets/form_sheet.dart';
import 'income_type_selector.dart';

/// Abre el formulario de ingreso (crear o editar). Resuelve `true` si se guardó.
Future<bool> showIncomeFormSheet(BuildContext context, {IncomeResponse? income, required String month}) async {
  final api = context.read<IncomesApi>();
  final saved = await showFormSheet<bool>(
    context,
    (_) => BlocProvider(
      create: (_) => FormSubmitCubit(),
      child: IncomeFormSheet(api: api, income: income, month: month),
    ),
  );
  return saved ?? false;
}

class IncomeFormSheet extends StatefulWidget {
  const IncomeFormSheet({super.key, required this.api, required this.month, this.income});

  final IncomesApi api;
  final IncomeResponse? income;

  /// Mes seleccionado: define la fecha por defecto al crear.
  final String month;

  @override
  State<IncomeFormSheet> createState() => _IncomeFormSheetState();
}

class _IncomeFormSheetState extends State<IncomeFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _amount;
  late final TextEditingController _description;
  late String _date;
  late IncomeType _type;

  @override
  void initState() {
    super.initState();
    final income = widget.income;
    _amount = TextEditingController(text: income == null ? '' : _amountText(income.amount));
    _description = TextEditingController(text: income?.description ?? '');
    _date = income?.date ?? defaultDateForMonth(widget.month);
    _type = income?.type ?? IncomeType.tarjeta;
  }

  @override
  void dispose() {
    _amount.dispose();
    _description.dispose();
    super.dispose();
  }

  static String _amountText(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toString();

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final request = IncomeRequest(
      amount: parseAmountInput(_amount.text)!,
      type: _type,
      date: _date,
      description: optionalText(_description.text),
    );
    final ok = await context.read<FormSubmitCubit>().submit(() => widget.api.save(widget.income?.id, request));
    if (ok && mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormSheet(
      title: widget.income == null ? 'Nuevo ingreso' : 'Editar ingreso',
      formKey: _formKey,
      onSave: _save,
      children: [
        AmountField(controller: _amount, autofocus: widget.income == null),
        DateField(value: _date, onChanged: (v) => setState(() => _date = v)),
        IncomeTypeSelector(value: _type, onChanged: (v) => setState(() => _type = v)),
        DescriptionField(controller: _description),
      ],
    );
  }
}
