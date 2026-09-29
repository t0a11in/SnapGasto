package cl.snapgasto.backend.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Define una notificación que el administrador asigna a un usuario. */
public record NotificationRequest(
        @NotNull(message = "El usuario es obligatorio.") UUID userId,
        @NotBlank(message = "El título es obligatorio.") @Size(max = 140) String title,
        @NotBlank(message = "El mensaje es obligatorio.") @Size(max = 1000) String body,
        boolean read) {
}
