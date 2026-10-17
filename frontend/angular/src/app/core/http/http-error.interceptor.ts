import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { apiErrorMessage } from './api-error';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AppStore } from '../state/App.store';
import { SessionStore } from '../state/session.store';

/**
 * Registra de manera centralizada cualquier respuesta HTTP fallida.
 * Reenvía el error original para que cada pantalla conserve su manejo actual.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const appStore = inject(AppStore);
  const sessionStore = inject(SessionStore);
  const apiBaseUrl = inject(API_BASE_URL);
  const isApiRequest = request.url.startsWith(apiBaseUrl);
  return next(request).pipe(
    tap({
      next: () => {
        if (isApiRequest) {
          appStore.setCircuitBreaker('CLOSED');
        }
      },
    }),


    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (isApiRequest && (error.status === 0 || error.status >= 500)) {
          appStore.setCircuitBreaker('OPEN');
        }
        if (isApiRequest && (error.status === 401)) {
          sessionStore.clear();
          appStore.setTokenLife('CLOSED');
        }


        console.error(`HTTP ${error.status} en ${request.method} ${request.urlWithParams}`, {
          message: apiErrorMessage(error),
          response: error.error,
        });
      }

      return throwError(() => error);
    }),
  );
};
