import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../nav_items.dart';
import 'brand_title.dart';

/// Menú lateral según rol (Mis finanzas / Administración).
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key, required this.location, required this.isAdmin});

  final String location;
  final bool isAdmin;

  void _go(BuildContext context, String route) {
    Navigator.of(context).pop(); // cierra el menú al navegar
    if (route != location) {
      context.go(route);
    }
  }

  @override
  Widget build(BuildContext context) {
    return NavigationDrawer(
      selectedIndex: null,
      children: [
        const Padding(padding: EdgeInsets.fromLTRB(28, 20, 16, 12), child: BrandTitle()),
        const _SectionLabel('Mis finanzas'),
        for (final item in personalNav) _DrawerTile(item: item, selected: location == item.route, onTap: _go),
        if (isAdmin) ...[
          const SizedBox(height: 8),
          const _SectionLabel('Administración'),
          for (final item in adminNav) _DrawerTile(item: item, selected: location == item.route, onTap: _go),
        ],
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 12, 16, 8),
      child: Text(
        text.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(letterSpacing: 0.8, color: AppColors.secondaryText),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  const _DrawerTile({required this.item, required this.selected, required this.onTap});

  final NavItem item;
  final bool selected;
  final void Function(BuildContext context, String route) onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: ListTile(
        selected: selected,
        selectedTileColor: scheme.primaryContainer,
        selectedColor: scheme.onPrimaryContainer,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        leading: Icon(item.icon),
        title: Text(item.label, style: TextStyle(fontWeight: selected ? FontWeight.w600 : FontWeight.normal)),
        onTap: () => onTap(context, item.route),
      ),
    );
  }
}
