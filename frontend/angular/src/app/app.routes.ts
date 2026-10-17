import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { CategoriesPageComponent } from './features/admin/category/category.page.component';
import { ExpensesPageComponent } from './features/admin/expense/expense.page.component';
import { NotificationsPageComponent } from './features/admin/notification/notification.page.component';
import { AdminShellComponent } from './features/admin/shell/admin-shell.component';
import { UsersPageComponent } from './features/admin/user/user.page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { IncomesPageComponent } from './features/incomes/incomes-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  // {
  //   path: '',
  //   component: AdminShellComponent,
  //   canActivate: [authGuard],
  //   children: [
  //   ]
  // },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'users', component: UsersPageComponent, title: 'Usuarios | SnapGasto' },
      { path: 'expenses', component: ExpensesPageComponent, title: 'Gastos | SnapGasto' },
      { path: 'incomes', component: IncomesPageComponent, title: 'Ingresos | SnapGasto' },
      { path: 'categories', component: CategoriesPageComponent, title: 'Categorías | SnapGasto' },
      { path: 'notifications', component: NotificationsPageComponent, title: 'Notificaciones | SnapGasto' },
      { path: '', pathMatch: 'full', redirectTo: 'users' }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'admin/incomes' },
  { path: '**', redirectTo: 'admin/incomes' }
];
