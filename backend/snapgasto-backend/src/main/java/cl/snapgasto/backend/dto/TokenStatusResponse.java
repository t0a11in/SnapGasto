package cl.snapgasto.backend.dto;

/** Respuesta liviana para que los clientes comprueben su sesión JWT vigente. */
public record TokenStatusResponse(boolean tokenAlive) {
}
