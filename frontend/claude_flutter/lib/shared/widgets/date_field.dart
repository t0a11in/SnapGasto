import 'package:flutter/material.dart';

import '../../core/utils/date_utils.dart';
import '../forms/validators.dart';

/// Fecha YYYY-MM-DD no futura, elegida con el calendario del sistema.
class DateField extends StatefulWidget {
  const DateField({super.key, required this.value, required this.onChanged, this.label = 'Fecha'});

  final String value;
  final ValueChanged<String> onChanged;
  final String label;

  @override
  State<DateField> createState() => _DateFieldState();
}

class _DateFieldState extends State<DateField> {
  late final TextEditingController _controller = TextEditingController(text: formatDateDisplay(widget.value));

  @override
  void didUpdateWidget(covariant DateField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _controller.text = formatDateDisplay(widget.value);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    final today = DateTime.now();
    final lastDate = DateTime(today.year, today.month, today.day);
    var initial = parseIsoDate(widget.value) ?? lastDate;
    if (initial.isAfter(lastDate)) {
      initial = lastDate;
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: lastDate,
      helpText: 'Selecciona la fecha',
    );
    if (picked != null) {
      widget.onChanged(toIsoDate(picked));
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: _controller,
      readOnly: true,
      onTap: _pick,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      validator: (_) => Validators.notFutureDate(widget.value),
      decoration: InputDecoration(
        labelText: widget.label,
        suffixIcon: const Icon(Icons.event_outlined),
      ),
    );
  }
}
