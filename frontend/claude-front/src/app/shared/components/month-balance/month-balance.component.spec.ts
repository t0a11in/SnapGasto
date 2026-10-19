import { TestBed } from '@angular/core/testing';
import { MonthBalanceComponent } from './month-balance.component';

describe('MonthBalanceComponent', () => {
  async function render(income: number | null, expense: number | null) {
    const fixture = TestBed.createComponent(MonthBalanceComponent);
    fixture.componentRef.setInput('income', income);
    fixture.componentRef.setInput('expense', expense);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra la diferencia positiva con separador de miles', async () => {
    const el = await render(1500000, 600000);
    expect(el.textContent).toContain('+$900.000');
    expect(el.textContent).toContain('Te quedan $900.000');
    expect(el.textContent).toContain('40,0 %');
  });

  it('marca en rojo cuando se gasta más de lo ingresado', async () => {
    const el = await render(500000, 650000);
    expect(el.textContent).toContain('-$150.000');
    expect(el.textContent).toContain('Gastaste $150.000 más');
    expect(el.querySelector('.balance')?.classList).toContain('is-negative');
  });

  it('mientras falta un dato no calcula la diferencia', async () => {
    const el = await render(null, 1000);
    expect(el.textContent).toContain('—');
    expect(el.querySelector('.placeholder')).not.toBeNull();
  });
});
