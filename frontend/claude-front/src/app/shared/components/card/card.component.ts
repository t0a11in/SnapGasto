import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChild,
  input,
  model,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { CardActionsDirective, CardFooterDirective } from './card-slots.directive';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardTone = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';

let nextId = 0;

/**
 * Contenedor estándar de la app: título, subtítulo, ícono, acciones, cuerpo,
 * pie, estado de carga y opción de contraer.
 *
 * ```html
 * <app-card title="Gastos de octubre" subtitle="12 movimientos" icon="trending-down" tone="danger">
 *   <button cardActions appButton size="sm" icon="plus">Nuevo</button>
 *   …contenido…
 *   <div cardFooter>Total: {{ total | money }}</div>
 * </app-card>
 * ```
 */
@Component({
  selector: 'app-card',
  imports: [IconComponent, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  readonly title = input('');
  readonly subtitle = input('');
  /** Ícono Feather junto al título. */
  readonly icon = input('');
  /** Color del ícono del título. */
  readonly tone = input<CardTone>('primary');
  readonly variant = input<CardVariant>('default');
  readonly padding = input<CardPadding>('md');
  /** Nivel del título para lectores de pantalla (h2 por defecto). */
  readonly headingLevel = input<2 | 3 | 4 | 5 | 6>(2);
  /** Muestra un spinner sobre el cuerpo mientras se cargan datos. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Agrega un botón para contraer/expandir el cuerpo. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  readonly collapsed = model(false);

  private readonly actions = contentChild(CardActionsDirective);
  private readonly footer = contentChild(CardFooterDirective);

  readonly titleId = `sg-card-${++nextId}-title`;
  readonly bodyId = `sg-card-${nextId}-body`;

  readonly hasHeader = computed(() => !!this.title() || !!this.icon() || !!this.actions() || this.collapsible());
  readonly hasFooter = computed(() => !!this.footer());
  readonly cardClasses = computed(() => `card sg-card sg-card--${this.variant()}`);
  readonly bodyClasses = computed(() => `card-body sg-card__body sg-card__body--${this.padding()}`);

  toggle(): void {
    this.collapsed.update((c) => !c);
  }
}
