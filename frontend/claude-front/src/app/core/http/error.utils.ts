import { HttpErrorResponse } from '@angular/common/http';
import { AppHttpError } from '../models';

const DEFAULT_MESSAGES: Record<number, string> = {
  0: 'No fue posible conectar con el servidor. Revisa tu conexión.',
  400: 'La solicitud no es válida.',
  401: 'Credenciales inválidas o sesión no autorizada.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'El recurso entra en conflicto con uno existente.',
  419: 'Tu sesión expiró.',
  500: 'Ocurrió un error inesperado en el servidor.',
};

function extractMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim().length > 0 && body.length < 500) {
    try {
      return extractMessage(JSON.parse(body));
    } catch {
      return body;
    }
  }
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return null;
}

/** Convierte cualquier error en `AppHttpError` con un mensaje legible (prioriza ApiError.message). */
export function toAppHttpError(error: unknown): AppHttpError {
  if (error instanceof AppHttpError) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    const message =
      extractMessage(error.error) ??
      DEFAULT_MESSAGES[error.status] ??
      (error.status >= 500 ? DEFAULT_MESSAGES[500] : `Error HTTP ${error.status}.`);
    return new AppHttpError(error.status, message, error.url);
  }
  if (error instanceof Error) {
    return new AppHttpError(-1, error.message);
  }
  return new AppHttpError(-1, 'Ocurrió un error inesperado.');
}

export function errorMessage(error: unknown): string {
  return toAppHttpError(error).message;
}
