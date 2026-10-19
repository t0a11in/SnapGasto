import { NavService } from './nav.service';

describe('NavService', () => {
  it('shows the personal income and expense modules to a standard user', () => {
    const menu = new NavService().menuFor(false);
    const incomesIndex = menu.findIndex((item) => item.path === '/incomes');

    expect(incomesIndex).toBeGreaterThanOrEqual(0);
    expect(menu[incomesIndex + 1]).toEqual(
      jasmine.objectContaining({
        path: '/expenses',
        title: 'Gastos',
        type: 'link',
      }),
    );
  });
});
