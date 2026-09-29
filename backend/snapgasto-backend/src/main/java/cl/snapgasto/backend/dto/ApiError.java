package cl.snapgasto.backend.dto;

/** Mantiene una respuesta de error estable para Flutter y otros clientes REST. */
public record ApiError(String message) {
}
