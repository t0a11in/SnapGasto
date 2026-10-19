import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { ExpensesPageComponent as AdminExpensesPageComponent } from './features/admin/expense/expense.page.component';
import { AdminShellComponent } from './features/admin/shell/admin-shell.component';
import { ExpensesPageComponent } from './features/expenses/expenses-page.component';
import { IncomesPageComponent } from './features/incomes/incomes-page.component';
import { routes } from './app.routes';

describe('application routes', () => {
  it('renders personal incomes and expenses inside the authenticated shell', () => {
    const shellRoute = routes.find((route) => route.path === '' && route.component === AdminShellComponent);
    const children = shellRoute?.children ?? [];

    expect(shellRoute?.canActivate).toContain(authGuard);
    expect(children).toContain(
      jasmine.objectContaining({
        path: 'expenses',
        component: ExpensesPageComponent,
        title: 'Gastos | SnapGasto',
      }),
    );
    expect(children).toContain(
      jasmine.objectContaining({
        path: 'incomes',
        component: IncomesPageComponent,
        title: 'Ingresos | SnapGasto',
      }),
    );
  });

  it('keeps the administration expense maintainer behind the admin guard', () => {
    const shellRoute = routes.find((route) => route.path === '' && route.component === AdminShellComponent);
    const adminRoute = shellRoute?.children?.find((route) => route.path === 'admin');

    expect(adminRoute?.canActivate).toContain(adminGuard);
    expect(adminRoute?.children).toContain(
      jasmine.objectContaining({
        path: 'expenses',
        component: AdminExpensesPageComponent,
        title: 'Gastos de usuarios | SnapGasto',
      }),
    );
  });

  it('redirects unknown authenticated paths to incomes', () => {
    const shellRoute = routes.find((route) => route.path === '' && route.component === AdminShellComponent);

    expect(shellRoute?.children).toContain(
      jasmine.objectContaining({ path: '**', redirectTo: 'incomes' }),
    );
  });
});
