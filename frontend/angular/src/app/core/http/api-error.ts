import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api.models';

/** Convierte el contrato ApiError del backend en un mensaje apto para la interfaz. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage = isApiError(error.error) ? error.error.message : undefined;

    if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;
    if (error.status === 0) return 'No fue posible conectar con la API de SnapGasto.';
    if (error.status === 400) return 'Los datos enviados no son válidos.';
    if (error.status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    if (error.status === 403) return 'No tienes permisos para realizar esta acción.';
    if (error.status === 404) return 'No se encontró el recurso solicitado.';
    if (error.status === 409) return 'La operación entra en conflicto con la información existente.';
    if (error.status === 422) return 'No fue posible validar los datos enviados.';
    if (error.status >= 500) return 'La API tuvo un error interno. Inténtalo nuevamente más tarde.';
  }

  if (error instanceof Error && error.message.trim()) return error.message;

  return 'No fue posible completar la operación. Inténtalo nuevamente.';
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error;
}
