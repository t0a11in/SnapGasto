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
import cl.snapgasto.backend.security.BearerTokens;
import cl.snapgasto.backend.service.TokenRefreshService;
import cl.snapgasto.backend.service.TokenRevocationService;
import cl.snapgasto.backend.service.TokenStatusService;

/**
 * Comprobación, renovación y cierre de la sesión JWT.
 */
@RestController
@RequestMapping("/api/auth/v1")
@Tag(name = "Sesión", description = "Validación, renovación y cierre de una sesión autenticada.")
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
     * Un token ausente, inválido o revocado recibe 401; uno vencido recibe 401
     * con {@code code = TOKEN_EXPIRED}.
     */
    @GetMapping("/token-status")
    @Operation(summary = "Comprueba si el token JWT de la sesión sigue vigente")
    public TokenStatusResponse tokenStatus(@AuthenticationPrincipal AppUser user) {
        return tokenStatusService.check(user);
    }

    /** Emite un token nuevo y revoca el usado en la solicitud. */
    @PostMapping("/refresh")
    @Operation(summary = "Renueva el access token JWT de una sesión vigente (el token anterior queda revocado)")
    public AuthResponse refresh(
            @AuthenticationPrincipal AppUser user,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        return tokenRefreshService.refresh(user, BearerTokens.extract(authorization));
    }

    /** Cierra la sesión actual revocando el bearer token recibido. */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cierra la sesión actual (revoca el bearer token recibido)")
    public void logout(
            @AuthenticationPrincipal AppUser user,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        tokenRevocationService.revoke(requireToken(user, authorization));
    }

    /** Cierra todas las sesiones del usuario en todos sus dispositivos. */
    @PostMapping("/logout-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cierra todas las sesiones del usuario en todos los dispositivos")
    public void logoutAll(
            @AuthenticationPrincipal AppUser user,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        requireToken(user, authorization);
        tokenRevocationService.revokeAllSessions(user);
    }

    /**
     * @deprecated Una operación que cambia estado no debe ser GET. Usar
     * {@code POST /api/auth/v1/logout}. Se mantiene solo mientras los clientes
     * migran.
     */
    @Deprecated
    @GetMapping("/expire-token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Obsoleto: usar POST /api/auth/v1/logout", deprecated = true)
    public void expireToken(
            @AuthenticationPrincipal AppUser user,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        logout(user, authorization);
    }

    private String requireToken(AppUser user, String authorization) {
        String token = BearerTokens.extract(authorization);
        if (user == null || token == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autorizado.");
        }
        return token;
    }
}
