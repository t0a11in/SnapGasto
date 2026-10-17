import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, MonoTypeOperatorFunction, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { apiErrorMessage } from '../http/api-error';
import { TokenStatus } from '../models/token-status.models';

/**
 * Consulta puntual de sesión. El interceptor existente adjunta el bearer token;
 * un 200 con tokenAlive=true permite conservar la sesión local y un 401 deja
 * que el interceptor la cierre. No realiza polling por sí mismo.
 */
@Injectable({ providedIn: 'root' })
export class TokenStatusApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  check() {
    return this.http.get<TokenStatus>(`${this.baseUrl}/auth/v1/token-status`).pipe(this.handleError());
  }


  private handleError<T>(): MonoTypeOperatorFunction<T> {
    return catchError((error: unknown) => throwError(() => new Error(apiErrorMessage(error))));
  }
}
