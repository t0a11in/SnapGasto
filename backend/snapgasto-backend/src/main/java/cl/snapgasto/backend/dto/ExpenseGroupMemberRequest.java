package cl.snapgasto.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Agrega al grupo una cuenta que ya se encuentra registrada. */
public record ExpenseGroupMemberRequest(
        @NotBlank(message = "El correo del integrante es obligatorio.")
        @Email(message = "El correo del integrante no es válido.")
        @Size(max = 180, message = "El correo es demasiado largo.")
        String email) {
}
