package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import cl.snapgasto.backend.entity.IncomeType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

/** Datos necesarios para crear o actualizar un ingreso manual. */
public record IncomeRequest(
        @NotNull(message = "El monto es obligatorio.") @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero.") BigDecimal amount,
        @NotNull(message = "El tipo de ingreso es obligatorio.") IncomeType type,
        @NotNull(message = "La fecha es obligatoria.") @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate date,
        @Size(max = 500, message = "La descripción es demasiado larga.") String description) {
}
