import 'package:flutter/material.dart';

import '../../core/models/models.dart';

/// Medio de pago: TARJETA / EFECTIVO / TRANSFERENCIA / OTRO.
class PaymentMethodDropdown extends StatelessWidget {
  const PaymentMethodDropdown({super.key, required this.value, required this.onChanged});

  final PaymentMethod value;
  final ValueChanged<PaymentMethod> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<PaymentMethod>(
      initialValue: value,
      decoration: const InputDecoration(labelText: 'Medio de pago'),
      items: [
        for (final pm in PaymentMethod.values) DropdownMenuItem(value: pm, child: Text(pm.label)),
      ],
      onChanged: (v) {
        if (v != null) {
          onChanged(v);
        }
      },
    );
  }
}
