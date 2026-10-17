package cl.snapgasto.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.service.TokenRefreshService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

/** Renueva el access token de una sesión JWT que aún sigue vigente. */
@RestController
@RequestMapping("/api/auth/v1")
@Tag(name = "Sesión", description = "Operaciones de sesión autenticada.")
@SecurityRequirement(name = "bearerAuth")
public class TokenRefreshController {

    private final TokenRefreshService tokenRefreshService;

    public TokenRefreshController(TokenRefreshService tokenRefreshService) {
        this.tokenRefreshService = tokenRefreshService;
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renueva el access token JWT de una sesión vigente")
    public AuthResponse refresh(@AuthenticationPrincipal AppUser user) {
        return tokenRefreshService.refresh(user);
    }
}
