package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import cl.snapgasto.backend.entity.ProjectPriority;
import cl.snapgasto.backend.entity.ProjectStatus;
import cl.snapgasto.backend.entity.ProjectType;
import cl.snapgasto.backend.entity.RecurrenceFrequency;

/**
 * Proyecto con sus valores calculados en el servidor para que Angular y Flutter
 * muestren exactamente lo mismo.
 *
 * @param savedAmount       AHORRO: aportes − retiros.
 * @param remaining         COMPRA/AHORRO: lo que falta para el monto objetivo.
 * @param progressRatio     AHORRO: ahorrado / objetivo (0..1+); COMPRA: 1 si está completada.
 * @param monthsLeft        meses hasta la fecha objetivo, contando el actual (0 si ya pasó).
 * @param monthlySuggested  AHORRO: cuánto apartar por mes para llegar a tiempo.
 * @param monthlyEquivalent RECURRENTE: costo mensual (los anuales se dividen en 12).
 * @param nextOccurrence    RECURRENTE: próxima fecha en que se registrará el gasto.
 */
public record ProjectResponse(
        UUID id,
        String name,
        ProjectType type,
        String category,
        ProjectPriority priority,
        ProjectStatus status,
        String notes,
        BigDecimal targetAmount,
        LocalDate targetDate,
        BigDecimal referencePrice,
        String referenceSource,
        String referenceUrl,
        LocalDateTime referenceAt,
        BigDecimal recurringAmount,
        RecurrenceFrequency frequency,
        Integer dayOfMonth,
        LocalDate startDate,
        LocalDate endDate,
        String paymentMethod,
        int notifyDaysBefore,
        UUID expenseId,
        LocalDateTime createdAt,
        BigDecimal savedAmount,
        BigDecimal remaining,
        BigDecimal progressRatio,
        Integer monthsLeft,
        BigDecimal monthlySuggested,
        BigDecimal monthlyEquivalent,
        LocalDate nextOccurrence) {
}
