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
} from './button.types';

/**
 * Botón de la app. Se aplica sobre un `<button>` o un `<a>` nativo para
 * conservar su semántica (envío de formularios, foco, enlaces):
 *
 * ```html
 * <button appButton variant="primary" icon="plus">Agregar</button>
 * <button appButton type="submit" [loading]="saving()">Guardar</button>
 * <a appButton appearance="outline" routerLink="/expenses">Ver gastos</a>
 * ```
 */
@Component({
  selector: 'button[appButton], a[appButton]',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  host: {
    '[class]': 'classes()',
    '[attr.type]': 'isButton ? type() : null',
    '[attr.disabled]': 'isButton && isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.tabindex]': '!isButton && isDisabled() ? -1 : null',
    '(click)': 'onClick($event)',
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly appearance = input<ButtonAppearance>('solid');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  /** Nombre de un ícono Feather (ver la galería en /ui/icons). */
  readonly icon = input<string>('');
  /** Librería del ícono: feather (por defecto), lucide, tabler o bootstrap. */
  readonly iconLibrary = input<IconLibrary>('feather');
  readonly iconPosition = input<'start' | 'end'>('start');
  /** Muestra un spinner y bloquea el botón mientras dura una acción. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Ocupa todo el ancho disponible. */
  readonly block = input(false, { transform: booleanAttribute });

  readonly isButton = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';

  readonly isDisabled = computed(() => this.disabled() || this.loading());
  readonly iconSize = computed(() => buttonIconSize(this.size()));
  readonly classes = computed(
    () =>
      `${buttonClasses(this.variant(), this.appearance(), this.size())} sg-btn` +
      (this.block() ? ' w-100' : '') +
      (this.isDisabled() && !this.isButton ? ' disabled' : ''),
  );

  /** Un enlace no tiene atributo disabled: se bloquea la navegación a mano. */
  onClick(event: Event): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
