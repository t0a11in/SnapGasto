import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AppNotification, NotificationPayload, AdminUser } from '../../core/models/api.models';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-notifications-page',
  imports: [ReactiveFormsModule],
  templateUrl: './notifications-page.component.html'
})
export class NotificationsPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly api = inject(AdminApiService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editing = signal<AppNotification | null | undefined>(undefined);
  readonly form = this.formBuilder.group({
    userId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(140)]],
    body: ['', [Validators.required, Validators.maxLength(1000)]],
    read: [false]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ notifications: this.api.notifications(), users: this.api.users() }).subscribe({
      next: ({ notifications, users }) => {
        this.notifications.set(notifications);
        this.users.set(users);
      },
      error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.message.set('');
    this.editing.set(null);
    this.form.reset({ userId: this.users()[0]?.id ?? '', title: '', body: '', read: false });
  }

  openEdit(notification: AppNotification): void {
    this.message.set('');
    this.editing.set(notification);
    this.form.reset({
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      read: notification.read
    });
  }

  closeModal(): void { this.editing.set(undefined); }

  save(): void {
    const editing = this.editing();
    if (editing === undefined || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: NotificationPayload = {
      userId: value.userId,
      title: value.title.trim(),
      body: value.body.trim(),
      read: value.read
    };
    this.saving.set(true);
    const request = editing ? this.api.updateNotification(editing.id, payload) : this.api.createNotification(payload);
    request.subscribe({
      next: () => {
        this.message.set('Notificación guardada correctamente.');
        this.closeModal();
        this.load();
      },
      error: (error: Error) => { this.message.set(error.message); this.saving.set(false); },
      complete: () => this.saving.set(false)
    });
  }

  remove(notification: AppNotification): void {
    if (!confirm('¿Eliminar esta notificación?')) return;
    this.api.deleteNotification(notification.id).subscribe({
      next: () => { this.message.set('Notificación eliminada.'); this.load(); },
      error: (error: Error) => this.message.set(error.message)
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
}
