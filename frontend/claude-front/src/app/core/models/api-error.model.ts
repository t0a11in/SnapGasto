/** Respuesta uniforme de errores controlados en Java. */
export interface ApiError {
  message: string;
}

/** Error HTTP normalizado que recibe la capa de presentación. */
export class AppHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly url: string | null = null,
  ) {
    super(message);
    this.name = 'AppHttpError';
  }
}

/** Código no estándar que usa la API para indicar sesión expirada. */
export const HTTP_SESSION_EXPIRED = 419;
