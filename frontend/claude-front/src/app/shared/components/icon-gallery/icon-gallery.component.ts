import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IconRegistryService, IconSetId } from '../../services/icon-registry.service';
import { ButtonComponent } from '../button/button.component';
import { CardComponent } from '../card/card.component';
import { IconComponent } from '../icon/icon.component';
import { APP_ICONS } from '../icon/icon-catalog';
import { ICON_LIBRARIES, IconLibrary, iconSnippet } from '../icon/icon-libraries';
import { InputComponent, InputValue } from '../input/input.component';

/** Íconos que se dibujan por tanda; Tabler tiene más de 5.000. */
export const ICON_PAGE_SIZE = 300;

/**
 * Página con todos los íconos de una librería. La librería llega desde la
 * ruta (`data: { library: 'tabler' }`). Cada ícono muestra la etiqueta para
 * usarlo y al hacer clic la copia al portapapeles.
 */
@Component({
  selector: 'app-icon-gallery',
  imports: [ButtonComponent, CardComponent, IconComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-gallery.component.html',
  styleUrl: './icon-gallery.component.scss',
})
export class IconGalleryComponent {
  private readonly registry = inject(IconRegistryService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly library = input<IconLibrary>('feather');

  readonly sizes = [16, 24, 32] as const;
  readonly size = signal<number>(24);
  readonly query = signal<InputValue>('');
  readonly filled = signal(false);
  readonly copied = signal('');

  readonly names = signal<readonly string[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  readonly info = computed(() => ICON_LIBRARIES[this.library()]);
  readonly isFeather = computed(() => this.library() === 'feather');
  readonly showFilled = computed(() => this.info().hasFilled && this.filled());
  private readonly setId = computed<IconSetId>(() => (this.showFilled() ? 'tabler-filled' : this.library()));
  private readonly term = computed(() => String(this.query() ?? '').trim().toLowerCase());

  readonly appIcons = computed(() => {
    const t = this.term();
    return t ? APP_ICONS.filter((i) => i.name.includes(t) || i.usage.toLowerCase().includes(t)) : APP_ICONS;
  });
  readonly filtered = computed(() => {
    const t = this.term();
    return t ? this.names().filter((n) => n.includes(t)) : this.names();
  });
  /** Se reinicia al cambiar de librería, de variante o de búsqueda. */
  readonly visibleCount = linkedSignal({
    source: () => [this.library(), this.setId(), this.term()] as const,
    computation: () => ICON_PAGE_SIZE,
  });
  readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));
  readonly remaining = computed(() => Math.max(0, this.filtered().length - this.visibleCount()));

  readonly importLine =
    "import { IconComponent } from '<ruta>/shared/components/icon/icon.component';";
  readonly exampleName = computed(() => this.names()[0] ?? 'nombre');
  readonly exampleSnippet = computed(() => this.snippet(this.exampleName()));

  constructor() {
    effect(() => {
      const id = this.setId();
      this.loading.set(true);
      this.loadError.set(false);
      this.registry
        .load(id)
        .then((set) => {
          if (this.setId() === id) {
            this.names.set(set.names);
          }
        })
        .catch(() => this.loadError.set(true))
        .finally(() => this.loading.set(false));
    });
  }

  snippet(name: string): string {
    return iconSnippet(this.library(), name, this.showFilled());
  }

  showMore(): void {
    this.visibleCount.update((n) => n + ICON_PAGE_SIZE);
  }

  async copy(name: string): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.snippet(name));
      this.copied.set(name);
    } catch {
      this.copied.set('');
    }
  }
}
