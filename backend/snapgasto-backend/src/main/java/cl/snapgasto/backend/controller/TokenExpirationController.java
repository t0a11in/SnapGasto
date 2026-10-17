package cl.snapgasto.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.TokenRevocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

/** Invalida el JWT recibido para probar o cerrar una sesión activa. */
@RestController
@RequestMapping("/api/auth/v1")
@Tag(name = "Sesión", description = "Operaciones de sesión autenticada.")
@SecurityRequirement(name = "bearerAuth")
public class TokenExpirationController {

    private final TokenRevocationService tokenRevocationService;

    public TokenExpirationController(TokenRevocationService tokenRevocationService) {
        this.tokenRevocationService = tokenRevocationService;
    }

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
