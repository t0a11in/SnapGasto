package cl.snapgasto.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;

/** Expone el perfil de la sesión actualmente autenticada. */
@RestController
@RequestMapping("/api/users")
// @Tag(name = "Usuarios", description = "Perfil del usuario autenticado.")
// @SecurityRequirement(name = "bearerAuth")
public class UserController {

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUser user) {
        return UserResponse.from(user);
    }
}
