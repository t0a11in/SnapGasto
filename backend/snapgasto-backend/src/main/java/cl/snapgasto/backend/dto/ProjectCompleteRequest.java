package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

/**
 * "Lo compré": datos del gasto real con que se concreta una COMPRA.
 * {@code category} y {@code description} son opcionales; por defecto se usan los del proyecto.
 */
public record ProjectCompleteRequest(
        @NotNull(message = "El monto es obligatorio.") @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero.") BigDecimal amount,
        @NotNull(message = "La fecha es obligatoria.") @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate date,
        @NotBlank(message = "El método de pago es obligatorio.") @Size(max = 60, message = "El método de pago es demasiado largo.") String paymentMethod,
        @Size(max = 80, message = "La categoría es demasiado larga.") String category,
        @Size(max = 500, message = "La descripción es demasiado larga.") String description) {
}
