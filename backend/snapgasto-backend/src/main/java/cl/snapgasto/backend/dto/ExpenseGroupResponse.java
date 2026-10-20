package cl.snapgasto.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Grupo visible para un integrante, junto con sus miembros actuales. */
public record ExpenseGroupResponse(
        UUID id,
        String name,
        UUID ownerId,
        LocalDateTime createdAt,
        List<ExpenseGroupMemberResponse> members) {
}
