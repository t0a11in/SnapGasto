import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryPayload } from '../../core/models/api.models';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-categories-page',
  imports: [ReactiveFormsModule],
  templateUrl: './categories-page.component.html'
})
export class CategoriesPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly api = inject(AdminApiService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editing = signal<Category | null | undefined>(undefined);
  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    icon: ['', Validators.maxLength(80)],
    colorHex: ['#2563eb', Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.categories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.message.set('');
    this.editing.set(null);
    this.form.reset({ name: '', icon: '', colorHex: '#2563eb' });
  }

  openEdit(category: Category): void {
    this.message.set('');
    this.editing.set(category);
    this.form.reset({ name: category.name, icon: category.icon ?? '', colorHex: category.colorHex ?? '#2563eb' });
  }

  closeModal(): void { this.editing.set(undefined); }

  save(): void {
    const editing = this.editing();
    if (editing === undefined || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: CategoryPayload = {
      name: value.name.trim(),
      icon: value.icon.trim() || null,
      colorHex: value.colorHex || null
    };
    this.saving.set(true);
    const request = editing ? this.api.updateCategory(editing.id, payload) : this.api.createCategory(payload);
    request.subscribe({
      next: () => {
        this.message.set('Categoría guardada correctamente.');
        this.closeModal();
        this.load();
      },
      error: (error: Error) => { this.message.set(error.message); this.saving.set(false); },
      complete: () => this.saving.set(false)
    });
  }

  remove(category: Category): void {
    if (!confirm(`¿Eliminar la categoría ${category.name}?`)) return;
    this.api.deleteCategory(category.id).subscribe({
      next: () => { this.message.set('Categoría eliminada.'); this.load(); },
      error: (error: Error) => this.message.set(error.message)
    });
  }
}
