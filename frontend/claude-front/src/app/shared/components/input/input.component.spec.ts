import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, maxLength, min, required } from '@angular/forms/signals';
import { InputComponent, InputValue } from './input.component';

@Component({
  imports: [InputComponent, FormField],
  template: `
    <app-input id="name" label="Nombre" [formField]="f.name" [showCounter]="true" />
    <app-input id="amount" label="Monto" type="number" suffix="CLP" [formField]="f.amount" />
    <app-input id="notes" label="Notas" type="textarea" [formField]="f.notes" />
  `,
})
class FormHostComponent {
  readonly model = signal({ name: '', amount: null as number | null, notes: '' });
  readonly f = form(this.model, (p) => {
    required(p.name, { message: 'Ingresa un nombre.' });
    maxLength(p.name, 10);
    min(p.amount, 1);
  });
}

@Component({
  imports: [InputComponent],
  template: `<app-input type="search" icon="search" [(value)]="query" />`,
})
class StandaloneHostComponent {
  readonly query = signal<InputValue>('arriendo');
}

const typeInto = (el: HTMLInputElement | HTMLTextAreaElement, value: string): void => {
  el.value = value;
  el.dispatchEvent(new Event('input'));
};

describe('InputComponent', () => {
  it('actualiza el modelo de Signal Forms al escribir texto', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#name input')!;
    typeInto(input, 'Ana');
    await fixture.whenStable();
    expect(fixture.componentInstance.model().name).toBe('Ana');
    expect((fixture.nativeElement as HTMLElement).querySelector('#name .sg-input__counter')!.textContent).toContain(
      '3 / 10',
    );
  });

  it('con type="number" entrega number o null', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('#amount input')!;
    expect(input.type).toBe('number');
    expect(host.querySelector('#amount .input-group-text')!.textContent).toContain('CLP');
    typeInto(input, '1500');
    await fixture.whenStable();
    expect(fixture.componentInstance.model().amount).toBe(1500);
    typeInto(input, '');
    await fixture.whenStable();
    expect(fixture.componentInstance.model().amount).toBeNull();
  });

  it('con type="textarea" renderiza un textarea', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    await fixture.whenStable();
    const textarea = (fixture.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>('#notes textarea')!;
    typeInto(textarea, 'Pago anual');
    await fixture.whenStable();
    expect(fixture.componentInstance.model().notes).toBe('Pago anual');
  });

  it('muestra los errores solo después de tocar el campo', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#name .invalid-feedback')).toBeNull();
    host.querySelector<HTMLInputElement>('#name input')!.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    const input = host.querySelector<HTMLInputElement>('#name input')!;
    expect(host.querySelector('#name .invalid-feedback')!.textContent).toContain('Ingresa un nombre.');
    expect(input.classList).toContain('is-invalid');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('refleja en el campo los cambios del modelo hechos desde fuera', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    await fixture.whenStable();
    fixture.componentInstance.model.update((m) => ({ ...m, name: 'Luis' }));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#name input')!.value).toBe('Luis');
  });

  it('también funciona con [(value)] sin formulario', async () => {
    const fixture = TestBed.createComponent(StandaloneHostComponent);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    expect(input.value).toBe('arriendo');
    typeInto(input, 'luz');
    await fixture.whenStable();
    expect(fixture.componentInstance.query()).toBe('luz');
  });
});
