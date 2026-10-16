package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import cl.snapgasto.backend.entity.Income;
import cl.snapgasto.backend.entity.IncomeType;

/** Expone un ingreso sin incluir ni permitir datos de otros usuarios. */
public record IncomeResponse(
        UUID id,
        BigDecimal amount,
        IncomeType type,
        LocalDate date,
        String description) {
    public static IncomeResponse from(Income income) {
        return new IncomeResponse(
                income.getId(),
                income.getAmount(),
                income.getType(),
                income.getDate(),
                income.getDescription());
    }
}
