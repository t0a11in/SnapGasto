import { NavService } from './nav.service';

describe('NavService', () => {
  it('keeps Ingresos directly after Gastos in the administration menu', () => {
    const menu = new NavService().MENUITEMS;
    const expensesIndex = menu.findIndex((item) => item.path === '/admin/expenses');

    expect(expensesIndex).toBeGreaterThanOrEqual(0);
    expect(menu[expensesIndex + 1]).toEqual(
      jasmine.objectContaining({
        path: '/admin/incomes',
        title: 'Ingresos',
        type: 'link',
      }),
    );
  });
});
