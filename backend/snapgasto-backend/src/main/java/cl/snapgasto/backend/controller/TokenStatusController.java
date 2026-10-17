package cl.snapgasto.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import cl.snapgasto.backend.dto.TokenStatusResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.TokenStatusService;

/** Expone un health-check de sesión, no un circuit breaker de infraestructura. */
@RestController
@RequestMapping("/api/auth/v1")
@Tag(name = "Sesión", description = "Validación y restauración de una sesión autenticada.")
@SecurityRequirement(name = "bearerAuth")
public class TokenStatusController {

    private final TokenStatusService tokenStatusService;

    public TokenStatusController(TokenStatusService tokenStatusService) {
        this.tokenStatusService = tokenStatusService;
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
}
