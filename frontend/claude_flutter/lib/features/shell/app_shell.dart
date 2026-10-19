import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/session/session_cubit.dart';
import 'widgets/app_drawer.dart';
import 'widgets/brand_title.dart';
import 'widgets/user_menu_button.dart';

/// Shell autenticado: barra superior, menú lateral según rol y contenido.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.location, required this.child});

  final String location;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isAdmin = context.select<SessionCubit, bool>((cubit) => cubit.state.isAdmin);
    return Scaffold(
      appBar: AppBar(
        title: const BrandTitle(size: 20),
        actions: const [UserMenuButton()],
      ),
      drawer: AppDrawer(location: location, isAdmin: isAdmin),
      body: child,
    );
  }
}
