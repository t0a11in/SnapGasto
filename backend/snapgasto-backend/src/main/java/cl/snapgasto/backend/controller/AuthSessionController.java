package cl.snapgasto.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;

/**
 * Valida una sesión JWT persistida por un cliente y devuelve el perfil seguro
 * que debe utilizar para restaurar su estado local.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Sesión", description = "Validación y restauración de una sesión autenticada.")
@SecurityRequirement(name = "bearerAuth")
public class AuthSessionController {

    @GetMapping("/session")
    public UserResponse session(@AuthenticationPrincipal AppUser user) {
        return UserResponse.from(user);
    }
}
