package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Lo comprometido por los proyectos en un mes.
 *
 * @param recurring        gastos recurrentes del mes (registrados o por registrar; sin omitidos).
 * @param purchases        compras planificadas para el mes (incluye las atrasadas en el mes actual).
 * @param savingsSuggested aporte sugerido total para las metas de ahorro.
 * @param total            recurring + purchases + savingsSuggested.
 * @param pending          lo que aún falta salir este mes (base del "Comprometido" del balance).
 */
public record ProjectCommitmentsResponse(
        String month,
        BigDecimal recurring,
        BigDecimal purchases,
        BigDecimal savingsSuggested,
        BigDecimal total,
        BigDecimal pending,
        List<ProjectCommitmentItem> items) {
}
