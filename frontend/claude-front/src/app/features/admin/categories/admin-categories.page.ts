import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { CategoryResponse } from '../../../core/models';
import { AdminCategoriesApiService } from '../../../core/services/admin-api.services';
import { ConfirmService } from '../../../shared/components/confirm.service';
import { ToastService } from '../../../shared/components/toast.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminResourceStore } from '../shared/admin-resource.store';
import { TableStateComponent } from '../shared/table-state.component';
import { CategoryFormModalComponent } from './category-form-modal.component';

@Component({
  selector: 'app-admin-categories-page',
  imports: [IconComponent, AdminPageHeaderComponent, TableStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-categories.page.html',
})
export class AdminCategoriesPage {
  readonly store = new AdminResourceStore(inject(AdminCategoriesApiService));
  private readonly modal = inject(NgbModal);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly sorted = computed(() => [...this.store.items()].sort((a, b) => a.name.localeCompare(b.name)));

  constructor() {
    this.store.load();
  }

  openForm(c: CategoryResponse | null = null): void {
    const ref = this.modal.open(CategoryFormModalComponent, { ariaLabelledBy: 'category-modal-title' });
    (ref.componentInstance as CategoryFormModalComponent).configure(this.store, c);
    ref.result.then(() => this.toast.success(c ? 'Categoría actualizada.' : 'Categoría creada.'), () => undefined);
  }

  async remove(c: CategoryResponse): Promise<void> {
    if (!(await this.confirm.confirm({ title: 'Eliminar categoría', message: `¿Eliminar la categoría "${c.name}"?`, confirmText: 'Eliminar' }))) {
      return;
    }
    try {
      await firstValueFrom(this.store.remove(c.id), { defaultValue: undefined });
      this.toast.success('Categoría eliminada.');
    } catch (err) {
      this.toast.error(errorMessage(err));
    }
  }
}
