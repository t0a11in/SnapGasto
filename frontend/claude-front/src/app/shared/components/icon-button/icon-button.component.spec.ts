import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button.component';

@Component({
  imports: [IconButtonComponent],
  template: `<button appIconButton icon="trash-2" label="Eliminar gasto" variant="danger" size="sm"></button>`,
})
class HostComponent {}

describe('IconButtonComponent', () => {
  it('muestra solo el ícono y usa label como nombre accesible y tooltip', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Eliminar gasto');
    expect(button.getAttribute('title')).toBe('Eliminar gasto');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.classList).toContain('sg-btn-ghost');
    expect(button.classList).toContain('text-danger');
    expect(button.classList).toContain('sg-icon-btn--sm');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.textContent?.trim()).toBe('');
  });
});
