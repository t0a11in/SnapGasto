package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import cl.snapgasto.backend.entity.Expense;

/**
 * Expone un gasto sin filtrar datos de otras cuentas.
 *
 * @param projectId proyecto que originó el gasto (recurrente o compra concretada); nulo si es manual.
 * @param generated true si lo registró automáticamente un gasto recurrente.
 */
public record ExpenseResponse(
        UUID id,
        BigDecimal amount,
        String category,
        LocalDate date,
        String description,
        String paymentMethod,
        UUID groupId,
        UUID projectId,
        boolean generated) {

    /** Conserva compatibilidad de construcción para pruebas y clientes antiguos. */
    public ExpenseResponse(
            UUID id,
            BigDecimal amount,
            String category,
            LocalDate date,
            String description,
            String paymentMethod) {
        this(id, amount, category, date, description, paymentMethod, null, null, false);
    }

    /** Conserva compatibilidad con la versión que agregó grupos. */
    public ExpenseResponse(
            UUID id,
            BigDecimal amount,
            String category,
            LocalDate date,
            String description,
            String paymentMethod,
            UUID groupId) {
        this(id, amount, category, date, description, paymentMethod, groupId, null, false);
    }

    public static ExpenseResponse from(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getAmount(),
                expense.getCategory(),
                expense.getDate(),
                expense.getDescription(),
                expense.getPaymentMethod(),
                expense.getExpenseGroup() == null ? null : expense.getExpenseGroup().getId(),
                expense.getProject() == null ? null : expense.getProject().getId(),
                expense.isGenerated());
    }
}
