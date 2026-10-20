package cl.snapgasto.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

/**
 * Emite un nuevo access token para una sesión que ya fue autenticada por el
 * filtro JWT. No acepta tokens vencidos ni credenciales en el cuerpo HTTP.
 *
 * <p>El token usado para renovar queda revocado (rotación: no pueden coexistir
 * dos tokens de la misma renovación) y el nuevo conserva el instante del inicio
 * de sesión original, de modo que una sesión no se puede extender más allá de
 * {@code app.security.jwt.max-session-hours}.
 */
@Service
public class TokenRefreshService {

    private final JwtService jwtService;
    private final TokenRevocationService tokenRevocationService;

    public TokenRefreshService(JwtService jwtService, TokenRevocationService tokenRevocationService) {
        this.jwtService = jwtService;
        this.tokenRevocationService = tokenRevocationService;
    }

    @Transactional
    public AuthResponse refresh(AppUser authenticatedUser, String currentToken) {
        if (authenticatedUser == null || currentToken == null) {
            throw unauthorized("No autorizado.");
        }
        final Claims claims;
        try {
            claims = jwtService.parseClaims(currentToken);
        } catch (JwtException | IllegalArgumentException exception) {
            throw unauthorized("No autorizado.");
        }
        if (jwtService.exceedsMaxSession(claims)) {
            throw unauthorized("La sesión superó su duración máxima. Inicia sesión nuevamente.");
        }

        tokenRevocationService.revoke(currentToken);
        String accessToken = jwtService.generateToken(authenticatedUser, jwtService.authTime(claims));
        return new AuthResponse(accessToken, UserResponse.from(authenticatedUser));
    }

    private ResponseStatusException unauthorized(String message) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
    }
}
