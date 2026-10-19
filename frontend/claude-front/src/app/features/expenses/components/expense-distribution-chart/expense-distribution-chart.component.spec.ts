import { TestBed } from '@angular/core/testing';
import { OTHER_COLOR } from '../../../../core/utils/chart-palette';
import { CategoryTotal, OTHER_CATEGORY } from '../../expenses.store';
import { ExpenseDistributionChartComponent } from './expense-distribution-chart.component';

const rows: CategoryTotal[] = [
  { category: 'Arriendo', total: 400000, count: 1, share: 0.8, colorHex: null },
  { category: 'Comida', total: 80000, count: 3, share: 0.16, colorHex: null },
  { category: OTHER_CATEGORY, total: 20000, count: 2, share: 0.04, colorHex: null },
];
const colors = new Map([
  ['Arriendo', '#2a78d6'],
  ['Comida', '#eb6834'],
  [OTHER_CATEGORY, OTHER_COLOR],
]);

describe('ExpenseDistributionChartComponent (torta)', () => {
  async function render(data: CategoryTotal[] = rows) {
    const fixture = TestBed.createComponent(ExpenseDistributionChartComponent);
    fixture.componentRef.setInput('rows', data);
    fixture.componentRef.setInput('colors', colors);
    fixture.componentRef.setInput('total', 500000);
    fixture.componentRef.setInput('month', '2026-10');
    await fixture.whenStable();
    return fixture;
  }

  it('dibuja un sector por categoría con su color y una leyenda con montos', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    const paths = el.querySelectorAll('path.slice');
    expect(paths.length).toBe(3);
    expect(paths[0].getAttribute('fill')).toBe('#2a78d6');
    expect(paths[2].getAttribute('fill')).toBe(OTHER_COLOR);
    expect(el.querySelector('.legend')?.textContent).toContain('$400.000');
    expect(el.querySelector('.legend')?.textContent).toContain('80,0 %');
  });

  it('el sector mayor (80 %) usa el arco largo', async () => {
    const fixture = await render();
    const d = (fixture.nativeElement as HTMLElement).querySelector('path.slice')!.getAttribute('d')!;
    expect(d).toContain(' 0 1 1 ');
  });

  it('una sola categoría se dibuja como círculo completo', async () => {
    const fixture = await render([{ ...rows[0], share: 1 }]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('circle.slice')).not.toBeNull();
    expect(el.querySelectorAll('path.slice').length).toBe(0);
  });

  it('clic en la leyenda emite la categoría; "Otras" pide ver todas', async () => {
    const fixture = await render();
    const selected: string[] = [];
    let all = 0;
    fixture.componentInstance.selectCategory.subscribe((c) => selected.push(c));
    fixture.componentInstance.showAll.subscribe(() => all++);
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.legend-item');
    items[1].click();
    items[2].click();
    expect(selected).toEqual(['Comida']);
    expect(all).toBe(1);
  });

  it('resalta el sector al enfocar la leyenda', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelectorAll<HTMLButtonElement>('.legend-item')[0].dispatchEvent(new FocusEvent('focus'));
    await fixture.whenStable();
    const paths = el.querySelectorAll('path.slice');
    expect(paths[0].getAttribute('transform')).toContain('translate');
    expect(paths[1].classList).toContain('is-dim');
  });

  it('sin datos muestra un mensaje vacío', async () => {
    const fixture = await render([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aún no hay gastos');
  });
});
