package cl.snapgasto.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Recibe las credenciales para iniciar una sesión. */
public record AuthRequest(
        @NotBlank(message = "El correo es obligatorio.") @Email(message = "El correo no es válido.") String email,
        @NotBlank(message = "La contraseña es obligatoria.") String password) {
}
