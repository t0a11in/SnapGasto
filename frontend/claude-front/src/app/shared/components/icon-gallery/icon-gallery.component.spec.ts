import { TestBed } from '@angular/core/testing';
import { ICON_ASSET_LOADER, ICON_ASSET_PATHS } from '../../services/icon-registry.service';
import { ALL_ICON_NAMES, APP_ICONS, isIconName } from '../icon/icon-catalog';
import { iconSnippet } from '../icon/icon-libraries';
import { ICON_PAGE_SIZE, IconGalleryComponent } from './icon-gallery.component';

/** Set falso de Tabler con más íconos que una tanda. */
const tablerNames = Array.from({ length: ICON_PAGE_SIZE + 20 }, (_, i) => `icon-${String(i).padStart(3, '0')}`);
const tablerSet = Object.fromEntries(tablerNames.map((n) => [n, [['path', { d: 'M0 0h1' }]]]));

describe('IconGalleryComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ICON_ASSET_LOADER,
          useValue: async (path: string) =>
            path === ICON_ASSET_PATHS.tabler || path === ICON_ASSET_PATHS['tabler-filled'] ? tablerSet : {},
        },
      ],
    });
  });

  const create = async (library: 'feather' | 'tabler' = 'feather') => {
    const fixture = TestBed.createComponent(IconGalleryComponent);
    fixture.componentRef.setInput('library', library);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    return fixture;
  };

  it('todos los íconos de la app existen en Feather', () => {
    expect(APP_ICONS.filter((i) => !isIconName(i.name)).map((i) => i.name)).toEqual([]);
  });

  it('genera la etiqueta según la librería', () => {
    expect(iconSnippet('feather', 'plus')).toBe('<app-icon name="plus" />');
    expect(iconSnippet('lucide', 'wallet')).toBe('<app-icon library="lucide" name="wallet" />');
    expect(iconSnippet('tabler', 'heart', true)).toBe('<app-icon library="tabler" name="heart" filled />');
  });

  it('Feather: muestra los íconos de la app y el catálogo, cada uno con su etiqueta visible', async () => {
    const fixture = await create('feather');
    const host = fixture.nativeElement as HTMLElement;
    const tiles = host.querySelectorAll('.sg-gallery__tile');
    expect(tiles.length).toBe(APP_ICONS.length + ALL_ICON_NAMES.length);
    expect(host.querySelector('.sg-gallery__snippet')!.textContent).toContain('<app-icon name=');
    expect(host.textContent).toContain('Cómo usarlo');
  });

  it('Tabler: carga por tandas y permite mostrar más', async () => {
    const fixture = await create('tabler');
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.sg-gallery__tile').length).toBe(ICON_PAGE_SIZE);
    expect(host.textContent).toContain('20 restantes');
    fixture.componentInstance.showMore();
    await fixture.whenStable();
    expect(host.querySelectorAll('.sg-gallery__tile').length).toBe(ICON_PAGE_SIZE + 20);
    expect(host.querySelector('.sg-gallery__snippet')!.textContent).toContain('library="tabler"');
  });

  it('Tabler: el modo relleno cambia la etiqueta', async () => {
    const fixture = await create('tabler');
    fixture.componentInstance.filled.set(true);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    expect(fixture.componentInstance.snippet('icon-000')).toBe('<app-icon library="tabler" name="icon-000" filled />');
  });

  it('filtra por nombre o por uso', async () => {
    const fixture = await create('feather');
    fixture.componentInstance.query.set('eliminar');
    await fixture.whenStable();
    expect(fixture.componentInstance.appIcons().map((i) => i.name)).toEqual(['trash-2']);
    fixture.componentInstance.query.set('trash');
    await fixture.whenStable();
    expect(fixture.componentInstance.filtered()).toEqual(['trash', 'trash-2']);
  });

  it('copia la etiqueta <app-icon> al hacer clic', async () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    const fixture = await create('feather');
    await fixture.componentInstance.copy('bell');
    expect(writeText).toHaveBeenCalledWith('<app-icon name="bell" />');
    expect(fixture.componentInstance.copied()).toBe('bell');
  });
});
