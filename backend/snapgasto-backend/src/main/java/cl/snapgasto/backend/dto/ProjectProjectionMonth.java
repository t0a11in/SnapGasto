package cl.snapgasto.backend.dto;

import java.math.BigDecimal;

/** Total comprometido por tipo para un mes futuro. */
public record ProjectProjectionMonth(
        String month,
        BigDecimal recurring,
        BigDecimal purchases,
        BigDecimal savingsSuggested,
        BigDecimal total) {
}
