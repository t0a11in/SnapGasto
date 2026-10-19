import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { FieldErrorsComponent } from '../field-errors.component';

let nextId = 0;

/**
 * Campo de categoría con autocompletado sobre las categorías existentes.
 * Si el texto no coincide con ninguna, se acepta como categoría nueva.
 */
@Component({
  selector: 'app-category-autocomplete',
  imports: [FormField, FieldErrorsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-autocomplete.component.html',
  styleUrl: './category-autocomplete.component.scss',
})
export class CategoryAutocompleteComponent {
  readonly field = input.required<FieldTree<string>>();
  readonly options = input<readonly string[]>([]);
  readonly label = input('Categoría');
  readonly placeholder = input('Escribe o elige una categoría');

  readonly inputId = `category-${++nextId}`;
  readonly listId = `${this.inputId}-list`;
  readonly errorId = `${this.inputId}-errors`;

  readonly value = computed(() => this.field()().value().trim());
  readonly invalid = computed(() => this.field()().touched() && this.field()().invalid());

  /** true si el texto escrito no existe todavía (comparación sin distinguir mayúsculas). */
  readonly isNew = computed(() => {
    const v = this.value().toLocaleLowerCase('es');
    return v.length > 0 && !this.options().some((o) => o.toLocaleLowerCase('es') === v);
  });
}
