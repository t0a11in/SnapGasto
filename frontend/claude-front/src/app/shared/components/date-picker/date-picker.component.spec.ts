import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required } from '@angular/forms/signals';
import { DatePickerComponent } from './date-picker.component';
import { ChileDateParserFormatter, dateStructToIso, isoToDateStruct } from './date-picker-locale';

@Component({
  imports: [DatePickerComponent, FormField],
  template: `<app-date-picker label="Fecha" [formField]="f.date" />`,
})
class HostComponent {
  readonly model = signal({ date: '2026-03-05' });
  readonly f = form(this.model, (p) => required(p.date, { message: 'Elige una fecha.' }));
}

describe('DatePickerComponent', () => {
  it('convierte entre AAAA-MM-DD y la estructura de ng-bootstrap', () => {
    expect(isoToDateStruct('2026-03-05')).toEqual({ year: 2026, month: 3, day: 5 });
    expect(isoToDateStruct('2026-02-30')).toBeNull();
    expect(isoToDateStruct('')).toBeNull();
    expect(dateStructToIso({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05');
  });

  it('lee y muestra fechas como dd-mm-aaaa', () => {
    const formatter = new ChileDateParserFormatter();
    expect(formatter.parse('5-3-2026')).toEqual({ year: 2026, month: 3, day: 5 });
    expect(formatter.parse('05/03/2026')).toEqual({ year: 2026, month: 3, day: 5 });
    expect(formatter.parse('31-02-2026')).toBeNull();
    expect(formatter.format({ year: 2026, month: 3, day: 5 })).toBe('05-03-2026');
  });

  it('muestra el valor del formulario en formato chileno', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    expect(input.value).toBe('05-03-2026');
  });

  it('al escribir una fecha válida actualiza el formulario en AAAA-MM-DD', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    input.value = '18-09-2026';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.model().date).toBe('2026-09-18');
  });

  it('avisa cuando el texto no es una fecha', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.value = '99-99-2026';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(host.querySelector('.invalid-feedback')!.textContent).toContain('dd-mm-aaaa');
    expect(fixture.componentInstance.model().date).toBe('');
  });
});
