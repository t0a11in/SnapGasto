import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import feather from 'feather-icons';

/**
 * Ícono Feather. El SVG proviene exclusivamente del catálogo estático de
 * feather-icons (nunca de datos del usuario) y se inserta como nodos DOM
 * parseados con DOMParser, sin innerHTML ni bypass del sanitizador.
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
  readonly size = input<number>(18);
  readonly strokeWidth = input<number>(2);
  readonly label = input<string>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    effect(() => this.render(this.name(), this.size(), this.strokeWidth()));
  }

  private render(name: string, size: number, strokeWidth: number): void {
    const el = this.host.nativeElement;
    while (el.firstChild) {
      this.renderer.removeChild(el, el.firstChild);
    }
    const icon = Object.prototype.hasOwnProperty.call(feather.icons, name)
      ? feather.icons[name]
      : undefined;
    if (!icon || !this.isBrowser) {
      return;
    }
    const markup = icon.toSvg({ width: size, height: size, 'stroke-width': strokeWidth });
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const svg = doc.documentElement;
    if (svg.nodeName.toLowerCase() !== 'svg') {
      return;
    }
    this.renderer.setAttribute(svg, 'focusable', 'false');
    this.renderer.appendChild(el, document.importNode(svg, true));
  }
}
