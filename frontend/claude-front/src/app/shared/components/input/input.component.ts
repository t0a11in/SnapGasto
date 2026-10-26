import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { validationMessages } from '../../forms/validation-messages';
import { IconComponent } from '../icon/icon.component';

export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number' | 'textarea';
export type InputValue = string | number | null;

let nextId = 0;

/**
 * Campo de texto de la app: texto, correo, búsqueda, teléfono, URL, número o
 * área de texto, con etiqueta, ayuda, ícono, sufijo, contador y errores.
 *
 * Funciona directo con Signal Forms (`[formField]`) o con `[(value)]`:
 *
 * ```html
 * <app-input label="Descripción" type="textarea" [formField]="form.description" [showCounter]="true" />
 * <app-input label="Monto" type="number" icon="dollar-sign" suffix="CLP" [formField]="form.amount" />
 * <app-input placeholder="Buscar…" type="search" icon="search" [(value)]="query" />
 * ```
 *
 * Con `type="number"` el valor es `number | null` (vacío = `null`); en el
 * resto es `string`. Para contraseñas con botón de mostrar usa `app-password-input`.
 */
@Component({
  selector: 'app-input',
  imports: [NgTemplateOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements FormValueControl<InputValue> {
  readonly value = model<InputValue>('');

  readonly type = input<InputType>('text');
  readonly label = input('');
  readonly hint = input('');
  readonly placeholder = input('');
  /** Ícono Feather que se muestra al inicio del campo. */
  readonly icon = input('');
  /** Texto fijo al final del campo (por ejemplo "CLP" o "%"). */
  readonly suffix = input('');
  readonly rows = input(3);
  readonly autocomplete = input<string | null>(null);
  readonly inputMode = input<string | null>(null);
  readonly step = input<number | 'any' | null>(null);
  /** Muestra "n / máximo" cuando hay `maxLength`. */
  readonly showCounter = input(false, { transform: booleanAttribute });

  // Estado que Signal Forms entrega automáticamente al usar [formField].
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly min = input<string | number | undefined>(undefined);
  readonly max = input<string | number | undefined>(undefined);
  readonly minLength = input<number | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly touch = output<void>();

  readonly inputId = `sg-input-${++nextId}`;
  readonly hintId = `${this.inputId}-hint`;
  readonly errorId = `${this.inputId}-errors`;

  private readonly control = viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('control');

  readonly isTextarea = computed(() => this.type() === 'textarea');
  readonly isNumber = computed(() => this.type() === 'number');
  readonly hasAddons = computed(() => !!this.icon() || !!this.suffix());
  readonly messages = computed(() => validationMessages(this.errors()));
  readonly showErrors = computed(() => this.touched() && this.messages().length > 0);
  readonly length = computed(() => String(this.value() ?? '').length);
  readonly describedBy = computed(() => {
    const ids = [this.showErrors() ? this.errorId : '', this.hint() ? this.hintId : ''].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  constructor() {
    // Solo se escribe en el DOM cuando el modelo cambia desde fuera; así no se
    // pierde el cursor ni un número a medio escribir (por ejemplo "12,").
    effect(() => {
      const value = this.value();
      const el = this.control()?.nativeElement;
      if (el && !Object.is(this.parse(el.value, el), value)) {
        el.value = value === null || value === undefined ? '' : String(value);
      }
    });
  }

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value.set(this.parse(el.value, el));
  }

  onBlur(): void {
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.control()?.nativeElement.focus(options);
  }

  private parse(raw: string, el: HTMLInputElement | HTMLTextAreaElement): InputValue {
    if (!this.isNumber()) {
      return raw;
    }
    if (raw === '') {
      return null;
    }
    const n = el instanceof HTMLInputElement ? el.valueAsNumber : Number(raw);
    return Number.isNaN(n) ? null : n;
  }
}
