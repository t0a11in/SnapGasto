import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/auth_repository.dart';
import '../../../core/session/session_cubit.dart';
import '../../../shared/widgets/pill_badge.dart';
import 'user_avatar.dart';

/// Avatar en la barra superior: muestra nombre, correo, rol y "Salir".
class UserMenuButton extends StatelessWidget {
  const UserMenuButton({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionCubit>().state;
    final user = session.user;
    return PopupMenuButton<void>(
      tooltip: 'Cuenta',
      offset: const Offset(0, 48),
      itemBuilder: (context) => [
        PopupMenuItem<void>(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user?.fullName ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)),
              const SizedBox(height: 2),
              Row(
                children: [
                  Flexible(child: Text(user?.email ?? '', overflow: TextOverflow.ellipsis)),
                  if (session.isAdmin) ...[
                    const SizedBox(width: 6),
                    PillBadge(
                      label: 'ADMIN',
                      color: Colors.white,
                      background: Theme.of(context).colorScheme.primary,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem<void>(
          onTap: () => context.read<AuthRepository>().logout(),
          child: const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.logout),
            title: Text('Salir'),
          ),
        ),
      ],
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: UserAvatar(fullName: user?.fullName),
      ),
    );
  }
}
