package cl.snapgasto.backend.dto;

import java.util.UUID;

/** Proyecto visto desde el mantenedor administrativo, con su dueño. */
public record AdminProjectResponse(UUID userId, String userName, String userEmail, ProjectResponse project) {
}
