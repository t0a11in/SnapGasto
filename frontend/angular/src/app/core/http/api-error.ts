import { HttpErrorResponse } from '@angular/common/http';

/** Convierte el contrato ApiError del backend en un mensaje apto para la interfaz. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage = error.error && typeof error.error === 'object' && 'message' in error.error
      ? error.error.message
      : undefined;
    if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;
    if (error.status === 0) return 'No fue posible conectar con la API de SnapGasto.';
    if (error.status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    if (error.status === 403) return 'No tienes permisos para realizar esta acción.';
  }
  return 'No fue posible completar la operación. Inténtalo nuevamente.';
}
