package cl.snapgasto.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.security.JwtService;

/**
 * Emite un nuevo access token para una sesión que ya fue autenticada por el
 * filtro JWT. No acepta tokens vencidos ni credenciales en el cuerpo HTTP.
 */
@Service
public class TokenRefreshService {

    private final JwtService jwtService;

    public TokenRefreshService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public AuthResponse refresh(AppUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autorizado.");
        }
        String accessToken = jwtService.generateToken(authenticatedUser.getUsername());
        return new AuthResponse(accessToken, UserResponse.from(authenticatedUser));
    }
}
