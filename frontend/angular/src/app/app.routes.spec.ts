import { adminGuard } from './core/guards/admin.guard';
import { ExpensesPageComponent } from './features/admin/expense/expense.page.component';
import { IncomesPageComponent } from './features/incomes/incomes-page.component';
import { routes } from './app.routes';

describe('application routes', () => {
  it('renders incomes inside the administration shell immediately after expenses', () => {
    const adminRoute = routes.find((route) => route.path === 'admin');
    const children = adminRoute?.children ?? [];
    const expenseIndex = children.findIndex((route) => route.component === ExpensesPageComponent);

    expect(adminRoute?.canActivate).toContain(adminGuard);
    expect(expenseIndex).toBeGreaterThanOrEqual(0);
    expect(children[expenseIndex + 1]).toEqual(
      jasmine.objectContaining({
        path: 'incomes',
        component: IncomesPageComponent,
        title: 'Ingresos | SnapGasto',
      }),
    );
  });

  it('redirects the application entry point to the shared incomes view', () => {
    expect(routes.find((route) => route.path === '')).toEqual(
      jasmine.objectContaining({ redirectTo: 'admin/incomes', pathMatch: 'full' }),
    );
    expect(routes.find((route) => route.path === '**')).toEqual(
      jasmine.objectContaining({ redirectTo: 'admin/incomes' }),
    );
  });
});
