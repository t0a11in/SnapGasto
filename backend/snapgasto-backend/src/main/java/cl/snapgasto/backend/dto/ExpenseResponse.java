package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import cl.snapgasto.backend.entity.Expense;

/** Expone un gasto sin filtrar datos de otras cuentas. */
public record ExpenseResponse(
        UUID id,
        BigDecimal amount,
        String category,
        LocalDate date,
        String description,
        String paymentMethod) {
    public static ExpenseResponse from(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getAmount(),
                expense.getCategory(),
                expense.getDate(),
                expense.getDescription(),
                expense.getPaymentMethod());
    }
}
