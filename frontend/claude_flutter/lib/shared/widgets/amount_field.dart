import 'package:flutter/material.dart';

import '../../core/utils/money_format.dart';
import '../forms/validators.dart';

/// Monto obligatorio > 0 con vista previa formateada (`$12.000`).
class AmountField extends StatefulWidget {
  const AmountField({super.key, required this.controller, this.label = 'Monto', this.autofocus = false});

  final TextEditingController controller;
  final String label;
  final bool autofocus;

  @override
  State<AmountField> createState() => _AmountFieldState();
}

class _AmountFieldState extends State<AmountField> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final value = parseAmountInput(widget.controller.text);
    return TextFormField(
      controller: widget.controller,
      autofocus: widget.autofocus,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      textInputAction: TextInputAction.next,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      validator: Validators.positiveAmount,
      decoration: InputDecoration(
        labelText: widget.label,
        prefixText: r'$ ',
        helperText: value != null && value > 0 ? formatMoney(value) : null,
      ),
    );
  }
}
