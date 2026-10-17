import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { apiErrorMessage } from '../http/api-error';
import { AuthResponse, LoginPayload, RegisterPayload } from '../models/api.models';
import { SessionStore } from '../state/session.store';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly sessionStore = inject(SessionStore);

  login(payload: LoginPayload) {
    console.log('INCIO LOGIN*****')
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((session) => this.sessionStore.start(session)),
      catchError((error: unknown) => throwError(() => new Error(apiErrorMessage(error))))
    );
  }


  

  register(payload: RegisterPayload) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload).pipe(
      tap((session) => this.sessionStore.start(session)),
      catchError((error: unknown) => throwError(() => new Error(apiErrorMessage(error))))
    );
  }

  logout(): void {
    this.sessionStore.clear();
  }
  logIn(): void {
    this.sessionStore.clear();
  }
}
