package cl.snapgasto.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;

class AuthSessionControllerTest {

    private final AuthSessionController controller = new AuthSessionController();

    @Test
    void returnsOnlyTheAuthenticatedUserProfile() {
        AppUser user = user();

        UserResponse response = controller.session(user);

        assertEquals(user.getId(), response.id());
        assertEquals("Ada Lovelace", response.fullName());
        assertEquals("ada@example.com", response.email());
        assertEquals("USER", response.role());
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Ada Lovelace");
        user.setEmail("ada@example.com");
        user.setRole(Role.USER);
        return user;
    }
}
