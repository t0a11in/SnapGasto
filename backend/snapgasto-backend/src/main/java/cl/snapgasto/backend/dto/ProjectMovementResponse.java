package cl.snapgasto.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import cl.snapgasto.backend.entity.ProjectMovement;
import cl.snapgasto.backend.entity.ProjectMovementKind;

/** Aporte o retiro registrado en una meta de ahorro. */
public record ProjectMovementResponse(
        UUID id,
        UUID projectId,
        ProjectMovementKind kind,
        BigDecimal amount,
        LocalDate date,
        String note,
        LocalDateTime createdAt) {

    public static ProjectMovementResponse from(ProjectMovement movement) {
        return new ProjectMovementResponse(
                movement.getId(),
                movement.getProject().getId(),
                movement.getKind(),
                movement.getAmount(),
                movement.getDate(),
                movement.getNote(),
                movement.getCreatedAt());
    }
}
