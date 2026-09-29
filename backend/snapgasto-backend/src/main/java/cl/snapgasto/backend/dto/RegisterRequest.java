package cl.snapgasto.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Recibe los datos necesarios para crear una cuenta local. */
public record RegisterRequest(
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 120, message = "El nombre es demasiado largo.") String fullName,
        @NotBlank(message = "El correo es obligatorio.") @Email(message = "El correo no es válido.") String email,
        @NotBlank(message = "La contraseña es obligatoria.") @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres.") String password) {
}
