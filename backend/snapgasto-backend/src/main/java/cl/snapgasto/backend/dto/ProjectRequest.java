package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import cl.snapgasto.backend.entity.ProjectPriority;
import cl.snapgasto.backend.entity.ProjectStatus;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.entity.RecurrenceFrequency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos de un proyecto. Las reglas que dependen del tipo (campos obligatorios de
 * COMPRA, RECURRENTE o AHORRO) se validan en {@code ProjectService}.
 */
public record ProjectRequest(
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 120, message = "El nombre es demasiado largo.") String name,
        @NotNull(message = "El tipo es obligatorio.") ProjectType type,
        @NotBlank(message = "La categoría es obligatoria.") @Size(max = 80, message = "La categoría es demasiado larga.") String category,
        ProjectPriority priority,
        ProjectStatus status,
        @Size(max = 500, message = "Las notas son demasiado largas.") String notes,
        // COMPRA / AHORRO
        @DecimalMin(value = "0.01", message = "El monto objetivo debe ser mayor que cero.") BigDecimal targetAmount,
        LocalDate targetDate,
        // COMPRA: precio de referencia (manual en v1; scraping en v2)
        @DecimalMin(value = "0.01", message = "El precio de referencia debe ser mayor que cero.") BigDecimal referencePrice,
        @Size(max = 120, message = "La tienda de referencia es demasiado larga.") String referenceSource,
        @Size(max = 500, message = "El link de referencia es demasiado largo.") String referenceUrl,
        // RECURRENTE
        @DecimalMin(value = "0.01", message = "El monto recurrente debe ser mayor que cero.") BigDecimal recurringAmount,
        RecurrenceFrequency frequency,
        @Min(value = 1, message = "El día del mes debe estar entre 1 y 28.") @Max(value = 28, message = "El día del mes debe estar entre 1 y 28.") Integer dayOfMonth,
        LocalDate startDate,
        LocalDate endDate,
        @Size(max = 60, message = "El método de pago es demasiado largo.") String paymentMethod,
        @Min(value = 0, message = "Los días de aviso no pueden ser negativos.") @Max(value = 30, message = "El aviso puede ser de hasta 30 días antes.") Integer notifyDaysBefore) {
}
