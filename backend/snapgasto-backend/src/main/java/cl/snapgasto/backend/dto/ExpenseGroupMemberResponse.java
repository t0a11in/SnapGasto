package cl.snapgasto.backend.dto;

import java.util.UUID;

import cl.snapgasto.backend.entity.GroupMembership;

/** Información pública de una persona integrante del grupo. */
public record ExpenseGroupMemberResponse(UUID userId, String fullName, String email, String role) {
    public static ExpenseGroupMemberResponse from(GroupMembership membership) {
        return new ExpenseGroupMemberResponse(
                membership.getUser().getId(),
                membership.getUser().getFullName(),
                membership.getUser().getEmail(),
                membership.getRole().name());
    }
}
