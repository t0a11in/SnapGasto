package cl.snapgasto.backend.dto;

import java.util.UUID;

import cl.snapgasto.backend.entity.AppUser;

/** Expone de forma segura los datos de perfil que consume el cliente. */
public record UserResponse(UUID id, String fullName, String email, String role) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }
}
