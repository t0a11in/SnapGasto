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
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { validationMessages } from '../../forms/validation-messages';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { DATEPICKER_LOCALE_PROVIDERS, dateStructToIso, isoToDateStruct } from './date-picker-locale';

let nextId = 0;

/**
 * Campo de fecha con calendario desplegable. El usuario ve y escribe
 * dd-mm-aaaa; el valor del formulario es 'AAAA-MM-DD' ('' si está vacío),
 * igual que en el resto de la app.
 *
 * ```html
 * <app-date-picker label="Fecha" [formField]="form.date" [max]="today" />
 * ```
 */
@Component({
  selector: 'app-date-picker',
  imports: [FormsModule, NgbInputDatepicker, IconButtonComponent],
  providers: [DATEPICKER_LOCALE_PROVIDERS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
})
export class DatePickerComponent implements FormValueControl<string> {
  readonly value = model('');

  readonly label = input('');
  readonly hint = input('');
  readonly placeholder = input('dd-mm-aaaa');

  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly name = input('');
  /** Fecha mínima seleccionable, 'AAAA-MM-DD'. */
  readonly min = input<string | undefined>(undefined);
  /** Fecha máxima seleccionable, 'AAAA-MM-DD'. */
  readonly max = input<string | undefined>(undefined);
  readonly touch = output<void>();

  readonly inputId = `sg-date-${++nextId}`;
  readonly hintId = `${this.inputId}-hint`;
  readonly errorId = `${this.inputId}-errors`;

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('control');

  /** Lo que muestra el datepicker; solo cambia cuando el valor llega desde fuera. */
  readonly viewDate = signal<NgbDateStruct | null>(null);
  /** El texto escrito no es una fecha válida. */
  readonly invalidText = signal(false);
  private lastUserValue: string | null = null;

  readonly minDate = computed(() => isoToDateStruct(this.min()) ?? undefined);
  readonly maxDate = computed(() => isoToDateStruct(this.max()) ?? undefined);
  readonly messages = computed(() => [
    ...(this.invalidText() ? ['Usa el formato dd-mm-aaaa.'] : []),
    ...validationMessages(this.errors()),
  ]);
  readonly showErrors = computed(() => (this.touched() || this.invalidText()) && this.messages().length > 0);
  readonly describedBy = computed(() => {
    const ids = [this.showErrors() ? this.errorId : '', this.hint() ? this.hintId : ''].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  constructor() {
    effect(() => {
      const value = this.value();
      if (value !== this.lastUserValue) {
        this.viewDate.set(isoToDateStruct(value));
        this.invalidText.set(false);
      }
    });
  }

  /** ng-bootstrap entrega una fecha, null (vacío) o el texto si no pudo leerlo. */
  onPickerChange(picked: NgbDateStruct | string | null): void {
    const iso = picked && typeof picked === 'object' ? dateStructToIso(picked) : '';
    this.invalidText.set(typeof picked === 'string' && picked.trim() !== '');
    this.lastUserValue = iso;
    this.value.set(iso);
  }

  onBlur(): void {
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.inputEl()?.nativeElement.focus(options);
  }
}
