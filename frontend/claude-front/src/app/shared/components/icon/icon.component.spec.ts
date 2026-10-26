import { TestBed } from '@angular/core/testing';
import { ICON_ASSET_LOADER, ICON_ASSET_PATHS } from '../../services/icon-registry.service';
import { IconComponent } from './icon.component';

const FAKE_ASSETS: Record<string, unknown> = {
  [ICON_ASSET_PATHS.lucide]: {
    wallet: [['path', { d: 'M1 1h2' }], ['circle', { cx: 12, cy: 12, r: 3 }]],
    evil: [['script', { src: 'x.js' }], ['path', { d: 'M0 0', onclick: 'alert(1)' }]],
  },
  [ICON_ASSET_PATHS.tabler]: { heart: [['path', { d: 'M2 2h2' }]] },
  [ICON_ASSET_PATHS['tabler-filled']]: { heart: [['path', { d: 'M3 3h3' }]] },
  [ICON_ASSET_PATHS.bootstrap]: { bank: 61812 },
};

describe('IconComponent', () => {
  let loads: string[];

  beforeEach(() => {
    loads = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ICON_ASSET_LOADER,
          useValue: async (path: string) => {
            loads.push(path);
            return FAKE_ASSETS[path];
          },
        },
      ],
    });
  });

  /** Espera a que termine la carga asíncrona del set de íconos. */
  const settle = async (fixture: { whenStable(): Promise<unknown> }) => {
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
  };

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
    expect(loads).toEqual([]);
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

  it('dibuja un ícono de Lucide con trazo y carga el set una sola vez', async () => {
    const first = TestBed.createComponent(IconComponent);
    first.componentRef.setInput('library', 'lucide');
    first.componentRef.setInput('name', 'wallet');
    first.componentRef.setInput('strokeWidth', 1.5);
    const second = TestBed.createComponent(IconComponent);
    second.componentRef.setInput('library', 'lucide');
    second.componentRef.setInput('name', 'wallet');
    await settle(first);
    await settle(second);
    const svg = (first.nativeElement as HTMLElement).querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('1.5');
    expect(svg.querySelectorAll('path, circle').length).toBe(2);
    expect(loads).toEqual([ICON_ASSET_PATHS.lucide]);
  });

  it('usa el set relleno de Tabler con filled', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('library', 'tabler');
    fixture.componentRef.setInput('name', 'heart');
    fixture.componentRef.setInput('filled', true);
    await settle(fixture);
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg')!;
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.querySelector('path')!.getAttribute('d')).toBe('M3 3h3');
  });

  it('usa el sprite de Bootstrap Icons solo para nombres existentes', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('library', 'bootstrap');
    fixture.componentRef.setInput('name', 'bank');
    await settle(fixture);
    const use = (fixture.nativeElement as HTMLElement).querySelector('svg use')!;
    expect(use.getAttribute('href')).toBe('icons/bootstrap/bootstrap-icons.svg#bank');

    fixture.componentRef.setInput('name', 'no-existe');
    await settle(fixture);
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')).toBeNull();
  });

  it('descarta etiquetas y atributos que no están en la lista blanca', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('library', 'lucide');
    fixture.componentRef.setInput('name', 'evil');
    await settle(fixture);
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg')!;
    expect(svg.querySelector('script')).toBeNull();
    expect(svg.querySelector('path')!.hasAttribute('onclick')).toBeFalse();
  });
});
