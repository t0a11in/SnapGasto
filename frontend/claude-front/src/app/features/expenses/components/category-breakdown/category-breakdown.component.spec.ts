import { TestBed } from '@angular/core/testing';
import { CategoryTotal } from '../../expenses.store';
import { CategoryBreakdownComponent } from './category-breakdown.component';

const make = (n: number): CategoryTotal[] =>
  Array.from({ length: n }, (_, i) => ({
    category: `Cat ${i}`,
    total: (n - i) * 10000,
    count: i + 1,
    share: 1 / n,
    colorHex: null,
  }));

describe('CategoryBreakdownComponent', () => {
  async function render(rows: CategoryTotal[], visibleRows: number | null = 3) {
    const fixture = TestBed.createComponent(CategoryBreakdownComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('visibleRows', visibleRows);
    await fixture.whenStable();
    return fixture;
  }

  it('muestra montos con separador de miles y emite la categoría al hacer clic', async () => {
    const fixture = await render(make(2));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('$20.000');
    let selected = '';
    fixture.componentInstance.selectCategory.subscribe((c) => (selected = c));
    el.querySelectorAll<HTMLButtonElement>('button.breakdown-row')[1].click();
    expect(selected).toBe('Cat 1');
  });

  it('limita la altura a 3 filas y deja el resto con scroll', async () => {
    const fixture = await render(make(8));
    const el = fixture.nativeElement as HTMLElement;
    const list = el.querySelector('.breakdown') as HTMLElement;
    expect(list.style.maxHeight).toBe('7.5rem');
    expect(getComputedStyle(list).overflowY).toBe('auto');
    expect(el.textContent).toContain('Desliza para ver 5 más');
  });

  it('el botón "Ver todas" emite expand', async () => {
    const fixture = await render(make(5));
    let expanded = 0;
    fixture.componentInstance.expand.subscribe(() => expanded++);
    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Ver todas (5)'),
    )!;
    button.click();
    expect(expanded).toBe(1);
  });

  it('sin límite (modal) no fija altura máxima', async () => {
    const fixture = await render(make(8), null);
    const list = (fixture.nativeElement as HTMLElement).querySelector('.breakdown') as HTMLElement;
    expect(list.style.maxHeight).toBe('');
  });
});
