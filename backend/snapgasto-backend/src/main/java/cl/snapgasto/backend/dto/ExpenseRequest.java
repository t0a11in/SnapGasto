package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

/** Recibe la información de un gasto manual validada antes de persistirla. */
public record ExpenseRequest(
        @NotNull(message = "El monto es obligatorio.") @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero.") BigDecimal amount,
        @NotBlank(message = "La categoría es obligatoria.") @Size(max = 80) String category,
        @NotNull(message = "La fecha es obligatoria.") @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate date,
        @Size(max = 500, message = "La descripción es demasiado larga.") String description,
        @NotBlank(message = "El método de pago es obligatorio.") @Size(max = 60) String paymentMethod) {
}
