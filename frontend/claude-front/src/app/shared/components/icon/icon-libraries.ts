/** Librerías de íconos disponibles en `<app-icon library="…">`. */
export type IconLibrary = 'feather' | 'lucide' | 'tabler' | 'bootstrap';

export interface IconLibraryInfo {
  readonly id: IconLibrary;
  readonly name: string;
  readonly npmPackage: string;
  readonly license: string;
  readonly website: string;
  readonly description: string;
  /** Acepta `strokeWidth` (íconos de línea). */
  readonly stroked: boolean;
  /** Tiene versión rellena con `filled`. */
  readonly hasFilled: boolean;
}

export const ICON_LIBRARIES: Readonly<Record<IconLibrary, IconLibraryInfo>> = {
  feather: {
    id: 'feather',
    name: 'Feather',
    npmPackage: 'feather-icons',
    license: 'MIT',
    website: 'https://feathericons.com',
    description: 'La librería original de la app. Íconos de línea simples, 24 × 24.',
    stroked: true,
    hasFilled: false,
  },
  lucide: {
    id: 'lucide',
    name: 'Lucide',
    npmPackage: 'lucide-static',
    license: 'ISC',
    website: 'https://lucide.dev',
    description: 'Continuación de Feather con el mismo estilo y muchos más íconos.',
    stroked: true,
    hasFilled: false,
  },
  tabler: {
    id: 'tabler',
    name: 'Tabler',
    npmPackage: '@tabler/icons',
    license: 'MIT',
    website: 'https://tabler.io/icons',
    description: 'El catálogo más grande, con versión de línea y rellena.',
    stroked: true,
    hasFilled: true,
  },
  bootstrap: {
    id: 'bootstrap',
    name: 'Bootstrap Icons',
    npmPackage: 'bootstrap-icons',
    license: 'MIT',
    website: 'https://icons.getbootstrap.com',
    description: 'Del equipo de Bootstrap. Las versiones rellenas terminan en "-fill". Grilla de 16 × 16.',
    stroked: false,
    hasFilled: false,
  },
};

export const ICON_LIBRARY_IDS = Object.keys(ICON_LIBRARIES) as IconLibrary[];

/** Etiqueta lista para copiar y pegar en un template. */
export function iconSnippet(library: IconLibrary, name: string, filled = false): string {
  const lib = library === 'feather' ? '' : ` library="${library}"`;
  return `<app-icon${lib} name="${name}"${filled ? ' filled' : ''} />`;
}
