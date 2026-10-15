import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AdminUser, AdminUserPayload, Role } from '../../core/models/api.models';

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule],
  templateUrl: './users-page.component.html'
})
export class UsersPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly api = inject(AdminApiService);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editing = signal<AdminUser | null | undefined>(undefined);
  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['USER' as Role, Validators.required],
    password: ['', [Validators.minLength(8), Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.users().subscribe({
      next: (users) => this.users.set(users),
      error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.message.set('');
    this.editing.set(null);
    this.form.reset({ fullName: '', email: '', role: 'USER', password: '' });
  }

  openEdit(user: AdminUser): void {
    this.message.set('');
    this.editing.set(user);
    this.form.reset({ fullName: user.fullName, email: user.email, role: user.role, password: '' });
  }

  closeModal(): void {
    this.editing.set(undefined);
  }

  save(): void {
    const editing = this.editing();
    if (editing === undefined || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const password = value.password.trim();
    if (!editing && !password) {
      this.form.controls.password.setErrors({ required: true });
      this.form.controls.password.markAsTouched();
      return;
    }
    const payload: AdminUserPayload = {
      fullName: value.fullName.trim(),
      email: value.email.trim(),
      role: value.role,
      ...(password ? { password } : {})
    };
    this.saving.set(true);
    const request = editing ? this.api.updateUser(editing.id, payload) : this.api.createUser(payload);
    request.subscribe({
      next: () => {
        this.message.set('Usuario guardado correctamente.');
        this.closeModal();
        this.load();
      },
      error: (error: Error) => { this.message.set(error.message); this.saving.set(false); },
      complete: () => this.saving.set(false)
    });
  }

  remove(user: AdminUser): void {
    if (!confirm(`¿Eliminar a ${user.fullName}? También se eliminarán sus gastos y notificaciones.`)) return;
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.message.set('Usuario eliminado.');
        this.load();
      },
      error: (error: Error) => this.message.set(error.message)
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
}
