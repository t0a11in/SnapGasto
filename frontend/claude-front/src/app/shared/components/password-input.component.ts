import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { IconComponent } from '../icons/icon.component';
import { FieldErrorsComponent } from './field-errors.component';

let nextId = 0;

/** Campo de contraseña reutilizable con botón mostrar/ocultar. */
@Component({
  selector: 'app-password-input',
  imports: [FormField, IconComponent, FieldErrorsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-input.component.html',
  styleUrl: './password-input.component.scss',
})
export class PasswordInputComponent {
  readonly field = input.required<FieldTree<string>>();
  readonly label = input('Contraseña');
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');
  readonly hint = input<string>('');

  readonly inputId = `password-${++nextId}`;
  readonly errorId = `${this.inputId}-errors`;
  readonly hintId = `${this.inputId}-hint`;

  readonly visible = signal(false);
  readonly invalid = computed(() => this.field()().touched() && this.field()().invalid());

  toggle(): void {
    this.visible.update((v) => !v);
  }
}
