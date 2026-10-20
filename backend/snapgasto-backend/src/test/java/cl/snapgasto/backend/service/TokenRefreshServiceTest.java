package cl.snapgasto.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.Duration;
import java.time.Instant;
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

    private final JwtService jwtService =
            new JwtService("test-only-jwt-secret-must-have-at-least-thirty-two-characters", 120, 168);

    @Mock
    private TokenRevocationService tokenRevocationService;

    private TokenRefreshService tokenRefreshService;

    @BeforeEach
    void setUp() {
        tokenRefreshService = new TokenRefreshService(jwtService, tokenRevocationService);
    }

    @Test
    void renewsTheTokenKeepsTheAuthTimeAndRevokesThePreviousToken() {
        AppUser user = user();
        Instant authTime = Instant.now().minus(Duration.ofHours(2)).withNano(0);
        String current = jwtService.generateToken(user, authTime);

        AuthResponse response = tokenRefreshService.refresh(user, current);

        verify(tokenRevocationService).revoke(current);
        assertNotEquals(current, response.accessToken());
        assertEquals(authTime, jwtService.authTime(jwtService.parseClaims(response.accessToken())));
        assertEquals(user.getId(), response.user().id());
        assertEquals("ADMIN", response.user().role());
    }

    @Test
    void refusesToRenewASessionOlderThanTheMaximumDuration() {
        AppUser user = user();
        String current = jwtService.generateToken(user, Instant.now().minus(Duration.ofHours(169)));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> tokenRefreshService.refresh(user, current));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
        verify(tokenRevocationService, never()).revoke(anyString());
    }

    @Test
    void rejectsAMissingAuthenticatedUserOrToken() {
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ResponseStatusException.class,
                () -> tokenRefreshService.refresh(null, "token")).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(ResponseStatusException.class,
                () -> tokenRefreshService.refresh(user(), null)).getStatusCode());
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setFullName("Ada Lovelace");
        user.setEmail("ada@example.com");
        user.setRole(Role.ADMIN);
        return user;
    }
}
