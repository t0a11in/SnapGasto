import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required, submit } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import feather from 'feather-icons';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { CategoryRequest, CategoryResponse } from '../../../core/models';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { optionalText } from '../../../shared/forms/common-validators';
import { IconComponent } from '../../../shared/icons/icon.component';
import { AdminResourceStore } from '../shared/admin-resource.store';

interface CategoryFormModel {
  name: string;
  icon: string;
  colorHex: string;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
export const FEATHER_ICON_NAMES = Object.keys(feather.icons).sort();

@Component({
  selector: 'app-category-form-modal',
  imports: [FormField, FieldErrorsComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form-modal.component.html',
})
export class CategoryFormModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private store: AdminResourceStore<CategoryRequest, CategoryResponse> | null = null;

  readonly iconNames = FEATHER_ICON_NAMES;
  readonly editingId = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);
  readonly model = signal<CategoryFormModel>({ name: '', icon: '', colorHex: '' });
  readonly categoryForm = form(this.model, (p) => {
    required(p.name, { message: 'Ingresa el nombre.' });
    maxLength(p.name, 80, { message: 'Máximo 80 caracteres.' });
    maxLength(p.icon, 80, { message: 'Máximo 80 caracteres.' });
    pattern(p.colorHex, /^$|^#[0-9A-Fa-f]{6}$/, { message: 'Usa el formato #RRGGBB.' });
  });

  readonly iconValid = computed(() => FEATHER_ICON_NAMES.includes(this.model().icon));
  readonly colorPickerValue = computed(() => (HEX_RE.test(this.model().colorHex) ? this.model().colorHex : '#6c757d'));

  configure(store: AdminResourceStore<CategoryRequest, CategoryResponse>, c: CategoryResponse | null): void {
    this.store = store;
    this.editingId.set(c?.id ?? null);
    this.model.set({ name: c?.name ?? '', icon: c?.icon ?? '', colorHex: c?.colorHex ?? '' });
  }

  setColor(value: string): void {
    this.model.update((m) => ({ ...m, colorHex: value.toUpperCase() }));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    const store = this.store;
    if (!store) {
      return;
    }
    await submit(this.categoryForm, async () => {
      const m = this.model();
      try {
        await firstValueFrom(
          store.save(this.editingId(), {
            name: m.name.trim(),
            icon: optionalText(m.icon),
            colorHex: optionalText(m.colorHex)?.toUpperCase() ?? null,
          }),
        );
        this.activeModal.close(true);
      } catch (err) {
        this.serverError.set(errorMessage(err));
      }
      return undefined;
    });
  }
}
