import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guards';
import { AppShellComponent } from './features/admin/shell/app-shell.component';

/** Galería de íconos: una sola página que recibe la librería desde `data`. */
const iconGallery = () =>
  import('./shared/components/icon-gallery/icon-gallery.component').then((m) => m.IconGalleryComponent);

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · SnapGasto',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Crear cuenta · SnapGasto',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'incomes' },
      {
        path: 'incomes',
        title: 'Ingresos · SnapGasto',
        loadComponent: () => import('./features/incomes/incomes.page').then((m) => m.IncomesPage),
      },
      {
        path: 'expenses',
        title: 'Gastos · SnapGasto',
        loadComponent: () => import('./features/expenses/expenses.page').then((m) => m.ExpensesPage),
      },
      {
        path: 'ui/icons',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'feather' },
          {
            path: 'feather',
            title: 'Íconos Feather · SnapGasto',
            data: { library: 'feather' },
            loadComponent: iconGallery,
          },
          {
            path: 'lucide',
            title: 'Íconos Lucide · SnapGasto',
            data: { library: 'lucide' },
            loadComponent: iconGallery,
          },
          {
            path: 'tabler',
            title: 'Íconos Tabler · SnapGasto',
            data: { library: 'tabler' },
            loadComponent: iconGallery,
          },
          {
            path: 'bootstrap',
            title: 'Bootstrap Icons · SnapGasto',
            data: { library: 'bootstrap' },
            loadComponent: iconGallery,
          },
        ],
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        canActivateChild: [adminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
