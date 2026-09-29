package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

/** Define un gasto que puede ser administrado por un usuario con rol ADMIN. */
public record AdminExpenseRequest(
        @NotNull(message = "El usuario es obligatorio.") UUID userId,
        @NotNull(message = "El monto es obligatorio.") @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero.") BigDecimal amount,
        @NotBlank(message = "La categoría es obligatoria.") @Size(max = 80) String category,
        @NotNull(message = "La fecha es obligatoria.") @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate date,
        @Size(max = 500) String description,
        @NotBlank(message = "El método de pago es obligatorio.") @Size(max = 60) String paymentMethod) {
}
