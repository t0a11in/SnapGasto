import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { buttonClasses } from './button.types';

@Component({
  imports: [ButtonComponent],
  template: `
    <button appButton id="save" type="submit" icon="plus" [loading]="loading()" (click)="clicks = clicks + 1">
      Guardar
    </button>
    <a appButton id="link" href="#" appearance="outline" variant="secondary" [disabled]="true">Ir</a>
  `,
})
class HostComponent {
  readonly loading = signal(false);
  clicks = 0;
}

describe('ButtonComponent', () => {
  it('aplica las clases de Bootstrap según variante, apariencia y tamaño', () => {
    expect(buttonClasses('primary', 'solid', 'md')).toBe('btn btn-primary');
    expect(buttonClasses('danger', 'outline', 'sm')).toBe('btn btn-outline-danger btn-sm');
    expect(buttonClasses('secondary', 'ghost', 'lg')).toBe('btn sg-btn-ghost text-secondary btn-lg');
  });

  it('muestra el ícono, respeta el type y conserva el texto', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#save')!;
    expect(button.classList).toContain('btn-primary');
    expect(button.type).toBe('submit');
    expect(button.querySelector('app-icon svg')).not.toBeNull();
    expect(button.textContent).toContain('Guardar');
  });

  it('con loading muestra spinner y queda deshabilitado', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#save')!;
    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.spinner-border')).not.toBeNull();
    expect(button.querySelector('app-icon')).toBeNull();
  });

  it('un enlace deshabilitado no navega y sale del orden de tabulación', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('#link')!;
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.classList).toContain('btn-outline-secondary');
    const event = new MouseEvent('click', { cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
  });
});
