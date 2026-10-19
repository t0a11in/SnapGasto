import 'package:flutter/material.dart';

import '../../../../core/models/models.dart';
import '../../../../shared/widgets/pill_badge.dart';

class RoleBadge extends StatelessWidget {
  const RoleBadge({super.key, required this.role});

  final Role role;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return role == Role.admin
        ? PillBadge(label: role.value, color: Colors.white, background: primary)
        : PillBadge(label: role.value, outlined: true);
  }
}
