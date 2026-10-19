import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { PasswordInputComponent } from './password-input.component';

@Component({
  imports: [PasswordInputComponent],
  template: `<app-password-input [field]="f.password" />`,
})
class HostComponent {
  readonly model = signal({ password: '' });
  readonly f = form(this.model, (p) => required(p.password, { message: 'Ingresa tu contraseña.' }));
}

describe('PasswordInputComponent', () => {
  it('el botón del ojo vive dentro del campo y alterna el tipo', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const wrapper = el.querySelector('.password-field')!;
    const input = wrapper.querySelector('input')!;
    const toggle = wrapper.querySelector<HTMLButtonElement>('.password-toggle')!;
    expect(input.type).toBe('password');
    toggle.click();
    await fixture.whenStable();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('muestra el error debajo del campo, fuera del contenedor del input', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.f.password().markAsTouched();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const feedback = el.querySelector('.invalid-feedback')!;
    expect(feedback.textContent).toContain('Ingresa tu contraseña.');
    expect(el.querySelector('.password-field')!.contains(feedback)).toBeFalse();
  });
});
