package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import cl.snapgasto.backend.entity.Expense;

/** Expone un gasto junto con el usuario propietario para la vista administrativa. */
public record AdminExpenseResponse(
        UUID id,
        UUID userId,
        String userName,
        BigDecimal amount,
        String category,
        LocalDate date,
        String description,
        String paymentMethod) {
    public static AdminExpenseResponse from(Expense expense) {
        return new AdminExpenseResponse(
                expense.getId(),
                expense.getUser().getId(),
                expense.getUser().getFullName(),
                expense.getAmount(),
                expense.getCategory(),
                expense.getDate(),
                expense.getDescription(),
                expense.getPaymentMethod());
    }
}
