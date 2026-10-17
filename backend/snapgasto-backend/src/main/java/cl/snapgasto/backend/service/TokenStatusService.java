package cl.snapgasto.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.TokenStatusResponse;
import cl.snapgasto.backend.entity.AppUser;

/**
 * Punto de comprobación de sesión para clientes que necesitan saber si deben
 * conservar su token local. La validación criptográfica y de expiración se
 * realiza antes, en {@code JwtAuthenticationFilter}.
 */
@Service
public class TokenStatusService {

    @Transactional(readOnly = true)
    public TokenStatusResponse check(AppUser authenticatedUser) {
        // El principal sólo existe si Spring Security aceptó el bearer token y
        // pudo resolver al usuario actual desde la base de datos.
        if (authenticatedUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autorizado.");
        }
        return new TokenStatusResponse(true);
    }
}
