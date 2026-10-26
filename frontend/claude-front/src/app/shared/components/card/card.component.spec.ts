import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';
import { CardActionsDirective, CardFooterDirective } from './card-slots.directive';

@Component({
  imports: [CardComponent, CardActionsDirective, CardFooterDirective],
  template: `
    <app-card id="full" title="Gastos" subtitle="Octubre" icon="trending-down" [collapsible]="true" [loading]="loading()">
      <button cardActions type="button" id="action">Nuevo</button>
      <p id="body">Contenido</p>
      <div cardFooter id="footer">Total</div>
    </app-card>
    <app-card id="plain"><p>Solo cuerpo</p></app-card>
  `,
})
class HostComponent {
  readonly loading = signal(false);
}

describe('CardComponent', () => {
  it('renderiza título accesible, acciones, cuerpo y pie', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('#full')!;
    const heading = card.querySelector('[role="heading"]')!;
    expect(heading.textContent).toContain('Gastos');
    expect(heading.getAttribute('aria-level')).toBe('2');
    expect(card.querySelector('section')!.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(card.querySelector('.sg-card__actions #action')).not.toBeNull();
    expect(card.querySelector('.card-footer #footer')).not.toBeNull();
  });

  it('sin título ni pie no dibuja encabezado ni pie', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('#plain')!;
    expect(card.querySelector('.sg-card__header')).toBeNull();
    expect(card.querySelector('.card-footer')).toBeNull();
  });

  it('se contrae y expande con el botón', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('#full')!;
    const toggle = card.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    await fixture.whenStable();
    expect(card.querySelector<HTMLElement>('.card-body')!.hidden).toBeTrue();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('muestra un spinner mientras carga', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    const body = (fixture.nativeElement as HTMLElement).querySelector('#full .card-body')!;
    expect(body.getAttribute('aria-busy')).toBe('true');
    expect(body.querySelector('.spinner-border')).not.toBeNull();
  });
});
