import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { NotificationResponse } from '../../../core/models';
import { AdminNotificationsApiService, AdminUsersApiService } from '../../../core/services/admin-api.services';
import { ConfirmService } from '../../../shared/components/confirm.service';
import { ToastService } from '../../../shared/components/toast.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminResourceStore } from '../shared/admin-resource.store';
import { TableStateComponent } from '../shared/table-state.component';
import { NotificationFormModalComponent } from './notification-form-modal.component';

type ReadFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-admin-notifications-page',
  imports: [DatePipe, IconComponent, AdminPageHeaderComponent, TableStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-notifications.page.html',
  styleUrl: './admin-notifications.page.scss',
})
export class AdminNotificationsPage {
  readonly store = new AdminResourceStore(inject(AdminNotificationsApiService));
  readonly users = new AdminResourceStore(inject(AdminUsersApiService));
  private readonly modal = inject(NgbModal);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly readFilter = signal<ReadFilter>('all');
  readonly filtered = computed(() => {
    const f = this.readFilter();
    return this.store
      .items()
      .filter((n) => f === 'all' || (f === 'read' ? n.read : !n.read))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.store.load();
    this.users.load();
  }

  openForm(n: NotificationResponse | null = null): void {
    const ref = this.modal.open(NotificationFormModalComponent, { ariaLabelledBy: 'notification-modal-title' });
    (ref.componentInstance as NotificationFormModalComponent).configure(this.store, this.users.items(), n);
    ref.result.then(() => {
      this.toast.success(n ? 'Notificación actualizada.' : 'Notificación enviada.');
      this.store.load();
    }, () => undefined);
  }

  async toggleRead(n: NotificationResponse): Promise<void> {
    try {
      await firstValueFrom(
        this.store.save(n.id, { userId: n.userId, title: n.title, body: n.body, read: !n.read }),
      );
    } catch (err) {
      this.toast.error(errorMessage(err));
    }
  }

  async remove(n: NotificationResponse): Promise<void> {
    if (!(await this.confirm.confirm({ title: 'Eliminar notificación', message: `¿Eliminar "${n.title}"?`, confirmText: 'Eliminar' }))) {
      return;
    }
    try {
      await firstValueFrom(this.store.remove(n.id), { defaultValue: undefined });
      this.toast.success('Notificación eliminada.');
    } catch (err) {
      this.toast.error(errorMessage(err));
    }
  }
}
