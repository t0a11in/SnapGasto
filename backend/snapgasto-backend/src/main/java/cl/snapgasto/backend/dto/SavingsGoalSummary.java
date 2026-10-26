package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import cl.snapgasto.backend.entity.ProjectStatus;

/** Avance de una meta de ahorro dentro del resumen. */
public record SavingsGoalSummary(
        UUID projectId,
        String name,
        ProjectStatus status,
        BigDecimal saved,
        BigDecimal target,
        BigDecimal progressRatio,
        LocalDate targetDate,
        BigDecimal monthlySuggested) {
}
