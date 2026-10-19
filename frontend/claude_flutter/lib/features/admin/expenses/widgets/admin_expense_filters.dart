import 'package:flutter/material.dart';

import '../../../../core/models/models.dart';
import '../../../../core/utils/date_utils.dart';
import '../../../../shared/widgets/month_picker_dialog.dart';

/// Filtros de "Gastos de usuarios": usuario y mes (ambos opcionales).
class AdminExpenseFilters extends StatelessWidget {
  const AdminExpenseFilters({
    super.key,
    required this.users,
    required this.userId,
    required this.month,
    required this.onUserChanged,
    required this.onMonthChanged,
  });

  final List<AdminUserResponse> users;

  /// '' = todos los usuarios.
  final String userId;

  /// '' = todos los meses.
  final String month;
  final ValueChanged<String> onUserChanged;
  final ValueChanged<String> onMonthChanged;

  Future<void> _pickMonth(BuildContext context) async {
    final picked = await showMonthPickerDialog(context, initialMonth: month.isEmpty ? currentMonth() : month);
    if (picked != null) {
      onMonthChanged(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final knownUser = userId.isEmpty || users.any((u) => u.id == userId);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        SizedBox(
          width: 220,
          child: DropdownButtonFormField<String>(
            key: ValueKey('user-filter-$userId-${users.length}'),
            initialValue: knownUser ? userId : '',
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Usuario', isDense: true),
            items: [
              const DropdownMenuItem(value: '', child: Text('Todos los usuarios')),
              for (final u in users)
                DropdownMenuItem(value: u.id, child: Text(u.fullName, overflow: TextOverflow.ellipsis)),
            ],
            onChanged: (v) => onUserChanged(v ?? ''),
          ),
        ),
        InputChip(
          avatar: const Icon(Icons.calendar_month_outlined, size: 18),
          label: Text(month.isEmpty ? 'Todos los meses' : formatMonthLabel(month)),
          onPressed: () => _pickMonth(context),
          onDeleted: month.isEmpty ? null : () => onMonthChanged(''),
          deleteButtonTooltipMessage: 'Quitar filtro de mes',
        ),
      ],
    );
  }
}
