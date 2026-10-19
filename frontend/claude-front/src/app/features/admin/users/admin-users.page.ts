import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { AdminUserResponse } from '../../../core/models';
import { AdminUsersApiService } from '../../../core/services/admin-api.services';
import { SessionStore } from '../../../core/state/session.store';
import { ConfirmService } from '../../../shared/components/confirm.service';
import { ToastService } from '../../../shared/components/toast.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminResourceStore } from '../shared/admin-resource.store';
import { TableStateComponent } from '../shared/table-state.component';
import { UserFormModalComponent } from './user-form-modal.component';

@Component({
  selector: 'app-admin-users-page',
  imports: [DatePipe, IconComponent, AdminPageHeaderComponent, TableStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss',
})
export class AdminUsersPage {
  readonly store = new AdminResourceStore(inject(AdminUsersApiService));
  private readonly modal = inject(NgbModal);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  private readonly session = inject(SessionStore);
  readonly currentUserId = computed(() => this.session.user()?.id ?? null);
  readonly query = signal('');
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const items = [...this.store.items()].sort((a, b) => a.fullName.localeCompare(b.fullName));
    return q ? items.filter((u) => `${u.fullName} ${u.email}`.toLowerCase().includes(q)) : items;
  });

  constructor() {
    this.store.load();
  }

  openForm(user: AdminUserResponse | null = null): void {
    const ref = this.modal.open(UserFormModalComponent, { ariaLabelledBy: 'user-modal-title' });
    (ref.componentInstance as UserFormModalComponent).configure(this.store, user);
    ref.result.then(() => this.toast.success(user ? 'Usuario actualizado.' : 'Usuario creado.'), () => undefined);
  }

  async remove(user: AdminUserResponse): Promise<void> {
    if (!(await this.confirm.confirm({ title: 'Eliminar usuario', message: `¿Eliminar a ${user.fullName}?`, confirmText: 'Eliminar' }))) {
      return;
    }
    try {
      await firstValueFrom(this.store.remove(user.id), { defaultValue: undefined });
      this.toast.success('Usuario eliminado.');
    } catch (err) {
      this.toast.error(errorMessage(err));
    }
  }
}
