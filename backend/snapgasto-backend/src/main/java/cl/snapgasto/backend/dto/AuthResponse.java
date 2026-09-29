package cl.snapgasto.backend.dto;

/** Devuelve un access token y el perfil asociado luego de autenticar una cuenta. */
public record AuthResponse(String accessToken, UserResponse user) {
}
