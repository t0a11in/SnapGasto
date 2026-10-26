import { ChangeDetectionStrategy, Component, Signal, computed, input } from '@angular/core';

/** Subconjunto estructural de un campo de Signal Forms (cualquier tipo de valor). */
export type FieldLike = () => {
  errors: Signal<readonly { kind: string; message?: string }[]>;
  touched: Signal<boolean>;
};

const FALLBACK: Record<string, string> = {
  required: 'Este campo es obligatorio.',
  email: 'Ingresa un correo válido.',
  minLength: 'El valor es demasiado corto.',
  maxLength: 'El valor es demasiado largo.',
  min: 'El valor es demasiado bajo.',
  max: 'El valor es demasiado alto.',
  pattern: 'El formato no es válido.',
};

/** Muestra los errores de un campo de Signal Forms una vez que fue tocado. */
@Component({
  selector: 'app-field-errors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-errors.component.html',
})
export class FieldErrorsComponent {
  readonly field = input.required<FieldLike>();
  readonly errorId = input<string | null>(null);

  readonly messages = computed(() =>
    this.field()()
      .errors()
      .map((e) => e.message ?? FALLBACK[e.kind] ?? 'Valor no válido.'),
  );

  readonly visible = computed(() => this.field()().touched() && this.messages().length > 0);
}
