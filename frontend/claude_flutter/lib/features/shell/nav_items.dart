import 'package:flutter/material.dart';

import '../../app/router/app_routes.dart';

class NavItem {
  const NavItem({required this.label, required this.route, required this.icon});

  final String label;
  final String route;
  final IconData icon;
}

const List<NavItem> personalNav = [
  NavItem(label: 'Ingresos', route: AppRoutes.incomes, icon: Icons.trending_up),
  NavItem(label: 'Gastos', route: AppRoutes.expenses, icon: Icons.trending_down),
];

const List<NavItem> adminNav = [
  NavItem(label: 'Usuarios', route: AppRoutes.adminUsers, icon: Icons.group_outlined),
  NavItem(label: 'Categorías', route: AppRoutes.adminCategories, icon: Icons.sell_outlined),
  NavItem(label: 'Gastos de usuarios', route: AppRoutes.adminExpenses, icon: Icons.list_alt),
  NavItem(label: 'Notificaciones', route: AppRoutes.adminNotifications, icon: Icons.notifications_none),
];
