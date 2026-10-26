package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import cl.snapgasto.backend.entity.ProjectMovementKind;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

/** Aporte o retiro de una meta de ahorro. */
public record ProjectMovementRequest(
        @NotNull(message = "Indica si es aporte o retiro.") ProjectMovementKind kind,
        @NotNull(message = "El monto es obligatorio.") @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero.") BigDecimal amount,
        @NotNull(message = "La fecha es obligatoria.") @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate date,
        @Size(max = 200, message = "La nota es demasiado larga.") String note) {
}
