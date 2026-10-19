import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { STORAGE_KEYS } from '../config/api.config';
import { AppHttpError, AuthRequest, AuthResponse, RegisterRequest } from '../models';
import { SessionStore } from '../state/session.store';
import { AuthApiService } from './auth-api.service';
import { BrowserStorageService } from './browser-storage.service';

/** Fachada de autenticación: coordina API, SessionStore, correo recordado y navegación. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly session = inject(SessionStore);
  private readonly storage = inject(BrowserStorageService);
  private readonly router = inject(Router);

  login(credentials: AuthRequest, rememberEmail: boolean): Observable<AuthResponse> {
    return this.api.login(credentials).pipe(
      tap((auth) => {
        this.session.setSession(auth);
        if (rememberEmail) {
          this.storage.setItem(STORAGE_KEYS.rememberedEmail, credentials.email);
        } else {
          this.storage.removeItem(STORAGE_KEYS.rememberedEmail);
        }
      }),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api.register(data).pipe(tap((auth) => this.session.setSession(auth)));
  }

  /** Reautentica al usuario actual con su contraseña (modal de sesión expirada). */
  reauthenticate(password: string): Observable<AuthResponse> {
    const email = this.session.user()?.email;
    if (!email) {
      throw new Error('No hay usuario en sesión para reautenticar.');
    }
    return this.api.login({ email, password }).pipe(tap((auth) => this.session.setSession(auth)));
  }

  rememberedEmail(): string | null {
    return this.storage.getItem(STORAGE_KEYS.rememberedEmail);
  }

  /**
   * Valida la sesión persistida contra /auth/v1/token-status al iniciar la app.
   * Si el token ya no está vivo se limpia la sesión. Ante un error de red se conserva.
   */
  async validateStoredSession(): Promise<void> {
    if (!this.session.isAuthenticated()) {
      return;
    }
    const alive = await firstValueFrom(
      this.api.tokenStatus().pipe(
        map((res) => res.tokenAlive),
        catchError((err: unknown) => of(err instanceof AppHttpError && err.status === 0)),
      ),
    );
    if (!alive) {
      this.session.clear();
    }
  }

  logout(redirect = true): void {
    this.session.clear();
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }

  homeUrl(): string {
    return '/incomes';
  }
}
