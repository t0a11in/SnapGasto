package cl.snapgasto.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import cl.snapgasto.backend.dto.AuthResponse;
import cl.snapgasto.backend.dto.TokenStatusResponse;
import cl.snapgasto.backend.dto.UserResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.service.TokenRefreshService;
import cl.snapgasto.backend.service.TokenRevocationService;
import cl.snapgasto.backend.service.TokenStatusService;

@ExtendWith(MockitoExtension.class)
class TokenStatusControllerTest {

    @Mock
    private TokenStatusService tokenStatusService;

    @Mock
    private TokenRefreshService tokenRefreshService;

    @Mock
    private TokenRevocationService tokenRevocationService;

    @Test
    void delegatesTheAuthenticatedPrincipalToTheTokenStatusService() {
        AppUser user = new AppUser();
        TokenStatusResponse expected = new TokenStatusResponse(true);
        when(tokenStatusService.check(user)).thenReturn(expected);
        TokenStatusController controller = controller();

        assertEquals(expected, controller.tokenStatus(user));
        verify(tokenStatusService).check(user);
    }

    @Test
    void delegatesTokenRenewalToTheSessionService() {
        AppUser user = user();
        AuthResponse expected = new AuthResponse("renewed-access-token", UserResponse.from(user));
        when(tokenRefreshService.refresh(user, "current-token")).thenReturn(expected);

        assertEquals(expected, controller().refresh(user, "Bearer current-token"));
        verify(tokenRefreshService).refresh(user, "current-token");
    }

    @Test
    void logoutRevokesTheBearerToken() {
        controller().logout(user(), "Bearer current-token");

        verify(tokenRevocationService).revoke("current-token");
    }

    @Test
    void logoutAllInvalidatesEverySessionOfTheUser() {
        AppUser user = user();

        controller().logoutAll(user, "Bearer current-token");

        verify(tokenRevocationService).revokeAllSessions(user);
    }

    private TokenStatusController controller() {
        return new TokenStatusController(tokenStatusService, tokenRefreshService, tokenRevocationService);
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
