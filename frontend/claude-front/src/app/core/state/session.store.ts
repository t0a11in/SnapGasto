import { Injectable, computed, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../config/api.config';
import { AuthResponse, UserResponse } from '../models';
import { BrowserStorageService } from '../services/browser-storage.service';

interface PersistedSession {
  accessToken: string;
  user: UserResponse;
}

function isPersistedSession(value: unknown): value is PersistedSession {
  const v = value as Partial<PersistedSession> | null;
  return (
    !!v &&
    typeof v.accessToken === 'string' &&
    v.accessToken.length > 0 &&
    !!v.user &&
    typeof v.user.email === 'string' &&
    (v.user.role === 'ADMIN' || v.user.role === 'USER')
  );
}

/** Estado de sesión (token + usuario) basado en Signals y persistido en localStorage. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly storage = inject(BrowserStorageService);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<UserResponse | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null && this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor() {
    this.restore();
  }

  /** Carga la sesión persistida (si es válida). */
  restore(): void {
    const persisted = this.storage.getJson<unknown>(STORAGE_KEYS.session);
    if (isPersistedSession(persisted)) {
      this._token.set(persisted.accessToken);
      this._user.set(persisted.user);
    } else if (persisted !== null) {
      this.storage.removeItem(STORAGE_KEYS.session);
    }
  }

  setSession(auth: AuthResponse): void {
    this._token.set(auth.accessToken);
    this._user.set(auth.user);
    this.storage.setJson(STORAGE_KEYS.session, {
      accessToken: auth.accessToken,
      user: auth.user,
    } satisfies PersistedSession);
  }

  clear(): void {
    this._token.set(null);
    this._user.set(null);
    this.storage.removeItem(STORAGE_KEYS.session);
  }
}
