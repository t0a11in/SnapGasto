package cl.snapgasto.backend.dto;

import java.math.BigDecimal;

/** Totales de ingresos por tipo para un mes determinado. */
public record IncomeMonthlySummaryResponse(
        String month,
        BigDecimal totalTarjeta,
        BigDecimal totalFisico,
        BigDecimal total) {
}
