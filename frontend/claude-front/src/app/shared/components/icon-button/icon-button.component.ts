import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, computed, inject, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconLibrary } from '../icon/icon-libraries';
import {
  ButtonAppearance,
  ButtonSize,
  ButtonType,
  ButtonVariant,
  buttonClasses,
  buttonIconSize,
} from '../button/button.types';

/**
 * Botón cuadrado que solo muestra un ícono (editar, eliminar, cerrar…).
 * `label` es obligatorio: es lo que lee el lector de pantalla y el tooltip.
 *
 * ```html
 * <button appIconButton icon="trash-2" label="Eliminar gasto" variant="danger" (click)="remove()"></button>
 * ```
 *
 * Para un botón con ícono y texto, usar `appButton` con `icon`.
 */
@Component({
  selector: 'button[appIconButton], a[appIconButton]',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    } @else {
      <app-icon [library]="iconLibrary()" [name]="icon()" [size]="iconSize()" />
    }
  `,
  styleUrl: './icon-button.component.scss',
  host: {
    '[class]': 'classes()',
    '[attr.type]': 'isButton ? type() : null',
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'label()',
    '[attr.disabled]': 'isButton && isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.tabindex]': '!isButton && isDisabled() ? -1 : null',
    '(click)': 'onClick($event)',
  },
})
export class IconButtonComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  /** Librería del ícono: feather (por defecto), lucide, tabler o bootstrap. */
  readonly iconLibrary = input<IconLibrary>('feather');
  readonly variant = input<ButtonVariant>('secondary');
  readonly appearance = input<ButtonAppearance>('ghost');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly isButton = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';

  readonly isDisabled = computed(() => this.disabled() || this.loading());
  readonly iconSize = computed(() => buttonIconSize(this.size()));
  readonly classes = computed(
    () =>
      `${buttonClasses(this.variant(), this.appearance(), this.size())} sg-icon-btn sg-icon-btn--${this.size()}` +
      (this.isDisabled() && !this.isButton ? ' disabled' : ''),
  );

  onClick(event: Event): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
