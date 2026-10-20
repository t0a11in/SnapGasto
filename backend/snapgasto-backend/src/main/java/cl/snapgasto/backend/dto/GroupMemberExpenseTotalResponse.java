package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Aporte de un integrante al total mensual del grupo. */
public record GroupMemberExpenseTotalResponse(
        UUID userId,
        String fullName,
        String email,
        BigDecimal total) {
}
