package cl.snapgasto.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Token de identidad emitido por Firebase después de un acceso con Google. */
public record FirebaseLoginRequest(@NotBlank(message = "El token de Firebase es obligatorio.") String idToken) {
}
