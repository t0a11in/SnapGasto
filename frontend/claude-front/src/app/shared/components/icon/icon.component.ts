import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  booleanAttribute,
  effect,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import feather from 'feather-icons';
import {
  BOOTSTRAP_SPRITE_PATH,
  IconNode,
  IconRegistryService,
  IconSetId,
} from '../../services/icon-registry.service';
import { IconLibrary } from './icon-libraries';

const SVG_NS = 'svg';
/** Únicos elementos y atributos que se aceptan al dibujar un ícono. */
const ALLOWED_TAGS = new Set(['path', 'circle', 'rect', 'line', 'ellipse', 'polyline', 'polygon']);
const ALLOWED_ATTRS = new Set([
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2',
  'width', 'height', 'points', 'fill', 'stroke', 'opacity',
]);

/**
 * Ícono de la app. Por defecto usa Feather; con `library` usa Lucide, Tabler
 * o Bootstrap Icons. Ver todos los nombres en el menú "Íconos".
 *
 * ```html
 * <app-icon name="trash-2" />
 * <app-icon library="lucide" name="wallet" [size]="20" />
 * <app-icon library="tabler" name="heart" filled />
 * <app-icon library="bootstrap" name="bank" label="Banco" />
 * ```
 *
 * Los SVG vienen solo de los paquetes instalados (nunca de datos del usuario),
 * se construyen nodo a nodo con una lista blanca de etiquetas y atributos, sin
 * innerHTML ni bypass del sanitizador.
 */
@Component({
  selector: 'app-icon',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-icon d-inline-flex align-middle',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
  },
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly library = input<IconLibrary>('feather');
  /** Versión rellena (solo Tabler; en Bootstrap usa los nombres "-fill"). */
  readonly filled = input(false, { transform: booleanAttribute });
  readonly size = input<number>(18);
  /** Grosor del trazo (Feather, Lucide y Tabler de línea). */
  readonly strokeWidth = input<number>(2);
  /** Texto para lectores de pantalla. Vacío = ícono decorativo. */
  readonly label = input<string>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly registry = inject(IconRegistryService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private renderId = 0;

  constructor() {
    effect(() => {
      const request = {
        name: this.name(),
        library: this.library(),
        filled: this.filled(),
        size: this.size(),
        strokeWidth: this.strokeWidth(),
      };
      void this.render(request);
    });
  }

  private async render(r: {
    name: string;
    library: IconLibrary;
    filled: boolean;
    size: number;
    strokeWidth: number;
  }): Promise<void> {
    const id = ++this.renderId;
    if (!this.isBrowser) {
      return;
    }
    if (r.library === 'feather') {
      this.replaceWith(this.featherSvg(r.name, r.size, r.strokeWidth));
      return;
    }

    const setId: IconSetId = r.library === 'tabler' && r.filled ? 'tabler-filled' : r.library;
    let svg: SVGElement | null = null;
    try {
      const set = await this.registry.load(setId);
      if (r.library === 'bootstrap') {
        svg = set.names.includes(r.name) ? this.bootstrapSvg(r.name, r.size) : null;
      } else {
        const node = set.nodes && Object.prototype.hasOwnProperty.call(set.nodes, r.name) ? set.nodes[r.name] : null;
        svg = node ? this.nodeSvg(node, r.size, r.strokeWidth, setId === 'tabler-filled') : null;
      }
    } catch {
      svg = null;
    }
    // Si mientras se cargaba cambió el ícono pedido, se descarta este resultado.
    if (id === this.renderId) {
      this.replaceWith(svg);
    }
  }

  private replaceWith(svg: SVGElement | Element | null): void {
    const el = this.host.nativeElement;
    while (el.firstChild) {
      this.renderer.removeChild(el, el.firstChild);
    }
    if (svg) {
      this.renderer.setAttribute(svg, 'focusable', 'false');
      this.renderer.appendChild(el, svg);
    }
  }

  private featherSvg(name: string, size: number, strokeWidth: number): Element | null {
    const icon = Object.prototype.hasOwnProperty.call(feather.icons, name) ? feather.icons[name] : undefined;
    if (!icon) {
      return null;
    }
    const markup = icon.toSvg({ width: size, height: size, 'stroke-width': strokeWidth });
    const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
    return svg.nodeName.toLowerCase() === 'svg' ? document.importNode(svg, true) : null;
  }

  private nodeSvg(node: IconNode, size: number, strokeWidth: number, filled: boolean): SVGElement {
    const svg = this.svgRoot(size, '0 0 24 24');
    if (filled) {
      this.renderer.setAttribute(svg, 'fill', 'currentColor');
      this.renderer.setAttribute(svg, 'stroke', 'none');
    } else {
      this.renderer.setAttribute(svg, 'fill', 'none');
      this.renderer.setAttribute(svg, 'stroke', 'currentColor');
      this.renderer.setAttribute(svg, 'stroke-width', String(strokeWidth));
      this.renderer.setAttribute(svg, 'stroke-linecap', 'round');
      this.renderer.setAttribute(svg, 'stroke-linejoin', 'round');
    }
    for (const [tag, attrs] of node) {
      if (!ALLOWED_TAGS.has(tag)) {
        continue;
      }
      const child: SVGElement = this.renderer.createElement(tag, SVG_NS);
      for (const [key, value] of Object.entries(attrs)) {
        if (ALLOWED_ATTRS.has(key)) {
          this.renderer.setAttribute(child, key, String(value));
        }
      }
      this.renderer.appendChild(svg, child);
    }
    return svg;
  }

  private bootstrapSvg(name: string, size: number): SVGElement {
    const svg = this.svgRoot(size, '0 0 16 16');
    this.renderer.setAttribute(svg, 'fill', 'currentColor');
    const use: SVGElement = this.renderer.createElement('use', SVG_NS);
    // El nombre ya se validó contra la lista oficial de Bootstrap Icons.
    this.renderer.setAttribute(use, 'href', `${BOOTSTRAP_SPRITE_PATH}#${name}`);
    this.renderer.appendChild(svg, use);
    return svg;
  }

  private svgRoot(size: number, viewBox: string): SVGElement {
    const svg: SVGElement = this.renderer.createElement('svg', SVG_NS);
    this.renderer.setAttribute(svg, 'width', String(size));
    this.renderer.setAttribute(svg, 'height', String(size));
    this.renderer.setAttribute(svg, 'viewBox', viewBox);
    return svg;
  }
}
