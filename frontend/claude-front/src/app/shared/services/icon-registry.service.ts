import { DOCUMENT, Injectable, InjectionToken, inject } from '@angular/core';
import feather from 'feather-icons';
import type { IconLibrary } from '../components/icon/icon-libraries';

/** Un elemento SVG: [etiqueta, atributos]. Formato de lucide-static y @tabler/icons. */
export type IconNode = readonly (readonly [string, Readonly<Record<string, string | number>>])[];

export interface IconSet {
  readonly names: readonly string[];
  /** Trazos de cada ícono (no existe para Feather ni Bootstrap). */
  readonly nodes?: Readonly<Record<string, IconNode>>;
}

/** Variante concreta que se descarga: Tabler tiene un archivo para línea y otro para relleno. */
export type IconSetId = IconLibrary | 'tabler-filled';

/**
 * Descarga un archivo de íconos publicado como asset (ver "assets" en
 * angular.json). Se puede reemplazar en los tests.
 */
export const ICON_ASSET_LOADER = new InjectionToken<(path: string) => Promise<unknown>>('ICON_ASSET_LOADER', {
  providedIn: 'root',
  factory: () => {
    const doc = inject(DOCUMENT);
    return async (path: string) => {
      const response = await fetch(new URL(path, doc.baseURI));
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${path} (${response.status}).`);
      }
      return response.json();
    };
  },
});

/** Ruta (relativa al <base href>) donde se publica cada set. */
export const ICON_ASSET_PATHS: Readonly<Record<Exclude<IconSetId, 'feather'>, string>> = {
  lucide: 'icons/lucide/icon-nodes.json',
  tabler: 'icons/tabler/tabler-nodes-outline.json',
  'tabler-filled': 'icons/tabler/tabler-nodes-filled.json',
  bootstrap: 'icons/bootstrap/bootstrap-icons.json',
};

/** Sprite de Bootstrap Icons: cada ícono es un <symbol id="nombre">. */
export const BOOTSTRAP_SPRITE_PATH = 'icons/bootstrap/bootstrap-icons.svg';

/**
 * Carga cada librería de íconos una sola vez y solo cuando se usa por primera
 * vez, para no sumar sus miles de íconos al JavaScript inicial de la app.
 */
@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  private readonly loadAsset = inject(ICON_ASSET_LOADER);
  private readonly cache = new Map<IconSetId, Promise<IconSet>>();

  load(id: IconSetId): Promise<IconSet> {
    let pending = this.cache.get(id);
    if (!pending) {
      pending = this.fetchSet(id);
      this.cache.set(id, pending);
      // Si falla (por ejemplo, sin conexión) se permite reintentar más tarde.
      pending.catch(() => this.cache.delete(id));
    }
    return pending;
  }

  private async fetchSet(id: IconSetId): Promise<IconSet> {
    if (id === 'feather') {
      return { names: Object.keys(feather.icons).sort() };
    }
    const data = (await this.loadAsset(ICON_ASSET_PATHS[id])) as Record<string, unknown>;
    const names = Object.keys(data).sort();
    // bootstrap-icons.json trae nombre → código de fuente; solo se usan los nombres.
    return id === 'bootstrap' ? { names } : { names, nodes: data as Record<string, IconNode> };
  }
}
