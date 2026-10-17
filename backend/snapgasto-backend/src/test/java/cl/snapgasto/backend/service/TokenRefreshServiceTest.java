package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.security.JwtService;

@ExtendWith(MockitoExtension.class)
class TokenRefreshServiceTest {

    @Mock
    private JwtService jwtService;

    private TokenRefreshService tokenRefreshService;

    @BeforeEach
    void setUp() {
        tokenRefreshService = new TokenRefreshService(jwtService);
    }

    @Test
    void renewsTheTokenForTheAuthenticatedUserAndReturnsTheCurrentProfile() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Ada Lovelace");
        user.setEmail("ada@example.com");
        user.setRole(Role.ADMIN);
        when(jwtService.generateToken("ada@example.com")).thenReturn("renewed-access-token");

        AuthResponse response = tokenRefreshService.refresh(user);

        verify(jwtService).generateToken("ada@example.com");
        assertEquals("renewed-access-token", response.accessToken());
        assertEquals(user.getId(), response.user().id());
        assertEquals("ADMIN", response.user().role());
    }

    @Test
    void rejectsAMissingAuthenticatedUser() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> tokenRefreshService.refresh(null));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    }
}
