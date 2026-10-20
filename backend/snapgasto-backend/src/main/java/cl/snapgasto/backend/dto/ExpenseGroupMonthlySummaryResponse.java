package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Total mensual del grupo y el aporte acumulado de cada integrante. */
public record ExpenseGroupMonthlySummaryResponse(
        UUID groupId,
        String groupName,
        String month,
        BigDecimal total,
        List<GroupMemberExpenseTotalResponse> memberTotals) {
}
