package cl.snapgasto.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import cl.snapgasto.backend.entity.AppUser;

/** Expone una cuenta en la grilla administrativa sin su hash de contraseña. */
public record AdminUserResponse(UUID id, String fullName, String email, String role, LocalDateTime createdAt) {
    public static AdminUserResponse from(AppUser user) {
        return new AdminUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name(), user.getCreatedAt());
    }
}
