import { computed, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { AdminCrudApi } from '../../../core/services/admin-crud-api';

/**
 * Estado genérico para un mantenedor ADMIN (listado plano + CRUD).
 * Se instancia por pantalla: `new AdminResourceStore(inject(AdminUsersApiService))`.
 */
export class AdminResourceStore<TReq, TRes extends { id: string }> {
  readonly items = signal<TRes[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly count = computed(() => this.items().length);

  constructor(private readonly api: AdminCrudApi<TReq, TRes>) {}

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.items.set(items ?? []);
          this.loaded.set(true);
        },
        error: (err: unknown) => this.error.set(errorMessage(err)),
      });
  }

  save(id: string | null, body: TReq): Observable<TRes> {
    const request$ = id ? this.api.update(id, body) : this.api.create(body);
    return request$.pipe(tap((saved) => this.upsert(saved)));
  }

  remove(id: string): Observable<void> {
    return this.api
      .remove(id)
      .pipe(tap(() => this.items.update((list) => list.filter((i) => i.id !== id))));
  }

  private upsert(saved: TRes): void {
    if (!saved || !saved.id) {
      this.load();
      return;
    }
    this.items.update((list) => {
      const idx = list.findIndex((i) => i.id === saved.id);
      if (idx === -1) {
        return [saved, ...list];
      }
      const copy = [...list];
      copy[idx] = saved;
      return copy;
    });
  }
}
