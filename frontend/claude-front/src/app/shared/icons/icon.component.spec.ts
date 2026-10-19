import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  it('renderiza el SVG de feather sin innerHTML y oculto a lectores', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'plus');
    fixture.componentRef.setInput('size', 20);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg')!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('width')).toBe('20');
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('ignora nombres desconocidos o de prototipo', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', '__proto__');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')).toBeNull();
  });

  it('expone etiqueta accesible cuando se indica', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'bell');
    fixture.componentRef.setInput('label', 'Notificaciones');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('img');
    expect(host.getAttribute('aria-label')).toBe('Notificaciones');
  });
});
