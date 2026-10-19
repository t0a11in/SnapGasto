import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  {
    path: 'users',
    title: 'Usuarios · SnapGasto',
    loadComponent: () => import('./users/admin-users.page').then((m) => m.AdminUsersPage),
  },
  {
    path: 'categories',
    title: 'Categorías · SnapGasto',
    loadComponent: () => import('./categories/admin-categories.page').then((m) => m.AdminCategoriesPage),
  },
  {
    path: 'expenses',
    title: 'Gastos de usuarios · SnapGasto',
    loadComponent: () => import('./expenses/admin-expenses.page').then((m) => m.AdminExpensesPage),
  },
  {
    path: 'notifications',
    title: 'Notificaciones · SnapGasto',
    loadComponent: () => import('./notifications/admin-notifications.page').then((m) => m.AdminNotificationsPage),
  },
];
