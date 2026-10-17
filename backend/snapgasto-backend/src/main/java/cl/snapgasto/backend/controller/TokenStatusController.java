package cl.snapgasto.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.dto.TokenStatusResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.TokenRefreshService;
import cl.snapgasto.backend.service.TokenRevocationService;
import cl.snapgasto.backend.service.TokenStatusService;

/**
 * Expone un health-check de sesión, no un circuit breaker de infraestructura.
 */
@RestController
@RequestMapping("/api/auth/v1")
@Tag(name = "Sesión", description = "Validación y restauración de una sesión autenticada.")
@SecurityRequirement(name = "bearerAuth")
public class TokenStatusController {

    private final TokenStatusService tokenStatusService;
    private final TokenRefreshService tokenRefreshService;
    private final TokenRevocationService tokenRevocationService;

    public TokenStatusController(
            TokenStatusService tokenStatusService,
            TokenRefreshService tokenRefreshService,
            TokenRevocationService tokenRevocationService) {
        this.tokenStatusService = tokenStatusService;
        this.tokenRefreshService = tokenRefreshService;
        this.tokenRevocationService = tokenRevocationService;
    }

    /**
     * Responde HTTP 200 solamente cuando el bearer token sigue siendo válido.
     * Un token ausente, inválido, expirado o asociado a un usuario eliminado
     * es rechazado por la cadena de seguridad con HTTP 401.
     */
    @GetMapping("/token-status")
    @Operation(summary = "Comprueba si el token JWT de la sesión sigue vigente")
    public TokenStatusResponse tokenStatus(@AuthenticationPrincipal AppUser user) {
        return tokenStatusService.check(user);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renueva el access token JWT de una sesión vigente")
    public AuthResponse refresh(@AuthenticationPrincipal AppUser user) {
        return tokenRefreshService.refresh(user);
    }

    /**
     * Usa GET por compatibilidad con el flujo solicitado. En una API pública se
     * recomienda exponer esta operación como POST o DELETE.
     */
    @GetMapping("/expire-token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Invalida el bearer token recibido")
    public void expireToken(
            @AuthenticationPrincipal AppUser user,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        if (user == null || authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autorizado.");
        }
        tokenRevocationService.revoke(authorization.substring(7));
    }
}
