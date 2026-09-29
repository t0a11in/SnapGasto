package cl.snapgasto.backend.dto;

import cl.snapgasto.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Define los datos editables desde el mantenedor de usuarios. */
public record AdminUserRequest(
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 120) String fullName,
        @NotBlank(message = "El correo es obligatorio.") @Email(message = "El correo no es válido.") String email,
        @NotNull(message = "El rol es obligatorio.") Role role,
        @Size(min = 8, max = 100, message = "La contraseña debe tener al menos 8 caracteres.") String password) {
}
