/** Convierte las distintas respuestas de error del backend en un mensaje para la UI. */
export function apiErrorMessage(payload, fallback = 'No fue posible completar la operación.') {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  return fallback;
}
