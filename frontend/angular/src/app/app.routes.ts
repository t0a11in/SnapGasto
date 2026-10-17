import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { AdminShellComponent } from './features/admin/admin-shell.component';
import { CategoriesPageComponent } from './features/admin/categories-page.component';
import { ExpensesPageComponent } from './features/admin/expenses-page.component';
import { NotificationsPageComponent } from './features/admin/notifications-page.component';
import { UsersPageComponent } from './features/admin/users-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { IncomesPageComponent } from './features/incomes/incomes-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: 'incomes',
    component: AdminShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: IncomesPageComponent, title: 'Ingresos | SnapGasto' }
    ]
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'users', component: UsersPageComponent, title: 'Usuarios | SnapGasto' },
      { path: 'expenses', component: ExpensesPageComponent, title: 'Gastos | SnapGasto' },
      { path: 'categories', component: CategoriesPageComponent, title: 'Categorías | SnapGasto' },
      { path: 'notifications', component: NotificationsPageComponent, title: 'Notificaciones | SnapGasto' },
      { path: '', pathMatch: 'full', redirectTo: 'users' }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'incomes' },
  { path: '**', redirectTo: 'incomes' }
];
