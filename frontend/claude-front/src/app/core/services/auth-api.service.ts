import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { sessionRequestContext } from '../http/http-context';
import { AuthRequest, AuthResponse, RegisterRequest, TokenStatusResponse } from '../models';

/** Rutas públicas: no llevan Bearer. */
export const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'] as const;

/**
 * Login, registro y token-status viajan con `sessionRequestContext()`: un 401/419
 * en ellos nunca abre el modal de reautenticación ni dispara logout automático,
 * lo que evita bucles.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  login(body: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, body, {
      context: sessionRequestContext(),
    });
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, body, {
      context: sessionRequestContext(),
    });
  }

  tokenStatus(): Observable<TokenStatusResponse> {
    return this.http.get<TokenStatusResponse>(`${this.baseUrl}/auth/v1/token-status`, {
      context: sessionRequestContext(),
    });
  }
}
