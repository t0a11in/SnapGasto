package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import cl.snapgasto.backend.entity.ProjectType;

/**
 * Un compromiso del mes.
 *
 * @param amount monto comprometido (gasto recurrente, compra o aporte sugerido).
 * @param done   lo ya cubierto en el mes (gasto registrado o aportes netos).
 * @param date   fecha de la ocurrencia o fecha objetivo; nula para aportes de ahorro.
 */
public record ProjectCommitmentItem(
        UUID projectId,
        String name,
        ProjectType type,
        String category,
        LocalDate date,
        BigDecimal amount,
        BigDecimal done,
        CommitmentState state) {
}
