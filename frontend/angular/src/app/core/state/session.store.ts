import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, SessionUser } from '../models/api.models';

const SESSION_KEY = 'snapgasto.admin.session';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly session = signal<AuthResponse | null>(this.read());
  readonly user = computed<SessionUser | null>(() => this.session()?.user ?? null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  start(session: AuthResponse): void {
    console.log('start SESSION' , SESSION_KEY)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
    this.session.set(null);
  }

  private read(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<AuthResponse>;
      if (!value.accessToken || !value.user?.id || !value.user.email || !value.user.fullName || !value.user.role) {
        console.log('borrado SESSION_KEY ')
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return value as AuthResponse;
    } catch {
      console.log('borrado SESSION_KEY ')
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
