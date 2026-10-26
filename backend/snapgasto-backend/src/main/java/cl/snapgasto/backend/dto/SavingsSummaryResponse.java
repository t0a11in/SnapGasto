package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Resumen del ahorro.
 *
 * @param totalSaved         total ahorrado acumulado de todas las metas.
 * @param monthContributions aportes del mes consultado.
 * @param monthWithdrawals   retiros del mes consultado.
 * @param monthNet           aportes − retiros del mes (lo que se descuenta del "Disponible").
 */
public record SavingsSummaryResponse(
        String month,
        BigDecimal totalSaved,
        BigDecimal monthContributions,
        BigDecimal monthWithdrawals,
        BigDecimal monthNet,
        List<SavingsGoalSummary> goals) {
}
